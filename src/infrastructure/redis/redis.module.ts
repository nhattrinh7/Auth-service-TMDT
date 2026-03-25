import { Module, Global } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import Redis from 'ioredis'
import { PermissionCacheService } from '~/infrastructure/redis/permission-cache.service'

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
  ],
  exports: [REDIS_CLIENT, PermissionCacheService],
})
export class RedisModule {}
