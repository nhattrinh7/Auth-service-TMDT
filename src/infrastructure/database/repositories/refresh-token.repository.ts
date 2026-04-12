import { Injectable } from '@nestjs/common'
import { PrismaService } from '~/infrastructure/database/prisma/prisma.service'
import { IRefreshTokenRepository, SaveRefreshToken } from '~/domain/repositories/refresh-token.repository.interface'
import { v4 as uuidv4 } from 'uuid'

@Injectable()
export class RefreshTokenRepository implements IRefreshTokenRepository {
  constructor(private readonly prisma: PrismaService) {}

  async saveRefreshToken(data: SaveRefreshToken): Promise<void> {
    await this.prisma.refreshToken.create({
      data: {
        id: uuidv4(),
        token: data.token,
        userId: data.userId,
        userAgent: data.userAgent,
        is2FAVerified: data.is2FAVerified,
        iat: data.iat,
        exp: data.exp,
      },
    })
  }

  async findRefreshToken(userId: string, userAgent: string): Promise<any> {
    return await this.prisma.refreshToken.findFirst({
      where: {
        userId: userId,
        userAgent: userAgent,
      },
    })
  }

  async updateRefreshToken(id: string, newHashedRefreshToken: string): Promise<void> {
    await this.prisma.refreshToken.update({
      where: { id: id },
      data: { token: newHashedRefreshToken },
    })
  }

  async deleteRefreshToken(id: string): Promise<void> {
    await this.prisma.refreshToken.delete({
      where: { id: id },
    })
  }
}
