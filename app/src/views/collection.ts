// 도감 — 기획서 §3-3
import { SCENES, bgKey, type SceneSpec } from '../data/scenes';
import { save } from '../core/store';
import { canUnlock, unlock, isUnlocked } from '../core/economy';
import { thumbUrl } from '../engine/assets';
import { toast } from './ui';

export function renderCollection(root: HTMLElement, nav: { back(): void; goScene(id: string): void }) {
  const render = () => {
    const owned = SCENES.filter((s) => isUnlocked(s.id)).length;
    root.innerHTML = `
      <div class="collection">
        <header class="page-head">
          <button class="btn back" aria-label="홈으로">←</button>
          <h2>도감 <span class="progress">${owned}/21</span></h2>
          <span class="droplets">💧 ${save.droplets}</span>
        </header>
        <div class="grid"></div>
        <div class="sheet" hidden></div>
      </div>`;
    root.querySelector('.back')!.addEventListener('click', nav.back);
    const grid = root.querySelector<HTMLElement>('.grid')!;
    const sheet = root.querySelector<HTMLElement>('.sheet')!;

    for (const s of SCENES) {
      const has = isUnlocked(s.id);
      const secret = s.id === 'scene-21' && !has;
      const card = document.createElement('button');
      card.className = `card ${has ? 'owned' : 'locked'}`;
      card.setAttribute('aria-label', secret ? '비밀 장면' : `${s.title}${has ? '' : ' (잠김)'}`);
      card.innerHTML = secret
        ? `<div class="thumb secret">???</div><span class="card-title">???</span>`
        : `<img class="thumb" alt="" loading="lazy" src="${thumbUrl(bgKey(s))}">
           ${has ? '' : `<span class="lock">🔒 ${s.tier === 0 ? '' : `💧${s.price}`}</span>`}
           <span class="card-title">${s.title}</span>`;
      card.addEventListener('click', () => { if (!secret) openSheet(s); });
      grid.appendChild(card);
    }

    function openSheet(s: SceneSpec) {
      const has = isUnlocked(s.id);
      const { ok, lack } = canUnlock(s.id);
      sheet.innerHTML = `
        <div class="sheet-card">
          <img class="sheet-thumb" alt="" src="${thumbUrl(bgKey(s))}" style="${has ? '' : 'filter:grayscale(1) brightness(.45)'}">
          <h3>「${s.title}」</h3>
          <p class="hint">${s.hint}</p>
          ${has
            ? `<button class="btn primary go">바로 가기</button>`
            : s.tier === 0
              ? `<p class="price">20곳을 모두 모으면 자동으로 열려요</p>`
              : `<p class="price">💧 ${s.price}${ok ? '' : ` · ${lack} 부족`}</p>
                 <button class="btn primary do-unlock" ${ok ? '' : 'disabled'}>해금하기</button>`}
          <button class="btn close">닫기</button>
        </div>`;
      sheet.hidden = false;
      sheet.querySelector('.close')!.addEventListener('click', () => { sheet.hidden = true; });
      sheet.querySelector('.go')?.addEventListener('click', () => nav.goScene(s.id));
      sheet.querySelector('.do-unlock')?.addEventListener('click', () => {
        if (unlock(s.id)) {
          toast(`「${s.title}」 해금! 🎉`);
          if (isUnlocked('scene-21') && s.tier !== 0) toast('…어? 스물한 번째 장면이 열렸다');
          render();
        }
      });
    }
  };
  render();
}
