import { Module } from '@nestjs/common';
import { QuestService } from './quests.service';
import { Quest } from '../entities/quest.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QuestController } from './quests.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Quest])],
  providers: [QuestService],
  controllers: [QuestController],
  exports: [QuestService],
})
export class QuestsModule {}
