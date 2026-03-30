import { ICommand } from '@nestjs/cqrs'

export class GoogleLoginCommand implements ICommand {
  constructor(
    public readonly credential: string,
    public readonly userAgent?: string,
  ) {}
}
