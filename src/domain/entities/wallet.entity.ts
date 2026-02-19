import { v4 as uuidv4 } from 'uuid'

export interface ICreateWalletProps {
  userId: string
}

export class Wallet {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public balance: number,
    public readonly createdAt: Date,
    public updatedAt: Date,
  ) {}

  // Factory method để tạo Wallet mới
  static create(props: ICreateWalletProps): Wallet {
    return new Wallet(
      uuidv4(),
      props.userId,
      0, // Balance mặc định là 0
      new Date(),
      new Date(),
    )
  }

  // Method để cập nhật balance nếu cần
  // updatedAt sẽ được Prisma tự động update nhờ decorator @updatedAt
  updateBalance(amount: number): void {
    if (this.balance + amount < 0) {
      throw new Error('Insufficient balance')
    }
    this.balance += amount
  }
}
