import { Injectable } from '@nestjs/common'
import { PrismaService } from '~/infrastructure/database/prisma/prisma.service'
import { User } from '~/domain/entities/user.entity'
import { UserMapper } from '~/infrastructure/database/mappers/user.mapper'
import { IUserRepository } from '~/domain/repositories/user.repository.interface'

@Injectable()
export class UserRepository implements IUserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmail(email: string): Promise<User | null> {
    const userData = await this.prisma.user.findUnique({ where: { email } })
    if (!userData) return null

    const user = UserMapper.toDomain(userData) // Map sang Entity trước, vì merge là merge cái dạng Entity ấy
    return user
  }

  async save(user: User): Promise<User> {
    const data = UserMapper.toPersistence(user)
    
    const saved = await this.prisma.user.upsert({
      where: { id: user.id },
      update: data,
      create: data,
    })

    return UserMapper.toDomain(saved)
  }
}
