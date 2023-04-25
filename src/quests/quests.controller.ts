import { Controller, Post, Body } from '@nestjs/common';
import { QuestService } from './quests.service';
import { CreateQuestsDto } from '../dtos/create-quests.dto';
import { ApiCreatedResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Quest } from '../entities/quest.entity';

@ApiTags('api')
@Controller('quests')
export class QuestController {
  constructor(private readonly questService: QuestService) {}

  @Post()
  @ApiOperation({ summary: 'creates Quests' })
  @ApiCreatedResponse({
    description: 'Quests have been successfully created.',
    type: Quest,
    isArray: true,
  })
  createQuests(@Body() createQuestsDto: CreateQuestsDto): Promise<Quest[]> {
    return this.questService.createQuests(createQuestsDto.quests);
  }
}
