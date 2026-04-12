import { Injectable } from '@nestjs/common'
import { PrismaService } from '~/infrastructure/database/prisma/prisma.service'
import { Wallet } from '~/domain/entities/wallet.entity'
import { WalletMapper } from '~/infrastructure/database/mappers/wallet.mapper'
import { IWalletRepository } from '~/domain/repositories/wallet.repository.interface'

@Injectable()
export class WalletRepository implements IWalletRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByUserId(userId: string): Promise<Wallet | null> {
    const walletData = await this.prisma.wallet.findUnique({
      where: { userId },
    })

    if (!walletData) return null

    return WalletMapper.toDomain(walletData)
  }

  async save(wallet: Wallet, tx?: any): Promise<Wallet> {
    const client = tx ?? this.prisma
    const data = WalletMapper.toPersistence(wallet)

    const saved = await client.wallet.upsert({
      where: { userId: wallet.userId },
      update: data,
      create: data,
    })

    return WalletMapper.toDomain(saved)
  }
}
