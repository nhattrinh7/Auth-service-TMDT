import { Module } from '@nestjs/common'
import { CqrsModule } from '@nestjs/cqrs'
import { UserController } from '~/presentation/v1/controllers/user.controller'
import { ApplicationModule } from '~/application/application.module'
import { MessagingModule } from '~/infrastructure/messaging/messaging.module'

@Module({
  imports: [CqrsModule, ApplicationModule, MessagingModule],
  controllers: [UserController],
  exports: [],
})
export class PresentationModule {}
