import { Module, Global } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import Redis from 'ioredis'
import { PermissionCacheService } from '~/infrastructure/redis/permission-cache.service'
import { LoginAttemptService } from '~/infrastructure/redis/login-attempt.service'
import { LOGIN_ATTEMPT_SERVICE } from '~/domain/contracts/login-attempt.service.interface'

export const REDIS_CLIENT = 'REDIS_CLIENT'

@Global()
@Module({
  providers: [
    {
      provide: REDIS_CLIENT,
      useFactory: (configService: ConfigService) => {
        const redisUrl = configService.get<string>('REDIS_URL')!
        return new Redis(redisUrl)
      },
      inject: [ConfigService],
    },
    PermissionCacheService,
    LoginAttemptService,
    {
      provide: LOGIN_ATTEMPT_SERVICE,
      useClass: LoginAttemptService,
    },
  ],
  exports: [REDIS_CLIENT, PermissionCacheService, LOGIN_ATTEMPT_SERVICE],
})
export class RedisModule {}
