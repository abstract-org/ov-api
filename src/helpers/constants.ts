import { sha256 } from './createHash';
import { makeQuestName } from './makeQuestName';

export enum POOL_TYPE {
  QUEST = 'USDC',
  VALUE_LINK = 'value-link',
}

export enum POOL_KIND {
  BLOCK = 'BLOCK',
  CITATION = 'CITATION',
}

export const DEFAULT_QUEST = {
  KIND: 'TOKEN',
  CONTENT: 'USDC',
  NAME: makeQuestName({ kind: 'TOKEN', content: 'USDC' }),
  HASH: sha256('TOKEN' + 'USDC'),
};

export const DEFAULT_INITIAL_BALANCE = 0;
export const DEFAULT_API_CREATOR_HASH = '111111111111111111111';

export const INITIAL_LIQUIDITY = [
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
