import { Module } from '@nestjs/common';
import { PoolsService } from './pools.service';
import { Quest } from '../entities/quest.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PoolsController } from './pools.controller';
import { Pool } from '../entities/pool.entity';
import { PoolState } from '../entities/pool-state.entity';
import { QuestsModule } from '../quests/quests.module';
import { QuestService } from '../quests/quests.service';

@Module({
  imports: [TypeOrmModule.forFeature([Pool, PoolState, Quest]), QuestsModule],
  providers: [PoolsService],
  controllers: [PoolsController, QuestService],
  exports: [PoolsService],
})
export class PoolsModule {}
