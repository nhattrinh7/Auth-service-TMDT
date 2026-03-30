import { Inject, Injectable } from '@nestjs/common'
import Redis from 'ioredis'
import { ILoginAttemptService } from '~/domain/contracts/login-attempt.service.interface'
import {
  MAX_LOGIN_ATTEMPTS,
  LOCKOUT_DURATION_SECONDS,
  LOGIN_ATTEMPTS_PREFIX,
  LOGIN_LOCKOUT_PREFIX,
} from '~/common/constants/login-attempt.constants'

const REDIS_CLIENT = 'REDIS_CLIENT'

@Injectable()
export class LoginAttemptService implements ILoginAttemptService {
  constructor(
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  async isLocked(email: string): Promise<boolean> {
    const locked = await this.redis.get(`${LOGIN_LOCKOUT_PREFIX}:${email}`)
    return locked === '1'
  }

  async recordFailedAttempt(email: string): Promise<number> {
    const key = `${LOGIN_ATTEMPTS_PREFIX}:${email}`

    // INCR tăng counter, nếu key chưa tồn tại thì tự tạo với giá trị 1
    const attempts = await this.redis.incr(key)

    // Set TTL cho lần đầu tiên (key mới tạo)
    if (attempts === 1) {
      await this.redis.expire(key, LOCKOUT_DURATION_SECONDS)
    }

    // Đạt ngưỡng → set lockout flag
    if (attempts >= MAX_LOGIN_ATTEMPTS) {
      await this.redis.set(
        `${LOGIN_LOCKOUT_PREFIX}:${email}`,
        '1',
        'EX',
        LOCKOUT_DURATION_SECONDS,
      )
    }

    return attempts
  }

  async resetAttempts(email: string): Promise<void> {
    await this.redis.del(`${LOGIN_ATTEMPTS_PREFIX}:${email}`)
    await this.redis.del(`${LOGIN_LOCKOUT_PREFIX}:${email}`)
  }

  async getRemainingAttempts(email: string): Promise<number> {
    const key = `${LOGIN_ATTEMPTS_PREFIX}:${email}`
    const attempts = await this.redis.get(key)
    return MAX_LOGIN_ATTEMPTS - (parseInt(attempts || '0', 10))
  }
}
