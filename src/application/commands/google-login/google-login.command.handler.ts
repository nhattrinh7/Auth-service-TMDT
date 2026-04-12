import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { ForbiddenException, Inject, ConflictException, UnauthorizedException } from '@nestjs/common'
import { OAuth2Client } from 'google-auth-library'
import { GoogleLoginCommand } from '~/application/commands/google-login/google-login.command'
import { LoginResponseDto } from '~/presentation/dtos/user.dto'
import type { IUserRepository } from '~/domain/repositories/user.repository.interface'
import type { IRefreshTokenRepository } from '~/domain/repositories/refresh-token.repository.interface'
import type { IRoleRepository } from '~/domain/repositories/role.repository.interface'
import type { IWalletRepository } from '~/domain/repositories/wallet.repository.interface'
import { USER_REPOSITORY } from '~/domain/repositories/user.repository.interface'
import { REFRESH_TOKEN_REPOSITORY } from '~/domain/repositories/refresh-token.repository.interface'
import { ROLE_REPOSITORY } from '~/domain/repositories/role.repository.interface'
import { WALLET_REPOSITORY } from '~/domain/repositories/wallet.repository.interface'
import { User } from '~/domain/entities/user.entity'
import { Gender, UserStatus } from '~/domain/enums/user.enum'
import { hashPassword, hashRefreshToken } from '~/common/utils/bcrypt.util'
import { MyJwtService } from '~/common/utils/jwt.util'
import { UserMapper } from '~/application/mappers/user.mapper'
import { PrismaService } from '~/infrastructure/database/prisma/prisma.service'
import { DEFAULT_USER_AGENT } from '~/common/constants/index.constants'

@CommandHandler(GoogleLoginCommand)
export class GoogleLoginHandler implements ICommandHandler<GoogleLoginCommand, LoginResponseDto> {
  private readonly googleClient: OAuth2Client

  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    @Inject(REFRESH_TOKEN_REPOSITORY)
    private readonly refreshRepository: IRefreshTokenRepository,
    @Inject(ROLE_REPOSITORY)
    private readonly roleRepository: IRoleRepository,
    @Inject(WALLET_REPOSITORY)
    private readonly walletRepository: IWalletRepository,
    private readonly jwtService: MyJwtService,
    private readonly prisma: PrismaService,
  ) {
    const googleClientId = process.env.GOOGLE_CLIENT_ID ?? ''
    if (!googleClientId) {
      throw new Error('Missing GOOGLE_CLIENT_ID')
    }
    this.googleClient = new OAuth2Client(googleClientId)
  }

  async execute(command: GoogleLoginCommand) {
    const { credential, userAgent } = command

    const googleClientId = process.env.GOOGLE_CLIENT_ID ?? ''
    if (!googleClientId) {
      throw new Error('Missing GOOGLE_CLIENT_ID')
    }
    const ticket = await this.googleClient.verifyIdToken({
      idToken: credential,
      audience: googleClientId,
    })
    const payload = ticket.getPayload()
    if (!payload?.email) throw new UnauthorizedException('Invalid Google credential')

    const email = payload.email
    const fullName = payload.name || payload.given_name || email.split('@')[0]
    const avatar = payload.picture ?? null

    let user = await this.userRepository.findByEmail(email)

    if (!user) {
      const customerRole = await this.roleRepository.findDefaultRole()
      if (!customerRole) throw new ConflictException('Default role not found')

      const phoneNumber = await this.generateUniquePhoneNumber()
      const dob = new Date('2000-01-01T00:00:00.000Z')
      const gender = Gender.OTHER
      const hashedPassword = await hashPassword(`${email}-${Date.now()}`)

      const newUser = User.createFromGoogle({
        email,
        roleId: customerRole.id,
        hashedPassword,
        fullName,
        phoneNumber,
        dob,
        gender,
        avatar,
      })

      user = await this.prisma.transaction(async tx => {
        const createdUser = await this.userRepository.save(newUser, tx)
        const wallet = createdUser.createWallet()
        await this.walletRepository.save(wallet, tx)
        return createdUser
      })
    } else {
      if (user.status === UserStatus.BANNED) throw new ForbiddenException('User is banned')

      let needSave = false
      if (!user.emailVerified) {
        user.emailVerified = true
        needSave = true
      }
      if (needSave) {
        user = await this.userRepository.save(user)
      }
    }

    const roleData = await this.prisma.role.findUnique({
      where: { id: user.roleId },
      include: { permissions: true },
    })

    const roleName = roleData?.name || ''
    const permissions = roleData?.permissions.map(p => p.name) || []

    const accessToken = await this.jwtService.signAccessToken({
      userId: user.id,
      roleId: user.roleId,
    })
    const refreshToken = await this.jwtService.signRefreshToken({
      userId: user.id,
      roleId: user.roleId,
    })

    const decodedToken = await this.jwtService.decodeToken(refreshToken)
    const hashedRefreshToken = await hashRefreshToken(refreshToken)

    await this.refreshRepository.saveRefreshToken({
      userId: user.id,
      token: hashedRefreshToken,
      userAgent: userAgent || DEFAULT_USER_AGENT,
      iat: new Date(decodedToken.iat * 1000),
      exp: new Date(decodedToken.exp * 1000),
      is2FAVerified: false,
    })

    return UserMapper.toLoginResponse(accessToken, refreshToken, user, roleName, permissions)
  }

  private async generateUniquePhoneNumber() {
    for (let i = 0; i < 5; i++) {
      const phoneNumber = `0${Math.floor(100000000 + Math.random() * 900000000)}`
      const existed = await this.userRepository.findByPhoneNumber(phoneNumber)
      if (!existed) return phoneNumber
    }
    throw new ConflictException('Cannot generate phone number')
  }
}
