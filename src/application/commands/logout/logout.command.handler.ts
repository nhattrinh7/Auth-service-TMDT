import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import type { IRefreshTokenRepository } from '~/domain/repositories/refresh-token.repository.interface'
import { REFRESH_TOKEN_REPOSITORY } from '~/domain/repositories/refresh-token.repository.interface'
import { LogoutCommand } from '~/application/commands/logout/logout.command'
import { MyJwtService } from '~/common/utils/jwt.util'
import { Inject } from '@nestjs/common'

@CommandHandler(LogoutCommand)
export class LogoutHandler implements ICommandHandler<LogoutCommand, void> {
  constructor(
    @Inject(REFRESH_TOKEN_REPOSITORY)
    private readonly refreshTokenRepository: IRefreshTokenRepository,
    private readonly jwtService: MyJwtService,
  ) {}

  async execute(command: LogoutCommand) {
    const { accessToken, userAgent } = command

    // Check accessToken
    const payload = await this.jwtService.verifyAccessToken(accessToken)

    // Ok thì tìm và xóa refreshToken
    const refreshTokenRecord = await this.refreshTokenRepository.findRefreshToken(payload.userId, userAgent)

    await this.refreshTokenRepository.deleteRefreshToken(refreshTokenRecord.id)
  }
}
