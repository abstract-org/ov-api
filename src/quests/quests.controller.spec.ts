import { Test, TestingModule } from '@nestjs/testing';
import { QuestController } from './quests.controller';
import { QuestService } from './quests.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Quest } from '../entities/quest.entity';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Pool } from '../entities/pool.entity';
import { PoolState } from '../entities/pool-state.entity';
import { INestApplication, ValidationPipe, HttpStatus } from '@nestjs/common';
import * as request from 'supertest';

describe('QuestController', () => {
  let controller: QuestController;
  let app: INestApplication;

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
        TypeOrmModule.forFeature([Quest]),
      ],
      controllers: [QuestController],
      providers: [QuestService],
    }).compile();

    controller = module.get<QuestController>(QuestController);
    app = module.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();
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

  it('should throw validation error for empty string values', async () => {
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

  afterAll(async () => {
    await app.close();
  });
});
