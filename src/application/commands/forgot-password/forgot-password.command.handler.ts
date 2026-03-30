import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { BadRequestException, Inject, NotFoundException } from '@nestjs/common'
import { ForgotPasswordCommand } from '~/application/commands/forgot-password/forgot-password.command'
import { OTP } from '~/domain/value-objects/otp.vo'
import { hashOTP } from '~/common/utils/bcrypt.util'
import { type IUserRepository, USER_REPOSITORY } from '~/domain/repositories/user.repository.interface'
import { type IMessagePublisher, MESSAGE_PUBLISHER } from '~/domain/contracts/message-publisher.interface'

@CommandHandler(ForgotPasswordCommand)
export class ForgotPasswordHandler implements ICommandHandler<ForgotPasswordCommand, void> {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    @Inject(MESSAGE_PUBLISHER)
    private readonly messagePublisher: IMessagePublisher,
  ) {}

  async execute(command: ForgotPasswordCommand) {
    const { email } = command

    const user = await this.userRepository.findByEmail(email)
    if (!user) throw new NotFoundException('User không tồn tại')
    if (!user.emailVerified) throw new BadRequestException('Email chưa được xác minh')

    const otp = OTP.create(5)
    const plainOtp = otp.getCode()
    const hashedOtp = await hashOTP(plainOtp!)
    const hashedOtpEntity = OTP.from(hashedOtp, otp.expireAt!)

    user.setPasswordResetOtp(hashedOtpEntity)
    await this.userRepository.save(user)

    this.messagePublisher.publishToNotificationService('send_password_reset_otp', {
      email,
      otp: plainOtp,
      expiryMinutes: otp.getExpiry(),
    })
  }
}
