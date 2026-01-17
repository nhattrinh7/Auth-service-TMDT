export class PhoneNumber {
  private constructor(public readonly value: string) {}

  static create(phone: string): PhoneNumber {
    // Regex cho số điện thoại Việt Nam: 10 số, bắt đầu bằng 0
    const phoneRegex = /^0[0-9]{9}$/
    if (!phoneRegex.test(phone)) {
      throw new Error('Invalid phone number format (must be 10 digits starting with 0)')
    }
    return new PhoneNumber(phone)
  }

  getValue(): string {
    return this.value
  }

  equals(other: PhoneNumber): boolean {
    return this.value === other.value
  }
}
