import { Module } from '@nestjs/common'
import { UserRepository } from '~/infrastructure/database/repositories/user.repository'
import { PrismaService } from '~/infrastructure/database/prisma/prisma.service'
import { USER_REPOSITORY } from '~/domain/repositories/user.repository.interface'
import { CqrsModule } from '@nestjs/cqrs'
import { REFRESH_TOKEN_REPOSITORY } from '~/domain/repositories/refresh-token.repository.interface'
import { ROLE_REPOSITORY } from '~/domain/repositories/role.repository.interface'
import { WALLET_REPOSITORY } from '~/domain/repositories/wallet.repository.interface'
import { RefreshTokenRepository } from '~/infrastructure/database/repositories/refresh-token.repository'
import { RoleRepository } from '~/infrastructure/database/repositories/role.repository'
import { WalletRepository } from '~/infrastructure/database/repositories/wallet.repository'

@Module({
  imports: [CqrsModule],
  providers: [
    PrismaService,
    {
      provide: USER_REPOSITORY,
      useClass: UserRepository,
    },
    {
      provide: REFRESH_TOKEN_REPOSITORY,
      useClass: RefreshTokenRepository,
    },
    {
      provide: ROLE_REPOSITORY,
      useClass: RoleRepository,
    },
    {
      provide: WALLET_REPOSITORY,
      useClass: WalletRepository,
    },
  ],
  exports: [
    PrismaService,
    USER_REPOSITORY,
    REFRESH_TOKEN_REPOSITORY,
    ROLE_REPOSITORY,
    WALLET_REPOSITORY,
  ],
})
export class DatabaseModule {}
