import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtService as NestJwtService } from '@nestjs/jwt'

export interface Payload {
  userId: string
  roleId: string
}

@Injectable()
export class MyJwtService {
  private readonly accessTokenSecret: string
  private readonly refreshTokenSecret: string
  private readonly accessTokenExpiration: string
  private readonly refreshTokenExpiration: string

  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: NestJwtService,
  ) {
    this.accessTokenSecret = this.configService.get<string>('ACCESS_TOKEN_SECRET')!
    this.refreshTokenSecret = this.configService.get<string>('REFRESH_TOKEN_SECRET')!
    this.accessTokenExpiration = this.configService.get('ACCESS_TOKEN_EXPIRATION')!
    this.refreshTokenExpiration = this.configService.get('REFRESH_TOKEN_EXPIRATION')!

    if (!this.accessTokenSecret || !this.refreshTokenSecret) {
      throw new Error('JWT secrets are not configured properly')
    }
  }

  async signAccessToken(payload: Payload): Promise<string> {
    return await this.jwtService.signAsync(payload, {
      secret: this.accessTokenSecret,
      expiresIn: this.accessTokenExpiration as any,
    })
  }

  async signRefreshToken(payload: Payload): Promise<string> {
    return await this.jwtService.signAsync(payload, {
      secret: this.refreshTokenSecret,
      expiresIn: this.refreshTokenExpiration as any,
    })
  }

  /**
   * Tạo refresh token với iat và exp được chỉ định (dùng khi refresh token)
   * @param timestamps - Object chứa iat và exp từ DB record
   * @returns JWT token string với iat và exp giữ nguyên
   */
  async signRefreshTokenWithTimestamps(
    payload: Payload,
    timestamps: { iat: Date; exp: Date }
  ): Promise<string> {
    // Convert Date object sang Unix timestamp (seconds)
    const iatSeconds = Math.floor(timestamps.iat.getTime() / 1000)
    const expSeconds = Math.floor(timestamps.exp.getTime() / 1000)

    // Tạo JWT với iat và exp cố định
    return await this.jwtService.signAsync(
      {
        ...payload,
        iat: iatSeconds,
        exp: expSeconds
      },
      {
        secret: this.refreshTokenSecret,
        noTimestamp: true // Không tự động thêm iat
      }
    )
  }

  // Thằng này đã tự kiểm tra expiration
  // Trả về payload nếu thành công, fail trả về false
  async verifyAccessToken(token: string): Promise<Payload> {
    try {
      return await this.jwtService.verifyAsync(token, {
        secret: this.accessTokenSecret,
      })
    } catch (error: any) {
      throw new Error(`Invalid access token: ${error.message}`)
    }
  }

  // Thằng này đã tự kiểm tra expiration
  async verifyRefreshToken(token: string): Promise<Payload> {
    try {
      return await this.jwtService.verifyAsync(token, {
        secret: this.refreshTokenSecret,
      })
    } catch (error: any) {
      throw new Error(`Invalid refresh token: ${error.message}`)
    }
  }

  decodeToken(token: string): any {
    return this.jwtService.decode(token)
  }

  getTokenExpiration(token: string): Date | null {
    const decoded = this.jwtService.decode(token)
    if (decoded?.exp) {
      return new Date(decoded.exp * 1000)
    }
    return null
  }

  isTokenExpired(token: string): boolean {
    const expiration = this.getTokenExpiration(token)
    return expiration ? expiration.getTime() < Date.now() : true
  }
}