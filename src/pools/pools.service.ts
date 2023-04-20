import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Pool } from '../entities/pool.entity';
import { CreatePoolDto } from '../dtos/create-pool.dto';
import { Quest } from '../entities/quest.entity';
import { PoolState } from '../entities/pool-state.entity';
import { sha256 } from '../helpers/createHash';
import { Modules } from '@abstract-org/sdk';
import { CreateValueLinkDto } from '../dtos/create-value-link.dto';

const INITIAL_LIQUIDITY = [
  {
    priceMin: 1,
    priceMax: 1000000,
    tokenA: 0,
    tokenB: 5000,
  },
  {
    priceMin: 20,
    priceMax: 1000000,
    tokenA: 0,
    tokenB: 5000,
  },
  {
    priceMin: 50,
    priceMax: 1000000,
    tokenA: 0,
    tokenB: 5000,
  },
  {
    priceMin: 200,
    priceMax: 1000000,
    tokenA: 0,
    tokenB: 5000,
  },
];

@Injectable()
export class PoolsService {
  constructor(
    @InjectRepository(Pool)
    private poolRepository: Repository<Pool>,
    @InjectRepository(Quest)
    private questRepository: Repository<Quest>,
    @InjectRepository(PoolState)
    private poolStateRepository: Repository<PoolState>,
  ) {}

  async createPools(createPoolsDto: CreatePoolDto[]): Promise<Pool[]> {
    const defaultQuestInstance = await this.getDefaultQuest();
    const pools = [];

    for (const { quest_hash } of createPoolsDto) {
      const leftQuest = defaultQuestInstance;
      const rightQuest = await this.questInstanceFromDb(quest_hash);

      const pool = new Pool();
      pool.quest_left_hash = leftQuest.hash;
      pool.quest_right_hash = rightQuest.hash;
      pool.hash = sha256(`${leftQuest.hash}${rightQuest.hash}`);

      const poolInstance = Modules.Pool.create(leftQuest, rightQuest, null);

      for (const liq of INITIAL_LIQUIDITY) {
        poolInstance.openPosition(
          liq.priceMin,
          liq.priceMax,
          liq.tokenA,
          liq.tokenB,
        );
      }

      const poolState = this.poolStateEntityFromPoolInstance(poolInstance);

      await this.poolStateRepository.save(poolState);
      await this.poolRepository.save(pool);

      pools.push(pool);
    }

    return pools;
  }

  poolStateEntityFromPoolInstance(pool) {
    const data = pool.getPoolState();
    const poolState = new PoolState();
    poolState.cur_liq = data.cur_liq;
    poolState.cur_price = data.cur_price;
    poolState.cur_pp = data.cur_pp;
    poolState.cur_left = data.cur_left;
    poolState.cur_right = data.cur_right;
    poolState.quest_left_price = data.quest_left_price;
    poolState.quest_right_price = data.quest_right_price;
    poolState.quest_left_volume = data.quest_left_volume;
    poolState.quest_right_volume = data.quest_right_volume;

    return poolState;
  }

  async questInstanceFromDb(hash: string): Promise<Modules.Quest> {
    const quest = await this.questRepository.findOne({
      where: { hash },
    });

    if (!quest) {
      throw new Error(`Quest not found for hash: ${hash}`);
    }

    return Modules.Quest.create('quest.name', quest.kind, quest.content);
  }

  async getDefaultQuest(): Promise<Modules.Quest> {
    const defaultQuest = await this.questRepository.findOne({
      where: {
        kind: 'TOKEN',
        content: 'USDC',
      },
    });

    if (!defaultQuest) {
      throw new Error('Default quest not found');
    }

    return Modules.Quest.create('USDC', 'USDC', 'USDC');
  }

  async createValueLinks(
    valueLinksDtoArray: CreateValueLinkDto[],
  ): Promise<Pool[]> {
    const pools = [];
    for (const valueLink of valueLinksDtoArray) {
      const { kind, quest_left_hash, quest_right_hash } = valueLink;
      const leftQuest = await this.questInstanceFromDb(quest_left_hash);
      const rightQuest = await this.questInstanceFromDb(quest_right_hash);

      const pool = new Pool();
      pool.quest_left_hash = leftQuest.hash;
      pool.quest_right_hash = rightQuest.hash;
      pool.kind = kind;
      pool.hash = sha256(`${leftQuest.hash}${rightQuest.hash}`);

      const poolInstance = Modules.Pool.create(leftQuest, rightQuest, null);
      const poolState = this.poolStateEntityFromPoolInstance(poolInstance);

      await this.poolStateRepository.save(poolState);
      await this.poolRepository.save(pool);

      pools.push(pool);
    }

    return pools;
  }
}
