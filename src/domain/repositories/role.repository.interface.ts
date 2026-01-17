import { Role } from '~/domain/entities/role.entity'

export interface IRoleRepository {
  findDefaultRole(): Promise<Role | null>
}
export const ROLE_REPOSITORY = Symbol('IRoleRepository')