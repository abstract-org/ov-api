import { Module } from '@nestjs/common';
import { PoolsService } from './pools.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PoolsController } from './pools.controller';
import { Pool } from '../entities/pool.entity';
import { PoolState } from '../entities/pool-state.entity';
import { QuestsModule } from '../quests/quests.module';
import { QuestService } from '../quests/quests.service';
import { Quest } from '../entities/quest.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Pool, PoolState, Quest]), QuestsModule],
  providers: [PoolsService, QuestService],
  controllers: [PoolsController],
  exports: [PoolsService],
})
export class PoolsModule {}
