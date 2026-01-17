import { Module } from '@nestjs/common'
import { CqrsModule } from '@nestjs/cqrs'
import { RegisterHandler } from '~/application/commands/register/register.command.handler'
import { LoginHandler } from '~/application/commands/login/login.command.handler'
import { VerifyEmailHandler } from '~/application/commands/verify-email/verify-email.command.handler'
import { DatabaseModule } from '~/infrastructure/database/database.module'
import { MessagingModule } from '~/infrastructure/messaging/messaging.module'
import { UserCreatedEventHandler } from '~/application/event-handlers/user-created.event-handler'
import { MyJwtService } from '~/common/utils/jwt.util'
import { RefreshTokenHandler } from '~/application/commands/refresh-token/refresh-token.command.handler'
import { VerifyRequestHandler } from '~/application/commands/verify-request/verify-request.command.handler'
import { JwtModule } from '@nestjs/jwt'
import { LogoutHandler } from '~/application/commands/logout/logout.command.handler'

const CommandHandlers = [
  RegisterHandler,
  LoginHandler,
  VerifyEmailHandler,
  RefreshTokenHandler,
  VerifyRequestHandler,
  LogoutHandler
]

const QueryHandlers = [
  
]

const EventHandlers = [
  UserCreatedEventHandler
]

@Module({
  imports: [
    CqrsModule,
    DatabaseModule,
    MessagingModule,
    JwtModule.register({})
  ],
  providers: [
    ...CommandHandlers,
    ...QueryHandlers,
    ...EventHandlers,
    MyJwtService
  ],
  exports: [],
})
export class ApplicationModule {}