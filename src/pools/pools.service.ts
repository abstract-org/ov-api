import { HttpException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Pool } from '../entities/pool.entity';
import { CreatePoolDto } from '../dtos/create-pool.dto';
import { Quest } from '../entities/quest.entity';
import { PoolState } from '../entities/pool-state.entity';
import { sha256 } from '../helpers/createHash';
import { Modules } from '@abstract-org/sdk';
import { CreateValueLinkDto } from '../dtos/create-value-link.dto';
import { CreatePositionDto } from '../dtos/create-position.dto';

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

      const poolInstance = Modules.Pool.create(leftQuest, rightQuest, null);
      for (const liq of INITIAL_LIQUIDITY) {
        poolInstance.openPosition(
          liq.priceMin,
          liq.priceMax,
          liq.tokenA,
          liq.tokenB,
        );
      }

      const poolEntity = new Pool();
      poolEntity.quest_left_hash = leftQuest.hash;
      poolEntity.quest_right_hash = rightQuest.hash;
      // poolEntity.hash = sha256(`${leftQuest.hash}${rightQuest.hash}`);
      poolEntity.hash = poolInstance.hash;
      poolEntity.type = 'USDC';
      poolEntity.kind = null;
      poolEntity.positions = poolInstance.pos.values();

      const poolState = this.poolStateEntityFromPoolInstance(poolInstance);

      await this.poolStateRepository.save(poolState);
      await this.poolRepository.save(poolEntity);

      pools.push(poolEntity);
    }

    return pools;
  }

  poolStateEntityFromPoolInstance(pool) {
    const data = pool.getPoolState();
    const poolState = new PoolState();
    poolState.cur_liq = data.curLiq;
    poolState.cur_price = data.curPrice;
    poolState.cur_pp = data.curPP;
    poolState.cur_left = data.curLeft;
    poolState.cur_right = data.curRight;
    poolState.quest_left_price = data.questLeftPrice;
    poolState.quest_right_price = data.questRightPrice;
    poolState.quest_left_volume = data.questLeftVolume;
    poolState.quest_right_volume = data.questRightVolume;
    poolState.pool_hash = data.hash;

    return poolState;
  }

  async questInstanceFromDb(hash: string): Promise<Modules.Quest> {
    const quest = await this.questRepository.findOne({
      where: { hash },
    });

    if (!quest) {
      throw new NotFoundException(`Quest not found for hash: ${hash}`);
    }

    return Modules.Quest.create(quest.hash, quest.kind, quest.content);
  }

  async getDefaultQuest(): Promise<Modules.Quest> {
    const DEFAULT_QUEST_NAME = 'USDC';
    const DEFAULT_QUEST_KIND = 'TOKEN';
    const DEFAULT_QUEST_CONTENT = 'USDC';
    const defaultQuestEntity = await this.questRepository.findOne({
      where: {
        kind: DEFAULT_QUEST_KIND,
        content: DEFAULT_QUEST_CONTENT,
      },
    });

    if (!defaultQuestEntity) {
      throw new Error('Default quest not found');
    }

    return Modules.Quest.create(
      DEFAULT_QUEST_NAME,
      defaultQuestEntity.kind,
      defaultQuestEntity.content,
      defaultQuestEntity.creator_hash,
    );
  }

  async createValueLinks(
    valueLinksDtoArray: CreateValueLinkDto[],
  ): Promise<Pool[]> {
    const pools = [];
    for (const valueLink of valueLinksDtoArray) {
      const { kind, quest_left_hash, quest_right_hash } = valueLink;
      const leftQuest = await this.questInstanceFromDb(quest_left_hash);
      const rightQuest = await this.questInstanceFromDb(quest_right_hash);

      const poolInstance = Modules.Pool.create(leftQuest, rightQuest, null);

      const poolEntity = new Pool();
      poolEntity.quest_left_hash = leftQuest.hash; // TODO: check if equal defaultQuest.hash
      poolEntity.quest_right_hash = rightQuest.hash;
      poolEntity.kind = kind;
      poolEntity.hash = poolInstance.hash;
      poolEntity.type = 'value-link';
      poolEntity.positions = poolInstance.pos.values();

      const poolState = this.poolStateEntityFromPoolInstance(poolInstance);

      await this.poolRepository.save(poolEntity);
      await this.poolStateRepository.save(poolState);

      pools.push(poolEntity);
    }

    return pools;
  }

  async findQuestPool(quest_hash: string): Promise<Pool> {
    const defaultQuest = await this.getDefaultQuest();
    const quest = await this.questInstanceFromDb(quest_hash);

    return this.poolRepository.findOne({
      where: {
        quest_left_hash: defaultQuest.hash,
        quest_right_hash: quest.hash,
      },
    });
  }

  async findPool(
    quest_left_hash: string,
    quest_right_hash: string,
  ): Promise<Pool> {
    const questLeft = await this.questInstanceFromDb(quest_left_hash);
    const questRight = await this.questInstanceFromDb(quest_right_hash);

    if (!questLeft) {
      throw new Error(`Can not find quest [${quest_left_hash}] for pool`);
    }
    if (!questRight) {
      throw new Error(`Can not find quest [${quest_right_hash}] for pool`);
    }

    return this.poolRepository.findOne({
      where: {
        quest_left_hash: questLeft.hash,
        quest_right_hash: questRight.hash,
      },
    });
  }

  async findPoolState(poolEntity: Pool): Promise<PoolState> {
    const [latestPoolState] = await this.poolStateRepository.find({
      skip: 0,
      take: 1,
      where: {
        pool_hash: poolEntity.hash,
      },
      order: { created_at: 'DESC' },
    });

    return latestPoolState;
  }

  async createPositions(
    positionsDtoArray: CreatePositionDto[],
  ): Promise<Pool[]> {
    const pools = [] as Pool[];
    const poolStates = [] as PoolState[];
    const defaultQuest = await this.getDefaultQuest();

    for (const positionDto of positionsDtoArray) {
      const { cited_quest, citing_quest, amount } = positionDto;
      const [citedQuest, citingQuest] = await Promise.all([
        this.questInstanceFromDb(cited_quest),
        this.questInstanceFromDb(citing_quest),
      ]);

      const citedQuestPoolEntity = await this.findQuestPool(cited_quest);
      const citedQuestPoolStateEntity = await this.findPoolState(
        citedQuestPoolEntity,
      );
      const citedQuestPool = Modules.Pool.create(
        defaultQuest,
        citedQuest,
        citedQuestPoolStateEntity.cur_price,
      );

      const citingQuestPoolEntity = await this.findQuestPool(citing_quest);
      const citingQuestPoolStateEntity = await this.findPoolState(
        citingQuestPoolEntity,
      );
      const citingQuestPool = Modules.Pool.create(
        defaultQuest,
        citingQuest,
        citingQuestPoolStateEntity.cur_price,
      );

      const crossPool: Modules.Pool = Modules.Pool.create(
        citingQuest,
        citedQuest,
        0,
      );

      const apiWallet: Modules.Wallet = Modules.Wallet.create(
        'APIWallet',
        'ov-api',
      );
      const [tradeAmountIn, tradeAmountOut] = citingQuestPool.buy(amount);
      apiWallet.addBalance(citingQuest.name, tradeAmountOut);

      const PRICE_RANGE_MULTIPLIER = 2; // default in Modules.Wallet
      const priceRange = apiWallet.calculatePriceRange(
        crossPool,
        citedQuestPool,
        citingQuestPoolEntity,
        PRICE_RANGE_MULTIPLIER,
      );

      // Reset price to find active liquidity during citeQuest
      crossPool.curPrice = 0;
      const [totalIn, totalOut] = apiWallet.citeQuest(
        crossPool,
        priceRange.min,
        priceRange.max,
        0,
        amount,
        priceRange.native,
      );

      if (!totalIn && !totalOut) {
        throw new Error('');
      }

      const crossPoolEntity = new Pool();
      crossPoolEntity.quest_left_hash = citedQuest.hash;
      crossPoolEntity.quest_right_hash = citingQuest.hash;
      crossPoolEntity.kind = 'CITATION';
      crossPoolEntity.hash = crossPool.hash;
      crossPoolEntity.type = 'value-link';
      crossPoolEntity.positions = crossPool.pos.values();

      const crossPoolStateEntity =
        this.poolStateEntityFromPoolInstance(crossPool);
      pools.push(crossPoolEntity);
      poolStates.push(crossPoolStateEntity);
    }

    await this.poolRepository.save(pools);
    await this.poolStateRepository.save(poolStates);
    return pools;
  }
}
