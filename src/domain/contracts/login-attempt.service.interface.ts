export interface ILoginAttemptService {
  isLocked(email: string): Promise<boolean>
  recordFailedAttempt(email: string): Promise<number>
  resetAttempts(email: string): Promise<void>
  getRemainingAttempts(email: string): Promise<number>
}

export const LOGIN_ATTEMPT_SERVICE = Symbol('ILoginAttemptService')
