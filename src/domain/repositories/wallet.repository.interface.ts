import { Wallet } from '~/domain/entities/wallet.entity'

export interface IWalletRepository {
  save(wallet: Wallet, tx?: any): Promise<Wallet>
  findByUserId(userId: string): Promise<Wallet | null>
}

export const WALLET_REPOSITORY = Symbol('IWalletRepository')
