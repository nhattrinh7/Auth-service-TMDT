export interface SaveRefreshToken {
  userId: string
  token: string
  userAgent: string
  iat: Date
  exp: Date
  is2FAVerified: boolean
}

export interface IRefreshTokenRepository {
  saveRefreshToken(data: SaveRefreshToken): Promise<void>
  findRefreshToken(userId: string, userAgent: string): Promise<any>
  updateRefreshToken(id: string, newHashedRefreshToken: string): Promise<void>
  deleteRefreshToken(id: string): Promise<void>
}
export const REFRESH_TOKEN_REPOSITORY = Symbol('IRefreshTokenRepository')
