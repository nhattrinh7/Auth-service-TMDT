import { createZodDto } from 'nestjs-zod'
import z from 'zod'
import { Gender, UserStatus } from '~/domain/enums/user.enum'

export const UserSchema = z.object({
  id: z.uuid(),
  username: z.string(),
  email: z.email(),
  roleId: z.uuid(),
  fullName: z.string().min(2),
  phoneNumber: z.string().min(10).max(11),
  dob: z.coerce.date(),
  gender: z.enum([Gender.MALE, Gender.FEMALE, Gender.OTHER]),
  avatar: z.url().nullable(),
  status: z.enum([UserStatus.ACTIVE, UserStatus.BANNED]),
  emailVerified: z.boolean(),
  require2FA: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
})
export class UserDto extends createZodDto(UserSchema) {}

// Register
const RegisterBodySchema = z
  .object({
    email: z.email(),
    password: z.string(),
    fullName: z.string(),
    phoneNumber: z.string(),
    gender: z.enum([Gender.MALE, Gender.FEMALE, Gender.OTHER]),
    dob: z.coerce.date(),
  })
  .strict()
export class RegisterBodyDto extends createZodDto(RegisterBodySchema) {}

export class RegisterResponseDto extends createZodDto(UserSchema) {}

// Login
const LoginBodySchema = z
  .object({
    email: z.email(),
    password: z.string(),
  })
  .strict()
export class LoginBodyDto extends createZodDto(LoginBodySchema) {}

// Google login
const GoogleLoginBodySchema = z
  .object({
    credential: z.string().min(1),
  })
  .strict()
export class GoogleLoginBodyDto extends createZodDto(GoogleLoginBodySchema) {}

const LoginResponseSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  user: UserSchema.pick({
    id: true,
    username: true,
    email: true,
    roleId: true,
    fullName: true,
    phoneNumber: true,
    dob: true,
    gender: true,
    avatar: true,
    status: true,
    emailVerified: true,
    require2FA: true,
    createdAt: true,
    updatedAt: true,
  }).extend({
    roleName: z.string(),
    permissions: z.array(z.string()),
  }),
})
export class LoginResponseDto extends createZodDto(LoginResponseSchema) {}

// Verify email
const VerifyEmailBodySchema = z.object({
  otp: z.string().length(6),
  email: z.email(),
})
export class VerifyEmailBodyDto extends createZodDto(VerifyEmailBodySchema) {}

// Refresh token
const RefresTokenBodySchema = z.object({
  refreshToken: z.string(),
})
export class RefreshTokenBodyDto extends createZodDto(RefresTokenBodySchema) {}

const RefresTokenResponseSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
})
export class RefreshTokenResponseDto extends createZodDto(RefresTokenResponseSchema) {}

// Forgot password
const ForgotPasswordBodySchema = z
  .object({
    email: z.email(),
  })
  .strict()
export class ForgotPasswordBodyDto extends createZodDto(ForgotPasswordBodySchema) {}

// Reset password
const ResetPasswordBodySchema = z
  .object({
    email: z.email(),
    otp: z.string().length(6),
    newPassword: z.string().min(8),
  })
  .strict()
export class ResetPasswordBodyDto extends createZodDto(ResetPasswordBodySchema) {}

// Verify request
const VerifyRequestResponseSchema = z.object({
  userId: z.string(),
  roleId: z.string(),
  categoryIds: z.array(z.string()).optional(),
})
export class VerifyRequestResponseDto extends createZodDto(VerifyRequestResponseSchema) {}
