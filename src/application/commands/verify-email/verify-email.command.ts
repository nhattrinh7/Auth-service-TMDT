import { ICommand } from '@nestjs/cqrs'

export class VerifyEmailCommand implements ICommand {
  constructor(
    public readonly email: string,
    public readonly otp: string,
  ) {}
}
