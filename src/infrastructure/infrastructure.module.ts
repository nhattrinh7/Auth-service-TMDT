import { Module } from '@nestjs/common'
import { DatabaseModule } from '~/infrastructure/database/database.module'
import { MessagingModule } from '~/infrastructure//messaging/messaging.module'
import { RedisModule } from '~/infrastructure/redis/redis.module'

@Module({
  imports: [DatabaseModule, MessagingModule, RedisModule],
  providers: [],
  exports: [],
})
export class InfrastructureModule {}
