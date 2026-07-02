// 세이브 스토어 — 기획서 §6-1. localStorage 단일 키, 인메모리 폴백.
export type MemberId = 'C1' | 'C2' | 'C3' | 'C4' | 'C5' | 'C6';
export type UmbrellaColor = 'blue' | 'mint' | 'orange' | 'pink' | 'purple' | 'red';

export interface Save {
  v: 1;
  member: MemberId;
  names: Record<MemberId, string>;
  droplets: number;
  lastVisit: string; // KST YYYY-MM-DD
  streak: number;
  tapEarnedToday: number;
  unlocked: string[];
  currentScene: string;
  umbrellaColor: UmbrellaColor;
  flags: { seen21Credit: boolean; onboarded: boolean };
  settings: { reducedMotion: boolean | null };
}

const KEY = 'roomblue.save.v1';
const kstFmt = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Seoul' });
export const todayKST = (): string => kstFmt.format(new Date());

export const defaultNames = (): Record<MemberId, string> => ({
  C1: '멤버 1', C2: '멤버 2', C3: '멤버 3', C4: '멤버 4', C5: '멤버 5', C6: '멤버 6',
});

function freshSave(): Save {
  return {
    v: 1,
    member: 'C1',
    names: defaultNames(),
    droplets: 0,
    lastVisit: '',
    streak: 0,
    tapEarnedToday: 0,
    unlocked: ['scene-01'],
    currentScene: 'scene-01',
    umbrellaColor: 'blue',
    flags: { seen21Credit: false, onboarded: false },
    settings: { reducedMotion: null },
  };
}

let storageOk = true;
try {
  localStorage.setItem('roomblue.probe', '1');
  localStorage.removeItem('roomblue.probe');
} catch {
  storageOk = false;
}
export const isPersistent = () => storageOk;

export function validateSave(raw: unknown): Save | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const s = raw as Partial<Save>;
  if (s.v !== 1 || typeof s.droplets !== 'number' || !Array.isArray(s.unlocked)) return null;
  const base = freshSave();
  return {
    ...base,
    ...s,
    v: 1,
    droplets: Math.max(0, Math.floor(s.droplets)),
    names: { ...base.names, ...(s.names ?? {}) },
    flags: { ...base.flags, ...(s.flags ?? {}) },
    settings: { ...base.settings, ...(s.settings ?? {}) },
    unlocked: s.unlocked.filter((u): u is string => typeof u === 'string'),
  };
}

function load(): Save {
  if (!storageOk) return freshSave();
  const raw = localStorage.getItem(KEY);
  if (!raw) return freshSave();
  try {
    const parsed = validateSave(JSON.parse(raw));
    if (parsed) return parsed;
  } catch { /* 손상 세이브 */ }
  localStorage.setItem(`${KEY}.bak`, raw); // 조용히 버리지 않고 백업
  return freshSave();
}

export const save: Save = load();

type Listener = () => void;
const listeners = new Set<Listener>();
export const onChange = (fn: Listener) => { listeners.add(fn); };

let flushTimer: number | undefined;
function flush() {
  flushTimer = undefined;
  if (storageOk) {
    try { localStorage.setItem(KEY, JSON.stringify(save)); } catch { storageOk = false; }
  }
}

export function commit() {
  listeners.forEach((fn) => fn());
  clearTimeout(flushTimer);
  flushTimer = window.setTimeout(flush, 500);
}

document.addEventListener('visibilitychange', () => { if (document.hidden) flush(); });

// 다른 탭이 세이브를 갱신하면 소프트 리로드 — 기획서 §6-2
window.addEventListener('storage', (e) => {
  if (e.key === KEY && e.newValue) location.reload();
});

export function exportSave(): string {
  flush();
  return JSON.stringify(save);
}

export function importSave(text: string): boolean {
  try {
    const parsed = validateSave(JSON.parse(text));
    if (!parsed) return false;
    Object.assign(save, parsed);
    commit();
    return true;
  } catch {
    return false;
  }
}

export function resetSave() {
  Object.assign(save, freshSave());
  commit();
}

export function prefersReducedMotion(): boolean {
  if (save.settings.reducedMotion !== null) return save.settings.reducedMotion;
  return matchMedia('(prefers-reduced-motion: reduce)').matches;
}
