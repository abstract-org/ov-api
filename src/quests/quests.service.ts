import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Quest } from '../entities/quest.entity';
import { CreateQuestDto } from '../dtos/create-quest.dto';

const DEFAULT_API_CREATOR_HASH = '111111111111111111111';

@Injectable()
export class QuestService {
  constructor(
    @InjectRepository(Quest)
    private questRepository: Repository<Quest>,
  ) {}

  async createQuests(createQuestsDto: CreateQuestDto[]): Promise<Quest[]> {
    const quests = createQuestsDto.map(this.dtoToQuestEntity);

    return this.questRepository.save(quests);
  }

  dtoToQuestEntity(dto: CreateQuestDto): Quest {
    const quest = new Quest();
    quest.kind = dto.kind;
    quest.content = dto.content;
    quest.creator_hash = dto.creator_hash || DEFAULT_API_CREATOR_HASH;
    quest.initial_balance = dto.initial_balance;

    return quest;
  }
}
