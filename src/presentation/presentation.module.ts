import { Module } from '@nestjs/common'
import { CqrsModule } from '@nestjs/cqrs'
import { AuthController } from '~/presentation/v1/controllers/auth.controller'
import { ApplicationModule } from '~/application/application.module'
import { MessagingModule } from '~/infrastructure/messaging/messaging.module'

@Module({
  imports: [CqrsModule, ApplicationModule, MessagingModule],
  controllers: [AuthController],
  exports: [],
})
export class PresentationModule {}
