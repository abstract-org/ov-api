import { Controller, Post, Body } from '@nestjs/common';
import { QuestService } from './quests.service';
import { CreateQuestsDto } from '../dtos/create-quests.dto';

@Controller('quests')
export class QuestController {
  constructor(private readonly questService: QuestService) {}

  @Post()
  createQuests(@Body() createQuestsDto: CreateQuestsDto) {
    return this.questService.createQuests(createQuestsDto.quests);
  }
}
