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
import { CreatePositionsDto } from '../dtos/create-positions.dto';
import * as request from 'supertest';
import { Repository } from 'typeorm';
import { POOL_KIND, POOL_TYPE } from '../helpers/constants';
import {
  clearTables,
  preparePools,
  prepareQuests,
} from '../../test/helpers/testHelpers';

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

    it('should return an error when quest not found', async () => {
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

    it('should create a new position and return an array of updated pools', async () => {
      const createPositionsDto: CreatePositionsDto = {
        positions: [
          {
            cited_quest: savedQuests[0].hash,
            citing_quest: savedQuests[1].hash,
            amount: 50,
            price_range_multiplier: 4,
          },
          {
            cited_quest: savedQuests[1].hash,
            citing_quest: savedQuests[2].hash,
            amount: 100,
          },
        ],
      };

      await controller.createPosition(createPositionsDto);

      for (const createPositionDto of createPositionsDto.positions) {
        const updatedPool = await repos.poolRepository.findOne({
          where: {
            quest_left_hash: createPositionDto.cited_quest,
            quest_right_hash: createPositionDto.citing_quest,
          },
        });
        const crossPool = crossPools.find(
          (pool) =>
            pool.quest_left_hash === createPositionDto.cited_quest &&
            pool.quest_right_hash === createPositionDto.citing_quest,
        );
        expect(updatedPool).toBeDefined();
        expect(crossPool).toBeDefined();
        expect(updatedPool.kind).toBe(crossPool.kind);
        expect(updatedPool.type).toBe(POOL_TYPE.VALUE_LINK);
        expect(updatedPool).toHaveProperty('positions');
        expect(updatedPool.positions).toHaveLength(3 + 2); // 3 base positions + 2 new opposite
      }
    });
  });

  afterAll(async () => {
    await app.close();
  });
});
