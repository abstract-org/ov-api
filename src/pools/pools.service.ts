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
import {
  DEFAULT_PRICE_RANGE_MULTIPLIER,
  INITIAL_LIQUIDITY,
  POOL_KIND,
  POOL_TYPE,
} from '../helpers/constants';

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

      const poolEntity = this.poolEntityFromPoolInstance(poolInstance, {
        quest_left_hash: leftQuest.hash,
        quest_right_hash: rightQuest.hash,
        type: POOL_TYPE.QUEST,
        kind: null,
      });
      const poolStateEntity =
        this.poolStateEntityFromPoolInstance(poolInstance);

      poolEntities.push(poolEntity);
      poolStateEntities.push(poolStateEntity);
    }

    await this.poolRepository.save(poolEntities);
    await this.poolStateRepository.save(poolStateEntities);

    return poolEntities;
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

      // TODO: throw Error if leftQuest.hash = defaultQuest.hash || rightQuest.hash = defaultQuest.hash
      const poolInstance = Modules.Pool.create(leftQuest, rightQuest, null);

      const poolEntity = this.poolEntityFromPoolInstance(poolInstance, {
        quest_left_hash: leftQuest.hash,
        quest_right_hash: rightQuest.hash,
        type: POOL_TYPE.VALUE_LINK,
        kind: kind,
      });

      const poolStateEntity =
        this.poolStateEntityFromPoolInstance(poolInstance);
      poolEntities.push(poolEntity);
      poolStateEntities.push(poolStateEntity);
    }

    await this.poolRepository.save(poolEntities);
    await this.poolStateRepository.save(poolStateEntities);

    return poolEntities;
  }

  async createPositions(
    positionsDtoArray: CreatePositionDto[],
  ): Promise<Pool[]> {
    const pools = [] as Pool[];
    const poolStates = [] as PoolState[];
    // const defaultQuest = await this.questService.ensureDefaultQuestInstance();

    for (const positionDto of positionsDtoArray) {
      const { cited_quest, citing_quest, amount } = positionDto;

      const citedQuestPoolEntity = await this.findQuestPool(cited_quest);
      const citedQuestPool = await this.poolInstanceFromPoolEntity(
        citedQuestPoolEntity,
      );

      const citingQuestPoolEntity = await this.findQuestPool(citing_quest);
      const citingQuestPool = await this.poolInstanceFromPoolEntity(
        citingQuestPoolEntity,
      );

      let crossPoolEntity = await this.findPool(cited_quest, citing_quest);

      // FIXME: it may be better to throw NotFoundException instead of creating new crossPool
      if (!crossPoolEntity) {
        [crossPoolEntity] = await this.createValueLinks([
          {
            kind: POOL_KIND.CITATION, // ??? this is ambiguous (POOL_KIND.BLOCK)
            quest_left_hash: cited_quest,
            quest_right_hash: citing_quest,
          },
        ]);
      }

      const crossPool = await this.poolInstanceFromPoolEntity(crossPoolEntity);

      const apiWallet: Modules.Wallet = Modules.Wallet.create(
        'APIWallet',
        'ov-api',
      );
      const [tradeAmountIn, tradeAmountOut] = citingQuestPool.buy(amount);
      // not used as we ignore balances:
      // apiWallet.addBalance(defaultQuest.name, -tradeAmountIn);
      // apiWallet.addBalance(citingQuest.name, tradeAmountOut);

      const priceRange = apiWallet.calculatePriceRange(
        crossPool,
        citedQuestPool,
        citingQuestPool,
        positionDto.price_range_multiplier || DEFAULT_PRICE_RANGE_MULTIPLIER,
      );

      if (!priceRange || isNaN(priceRange.min) || isNaN(priceRange.max)) {
        throw new NotAcceptableException(
          `Can not calculate priceRange for pool ${crossPool.hash}`,
        );
      }

      // Reset price to find active liquidity during citeQuest
      crossPool.curPrice = 0;
      const citationResult = apiWallet.citeQuest(
        crossPool,
        priceRange.min,
        priceRange.max,
        0,
        tradeAmountOut,
        priceRange.native,
      );

      if (!citationResult) {
        throw new NotAcceptableException('Cannot cite');
      }

      const [totalIn, totalOut] = citationResult;

      if (!totalIn && !totalOut) {
        throw new NotAcceptableException(
          `Could not open position for pool ${crossPool.hash}`,
        );
      }

      crossPoolEntity.positions = crossPool.pos.values();

      const crossPoolStateEntity =
        this.poolStateEntityFromPoolInstance(crossPool);
      pools.push(crossPoolEntity);
      poolStates.push(crossPoolStateEntity);
    }

    const updatedPools = await this.upsertPoolsByHash(pools);
    await this.poolStateRepository.save(poolStates);

    return updatedPools;
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

  async findLatestPoolState(poolEntity: Pool): Promise<PoolState> {
    return this.poolStateRepository.findOne({
      where: {
        pool_hash: poolEntity.hash,
      },
      order: { created_at: 'DESC' },
    });
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

  poolEntityFromPoolInstance(
    poolInstance: Modules.Pool,
    data: Partial<Pool>,
  ): Pool {
    const poolEntity = new Pool();
    poolEntity.hash = poolInstance.hash;
    poolEntity.positions = poolInstance.pos.values();
    poolEntity.quest_left_hash = data.quest_left_hash;
    poolEntity.quest_right_hash = data.quest_right_hash;
    poolEntity.type = data.type;
    poolEntity.kind = data.kind || null;

    return poolEntity;
  }

  poolStateEntityFromPoolInstance(pool: Modules.Pool): PoolState {
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

  async poolInstanceFromPoolEntity(poolEntity: Pool): Promise<Modules.Pool> {
    const leftQuest = await this.questService.questInstanceFromDb(
      poolEntity.quest_left_hash,
    );
    const rightQuest = await this.questService.questInstanceFromDb(
      poolEntity.quest_right_hash,
    );

    const pool = Modules.Pool.create(leftQuest, rightQuest, 0);
    pool.hydratePositions(poolEntity.positions);
    pool.kind = poolEntity.kind;
    pool.type = poolEntity.type;

    const poolState = await this.findLatestPoolState(poolEntity);
    if (poolState) {
      pool.curLiq = poolState.cur_liq;
      pool.curPrice = poolState.cur_price;
      pool.curPP = poolState.cur_pp;
      pool.curLeft = poolState.cur_left;
      pool.curRight = poolState.cur_right;
      pool.questLeftPrice = poolState.quest_left_price;
      pool.questRightPrice = poolState.quest_right_price;
      pool.questLeftVolume = poolState.quest_left_volume;
      pool.questRightVolume = poolState.quest_right_volume;
    }

    return pool;
  }

  async upsertPoolsByHash(pools: Pool[]): Promise<Pool[]> {
    const updatedPools: Pool[] = [];

    for (const pool of pools) {
      const queryByHash = { where: { hash: pool.hash } };
      const existedPool = await this.poolRepository.findOne(queryByHash);
      if (!existedPool) {
        await this.poolRepository.save(pool);
      } else {
        await this.poolRepository.update({ hash: pool.hash }, pool);
      }
      const updatedPool = await this.poolRepository.findOne(queryByHash);
      updatedPools.push(updatedPool);
    }

    return updatedPools;
  }
}
