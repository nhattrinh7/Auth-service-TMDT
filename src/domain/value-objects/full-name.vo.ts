export class FullName {
  private constructor(public readonly value: string) {}

  static create(name: string): FullName {
    const trimmed = name.trim()
    if (!trimmed || trimmed.length < 2) {
      throw new Error('Full name must be at least 2 characters')
    }
    if (trimmed.length > 100) {
      throw new Error('Full name must not exceed 100 characters')
    }
    return new FullName(trimmed)
  }

  getValue(): string {
    return this.value
  }

  equals(other: FullName): boolean {
    return this.value === other.value
  }
}
