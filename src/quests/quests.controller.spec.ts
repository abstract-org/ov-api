import { Test, TestingModule } from '@nestjs/testing';
import { QuestController } from './quests.controller';
import { QuestService } from './quests.service';
import { getRepositoryToken, TypeOrmModule } from '@nestjs/typeorm';
import { Quest } from '../entities/quest.entity';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Pool } from '../entities/pool.entity';
import { PoolState } from '../entities/pool-state.entity';
import { INestApplication, ValidationPipe, HttpStatus } from '@nestjs/common';
import * as request from 'supertest';
import {
  DEFAULT_API_CREATOR_HASH,
  DEFAULT_INITIAL_BALANCE,
} from '../helpers/constants';
import { Modules } from '@abstract-org/sdk';
import { CreateQuestDto } from '../dtos/create-quest.dto';
import { Repository } from 'typeorm';

describe('QuestController', () => {
  let controller: QuestController;
  let app: INestApplication;
  let questRepository: Repository<Quest>;

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
        TypeOrmModule.forFeature([Quest]),
      ],
      controllers: [QuestController],
      providers: [QuestService],
    }).compile();

    controller = module.get<QuestController>(QuestController);
    app = module.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    questRepository = module.get<Repository<Quest>>(getRepositoryToken(Quest));
  });

  beforeEach(async () => {
    await questRepository.query('DELETE FROM quests');
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should create quests', async () => {
    const questsDto = {
      quests: [
        {
          kind: 'test',
          content: 'test content',
          creator_hash: 'test_hash',
          initial_balance: 100,
        },
      ],
    };

    const response = await controller.createQuests(questsDto);

    expect(response).toBeDefined();
    expect(response[0]).toHaveProperty('id');
    expect(response[0].kind).toBe('test');
    expect(response[0].content).toBe('test content');
    expect(response[0].creator_hash).toBe('test_hash');
    expect(response[0].initial_balance).toBe(100);
  });

  it('should create with missing creator_hash and initial_balance', async () => {
    const questsDto = {
      quests: [
        {
          kind: 'test',
          content: 'test content',
          // creator_hash field is missing
          // initial_balance field is missing
        },
      ],
    };

    const [createdQuest] = await controller.createQuests(questsDto);

    expect(createdQuest).toBeDefined();
    expect(createdQuest).toHaveProperty('id');
    expect(createdQuest.kind).toBe('test');
    expect(createdQuest.content).toBe('test content');
    expect(createdQuest.creator_hash).toBe(DEFAULT_API_CREATOR_HASH);
    expect(createdQuest.initial_balance).toBe(DEFAULT_INITIAL_BALANCE);
  });

  it('should return correct hash', async () => {
    const questDto: CreateQuestDto = {
      kind: 'test',
      content: 'test content',
    };
    const questsDto = { quests: [questDto] };
    const expectedHash = Modules.Quest.makeHash(questDto);

    const response = await controller.createQuests(questsDto);

    expect(response).toBeDefined();
    expect(response[0]).toHaveProperty('hash', expectedHash);
  });

  it('quest in DB should have correct hash', async () => {
    const questDto: CreateQuestDto = {
      kind: 'test',
      content: 'test content',
    };
    const findQuery = { where: questDto };
    const questsDto = { quests: [questDto] };
    const expectedHash = Modules.Quest.makeHash(questDto);
    const questInDbBefore = await questRepository.findOne(findQuery);

    await controller.createQuests(questsDto);

    const questInDbAfter = await questRepository.findOne(findQuery);

    expect(questInDbBefore).toBeNull();
    expect(questInDbAfter).toBeDefined();
    expect(questInDbAfter).toHaveProperty('hash', expectedHash);
  });

  it('should throw validation error for missing fields', async () => {
    const createQuestsDto = {
      quests: [
        {
          kind: 'test',
          // content field is missing
          creator_hash: 'test_hash',
          initial_balance: 100,
        },
      ],
    };

    await request(app.getHttpServer())
      .post('/quests')
      .send(createQuestsDto)
      .expect(HttpStatus.BAD_REQUEST);
  });

  it('should throw validation error for invalid data types', async () => {
    const createQuestsDto = {
      quests: [
        {
          kind: 'test',
          content: 'test content',
          creator_hash: 'test_hash',
          initial_balance: 'not a number', // Invalid data type
        },
      ],
    };

    await request(app.getHttpServer())
      .post('/quests')
      .send(createQuestsDto)
      .expect(HttpStatus.BAD_REQUEST);
  });

  it('should throw validation error for empty kind', async () => {
    const createQuestsDto = {
      quests: [
        {
          kind: '', // Empty string
          content: 'test content',
          creator_hash: 'test_hash',
          initial_balance: 100,
        },
      ],
    };

    await request(app.getHttpServer())
      .post('/quests')
      .send(createQuestsDto)
      .expect(HttpStatus.BAD_REQUEST);
  });

  it('should throw validation error for empty content', async () => {
    const createQuestsDto = {
      quests: [
        {
          kind: 'test', // Empty string
          content: '',
          creator_hash: 'test_hash',
          initial_balance: 100,
        },
      ],
    };

    await request(app.getHttpServer())
      .post('/quests')
      .send(createQuestsDto)
      .expect(HttpStatus.BAD_REQUEST);
  });

  afterAll(async () => {
    await app.close();
  });
});
