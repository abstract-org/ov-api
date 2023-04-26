import { INestApplication } from '@nestjs/common';
import { CreateQuestDto } from '../../src/dtos/create-quest.dto';
import { faker } from '@faker-js/faker';
import { QuestService } from '../../src/quests/quests.service';
import { Quest } from '../../src/entities/quest.entity';
import { CreatePoolDto } from '../../src/dtos/create-pool.dto';
import { PoolsService } from '../../src/pools/pools.service';
import { Modules } from '@abstract-org/sdk';

export async function prepareQuests(app: INestApplication) {
  const createQuestsDto: CreateQuestDto[] = [
    {
      kind: 'TEST_TITLE',
      content: faker.lorem.paragraph(),
      initial_balance: 20000,
    },
    {
      kind: 'TEST_ABSTRACT',
      content: faker.lorem.paragraph(),
      initial_balance: 20000,
    },
    {
      kind: 'TEST_BODY',
      content: faker.lorem.paragraph(),
      initial_balance: 20000,
    },
  ];

  return app.get(QuestService).createQuests(createQuestsDto);
}

export async function preparePools(
  savedQuests: Quest[],
  app: INestApplication,
) {
  const createPoolsDto: CreatePoolDto[] = savedQuests.map((quest) => ({
    quest_hash: quest.hash,
  }));
  const savedPools = await app.get(PoolsService).createPools(createPoolsDto);
  const defaultQuestInstance = await app
    .get(QuestService)
    .ensureDefaultQuestInstance();

  const poolInstances: Modules.Pool[] = [];
  for (const poolEntity of savedPools) {
    const rightQuest = await app
      .get(QuestService)
      .questInstanceFromDb(poolEntity.quest_right_hash);
    const poolInstance = Modules.Pool.create(
      defaultQuestInstance,
      rightQuest,
      0,
    );
    poolInstance.hydratePositions(poolEntity.positions);
    poolInstances.push(poolInstance);
  }

  await app.get(PoolsService).savePoolStatesForPoolInstances(poolInstances);

  return savedPools;
}

export async function clearTables(repos) {
  await repos.poolStateRepository.query('DELETE FROM pool_states');
  await repos.poolRepository.query('DELETE FROM pools');
  await repos.questRepository.query('DELETE FROM quests');
}
