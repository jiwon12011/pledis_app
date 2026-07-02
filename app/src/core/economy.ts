// 출석·재화·해금 — 기획서 §2, §6-1
import { save, commit, todayKST } from './store';
import { SCENES, sceneById } from '../data/scenes';

export const TAP_DAILY_CAP = 20;
export const ATTEND_REWARD = 30;
export const STREAK_BONUS = 100;

export interface AttendResult { attended: boolean; reward: number; streakBonus: boolean; returned: boolean }

/** 접속(및 자정 통과 후 첫 상호작용) 시 호출. */
export function checkAttendance(): AttendResult {
  const today = todayKST();
  const last = save.lastVisit;
  if (last === today) return { attended: false, reward: 0, streakBonus: false, returned: false };
  if (last > today) return { attended: false, reward: 0, streakBonus: false, returned: false }; // 시계 되돌림: 지급만 스킵

  const yesterday = kstOffset(-1);
  const wasStreak = last === yesterday;
  save.streak = wasStreak ? save.streak + 1 : 1;
  save.lastVisit = today;
  save.tapEarnedToday = 0;

  let reward = ATTEND_REWARD;
  const streakBonus = wasStreak && save.streak % 7 === 0;
  if (streakBonus) reward += STREAK_BONUS;
  save.droplets += reward;
  commit();
  return { attended: true, reward, streakBonus, returned: !wasStreak && last !== '' };
}

function kstOffset(days: number): string {
  const d = new Date(Date.now() + days * 86400_000);
  return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Seoul' }).format(d);
}

/** 멤버 탭 적립. 반환: 실제 적립량(0 = 캡 도달). */
export function earnTap(): number {
  if (save.tapEarnedToday >= TAP_DAILY_CAP) return 0;
  save.tapEarnedToday += 1;
  save.droplets += 1;
  commit();
  return 1;
}

export const isUnlocked = (id: string) => save.unlocked.includes(id);

export function canUnlock(id: string): { ok: boolean; lack: number } {
  const scene = sceneById(id);
  if (!scene || isUnlocked(id) || scene.tier === 0) return { ok: false, lack: 0 };
  const lack = scene.price - save.droplets;
  return { ok: lack <= 0, lack: Math.max(0, lack) };
}

export function unlock(id: string): boolean {
  const scene = sceneById(id);
  if (!scene || !canUnlock(id).ok) return false;
  save.droplets -= scene.price;
  save.unlocked.push(id);
  maybeUnlockFinale();
  commit();
  return true;
}

/** 20종 전수집 → scene-21 자동 해금 (기획서 §2) */
export function maybeUnlockFinale() {
  const others = SCENES.filter((s) => s.id !== 'scene-21').map((s) => s.id);
  if (!save.unlocked.includes('scene-21') && others.every((id) => save.unlocked.includes(id))) {
    save.unlocked.push('scene-21');
  }
}

/** 해금 씬을 spec 순서로 */
export function unlockedInOrder(): string[] {
  return SCENES.filter((s) => save.unlocked.includes(s.id)).map((s) => s.id);
}
