// opt/manifest.json 로더 + URL 해석 + 프리로드 — spec-assets §7~8
export interface Entry { src: string; w: number; h: number; bytes: number; lqip?: string; thumb?: string; bbox?: { left: number; top: number; width: number; height: number } }

let entries: Record<string, Entry> = {};
const BASE = import.meta.env.BASE_URL;

export async function loadManifest(): Promise<void> {
  const res = await fetch(`${BASE}opt/manifest.json`);
  if (!res.ok) throw new Error(`manifest ${res.status}`);
  entries = (await res.json()).entries;
}

export const asset = (key: string): Entry => {
  const e = entries[key];
  if (!e) throw new Error(`unknown asset: ${key}`);
  return e;
};
export const url = (key: string) => `${BASE}${asset(key).src}`;
export const thumbUrl = (key: string) => `${BASE}${asset(key).thumb}`;

const decoded = new Set<string>();
/** 백그라운드 디코드 프리로드. 실패는 조용히 무시(재시도는 표시 시점에). */
export function preload(keys: string[]) {
  for (const key of keys) {
    if (decoded.has(key)) continue;
    const img = new Image();
    img.src = url(key);
    img.decode().then(() => decoded.add(key)).catch(() => {});
  }
}

/** 표시 전 디코드 보장(전환 깜빡임 방지). 3회 지수 백오프. */
export async function ensureDecoded(key: string): Promise<boolean> {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const img = new Image();
      img.src = url(key);
      await img.decode();
      decoded.add(key);
      return true;
    } catch {
      await new Promise((r) => setTimeout(r, 300 * 2 ** attempt));
    }
  }
  return false;
}

export const memberAssetKeys = (member: string): string[] => [
  'standing', 'waving', 'sit', 'dance', 'jump', 'slide', 'cycling', 'umbrella-topview',
  'walk-sheet', 'run-sheet', 'expression-neutral', 'expression-laugh', 'expression-shy', 'expression-surprised',
].map((p) => `ch/${member}/${p}`);
