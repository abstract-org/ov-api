import { Test, TestingModule } from '@nestjs/testing';
import { PoolsController } from './pools.controller';
import { PoolsService } from './pools.service';
import { TypeOrmModule } from '@nestjs/typeorm';
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

describe('PoolsController', () => {
  let controller: PoolsController;
  let app: INestApplication;
  let questService: QuestService;
  let savedQuests: Quest[];
  let savedPools: Pool[];

  const saveQuestsWithHashes = async (hashes: string[]): Promise<void> => {
    const quests = hashes.map((hash) => {
      const quest = new Quest();
      quest.kind = 'TEST_KIND';
      quest.content = faker.lorem.paragraph();
      quest.hash = hash;
      quest.creator_hash = 'test_creator_hash';
      quest.initial_balance = 1000;

      return quest;
    });

    await questService.createQuests(quests);
  };

  async function savePoolStateForPool(pool: Modules.Pool): Promise<PoolState> {
    const poolState = await app
      .get('PoolsService')
      .poolStateEntityFromPoolInstance(pool);

    return app.get('PoolStateRepository').save(poolState);
  }

  beforeEach(async () => {
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

    controller = module.get<PoolsController>(PoolsController);
    questService = module.get(QuestService);
    app = module.createNestApplication();
    await app.init();

    // Save Quests
    const defaultQuest = await questService.ensureDefaultQuest();
    const createQuestsDto: CreateQuestDto[] = [
      {
        kind: 'Test Quest 1',
        content: faker.lorem.paragraph(),
        initial_balance: 1000,
      },
      {
        kind: 'Test Quest 2',
        content: faker.lorem.paragraph(),
        initial_balance: 1000,
      },
      {
        kind: 'Test Quest 3',
        content: faker.lorem.paragraph(),
        initial_balance: 1000,
      },
    ];
    savedQuests = await app.get(QuestService).createQuests(createQuestsDto);

    // Save Pools
    const createPoolsDto: CreatePoolDto[] = savedQuests.map((quest) => ({
      quest_hash: quest.hash,
    }));
    savedPools = await app.get(PoolsService).createPools(createPoolsDto);
    for (const poolEntity of savedPools) {
      const leftQuest = defaultQuest;
      const rightQuest = await app
        .get(PoolsService)
        .questInstanceFromDb(poolEntity.quest_right_hash);
      const poolInstance = Modules.Pool.create(leftQuest, rightQuest, 0);
      poolInstance.hydratePositions(poolEntity.positions);

      await savePoolStateForPool(poolInstance);
    }
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('POST /pools', () => {
    it('should create pools', async () => {
      await saveQuestsWithHashes(['test_quest_hash_1', 'test_quest_hash_2']);
      const createPoolsDto = {
        pools: [
          {
            quest_hash: 'test_quest_hash_1',
          },
          {
            quest_hash: 'test_quest_hash_2',
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
    it('should create value links', async () => {
      await saveQuestsWithHashes([
        'test_quest_left_hash_1',
        'test_quest_right_hash_1',
        'test_quest_left_hash_2',
        'test_quest_right_hash_2',
      ]);
      const createValueLinksDto = {
        pools: [
          {
            kind: 'LINK_KIND_1',
            quest_left_hash: 'test_quest_left_hash_1',
            quest_right_hash: 'test_quest_right_hash_1',
          },
          {
            kind: 'LINK_KIND_2',
            quest_left_hash: 'test_quest_left_hash_2',
            quest_right_hash: 'test_quest_right_hash_2',
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
    beforeAll(() => {});
    it('should create a new position and return an array of created pools', async () => {
      const createPositionsDto: CreatePositionsDto = {
        positions: [
          {
            cited_quest: savedQuests[0].hash,
            citing_quest: savedQuests[1].hash,
            amount: 100,
          },
          {
            cited_quest: savedQuests[1].hash,
            citing_quest: savedQuests[2].hash,
            amount: 200,
          },
        ],
      };

      const response = await request(app.getHttpServer())
        .post('/position')
        .send(createPositionsDto);

      expect(response.status).toBe(201);
      expect(response.body).toHaveLength(2);
      response.body.forEach((pool: Pool) => {
        expect(pool).toHaveProperty('id');
        expect(pool).toHaveProperty('hash');
        expect(pool).toHaveProperty('quest_left_hash');
        expect(pool).toHaveProperty('quest_right_hash');
        expect(pool).toHaveProperty('kind', 'CITATION');
        expect(pool).toHaveProperty('type', 'value-link');
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
