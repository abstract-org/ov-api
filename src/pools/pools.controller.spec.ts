import { Test, TestingModule } from '@nestjs/testing';
import { PoolsController } from './pools.controller';
import { PoolsService } from './pools.service';
import { getRepositoryToken, TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Pool } from '../entities/pool.entity';
import { Quest } from '../entities/quest.entity';
import { PoolState } from '../entities/pool-state.entity';
import { INestApplication } from '@nestjs/common';
import { QuestService } from '../quests/quests.service';
import { CreateQuestDto } from '../dtos/create-quest.dto';
import { CreatePoolDto } from '../dtos/create-pool.dto';
import { CreatePositionsDto } from '../dtos/create-positions.dto';
import * as request from 'supertest';
import { faker } from '@faker-js/faker';
import { Modules } from '@abstract-org/sdk';
import { Repository } from 'typeorm';
import { POOL_KIND, POOL_TYPE } from '../helpers/constants';

async function prepareQuests(app: INestApplication) {
  const createQuestsDto: CreateQuestDto[] = [
    {
      kind: 'TEST_TITLE',
      content: faker.lorem.paragraph(),
      initial_balance: 1000,
    },
    {
      kind: 'TEST_ABSTRACT',
      content: faker.lorem.paragraph(),
      initial_balance: 1000,
    },
    {
      kind: 'TEST_BODY',
      content: faker.lorem.paragraph(),
      initial_balance: 1000,
    },
  ];

  return app.get(QuestService).createQuests(createQuestsDto);
}

