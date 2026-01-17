import { ICommand } from '@nestjs/cqrs'

export class LogoutCommand implements ICommand {
  constructor(
    public readonly accessToken: string,
    public readonly userAgent: string,
  ) {}
}
