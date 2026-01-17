export class OTP {
  private constructor(
    public code: string | null,
    public expireAt: Date | null,
  ) {}

  static create(expiryMinutes: number = 5): OTP {
    const code = Math.floor(100000 + Math.random() * 900000).toString()
    const expireAt = new Date(Date.now() + expiryMinutes * 60 * 1000)
    return new OTP(code, expireAt)
  }

  // recreate OTP from existing code and expiry from DB
  static from(code: string, expireAt: Date): OTP {
    return new OTP(code, expireAt)
  }

  isValid(inputCode: string): boolean {
    if (!this.code || !this.expireAt) return false;
    return this.code === inputCode && new Date() < this.expireAt;
  }

  isExpired(): boolean {
    if (!this.expireAt) return true; // null cũng coi là expired
    return new Date() >= this.expireAt;
  }

  getCode(): string | null {
    return this.code
  }

  getExpiry(): string {
    if (!this.expireAt) return '0';
    const minutes = Math.ceil((this.expireAt.getTime() - Date.now()) / 60000);
    return String(minutes);
  }
}
