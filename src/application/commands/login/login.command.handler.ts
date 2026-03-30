import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import type { IUserRepository } from '~/domain/repositories/user.repository.interface'
import type { IRefreshTokenRepository } from '~/domain/repositories/refresh-token.repository.interface'
import type { ILoginAttemptService } from '~/domain/contracts/login-attempt.service.interface'
import { USER_REPOSITORY } from '~/domain/repositories/user.repository.interface'
import { REFRESH_TOKEN_REPOSITORY } from '~/domain/repositories/refresh-token.repository.interface'
import { LOGIN_ATTEMPT_SERVICE } from '~/domain/contracts/login-attempt.service.interface'
import { LoginCommand } from '~/application/commands/login/login.command'
import { LoginResponseDto } from '~/presentation/dtos/user.dto'
import { ForbiddenException, Inject, NotFoundException, UnauthorizedException } from '@nestjs/common'
import { UserStatus } from '~/domain/enums/user.enum'
import { comparePassword, hashRefreshToken } from '~/common/utils/bcrypt.util'
import { MyJwtService } from '~/common/utils/jwt.util'
import { UserMapper } from '~/application/mappers/user.mapper'
import { PrismaService } from '~/infrastructure/database/prisma/prisma.service'
import { DEFAULT_USER_AGENT } from '~/common/constants/index.constants'
import { MAX_LOGIN_ATTEMPTS } from '~/common/constants/login-attempt.constants'

@CommandHandler(LoginCommand)
export class LoginHandler implements ICommandHandler<LoginCommand, LoginResponseDto> {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    @Inject(REFRESH_TOKEN_REPOSITORY)
    private readonly refreshRepository: IRefreshTokenRepository,
    @Inject(LOGIN_ATTEMPT_SERVICE)
    private readonly loginAttemptService: ILoginAttemptService,
    private readonly jwtService: MyJwtService,
    private readonly prisma: PrismaService,
  ) {}

  async execute(command: LoginCommand) {
    const { email, password, userAgent } = command

    const user = await this.userRepository.findByEmail(email)
    if (!user) throw new NotFoundException(`User doesn't exist`)
    if (!user.emailVerified) throw new ForbiddenException(`Email is not verified`)
    if (user.status === UserStatus.BANNED) throw new ForbiddenException('User is banned')

    // Kiểm tra tài khoản có đang bị khóa tạm thời không
    const isLocked = await this.loginAttemptService.isLocked(email)
    if (isLocked) {
      throw new ForbiddenException(
        'Tài khoản đã bị khóa tạm thời do đăng nhập sai quá nhiều lần. Vui lòng thử lại sau 15 phút.'
      )
    }

    const isMatch = await comparePassword(password, user._password)
    if (!isMatch) {
      // Ghi nhận lần đăng nhập sai
      const attempts = await this.loginAttemptService.recordFailedAttempt(email)
      const remaining = MAX_LOGIN_ATTEMPTS - attempts

      if (remaining <= 0) {
        throw new ForbiddenException(
          'Tài khoản đã bị khóa tạm thời do đăng nhập sai quá nhiều lần. Vui lòng thử lại sau 15 phút.'
        )
      }

      throw new UnauthorizedException(
        `Email hoặc mật khẩu không đúng. Bạn còn ${remaining} lần thử.`
      )
    }

    // Đăng nhập thành công → reset counter
    await this.loginAttemptService.resetAttempts(email)

    // Lấy role name và permissions
    const roleData = await this.prisma.role.findUnique({
      where: { id: user.roleId },
      include: { permissions: true }
    })
    
    const roleName = roleData?.name || ''
    const permissions = roleData?.permissions.map(p => p.name) || []

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
      userAgent: userAgent || DEFAULT_USER_AGENT,
      iat: new Date(decodedToken.iat * 1000),
      exp: new Date(decodedToken.exp * 1000),
      is2FAVerified: false,
    })

    // Trả về dữ liệu
    return UserMapper.toLoginResponse(accessToken, refreshToken, user, roleName, permissions)
  }
}