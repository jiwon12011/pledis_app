// 부트스트랩 + 상태 기반 라우팅 — 기획서 §3
import './styles/tokens.css';
import './styles/ui.css';
import './styles/room.css';
import { loadManifest, preload, memberAssetKeys } from './engine/assets';
import { save } from './core/store';
import { checkAttendance } from './core/economy';
import { renderRoom } from './views/room';
import { renderOnboarding } from './views/onboarding';
import { renderCollection } from './views/collection';
import { renderSettings } from './views/settings';
import { toast } from './views/ui';

const app = document.getElementById('app')!;
let roomHandle: { dispose(): void } | null = null;

function teardown() {
  roomHandle?.dispose();
  roomHandle = null;
}

function goRoom() {
  teardown();
  roomHandle = renderRoom(app, { goCollection, goSettings });
}
function goCollection() {
  teardown();
  renderCollection(app, {
    back: goRoom,
    goScene: (id) => { save.currentScene = id; goRoom(); },
  });
}
function goSettings() {
  teardown();
  renderSettings(app, { back: goRoom, reboot: () => location.reload() });
}

async function boot() {
  app.innerHTML = '<div class="boot">ROOM:BLUE …</div>';
  try {
    await loadManifest();
  } catch {
    app.innerHTML = '<div class="boot">에셋을 불러오지 못했어요.<br><button class="btn" onclick="location.reload()">다시 시도</button></div>';
    return;
  }

  if (!save.flags.onboarded) {
    renderOnboarding(app, () => {
      afterEnter();
      goRoom();
    });
    return;
  }
  afterEnter();
  goRoom();
}

function afterEnter() {
  const att = checkAttendance();
  if (att.attended) {
    window.setTimeout(() => {
      if (att.returned) toast('돌아왔네! 반가워 👋');
      toast(`출석 💧+${att.reward}${att.streakBonus ? ` (연속 ${save.streak}일 보너스!)` : ''} · 연속 ${save.streak}일`);
    }, 800);
  }
  // 선택 멤버 에셋 백그라운드 프리로드 (기획서 §9)
  window.setTimeout(() => preload(memberAssetKeys(save.member)), 1500);
}

boot();
