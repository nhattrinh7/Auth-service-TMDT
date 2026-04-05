 import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import Joi from 'joi'
import { ZodValidationPipe } from 'nestjs-zod'
import { APP_PIPE } from '@nestjs/core'
import { PresentationModule } from '~/presentation/presentation.module'
import { ApplicationModule } from '~/application/application.module'
import { InfrastructureModule } from '~/infrastructure/infrastructure.module'
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler'
import { APP_GUARD } from '@nestjs/core'
import { RequestLoggingMiddleware } from '~/common/middleware/request-logging.middleware'


@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        name: 'short',  // Chống spam tấn công brute-force thử password, chống bot tự động    
        ttl: 1000,          
        limit: 100,          
      },
      {
        name: 'long',
        ttl: 60000,       
        limit: 500,
      }
    ]),
    ConfigModule.forRoot({
      envFilePath: `.env.${process.env.NODE_ENV || 'development'}`,      
      isGlobal: true,
      validationSchema: Joi.object({
        DATABASE_URL: Joi.string().required(),
        REDIS_URL: Joi.string().required(),
      
        SERVICE_NAME: Joi.string().required(),
        SERVICE_HOST: Joi.string().required(),
        PORT: Joi.number().required(),
        ACCESS_TOKEN_SECRET: Joi.string().allow('').optional(),
        REFRESH_TOKEN_SECRET: Joi.string().allow('').optional(),
        ACCESS_TOKEN_EXPIRATION: Joi.string().required(),
        REFRESH_TOKEN_EXPIRATION: Joi.string().required(),
        GOOGLE_CLIENT_ID: Joi.string().required(),
        RABBITMQ_HOST: Joi.string().required(),
      }),
      validationOptions: {
        abortEarly: true, // Show 1 errors per times
      },
    }),
    InfrastructureModule,
    ApplicationModule,
    PresentationModule,
  ],
  providers: [
    {
      provide: APP_PIPE,
      useClass: ZodValidationPipe,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestLoggingMiddleware).forRoutes('{*path}')
  }
}
