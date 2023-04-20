// src/quest/quest.controller.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { QuestController } from './quests.controller';
import { QuestService } from './quests.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Quest } from '../entities/quest.entity';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Pool } from '../entities/pool.entity';
import { PoolState } from '../entities/pool-state.entity';

describe('QuestController', () => {
  let controller: QuestController;

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
});
