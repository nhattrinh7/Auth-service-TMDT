import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { RegisterCommand } from '~/application/commands/register/register.command'
import type { IUserRepository } from '~/domain/repositories/user.repository.interface'
import type { IRoleRepository } from '~/domain/repositories/role.repository.interface'
import { USER_REPOSITORY } from '~/domain/repositories/user.repository.interface'
import { ROLE_REPOSITORY } from '~/domain/repositories/role.repository.interface'
import { User } from '~/domain/entities/user.entity'
import { RegisterResponseDto } from '~/presentation/dtos/user.dto'
import { hashPassword, hashOTP } from '~/common/utils/bcrypt.util'
import { UserMapper } from '~/application/mappers/user.mapper'
import { ConflictException, Inject } from '@nestjs/common'
import { EventPublisher } from '@nestjs/cqrs'

@CommandHandler(RegisterCommand)
export class RegisterHandler implements ICommandHandler<RegisterCommand, RegisterResponseDto> {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    @Inject(ROLE_REPOSITORY)
    private readonly roleRepository: IRoleRepository,
    private readonly publisher: EventPublisher,
  ) {}

  async execute(command: RegisterCommand) {
    const { email, password, fullName, phoneNumber, dob, gender } = command

    const existingUser = await this.userRepository.findByEmail(email)
    if (existingUser) {
      throw new ConflictException('Email already in use')
    }

    const hashedPassword = await hashPassword(password)

    // Lấy id của role mặc định là role Customer
    const customerRole = await this.roleRepository.findDefaultRole()
    if (!customerRole) throw new ConflictException('Default role not found')
    
    const user = User.create({
      email,
      roleId: customerRole.id,
      hashedPassword,
      fullName,
      phoneNumber,
      dob,
      gender,
    })
    // Hash OTP trước khi lưu vào DB rồi lưu
    const plainOTP = user.emailVerifyOtp!.getCode()
    const hashedOTP = await hashOTP(plainOTP!)
    user.emailVerifyOtp!.code = hashedOTP
    const createdUser = await this.userRepository.save(user)

    this.publisher.mergeObjectContext(user)
    user.commit()

    return UserMapper.toUserResponse(createdUser)
  }
}
