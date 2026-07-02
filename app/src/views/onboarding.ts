// 온보딩 3단계 — 기획서 §3-1
import { save, commit, type MemberId } from '../core/store';
import { url } from '../engine/assets';

const MEMBERS: MemberId[] = ['C1', 'C2', 'C3', 'C4', 'C5', 'C6'];

export function renderOnboarding(root: HTMLElement, done: () => void) {
  let step = 0;
  let picked: MemberId = 'C1';
  let carouselIdx = 0;

  const render = () => {
    if (step === 0) {
      root.innerHTML = `
        <div class="onboarding step-intro" style="background-image:url('${url('bg/scene-01-bg')}')">
          <div class="ob-scrim"></div>
          <div class="ob-body">
            <h1 class="logo">ROOM<span>:</span>BLUE</h1>
            <p class="ob-copy">여름 방에 들어갈래?</p>
            <img class="ob-mini" alt="" src="${url('cut/scene-05-miniatures-six')}">
            <button class="btn primary ob-next">시작하기</button>
          </div>
          <p class="disclaimer">비공식 팬메이드 · 특정 소속사와 무관합니다</p>
        </div>`;
      root.querySelector('.ob-next')!.addEventListener('click', () => { step = 1; render(); });
      return;
    }

    if (step === 1) {
      const m = MEMBERS[carouselIdx];
      root.innerHTML = `
        <div class="onboarding step-pick">
          <div class="ob-body">
            <h2>함께 지낼 멤버를 골라주세요</h2>
            <div class="carousel">
              <button class="car-prev" aria-label="이전"><img alt="" src="${url('ui/arrow-left')}"></button>
              <button class="car-member" aria-label="${save.names[m]} 선택">
                <img alt="" src="${url(`ch/${m}/standing`)}">
              </button>
              <button class="car-next" aria-label="다음"><img alt="" src="${url('ui/arrow-right')}"></button>
            </div>
            <p class="car-name">${save.names[m]}</p>
            <p class="ob-tip">탭해서 선택 · 나중에 설정에서 바꿀 수 있어요</p>
          </div>
          <p class="disclaimer">비공식 팬메이드 · 특정 소속사와 무관합니다</p>
        </div>`;
      root.querySelector('.car-prev')!.addEventListener('click', () => { carouselIdx = (carouselIdx + 5) % 6; render(); });
      root.querySelector('.car-next')!.addEventListener('click', () => { carouselIdx = (carouselIdx + 1) % 6; render(); });
      root.querySelector('.car-member')!.addEventListener('click', () => { picked = MEMBERS[carouselIdx]; step = 2; render(); });
      return;
    }

    root.innerHTML = `
      <div class="onboarding step-name">
        <div class="ob-body">
          <div class="pick-hero">
            <img alt="" src="${url(`ch/${picked}/waving`)}">
            <img class="pick-bubble" alt="" src="${url(`ch/${picked}/expression-laugh`)}">
          </div>
          <h2>뭐라고 부를까요?</h2>
          <input class="name-input" maxlength="12" value="${save.names[picked]}" aria-label="별명 입력">
          <button class="btn primary ob-done">우리집 가기</button>
        </div>
        <p class="disclaimer">비공식 팬메이드 · 특정 소속사와 무관합니다</p>
      </div>`;
    root.querySelector('.ob-done')!.addEventListener('click', () => {
      const input = root.querySelector<HTMLInputElement>('.name-input')!;
      const name = input.value.trim();
      if (name) save.names[picked] = name;
      save.member = picked;
      save.flags.onboarded = true;
      commit();
      done();
    });
  };

  render();
}
