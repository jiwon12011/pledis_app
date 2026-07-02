// 설정 — 기획서 §3-4
import { save, commit, exportSave, importSave, resetSave, isPersistent, type MemberId } from '../core/store';
import { url } from '../engine/assets';
import { toast } from './ui';

const MEMBERS: MemberId[] = ['C1', 'C2', 'C3', 'C4', 'C5', 'C6'];

export function renderSettings(root: HTMLElement, nav: { back(): void; reboot(): void }) {
  const rm = save.settings.reducedMotion;
  root.innerHTML = `
    <div class="settings">
      <header class="page-head">
        <button class="btn back" aria-label="홈으로">←</button>
        <h2>설정</h2><span></span>
      </header>

      ${isPersistent() ? '' : '<p class="warn">⚠️ 이 브라우저에선 진행이 저장되지 않아요 (프라이빗 모드?)</p>'}

      <div class="settings-body">
      <section><h3>🏠 함께 지내는 멤버</h3>
        <div class="member-row">
          ${MEMBERS.map((m) => `
            <button class="member-pick ${save.member === m ? 'active' : ''}" data-m="${m}" aria-label="${save.names[m]}">
              <img alt="" src="${url(`ch/${m}/standing`)}">
              <span class="mp-name">${escapeHtml(save.names[m])}</span>
            </button>`).join('')}
        </div>
        <p class="tip">바꿔도 물방울·해금은 그대로예요</p>
      </section>

      <section><h3>✏️ 멤버 별명</h3>
        <p class="tip" style="margin-top:0">내가 부르고 싶은 이름으로 바꿔보세요</p>
        ${MEMBERS.map((m) => `
          <label class="name-edit"><input data-name="${m}" maxlength="12" value="${escapeHtml(save.names[m])}"></label>`).join('')}
      </section>

      <section><h3>🌀 모션 줄이기</h3>
        <div class="seg">
          <button data-rm="null" class="${rm === null ? 'active' : ''}">시스템 따름</button>
          <button data-rm="true" class="${rm === true ? 'active' : ''}">켬</button>
          <button data-rm="false" class="${rm === false ? 'active' : ''}">끔</button>
        </div>
      </section>

      <section><h3>💾 진행 백업</h3>
        <p class="tip" style="margin-top:0">기기를 바꿀 때 내보내기 → 새 기기에서 가져오기</p>
        <div class="row-btns">
          <button class="btn do-export">내보내기(복사)</button>
          <button class="btn do-import">가져오기</button>
        </div>
        <textarea class="save-io" rows="3" placeholder="가져올 세이브 JSON을 붙여넣으세요" aria-label="세이브 JSON"></textarea>
        <button class="btn danger do-reset">데이터 초기화</button>
      </section>

      <section class="about">
        <p>ROOM:BLUE — 비공식 팬메이드 웹앱입니다.<br>
        특정 소속사·아티스트와 무관하며 수익을 창출하지 않습니다.<br>
        문의 시 게시를 중단합니다.</p>
      </section>
      </div>
    </div>`;

  root.querySelector('.back')!.addEventListener('click', () => { flushNames(); nav.back(); });

  root.querySelectorAll<HTMLButtonElement>('.member-pick').forEach((b) =>
    b.addEventListener('click', () => {
      save.member = b.dataset.m as MemberId;
      commit();
      root.querySelectorAll('.member-pick').forEach((x) => x.classList.toggle('active', x === b));
      toast(`${save.names[save.member]}(와)과 함께 지내요`);
    }));

  root.querySelectorAll<HTMLButtonElement>('.seg button').forEach((b) =>
    b.addEventListener('click', () => {
      save.settings.reducedMotion = b.dataset.rm === 'null' ? null : b.dataset.rm === 'true';
      commit();
      root.querySelectorAll('.seg button').forEach((x) => x.classList.toggle('active', x === b));
    }));

  const io = root.querySelector<HTMLTextAreaElement>('.save-io')!;
  root.querySelector('.do-export')!.addEventListener('click', async () => {
    flushNames();
    const text = exportSave();
    io.value = text;
    try { await navigator.clipboard.writeText(text); toast('클립보드에 복사했어요'); }
    catch { toast('아래 칸에서 직접 복사해주세요'); }
  });
  root.querySelector('.do-import')!.addEventListener('click', () => {
    if (!io.value.trim()) { toast('세이브 JSON을 붙여넣어 주세요'); return; }
    if (importSave(io.value.trim())) { toast('가져오기 완료!'); nav.reboot(); }
    else toast('세이브 형식이 올바르지 않아요 — 기존 데이터는 그대로예요');
  });

  let resetArmed = false;
  root.querySelector<HTMLButtonElement>('.do-reset')!.addEventListener('click', (e) => {
    const btn = e.currentTarget as HTMLButtonElement;
    if (!resetArmed) {
      resetArmed = true;
      btn.textContent = '정말 초기화할까요? (다시 탭)';
      setTimeout(() => { resetArmed = false; btn.textContent = '데이터 초기화'; }, 4000);
      return;
    }
    resetSave();
    nav.reboot();
  });

  function flushNames() {
    root.querySelectorAll<HTMLInputElement>('input[data-name]').forEach((inp) => {
      const v = inp.value.trim();
      if (v) save.names[inp.dataset.name as MemberId] = v;
    });
    commit();
  }
}

const escapeHtml = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
