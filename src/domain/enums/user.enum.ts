export const Gender = {
  MALE: 'MALE',
  FEMALE: 'FEMALE',
  OTHER: 'OTHER',
} as const
export type Gender = (typeof Gender)[keyof typeof Gender]

export const UserStatus = {
  ACTIVE: 'ACTIVE',
  BANNED: 'BANNED',
} as const
export type UserStatus = (typeof UserStatus)[keyof typeof UserStatus]
