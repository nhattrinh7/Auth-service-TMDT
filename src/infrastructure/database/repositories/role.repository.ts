import { Injectable } from '@nestjs/common'
import { PrismaService } from '~/infrastructure/database/prisma/prisma.service'
import { Role } from '~/domain/entities/role.entity'
import { RoleMapper } from '~/infrastructure/database/mappers//role.mapper'
import { IRoleRepository } from '~/domain/repositories//role.repository.interface'

@Injectable()
export class RoleRepository implements IRoleRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findDefaultRole(): Promise<Role | null> {
    const roleData = await this.prisma.role.findUnique({ where: { name: 'CUSTOMER' } })
    if (!roleData) return null

    return RoleMapper.toDomain(roleData)
  }
}