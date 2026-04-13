import { User } from '~/domain/entities/user.entity'
import { RegisterResponseDto, LoginResponseDto } from '~/presentation/dtos/user.dto'

export class UserMapper {
  static toUserResponse(user: User): RegisterResponseDto {
    return {
      id: user.id,
      username: user.username,
      email: user.email.value, // ← Extract string từ Value Object
      roleId: user.roleId,
      fullName: user.fullName.value, // ← Extract string
      phoneNumber: user.phoneNumber.value, // ← Extract string
      dob: user.dob.toISOString(),
      gender: user.gender,
      avatar: user.avatar,
      status: user.status,
      require2FA: user.require2FA,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    }
  }

  static toLoginResponse(
    accessToken: string,
    refreshToken: string,
    user: User,
    roleName: string,
    permissions: string[],
  ): LoginResponseDto {
    return {
      accessToken: accessToken,
      refreshToken: refreshToken,
      user: {
        id: user.id,
        username: user.username,
        email: user.email.value,
        roleId: user.roleId,
        fullName: user.fullName.value,
        phoneNumber: user.phoneNumber.value,
        dob: user.dob.toISOString(),
        gender: user.gender,
        avatar: user.avatar,
        status: user.status,
        require2FA: user.require2FA,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
        roleName: roleName,
        permissions: permissions,
      },
    }
  }
}
