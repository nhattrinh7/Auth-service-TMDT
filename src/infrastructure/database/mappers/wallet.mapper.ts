import { Wallet as PrismaWallet } from '@prisma/client'
import { Wallet } from '~/domain/entities/wallet.entity'
import { Decimal } from '@prisma/client/runtime/library'

export class WalletMapper {
  static toDomain(raw: PrismaWallet): Wallet {
    return new Wallet(
      raw.id,
      raw.userId,
      raw.balance.toNumber(), // Convert Decimal to number
      raw.createdAt,
      raw.updatedAt,
    )
  }

  static toPersistence(wallet: Wallet) {
    return {
      id: wallet.id,
      userId: wallet.userId,
      balance: new Decimal(wallet.balance),
      createdAt: wallet.createdAt,
      updatedAt: wallet.updatedAt,
    }
  }
}
