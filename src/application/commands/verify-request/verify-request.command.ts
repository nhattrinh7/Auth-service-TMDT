import { ICommand } from '@nestjs/cqrs'

export class VerifyRequestCommand implements ICommand {
  constructor(
    public readonly accessToken: string,
    public readonly method: string,
    public readonly uri: string,
  ) {}
}
