import { Inject, Injectable } from '@nestjs/common'
import Redis from 'ioredis'
const REDIS_CLIENT = 'REDIS_CLIENT'

interface CachedPermission {
  method: string
  path: string
  isPublic: boolean
}

const PERMISSIONS_PREFIX = 'rbac:role'
const CATEGORY_PREFIX = 'rbac:category'
const DEFAULT_TTL = 3600 // 1 giờ

@Injectable()
export class PermissionCacheService {
  constructor(
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  // ===== PERMISSIONS =====
  async getPermissions(roleId: string): Promise<CachedPermission[] | null> {
    const data = await this.redis.get(`${PERMISSIONS_PREFIX}:${roleId}:permissions`)
    if (!data) return null
    return JSON.parse(data)
  }

  async setPermissions(roleId: string, permissions: CachedPermission[]): Promise<void> {
    await this.redis.set(
      `${PERMISSIONS_PREFIX}:${roleId}:permissions`,
      JSON.stringify(permissions),
      'EX',
      DEFAULT_TTL,
    )
  }

  // ===== CATEGORY IDS (top-level) =====
  async getCategoryIds(roleId: string): Promise<string[] | null> {
    const data = await this.redis.get(`${CATEGORY_PREFIX}:${roleId}:categoryIds`)
    if (!data) return null
    return JSON.parse(data)
  }

  async setCategoryIds(roleId: string, categoryIds: string[]): Promise<void> {
    await this.redis.set(
      `${CATEGORY_PREFIX}:${roleId}:categoryIds`,
      JSON.stringify(categoryIds),
      'EX', // EX nghĩa là set thời gian sống bằng giây, PX là set thời gian sống bằng mili giây
      DEFAULT_TTL,
    )
  }

  // ===== INVALIDATE (khi admin thay đổi role/permission) =====
  async invalidate(roleId: string): Promise<void> {
    await this.redis.del(`${PERMISSIONS_PREFIX}:${roleId}:permissions`)
    await this.redis.del(`${CATEGORY_PREFIX}:${roleId}:categoryIds`)
  }
}
