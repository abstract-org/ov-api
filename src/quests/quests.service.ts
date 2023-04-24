import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Quest } from '../entities/quest.entity';
import { CreateQuestDto } from '../dtos/create-quest.dto';
import { sha256 } from '../helpers/createHash';
import { Modules } from '@abstract-org/sdk';

const DEFAULT_API_CREATOR_HASH = '111111111111111111111';
const DEFAULT_QUEST_NAME = 'USDC';
const DEFAULT_QUEST_KIND = 'TOKEN';
const DEFAULT_QUEST_CONTENT = 'USDC';

@Injectable()
export class QuestService {
  constructor(
    @InjectRepository(Quest)
    private questRepository: Repository<Quest>,
  ) {}

  async createQuests(createQuestsDto: CreateQuestDto[]): Promise<Quest[]> {
    const quests = createQuestsDto.map(this.dtoToQuestEntity);

    return this.questRepository.save<Quest>(quests);
  }

  dtoToQuestEntity(dto: CreateQuestDto): Quest {
    const quest = new Quest();
    quest.kind = dto.kind;
    quest.content = dto.content;
    quest.hash = sha256(`${quest.kind}${quest.content}`);
    quest.creator_hash = dto.creator_hash || DEFAULT_API_CREATOR_HASH;
    quest.initial_balance = dto.initial_balance;

    return quest;
  }

  async ensureDefaultQuest(): Promise<Quest> {
    const defaultQuestEntity = await this.questRepository.findOne({
      where: {
        kind: DEFAULT_QUEST_KIND,
        content: DEFAULT_QUEST_CONTENT,
      },
    });

    if (!defaultQuestEntity) {
      const [newDefaultQuest] = await this.createQuests([
        {
          kind: DEFAULT_QUEST_KIND,
          content: DEFAULT_QUEST_CONTENT,
          initial_balance: 100000,
        },
      ]);

      return newDefaultQuest;
    }

    return defaultQuestEntity;
  }

  async getDefaultQuestInstance() {
    const defaultQuestEntity = await this.ensureDefaultQuest();

    return Modules.Quest.create(
      DEFAULT_QUEST_NAME,
      defaultQuestEntity.kind || DEFAULT_QUEST_KIND,
      defaultQuestEntity.content || DEFAULT_QUEST_CONTENT,
      defaultQuestEntity.creator_hash || DEFAULT_API_CREATOR_HASH,
      defaultQuestEntity.created_at?.toISOString() || new Date().toISOString(),
    );
  }
}
