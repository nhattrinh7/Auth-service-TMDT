import { AggregateRoot } from '@nestjs/cqrs'
import { Gender, UserStatus } from '~/domain/enums/user.enum'
import { v4 as uuidv4 } from 'uuid'
import { ICreateGoogleUserProps, ICreateUserProps } from '~/domain/interfaces/user.interface'
import { PhoneNumber } from '~/domain/value-objects/phone-number.vo'
import { Email } from '~/domain/value-objects/email.vo'
import { FullName } from '~/domain/value-objects/full-name.vo'
import { OTP } from '~/domain/value-objects/otp.vo'
import { generateUsername } from '~/common/utils/create-username.util'
import { UserCreatedEvent } from '~/domain/events/user-created.event'
import { Wallet } from '~/domain/entities/wallet.entity'

export class User extends AggregateRoot {
  constructor(
    public readonly id: string,
    public username: string,
    public email: Email,
    public roleId: string,
    private password: string,
    private passCode: string | null,
    public fullName: FullName,
    public phoneNumber: PhoneNumber,
    public dob: Date,
    public gender: Gender,
    public avatar: string | null,
    public status: UserStatus,
    public require2FA: boolean,
    public emailVerifyOtp: OTP | null,
    public emailVerified: boolean,
    private passwordResetOtp: OTP | null,
    private passCodeResetOtp: OTP | null,
    public readonly createdAt: Date,
    public updatedAt: Date,
  ) {
    super()
  }

  // Factory method
  static create(props: ICreateUserProps): User {
    const user = new User(
      uuidv4(),
      generateUsername(),
      Email.create(props.email),
      props.roleId,
      props.hashedPassword,
      null,
      FullName.create(props.fullName),
      PhoneNumber.create(props.phoneNumber),
      props.dob,
      props.gender,
      null,
      UserStatus.ACTIVE,
      false,
      OTP.create(30),
      false,
      null,
      null,
      new Date(),
      new Date(),
    )

    user.apply(
      new UserCreatedEvent(
        user.id,
        user.email.getValue(),
        user.emailVerifyOtp!.getCode()!,
        user.emailVerifyOtp!.getExpiry(),
      ),
    )

    return user
  }

  static createFromGoogle(props: ICreateGoogleUserProps): User {
    const user = new User(
      uuidv4(),
      generateUsername(),
      Email.create(props.email),
      props.roleId,
      props.hashedPassword,
      null,
      FullName.create(props.fullName),
      PhoneNumber.create(props.phoneNumber),
      props.dob,
      props.gender,
      props.avatar ?? null,
      UserStatus.ACTIVE,
      false,
      null,
      true,
      null,
      null,
      new Date(),
      new Date(),
    )

    return user
  }

  get _password(): string {
    return this.password
  }

  get _emailVerifyOtp(): OTP | null {
    return this.emailVerifyOtp
  }

  get _passwordResetOtp(): OTP | null {
    return this.passwordResetOtp
  }

  setPasswordResetOtp(otp: OTP | null): void {
    this.passwordResetOtp = otp
    this.updatedAt = new Date()
  }

  clearPasswordResetOtp(): void {
    this.passwordResetOtp = null
    this.updatedAt = new Date()
  }

  setPassword(hashedPassword: string): void {
    this.password = hashedPassword
    this.updatedAt = new Date()
  }

  // Method để tạo wallet cho user (User là aggregate root của Wallet)
  createWallet(): Wallet {
    return Wallet.create({ userId: this.id })
  }
}
