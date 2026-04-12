import { GlobalExceptionFilter } from './common/filters/global-exception.filter'
import { NestFactory } from '@nestjs/core'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'

import helmet from 'helmet'
import { AppModule } from './app.module'
import { Transport, MicroserviceOptions } from '@nestjs/microservices'
import { ConfigService } from '@nestjs/config'
import { setConfigService } from '~/configs/env.config'
import { ResponseInterceptor } from '~/common/interceptors/response.interceptor'
import { env } from '~/configs/env.config'
import { corsOptions } from './configs/cors.config'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  app.use(helmet())

  app.setGlobalPrefix('api')

  const config = new DocumentBuilder().setTitle('auth-service API Docs').setVersion('1.0').build()
  const document = SwaggerModule.createDocument(app, config)
  SwaggerModule.setup('api/v1/auth/docs', app, document)

  // Nestjs mặc định  mình throw exception thì nó xử lí lỗi sẵn rồi
  // dùng cái filter này để customize lại response thôi
  app.useGlobalFilters(new GlobalExceptionFilter())
  app.useGlobalInterceptors(new ResponseInterceptor())
  // app.enableCors(corsOptions)

  const configService = app.get(ConfigService)
  setConfigService(configService)

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [`amqp://admin:admin123@${process.env.RABBITMQ_HOST || 'localhost'}:5672`], // lên production thì sửa localhost thành rabbitmq-service
      exchange: 'events_exchange',
      exchangeType: 'topic',
      wildcards: true,
      queue: 'auth_queue',
      consumerTag: 'auth_consumer',
      queueOptions: {
        durable: true, // queue được persist để ko mất khi restart
        exclusive: false, // nhiều consumer có thể consume queue này
        autoDelete: false, // queue không bị xóa khi không có consumer
      },
      noAck: false,
      prefetchCount: 10,
    },
  })

  // Start tất cả microservices đã được kết nối với ứng dụng NestJS thông qua connectMicroservice()
  // trong trường hợp này là duy nhất thằng microservice RabbitMQ thôi
  await app.startAllMicroservices()

  await app.listen(env.config.PORT ?? 3001)
}

// eslint-disable-next-line no-console
bootstrap().catch(console.error)
