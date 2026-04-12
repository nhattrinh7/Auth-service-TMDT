import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { Inject, ForbiddenException } from '@nestjs/common'
import { VerifyRequestCommand } from '~/application/commands/verify-request/verify-request.command'
import type { VerifyRequestResponseDto } from '~/presentation/dtos/user.dto'
import { MyJwtService } from '~/common/utils/jwt.util'
import { ROLE_REPOSITORY } from '~/domain/repositories/role.repository.interface'
import type { IRoleRepository } from '~/domain/repositories/role.repository.interface'
import { PermissionCacheService } from '~/infrastructure/redis/permission-cache.service'
import { NON_ADMIN_ROLES } from '~/common/constants/index.constants'

@CommandHandler(VerifyRequestCommand)
export class VerifyRequestHandler implements ICommandHandler<VerifyRequestCommand, VerifyRequestResponseDto> {
  // Cache roleName theo roleId (in-memory, ít data nên không cần Redis)
  private roleNameCache = new Map<string, string>()

  constructor(
    private readonly jwtService: MyJwtService,
    @Inject(ROLE_REPOSITORY) private readonly roleRepository: IRoleRepository,
    private readonly permissionCacheService: PermissionCacheService,
  ) {}

  async execute(command: VerifyRequestCommand) {
    const { accessToken, method, uri } = command

    // 1. Verify JWT → lấy userId, roleId
    const payload = await this.jwtService.verifyAccessToken(accessToken)
    const { userId, roleId } = payload

    // 2. Lấy permissions của role (Redis cache → fallback DB)
    let permissions = await this.permissionCacheService.getPermissions(roleId)

    if (!permissions) {
      // Cache miss → query DB → cache lại
      permissions = await this.roleRepository.findPermissionsByRoleId(roleId)
      await this.permissionCacheService.setPermissions(roleId, permissions)
    }

    // Ko cần check isPublic vì trong _PermissionToRole, mỗi role đã có sẵn cả các permission
    // public rồi, check method + path khớp hay ko là dc quyền, public hay ko ko quan trọng

    // 3. Normalize URI: bỏ prefix /api (Kong gửi /api/v1/... , DB lưu /v1/...)
    const normalizedUri = uri.replace(/^\/api/, '')

    // 4. Tìm permission khớp (method + path)
    const matchedPermission = permissions.find(p => p.method === method && p.path === normalizedUri)

    // 5. Nếu không tìm thấy permission → role không có quyền → 403
    if (!matchedPermission) {
      throw new ForbiddenException('Bạn không có quyền truy cập tài nguyên này')
    }

    // *Phần trên là check RBAC, dưới này là phần chuẩn bị categoryIds để forward cho downstream service*

    // 6. Nếu là admin role → lấy categoryIds (top-level) để forward cho downstream service
    const roleName = await this.getRoleName(roleId)
    let categoryIds: string[] | undefined

    if (roleName && !NON_ADMIN_ROLES.has(roleName)) {
      // Admin role → lấy categoryIds
      const cached = await this.permissionCacheService.getCategoryIds(roleId)

      if (cached) {
        categoryIds = cached
      } else {
        const fromDb = await this.roleRepository.findTopLevelCategoryIdsByRoleId(roleId)
        await this.permissionCacheService.setCategoryIds(roleId, fromDb)
        categoryIds = fromDb
      }
    }

    // 7. Trả về dữ liệu
    return {
      userId,
      roleId,
      ...(categoryIds !== undefined && { categoryIds }),
    }
  }

  /**
   * Lấy roleName từ roleId (cache in-memory vì data ít và ổn định)
   */
  private async getRoleName(roleId: string): Promise<string | null> {
    if (this.roleNameCache.has(roleId)) {
      return this.roleNameCache.get(roleId)!
    }

    const roleName = await this.roleRepository.findRoleNameById(roleId)
    if (roleName) {
      this.roleNameCache.set(roleId, roleName)
    }
    return roleName
  }
}
