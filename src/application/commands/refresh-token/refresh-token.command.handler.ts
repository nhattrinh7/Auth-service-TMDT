import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { REFRESH_TOKEN_REPOSITORY } from '~/domain/repositories/refresh-token.repository.interface'
import { RefreshTokenCommand } from '~/application/commands/refresh-token/refresh-token.command'
import { RefreshTokenResponseDto } from '~/presentation/dtos/user.dto'
import { Inject, NotFoundException, UnauthorizedException } from '@nestjs/common'
import { MyJwtService } from '~/common/utils/jwt.util'
import { compareRefreshToken, hashRefreshToken } from '~/common/utils/bcrypt.util'
import type { IRefreshTokenRepository } from '~/domain/repositories/refresh-token.repository.interface'

@CommandHandler(RefreshTokenCommand)
export class RefreshTokenHandler implements ICommandHandler<RefreshTokenCommand, RefreshTokenResponseDto> {
  constructor(
    @Inject(REFRESH_TOKEN_REPOSITORY)
    private readonly refreshRepository: IRefreshTokenRepository,
    private readonly jwtService: MyJwtService,
  ) {}

  async execute(command: RefreshTokenCommand) {
    const { refreshToken, userAgent } = command

    // Check xem refreshToken có hợp lệ không
    const refreshTokenDecoded = await this.jwtService.verifyRefreshToken(refreshToken)
    const jwtPayload = { userId: refreshTokenDecoded.userId, roleId: refreshTokenDecoded.roleId }

    // Query refreshToken trong DB ra
    const refreshTokenRecord = await this.refreshRepository.findRefreshToken(jwtPayload.userId, userAgent)
    if (!refreshTokenRecord) throw new NotFoundException(`RefreshToken doesn't exist, cannot refresh token`)

    // So sánh bằng bcrypt compare vì token được hash trước khi lưu DB
    const isMatch = await compareRefreshToken(refreshToken, refreshTokenRecord.token)
    if (!isMatch) throw new UnauthorizedException('Refresh token is not match')

    // Check token đã hết hạn chưa
    if (new Date() > refreshTokenRecord.exp) {
      await this.refreshRepository.deleteRefreshToken(refreshTokenRecord.id)
      throw new UnauthorizedException('Refresh token expired')
    }

    // Tạo accessToken và refreshToken mới
    const newAccessToken = await this.jwtService.signAccessToken({
      userId: jwtPayload.userId,
      roleId: jwtPayload.roleId,
    })

    const newRefreshToken = await this.jwtService.signRefreshTokenWithTimestamps(
      {
        userId: jwtPayload.userId,
        roleId: jwtPayload.roleId,
      },
      {
        iat: refreshTokenRecord.iat, // Giữ nguyên iat từ DB
        exp: refreshTokenRecord.exp, // Giữ nguyên exp từ DB
      },
    )

    const newHashedRefreshToken = await hashRefreshToken(newRefreshToken)

    // Update token string trong DB
    await this.refreshRepository.updateRefreshToken(refreshTokenRecord.id, newHashedRefreshToken)

    return { accessToken: newAccessToken, refreshToken: newRefreshToken }
  }
}
