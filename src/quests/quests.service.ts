import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Quest } from '../entities/quest.entity';
import { CreateQuestDto } from '../dtos/create-quest.dto';
import { sha256 } from '../helpers/createHash';
import { Modules } from '@abstract-org/sdk';
import { DEFAULT_API_CREATOR_HASH, DEFAULT_QUEST } from '../helpers/constants';
import { makeQuestName } from '../helpers/makeQuestName';

@Injectable()
export class QuestService {
  constructor(
    @InjectRepository(Quest)
    private questRepository: Repository<Quest>,
  ) {}

  async createQuests(dtoList: CreateQuestDto[]): Promise<Quest[]> {
    const quests = dtoList.map(this.dtoToQuestEntity);

    return this.questRepository.save<Quest>(quests);
  }

  dtoToQuestEntity(dto: CreateQuestDto): Quest {
    const questName = makeQuestName({ kind: dto.kind, content: dto.content });
    const { initial_balance } = dto;
    const questInstance = Modules.Quest.create(
      questName,
      dto.kind,
      dto.content,
      dto.creator_hash || DEFAULT_API_CREATOR_HASH,
    );

    const questEntity = new Quest();
    questEntity.kind = questInstance.kind;
    questEntity.content = questInstance.content;
    questEntity.hash = questInstance.hash;
    questEntity.creator_hash = questInstance.creator_hash;
    questEntity.initial_balance = initial_balance;

    return questEntity;
  }

  async ensureDefaultQuestEntity(): Promise<Quest> {
    let defaultQuestEntity = await this.questRepository.findOne({
      where: {
        kind: DEFAULT_QUEST.KIND,
        content: DEFAULT_QUEST.CONTENT,
      },
    });

    if (defaultQuestEntity) {
      return defaultQuestEntity;
    }

    [defaultQuestEntity] = await this.createQuests([
      {
        kind: DEFAULT_QUEST.KIND,
        content: DEFAULT_QUEST.CONTENT,
        initial_balance: 100000,
      },
    ]);

    return defaultQuestEntity;
  }

  async ensureDefaultQuestInstance(): Promise<Modules.Quest> {
    const defaultQuestEntity = await this.ensureDefaultQuestEntity();

    return Modules.Quest.create(
      makeQuestName(defaultQuestEntity),
      defaultQuestEntity.kind,
      defaultQuestEntity.content,
      defaultQuestEntity.creator_hash || DEFAULT_API_CREATOR_HASH,
      defaultQuestEntity.created_at?.toISOString() || new Date().toISOString(),
    );
  }

  async questInstanceFromDb(hash: string): Promise<Modules.Quest> {
    const questEntity = await this.questRepository.findOne({
      where: { hash },
    });

    if (!questEntity) {
      throw new NotFoundException(`Quest not found for hash: ${hash}`);
    }

    return Modules.Quest.create(
      makeQuestName(questEntity),
      questEntity.kind,
      questEntity.content,
    );
  }
}
