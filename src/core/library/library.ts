import { fetch } from 'bun';
import type { MusicType, MusicResponse } from './types.ts';

import { cacheEngine } from '../../lib/cache.ts';
import { getCacheKey } from '../../lib/get-cache-key.ts';
import { KEYGENMUSIC_URL, Headers } from '../index.ts';

const getLibrary = async (): Promise<Array<MusicType>> => {
  const cacheKey = getCacheKey('library', '');
  const cached = await cacheEngine.get<Array<MusicType>>(cacheKey);
  if (cached) return cached;

  const response = await fetch(`${KEYGENMUSIC_URL}/kgm/lib.txt`, { headers: Headers() });
  const responseJson = (await response.json()) as Array<MusicResponse>;

  const library = responseJson.map((m) => ({
    id: m.n,
    composer: m.rg,
    software: m.sn,
    metadata: m.mdt,
    path: m.path
  }));

  await cacheEngine.set(cacheKey, library, 86_400);
  return library;
};

const info = async (id: string, internal: boolean = false): Promise<MusicType | null> => {
  const cacheKey = getCacheKey('info', `${id}${internal ? 'internal' : ''}`);
  const cached = await cacheEngine.get<MusicType>(cacheKey);
  if (cached) return cached;

  let info = (await getLibrary()).find((music) => music.id === Number(id));
  if (!info) return null;

  if (!internal) {
    info = {
      ...info,
      path: `/api/music/download/${info.id}`
    };
  }

  await cacheEngine.set(cacheKey, info, 3600);
  return info;
};

const search = async (query: string): Promise<Array<MusicType>> => {
  const cacheKey = getCacheKey('search', encodeURIComponent(query));
  const cached = await cacheEngine.get<Array<MusicType>>(cacheKey);
  if (cached) return cached;

  const result = (await getLibrary()).filter(
    (music) =>
      String(music.id).includes(query) ||
      music.composer.toLowerCase().includes(query.toLowerCase()) ||
      music.software.toLowerCase().includes(query.toLowerCase()) ||
      String(music.metadata).toLowerCase().includes(query.toLowerCase()) ||
      music.path.toLowerCase().includes(query.toLowerCase())
  );

  const changedResults = result.map((music) => ({
    ...music,
    path: `/api/music/download/${music.id}`
  }));

  await cacheEngine.set(cacheKey, changedResults, 86_400);
  return changedResults;
};

export const Library = {
  info,
  search
};
