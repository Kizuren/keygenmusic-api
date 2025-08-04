interface MusicResponse {
  st: string;
  rg: string;
  sn: string;
  n: number;
  mdt: string;
  path: string;
}

interface MusicType {
  id: number;
  composer: string;
  software: string;
  metadata: string;
  path: string;
}

export type { MusicType, MusicResponse };
