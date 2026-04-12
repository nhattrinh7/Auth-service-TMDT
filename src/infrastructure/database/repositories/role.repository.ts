import { Injectable } from '@nestjs/common'
import { PrismaService } from '~/infrastructure/database/prisma/prisma.service'
import { Role } from '~/domain/entities/role.entity'
import { RoleMapper } from '~/infrastructure/database/mappers//role.mapper'
import { IRoleRepository, PermissionRecord } from '~/domain/repositories//role.repository.interface'

@Injectable()
export class RoleRepository implements IRoleRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findDefaultRole(): Promise<Role | null> {
    const roleData = await this.prisma.role.findUnique({ where: { name: 'CUSTOMER' } })
    if (!roleData) return null

    return RoleMapper.toDomain(roleData)
  }

  async findRoleNameById(roleId: string): Promise<string | null> {
    const role = await this.prisma.role.findUnique({
      where: { id: roleId },
      select: { name: true },
    })
    return role?.name ?? null
  }

  async findPermissionsByRoleId(roleId: string): Promise<PermissionRecord[]> {
    const role = await this.prisma.role.findUnique({
      where: { id: roleId },
      include: {
        permissions: {
          select: {
            method: true,
            path: true,
            isPublic: true,
          },
        },
      },
    })

    if (!role) return []

    return role.permissions.map(p => ({
      method: p.method,
      path: p.path,
      isPublic: p.isPublic ?? false,
    }))
  }

  async findTopLevelCategoryIdsByRoleId(roleId: string): Promise<string[]> {
    const categories = await this.prisma.roleCategory.findMany({
      where: {
        roleId,
        level: 1, // Chỉ lấy category cấp 1
      },
      select: {
        categoryId: true,
      },
    })

    return categories.map(c => c.categoryId)
  }
}