async function preparePools(savedQuests: Quest[], app: INestApplication) {
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

async function clearTables(repos) {
  await repos.poolStateRepository.query('DELETE FROM pool_states');
  await repos.poolRepository.query('DELETE FROM pools');
  await repos.questRepository.query('DELETE FROM quests');
}

describe('PoolsController', () => {
  let controller: PoolsController;
  let app: INestApplication;
  let savedQuests: Quest[];
  let repos: Record<string, Repository<any>>;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: '.env.test',
        }),
        TypeOrmModule.forRootAsync({
          imports: [ConfigModule],
          inject: [ConfigService],
          useFactory: (configService: ConfigService) => ({
            type: 'postgres',
            host: configService.get<string>('DB_HOST'),
            port: configService.get<number>('DB_PORT'),
            username: configService.get<string>('DB_USERNAME'),
            password: configService.get<string>('DB_PASSWORD'),
            database: configService.get<string>('DB_DATABASE'),
            entities: [Quest, Pool, PoolState],
            synchronize: true,
          }),
        }),
        TypeOrmModule.forFeature([Pool, Quest, PoolState]),
      ],
      controllers: [PoolsController],
      providers: [PoolsService, QuestService],
    }).compile();

    app = module.createNestApplication();
    await app.init();
    repos = {
      questRepository: module.get<Repository<Quest>>(getRepositoryToken(Quest)),
      poolRepository: module.get<Repository<Pool>>(getRepositoryToken(Pool)),
      poolStateRepository: module.get<Repository<PoolState>>(
        getRepositoryToken(PoolState),
      ),
    };
    controller = module.get<PoolsController>(PoolsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('POST /pools', () => {
    let defaultQuestInstance;

    beforeEach(async () => {
      await clearTables(repos);
      savedQuests = await prepareQuests(app);
      defaultQuestInstance = await app
        .get(QuestService)
        .ensureDefaultQuestInstance();
    });

    it('should create pools', async () => {
      const createPoolsDto = {
        pools: [
          {
            quest_hash: savedQuests[0].hash,
          },
          {
            quest_hash: savedQuests[1].hash,
          },
          {
            quest_hash: savedQuests[2].hash,
          },
        ],
      };

      const response = await controller.createPools(createPoolsDto);

      expect(response).toBeDefined();
      expect(response).toHaveLength(createPoolsDto.pools.length);
      response.forEach((pool) => {
        expect(pool).toHaveProperty('id');
        expect(pool).toHaveProperty('hash');
      });

      const poolsFromDb = await repos.poolRepository.find();
      expect(poolsFromDb).toHaveLength(createPoolsDto.pools.length);
      createPoolsDto.pools.forEach(({ quest_hash }) => {
        const pool = poolsFromDb.find(
          (poolCreated) => poolCreated.quest_right_hash === quest_hash,
        );

        expect(pool).toBeDefined();
        expect(pool.quest_left_hash).toEqual(defaultQuestInstance.hash);
        expect(pool.quest_right_hash).toEqual(quest_hash);
      });
    });

    it('should throw an error when creating pools with invalid input', async () => {
      const createPoolsDto: any = {
        pools: [
          {
            quest_hash: 12345, // Invalid quest_hash format
          },
        ],
      };

      await expect(controller.createPools(createPoolsDto)).rejects.toThrow();
    });
  });

  describe('POST /value-links', () => {
    beforeEach(async () => {
      await clearTables(repos);
      savedQuests = await prepareQuests(app);
      await preparePools(savedQuests, app);
    });

    it('should create value links', async () => {
      const createValueLinksDto = {
        pools: [
          {
            kind: 'BLOCK',
            quest_left_hash: savedQuests[0].hash,
            quest_right_hash: savedQuests[1].hash,
          },
          {
            kind: 'BLOCK',
            quest_left_hash: savedQuests[0].hash,
            quest_right_hash: savedQuests[2].hash,
          },
          {
            kind: 'CITATION',
            quest_left_hash: savedQuests[1].hash,
            quest_right_hash: savedQuests[2].hash,
          },
        ],
      };

      const response = await controller.createValueLink(createValueLinksDto);

      expect(response).toBeDefined();
      expect(response).toHaveLength(createValueLinksDto.pools.length);
      response.forEach((pool) => {
        expect(pool).toHaveProperty('id');
        expect(pool).toHaveProperty('hash');
        expect(pool).toHaveProperty('kind');
      });
    });

    it('should throw an error when creating value links with invalid input', async () => {
      const createValueLinksDto: any = {
        pools: [
          {
            kind: 'LINK_KIND_1',
            quest_left_hash: 'test_quest_left_hash_1',
            quest_right_hash: 12345, // Invalid quest_right_hash format
          },
        ],
      };

      await expect(
        controller.createValueLink(createValueLinksDto),
      ).rejects.toThrow();
    });
  });

  describe('POST /positions', () => {
    let crossPools: Pool[];

    beforeEach(async () => {
      await clearTables(repos);
      savedQuests = await prepareQuests(app);
      await preparePools(savedQuests, app);
      crossPools = await app.get(PoolsService).createValueLinks([
        {
          kind: POOL_KIND.BLOCK,
          quest_left_hash: savedQuests[0].hash,
          quest_right_hash: savedQuests[1].hash,
        },
        {
          kind: POOL_KIND.CITATION,
          quest_left_hash: savedQuests[1].hash,
          quest_right_hash: savedQuests[2].hash,
        },
      ]);
    });

    it('should create a new position and return an array of created pools', async () => {
      const createPositionsDto: CreatePositionsDto = {
        positions: [
          {
            cited_quest: savedQuests[0].hash,
            citing_quest: savedQuests[1].hash,
            amount: 100,
            price_range_multiplier: 4,
          },
          {
            cited_quest: savedQuests[1].hash,
            citing_quest: savedQuests[2].hash,
            amount: 200,
          },
        ],
      };

      const response = await controller.createPosition(createPositionsDto);
      response.forEach((pool: Pool) => {
        expect(pool).toHaveProperty('id');
        expect(pool).toHaveProperty('hash');
        expect(pool).toHaveProperty('quest_left_hash');
        expect(pool).toHaveProperty('quest_right_hash');
        expect(pool).toHaveProperty('kind', POOL_KIND.CITATION);
        expect(pool).toHaveProperty('type', POOL_TYPE.VALUE_LINK);
        expect(pool).toHaveProperty('positions');
      });
    });

    it('should return an error when the quest is not found', async () => {
      const createPositionsDto: CreatePositionsDto = {
        positions: [
          {
            cited_quest: 'nonexistent-hash',
            citing_quest: savedQuests[1].hash,
            amount: 100,
          },
        ],
      };

      const response = await request(app.getHttpServer())
        .post('/position')
        .send(createPositionsDto);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe(
        'Quest not found for hash: nonexistent-hash',
      );
    });
  });

  afterAll(async () => {
    await app.close();
  });
});
