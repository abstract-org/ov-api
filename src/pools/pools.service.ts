import { Injectable, NotAcceptableException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Pool } from '../entities/pool.entity';
import { CreatePoolDto } from '../dtos/create-pool.dto';
import { PoolState } from '../entities/pool-state.entity';
import { Modules } from '@abstract-org/sdk';
import { CreateValueLinkDto } from '../dtos/create-value-link.dto';
import { CreatePositionDto } from '../dtos/create-position.dto';
import { QuestService } from '../quests/quests.service';
import { INITIAL_LIQUIDITY, POOL_KIND, POOL_TYPE } from '../helpers/constants';

@Injectable()
export class PoolsService {
  constructor(
    @InjectRepository(Pool)
    private poolRepository: Repository<Pool>,
    @InjectRepository(PoolState)
    private poolStateRepository: Repository<PoolState>,
    private readonly questService: QuestService,
  ) {}

  async createPools(createPoolsDto: CreatePoolDto[]): Promise<Pool[]> {
    const defaultQuestInstance =
      await this.questService.ensureDefaultQuestInstance();

    const poolEntities: Pool[] = [];
    const poolStateEntities: PoolState[] = [];
    for (const { quest_hash } of createPoolsDto) {
      const leftQuest = defaultQuestInstance;
      const rightQuest = await this.questService.questInstanceFromDb(
        quest_hash,
      );
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
      poolEntity.hash = poolInstance.hash;
      poolEntity.type = POOL_TYPE.QUEST;
      poolEntity.kind = null;
      poolEntity.positions = poolInstance.pos.values();

      poolEntities.push(poolEntity);
      poolStateEntities.push(
        this.poolStateEntityFromPoolInstance(poolInstance),
      );
    }

    await this.poolStateRepository.save(poolStateEntities);
    await this.poolRepository.save(poolEntities);

    return poolEntities;
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
    poolState.pool_hash = pool.hash;

    return poolState;
  }

  async createValueLinks(
    valueLinksDtoArray: CreateValueLinkDto[],
  ): Promise<Pool[]> {
    const poolEntities: Pool[] = [];
    const poolStateEntities: PoolState[] = [];
    for (const valueLink of valueLinksDtoArray) {
      const { kind, quest_left_hash, quest_right_hash } = valueLink;
      const leftQuest = await this.questService.questInstanceFromDb(
        quest_left_hash,
      );
      const rightQuest = await this.questService.questInstanceFromDb(
        quest_right_hash,
      );

      const poolInstance = Modules.Pool.create(leftQuest, rightQuest, null);

      const poolEntity = new Pool();
      poolEntity.quest_left_hash = leftQuest.hash; // TODO: check if equal defaultQuest.hash
      poolEntity.quest_right_hash = rightQuest.hash;
      poolEntity.kind = kind;
      poolEntity.hash = poolInstance.hash;
      poolEntity.type = 'value-link';
      poolEntity.positions = poolInstance.pos.values();

      poolEntities.push(poolEntity);
      poolStateEntities.push(
        this.poolStateEntityFromPoolInstance(poolInstance),
      );
    }

    const poolStatesSaved = await this.poolStateRepository.save(
      poolStateEntities,
    );
    console.log('### DEBUG', poolStatesSaved);
    await this.poolRepository.save(poolEntities);

    return poolEntities;
  }

  async findQuestPool(quest_hash: string): Promise<Pool> {
    const defaultQuest = await this.questService.ensureDefaultQuestInstance();
    const quest = await this.questService.questInstanceFromDb(quest_hash);

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
    const questLeft = await this.questService.questInstanceFromDb(
      quest_left_hash,
    );
    const questRight = await this.questService.questInstanceFromDb(
      quest_right_hash,
    );

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

  async savePoolStatesForPoolInstances(
    pools: Modules.Pool[],
  ): Promise<PoolState[]> {
    const poolStates: PoolState[] = [];
    for (const pool of pools) {
      const poolState = this.poolStateEntityFromPoolInstance(pool);
      poolStates.push(poolState);
    }

    return this.poolStateRepository.save(poolStates);
  }

  async createPositions(
    positionsDtoArray: CreatePositionDto[],
  ): Promise<Pool[]> {
    const pools = [] as Pool[];
    const poolStates = [] as PoolState[];
    const defaultQuest = await this.questService.ensureDefaultQuestInstance();

    for (const positionDto of positionsDtoArray) {
      const { cited_quest, citing_quest, amount } = positionDto;
      const [citedQuest, citingQuest] = await Promise.all([
        this.questService.questInstanceFromDb(cited_quest),
        this.questService.questInstanceFromDb(citing_quest),
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
        positionDto.price_range_multiplier || PRICE_RANGE_MULTIPLIER,
      );

      if (!priceRange) {
        throw new NotAcceptableException(
          `Can not calculate priceRange for pool ${crossPool.hash}`,
        );
      }

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
        throw new NotAcceptableException(
          `Could not open position for pool ${crossPool.hash}`,
        );
      }

      const crossPoolEntity = new Pool();
      crossPoolEntity.quest_left_hash = citedQuest.hash;
      crossPoolEntity.quest_right_hash = citingQuest.hash;
      crossPoolEntity.kind = POOL_KIND.CITATION;
      crossPoolEntity.hash = crossPool.hash;
      crossPoolEntity.type = POOL_TYPE.VALUE_LINK;
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
