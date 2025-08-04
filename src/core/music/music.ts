import { cacheEngine } from '../../lib/cache.ts';
import { getCacheKey } from '../../lib/get-cache-key.ts';
import { Library, KEYGENMUSIC_URL } from '../index.ts';

const getDownloadUrl = async (id: string): Promise<string | null> => {
  const cacheKey = getCacheKey('download', `id`);
  const cached = await cacheEngine.get<string>(cacheKey);
  if (cached) return cached;

  const musicInfo = await Library.info(id, true);
  if (!musicInfo) return null;

  const completeUrl = `${KEYGENMUSIC_URL}${musicInfo.path}`;

  await cacheEngine.set(cacheKey, completeUrl, 86_400);
  return completeUrl;
};

export const Music = {
  getDownloadUrl
};
