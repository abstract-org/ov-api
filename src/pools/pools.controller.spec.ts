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
import { Repository } from 'typeorm';
import { sha256 } from '../helpers/createHash';

describe('PoolsController', () => {
  let controller: PoolsController;
  let app: INestApplication;
  let questRepository: Repository<Quest>;

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
    questRepository = module.get('QuestRepository');
    app = module.createNestApplication();
    await app.init();
  });

  const saveQuestsWithHashes = async (hashes: string[]): Promise<void> => {
    const quests = hashes.map((hash) => {
      const quest = new Quest();
      quest.kind = 'TEST_KIND';
      quest.content = 'TEST_CONTENT';
      quest.hash = hash;
      quest.creator_hash = 'test_creator_hash';
      quest.initial_balance = 1000;

      return quest;
    });

    await questRepository.save<Quest>(quests);
  };

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

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

  afterAll(async () => {
    await app.close();
  });
});
