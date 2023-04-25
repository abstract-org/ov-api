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
  HASH: sha256(makeQuestName({ kind: 'TOKEN', content: 'USDC' })),
};

export const DEFAULT_API_CREATOR_HASH = '111111111111111111111';
