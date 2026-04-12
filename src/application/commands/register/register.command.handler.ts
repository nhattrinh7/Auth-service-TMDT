import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { RegisterCommand } from '~/application/commands/register/register.command'
import type { IUserRepository } from '~/domain/repositories/user.repository.interface'
import type { IRoleRepository } from '~/domain/repositories/role.repository.interface'
import type { IWalletRepository } from '~/domain/repositories/wallet.repository.interface'
import { USER_REPOSITORY } from '~/domain/repositories/user.repository.interface'
import { ROLE_REPOSITORY } from '~/domain/repositories/role.repository.interface'
import { WALLET_REPOSITORY } from '~/domain/repositories/wallet.repository.interface'
import { User } from '~/domain/entities/user.entity'
import { RegisterResponseDto } from '~/presentation/dtos/user.dto'
import { hashPassword, hashOTP } from '~/common/utils/bcrypt.util'
import { UserMapper } from '~/application/mappers/user.mapper'
import { ConflictException, Inject } from '@nestjs/common'
import { EventPublisher } from '@nestjs/cqrs'
import { PrismaService } from '~/infrastructure/database/prisma/prisma.service'

@CommandHandler(RegisterCommand)
export class RegisterHandler implements ICommandHandler<RegisterCommand, RegisterResponseDto> {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    @Inject(ROLE_REPOSITORY)
    private readonly roleRepository: IRoleRepository,
    @Inject(WALLET_REPOSITORY)
    private readonly walletRepository: IWalletRepository,
    private readonly publisher: EventPublisher,
    private readonly prismaService: PrismaService,
  ) {}

  async execute(command: RegisterCommand) {
    const { email, password, fullName, phoneNumber, dob, gender } = command

    const existingUser = await this.userRepository.findByEmail(email)
    if (existingUser) {
      throw new ConflictException('Email already in use')
    }

    const existingPhone = await this.userRepository.findByPhoneNumber(phoneNumber)
    if (existingPhone) {
      throw new ConflictException('Phone number already in use')
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

    // Wrap DB writes trong transaction
    const createdUser = await this.prismaService.transaction(async tx => {
      const createdUser = await this.userRepository.save(user, tx)

      // Tạo wallet cho user sau khi tạo user thành công
      // User là aggregate root nên method createWallet() được gọi từ User entity
      const wallet = createdUser.createWallet()
      await this.walletRepository.save(wallet, tx)

      return createdUser
    })

    // Publish events NGOÀI transaction
    this.publisher.mergeObjectContext(user)
    user.commit()

    return UserMapper.toUserResponse(createdUser)
  }
}
