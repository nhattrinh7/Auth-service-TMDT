import { ICommand } from '@nestjs/cqrs'
import { Gender } from '~/domain/enums/user.enum'

export class RegisterCommand implements ICommand {
  constructor(
    public readonly email: string,
    public readonly password: string,
    public readonly fullName: string,
    public readonly phoneNumber: string,
    public readonly dob: Date,
    public readonly gender: Gender,
  ) {}
}
