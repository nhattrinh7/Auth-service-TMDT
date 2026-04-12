import { Injectable } from '@nestjs/common'
import { PrismaService } from '~/infrastructure/database/prisma/prisma.service'
import { User } from '~/domain/entities/user.entity'
import { UserMapper } from '~/infrastructure/database/mappers/user.mapper'
import { IUserRepository } from '~/domain/repositories/user.repository.interface'

@Injectable()
export class UserRepository implements IUserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByPhoneNumber(phoneNumber: string): Promise<User | null> {
    const userData = await this.prisma.user.findUnique({
      where: { phoneNumber },
      include: {
        role: {
          include: {
            permissions: true,
          },
        },
      },
    })
    if (!userData) return null

    return UserMapper.toDomain(userData)
  }

  async findByEmail(email: string): Promise<User | null> {
    const userData = await this.prisma.user.findUnique({
      where: { email },
      include: {
        role: {
          include: {
            permissions: true,
          },
        },
      },
    })
    if (!userData) return null

    const user = UserMapper.toDomain(userData) // Map sang Entity trước, vì merge là merge cái dạng Entity ấy
    return user
  }

  async save(user: User, tx?: any): Promise<User> {
    const client = tx ?? this.prisma
    const data = UserMapper.toPersistence(user)

    const saved = await client.user.upsert({
      where: { id: user.id },
      update: data,
      create: data,
    })

    return UserMapper.toDomain(saved)
  }
}
