import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { Quest } from './entities/quest.entity';
import { Pool } from './entities/pool.entity';
import { Block } from './entities/block.entity';
import { Wallet } from './entities/wallet.entity';
import { PoolState } from './entities/pool-state.entity';
import { WalletBalance } from './entities/wallet-balance.entity';
import { QuestController } from './quests/quests.controller';
import { PoolsController } from './pools/pools.controller';
import { QuestService } from './quests/quests.service';
import { PoolsService } from './pools/pools.service';
import { QuestsModule } from './quests/quests.module';
import { PoolsModule } from './pools/pools.module';
import { getSecret } from './utils/getSecret';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: process.env.NODE_ENV === 'test' ? '.env.test' : '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService, dbPass: string) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USERNAME'),
        password: dbPass,
        database: configService.get<string>('DB_DATABASE'),
        entities: [Quest, Pool, PoolState],
        synchronize: false,
      }),
    }),
    TypeOrmModule.forFeature([
      Quest,
      Pool,
      Block,
      Wallet,
      PoolState,
      WalletBalance,
    ]),
    QuestsModule,
    PoolsModule,
  ],
  controllers: [AppController, QuestController, PoolsController],
  providers: [
    AppService,
    QuestService,
    PoolsService,
    {
      provide: 'DB_PASS',
      useFactory: async () => {
        return await getSecret('SUPABASE_OPENVALUE_DEV_DB');
      },
    },
  ],
})
export class AppModule {}
