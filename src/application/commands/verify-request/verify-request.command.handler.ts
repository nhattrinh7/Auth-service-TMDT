import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { VerifyRequestCommand } from '~/application/commands/verify-request/verify-request.command'
import { VerifyRequestResponseDto } from '~/presentation/dtos/user.dto'
import { MyJwtService } from '~/common/utils/jwt.util'

@CommandHandler(VerifyRequestCommand)
export class VerifyRequestHandler implements ICommandHandler<VerifyRequestCommand, VerifyRequestResponseDto> {
  constructor(
    private readonly jwtService: MyJwtService,
  ) {}

  async execute(command: VerifyRequestCommand) {
    const { accessToken } = command

    const payload = await this.jwtService.verifyAccessToken(accessToken)

    // Trả về dữ liệu
    return { 
      userId: payload.userId,
      roleId: payload.roleId,
    }
  }
}