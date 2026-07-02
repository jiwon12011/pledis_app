// 스프라이트 표시 — 포즈 img 스왑 + 시트 CSS steps 애니 (기획서 §9)
import { url, asset } from './assets';
import type { PoseName } from '../data/scenes';
import type { MemberId } from '../core/store';

const SHEET_POSES: Record<string, { key: string; frames: number; dur: number }> = {
  walk: { key: 'walk-sheet', frames: 8, dur: 800 },
  run: { key: 'run-sheet', frames: 8, dur: 550 },
};

/** 멤버 1명의 시각 요소. 컨테이너는 발끝 앵커(translate(-50%,-100%)) 기준으로 부모가 배치. */
export class MemberSprite {
  readonly el: HTMLDivElement;
  private img: HTMLImageElement;
  private sheet: HTMLDivElement;
  private member: MemberId;
  private current: PoseName | null = null;

  constructor(member: MemberId) {
    this.member = member;
    this.el = document.createElement('div');
    this.el.className = 'member-sprite';
    this.img = document.createElement('img');
    this.img.alt = '';
    this.img.draggable = false;
    this.sheet = document.createElement('div');
    this.sheet.className = 'sheet-anim';
    this.el.append(this.img, this.sheet);
  }

  setMember(member: MemberId) {
    this.member = member;
    const pose = this.current;
    this.current = null;
    if (pose) this.setPose(pose);
  }

  setPose(pose: PoseName) {
    if (pose === this.current) return;
    this.current = pose;
    const sheetSpec = SHEET_POSES[pose];
    if (sheetSpec) {
      // 홀더(1프레임 폭, overflow hidden) 안에서 시트 전체(img)를 translateX steps로 이동
      const key = `ch/${this.member}/${sheetSpec.key}`;
      const e = asset(key);
      this.img.style.display = 'none';
      this.sheet.style.display = 'block';
      this.sheet.style.aspectRatio = `${e.w / sheetSpec.frames} / ${e.h}`;
      this.sheet.innerHTML =
        `<img class="strip" alt="" draggable="false" src="${url(key)}"
              style="width:${sheetSpec.frames * 100}%; animation: sheet-run ${sheetSpec.dur}ms steps(${sheetSpec.frames}) infinite;">`;
    } else {
      this.sheet.style.display = 'none';
      this.sheet.style.animation = 'none';
      this.img.style.display = 'block';
      // 크로스페이드 스왑
      this.img.style.opacity = '0';
      const next = url(`ch/${this.member}/${pose}`);
      const swap = () => {
        this.img.src = next;
        requestAnimationFrame(() => { this.img.style.opacity = '1'; });
      };
      setTimeout(swap, 60);
    }
  }

  get pose() { return this.current; }
}

/** 물방울 프레임 시퀀스를 지정 위치에서 1회 재생 */
export function playDroplet(parent: HTMLElement, xPct: number, yPct: number, opts: { splashOnly?: boolean; scale?: number } = {}) {
  const frames = opts.splashOnly ? [4, 5, 6] : [1, 2, 3, 4, 5, 6];
  const el = document.createElement('img');
  el.className = 'fx-droplet';
  el.alt = '';
  el.style.left = `${xPct}%`;
  el.style.top = `${yPct}%`;
  el.style.width = `${(opts.scale ?? 1) * 7}%`;
  parent.appendChild(el);
  let i = 0;
  const step = () => {
    if (i >= frames.length) { el.remove(); return; }
    el.src = url(`fx/droplet-f${frames[i]}`);
    i += 1;
    setTimeout(step, 110);
  };
  step();
}

/** 불꽃 5프레임 시퀀스 1회 */
export function playFirework(parent: HTMLElement, xPct: number, yPct: number, widthPct = 22) {
  const el = document.createElement('img');
  el.className = 'fx-firework';
  el.alt = '';
  el.style.left = `${xPct}%`;
  el.style.top = `${yPct}%`;
  el.style.width = `${widthPct}%`;
  parent.appendChild(el);
  let i = 1;
  const step = () => {
    if (i > 5) { el.remove(); return; }
    el.src = url(`fx/firework-f${i}`);
    i += 1;
    setTimeout(step, 180);
  };
  step();
}
