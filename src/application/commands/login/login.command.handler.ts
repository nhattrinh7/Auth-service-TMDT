import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import type { IUserRepository } from '~/domain/repositories/user.repository.interface'
import type { IRefreshTokenRepository } from '~/domain/repositories/refresh-token.repository.interface'
import { USER_REPOSITORY } from '~/domain/repositories/user.repository.interface'
import { REFRESH_TOKEN_REPOSITORY } from '~/domain/repositories/refresh-token.repository.interface'
import { LoginCommand } from '~/application/commands/login/login.command'
import { LoginResponseDto } from '~/presentation/dtos/user.dto'
import { ForbiddenException, Inject, NotFoundException, UnauthorizedException } from '@nestjs/common'
import { UserStatus } from '~/domain/enums/user.enum'
import { comparePassword, hashRefreshToken } from '~/common/utils/bcrypt.util'
import { MyJwtService } from '~/common/utils/jwt.util'
import { UserMapper } from '~/application/mappers/user.mapper'

@CommandHandler(LoginCommand)
export class LoginHandler implements ICommandHandler<LoginCommand, LoginResponseDto> {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    @Inject(REFRESH_TOKEN_REPOSITORY)
    private readonly refreshRepository: IRefreshTokenRepository,
    private readonly jwtService: MyJwtService,
  ) {}

  async execute(command: LoginCommand) {
    const { email, password, userAgent } = command

    const user = await this.userRepository.findByEmail(email)
    if (!user) throw new NotFoundException(`User doesn't exist`)
    if (!user.emailVerified) throw new ForbiddenException(`Email is not verified`)
    if (user.status === UserStatus.BANNED) throw new ForbiddenException('User is banned')

    const isMatch = await comparePassword(password, user._password)
    if (!isMatch) throw new UnauthorizedException('Email or password is not correct')

    // Nếu trùng khớp thì tạo accessToken và refreshToken
    const accessToken = await this.jwtService.signAccessToken({
      userId: user.id,
      roleId: user.roleId
    })
    const refreshToken = await this.jwtService.signRefreshToken({
      userId: user.id,
      roleId: user.roleId
    })

    const decodedToken = await this.jwtService.decodeToken(refreshToken)

    const hashedRefreshToken  = await hashRefreshToken(refreshToken)

    // Lưu refreshToken vào Database
     await this.refreshRepository.saveRefreshToken({
      userId: user.id,
      token: hashedRefreshToken,
      userAgent: userAgent || 'Unknown',
      iat: new Date(decodedToken.iat * 1000),
      exp: new Date(decodedToken.exp * 1000),
      is2FAVerified: false,
    })

    // Trả về dữ liệu
    return UserMapper.toLoginResponse(accessToken, refreshToken, user)
  }
}