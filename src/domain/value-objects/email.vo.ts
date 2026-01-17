export class Email {
  private constructor(public readonly value: string) {}

  static create(email: string): Email {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!email || !emailRegex.test(email)) {
      throw new Error('Invalid email format')
    }
    return new Email(email.toLowerCase())
  }

  getValue(): string {
    return this.value
  }

  equals(other: Email): boolean {
    return this.value === other.value
  }
}
