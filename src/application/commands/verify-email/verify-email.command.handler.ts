import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import type { IUserRepository } from '~/domain/repositories/user.repository.interface'
import { USER_REPOSITORY } from '~/domain/repositories/user.repository.interface'
import { VerifyEmailCommand } from '~/application/commands/verify-email/verify-email.command'
import { BadRequestException, Inject, NotFoundException, UnprocessableEntityException } from '@nestjs/common'
import { compareOTP } from '~/common/utils/bcrypt.util'

@CommandHandler(VerifyEmailCommand)
export class VerifyEmailHandler implements ICommandHandler<VerifyEmailCommand, void> {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(command: VerifyEmailCommand) {
    const { email, otp } = command

    const user = await this.userRepository.findByEmail(email)
    if (!user) throw new NotFoundException(`User doesn't exist`)
    if (user.emailVerified) throw new BadRequestException(`Email is already verified`)

    // const isExpired = user._emailVerifyOtp?.expireAt && user._emailVerifyOtp?.expireAt.getTime() < Date.now()
    const isExpired = user.emailVerifyOtp?.isExpired()
    if (isExpired) throw new UnprocessableEntityException('OTP is expired or invalid')

    // Chưa hết hạn thì check otp xem có match không, match thì set trường otp và expire trong db bằng null, đồng thời emailVerrified = true
    let isMatch: boolean = false
    if (user.emailVerifyOtp?.code) {
      isMatch = await compareOTP(otp, user.emailVerifyOtp.code)
    }
    if (!isMatch) throw new UnprocessableEntityException('OTP is not correct')

    if (user.emailVerifyOtp) {
      user.emailVerifyOtp.code = null
      user.emailVerifyOtp.expireAt = null
    }
    user.emailVerified = true
    await this.userRepository.save(user)
  }
}