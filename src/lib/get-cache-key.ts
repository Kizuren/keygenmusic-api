const CACHE_KEY_BASE = 'KEYGENMUSIC:' as const;

type CacheBaseType = typeof CACHE_KEY_BASE;

type CacheKeyType = 'search' | 'info' | 'library' | 'download';

export function getCacheKey<T extends CacheKeyType>(
  type: T,
  identifier: string
): `${CacheBaseType}${T}:${string}` {
  return `${CACHE_KEY_BASE}${type}:${identifier}` as const;
}
