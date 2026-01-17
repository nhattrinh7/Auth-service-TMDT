// infrastructure/database/mappers/user.mapper.ts
import { Role as PrismaRole } from '@prisma/client'
import { Role } from '~/domain/entities/role.entity'


export class RoleMapper {
  static toDomain(prismaRole: PrismaRole): Role {
    return new Role(
      prismaRole.id,
      prismaRole.name,
      prismaRole.description,
      prismaRole.createdAt,
      prismaRole.updatedAt,
    )
  }

  static toPersistence(role: Role) {
    return {
      id: role.id,
      name: role.name,
      description: role.description,
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
    }
  }
}