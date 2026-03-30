import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { BadRequestException, Inject, NotFoundException, UnprocessableEntityException } from '@nestjs/common'
import { ResetPasswordCommand } from '~/application/commands/reset-password/reset-password.command'
import { compareOTP, hashPassword } from '~/common/utils/bcrypt.util'
import { type IUserRepository, USER_REPOSITORY } from '~/domain/repositories/user.repository.interface'

@CommandHandler(ResetPasswordCommand)
export class ResetPasswordHandler implements ICommandHandler<ResetPasswordCommand, void> {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(command: ResetPasswordCommand) {
    const { email, otp, newPassword } = command

    const user = await this.userRepository.findByEmail(email)
    if (!user) throw new NotFoundException('User không tồn tại')
    if (!user.emailVerified) throw new BadRequestException('Email chưa được xác minh')

    const passwordResetOtp = user._passwordResetOtp
    const isExpired = passwordResetOtp?.isExpired()
    if (!passwordResetOtp || isExpired) {
      throw new UnprocessableEntityException('OTP đã hết hạn hoặc không hợp lệ')
    }

    let isMatch = false
    if (passwordResetOtp.code) {
      isMatch = await compareOTP(otp, passwordResetOtp.code)
    }
    if (!isMatch) throw new UnprocessableEntityException('OTP không đúng')

    const hashedPassword = await hashPassword(newPassword)
    user.setPassword(hashedPassword)
    user.clearPasswordResetOtp()
    await this.userRepository.save(user)
  }
}
