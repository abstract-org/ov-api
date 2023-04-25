import { Quest } from '../entities/quest.entity';
import { makeContentHash } from './createHash';

export const makeQuestName = (
  { kind, content }: Partial<Pick<Quest, 'kind' | 'content'>>,
  forceName?: string,
) => {
  if (forceName) {
    return forceName;
  }

  if (!kind || !content) {
    throw new Error('Cannot make quest name without kind and content');
  }

  const contentHash = makeContentHash(kind, content);

  return `_${kind.toUpperCase()}${contentHash.substring(0, 4)}`;
};
