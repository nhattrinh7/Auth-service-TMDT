// infrastructure/database/mappers/user.mapper.ts
import { User as PrismaUser } from '@prisma/client'
import { User } from '~/domain/entities/user.entity'
import { Email } from '~/domain/value-objects/email.vo'
import { FullName } from '~/domain/value-objects/full-name.vo'
import { PhoneNumber } from '~/domain/value-objects/phone-number.vo'
import { OTP } from '~/domain/value-objects/otp.vo'

export class UserMapper {
  static toDomain(prismaUser: PrismaUser): User {
    return new User(
      prismaUser.id,
      prismaUser.username,
      Email.create(prismaUser.email),
      prismaUser.roleId,
      prismaUser.password,
      prismaUser.passCode,
      FullName.create(prismaUser.fullName),
      PhoneNumber.create(prismaUser.phoneNumber ?? ''),
      prismaUser.dob ?? new Date(),
      prismaUser.gender,
      prismaUser.avatar,
      prismaUser.status,
      prismaUser.require2FA,
      
      // ✅ Reconstruct OTP Value Objects từ DB
      prismaUser.emailVerifyOtp && prismaUser.emailVerifyOtpExpire
        ? OTP.from(prismaUser.emailVerifyOtp, prismaUser.emailVerifyOtpExpire)
        : null,
      
      prismaUser.emailVerified,
      
      prismaUser.passwordResetOtp && prismaUser.passwordResetOtpExpire
        ? OTP.from(prismaUser.passwordResetOtp, prismaUser.passwordResetOtpExpire)
        : null,
      
      prismaUser.passCodeResetOtp && prismaUser.passCodeResetOtpExpire
        ? OTP.from(prismaUser.passCodeResetOtp, prismaUser.passCodeResetOtpExpire)
        : null,
      
      prismaUser.createdAt,
      prismaUser.updatedAt,
    )
  }

  static toPersistence(user: User) {
    // Access private fields qua bracket notation
    return {
      id: user.id,
      username: user.username,
      email: user.email.value,
      roleId: user.roleId,
      password: user['password'],
      passCode: user['passCode'],
      fullName: user.fullName.value,
      phoneNumber: user.phoneNumber.value,
      dob: user.dob,
      gender: user.gender,
      
      // ✅ Extract code và expiry từ OTP Value Objects
      emailVerifyOtp: user['emailVerifyOtp']?.code ?? null,
      emailVerifyOtpExpire: user['emailVerifyOtp']?.expireAt ?? null,
      
      emailVerified: user.emailVerified,
      
      passwordResetOtp: user['passwordResetOtp']?.code ?? null,
      passwordResetOtpExpire: user['passwordResetOtp']?.expireAt ?? null,
      
      passCodeResetOtp: user['passCodeResetOtp']?.code ?? null,
      passCodeResetOtpExpire: user['passCodeResetOtp']?.expireAt ?? null,
      
      avatar: user.avatar,
      status: user.status,
      require2FA: user.require2FA,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }
  }
}