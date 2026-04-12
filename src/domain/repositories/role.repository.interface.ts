import { Role } from '~/domain/entities/role.entity'

export interface PermissionRecord {
  method: string
  path: string
  isPublic: boolean
}

export interface IRoleRepository {
  findDefaultRole(): Promise<Role | null>
  findRoleNameById(roleId: string): Promise<string | null>
  findPermissionsByRoleId(roleId: string): Promise<PermissionRecord[]>
  findTopLevelCategoryIdsByRoleId(roleId: string): Promise<string[]>
}
export const ROLE_REPOSITORY = Symbol('IRoleRepository')
