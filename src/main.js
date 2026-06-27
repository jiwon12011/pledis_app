// src/main.js
// ─────────────────────────────────────────────────────────────────────────
// 부트스트랩 — 워리오웨어식 마이크로게임 셸을 결선하고 렌더 루프를 시작한다.
//   tokens → scene-data(응원석/에셋풀) → Loader → Renderer → Game(마이크로게임)
//
// 정적 서버 전제(ES module): python3 -m http.server 8080 → http://localhost:8080/
//
// 책임:
//   · 캔버스/렌더러 셋업 + RAF 루프
//   · Game(마이크로게임 상태기계) 결선 + kit(에셋 접근) 주입
//   · 입력 수렴(키보드 ←→/Space·↑·W + 터치 게임패드 + 캔버스 포인터)
//   · DOM 오버레이(타이틀 → 시작, 게임오버 정산 카드/재시작). HUD 본체는 캔버스가 그린다.
//   · reduced-motion 단일 플래그 + 정수 비율 스케일(픽셀 정합)
// ─────────────────────────────────────────────────────────────────────────

import { CANVAS } from './tokens.js?v=28';
import { Loader } from './loader.js?v=28';
import { NAV_SCENES } from './scenes/scene-data.js?v=28';
import { Renderer } from './engine/renderer.js?v=28';
import { Game } from './engine/game.js?v=28';
import { Motion } from './engine/motion.js?v=28';
import { MICRO_KEYS } from './engine/minigames.js?v=28';
import { MEMBER_COLORS } from './engine/members.js?v=28';

// ── 0. 환경 플래그 ─────────────────────────────────────────────────
const params = new URLSearchParams(location.search);
const DEBUG = params.has('debug');
const FORCE_REDUCED = params.has('reduced');
const reducedQuery = matchMedia('(prefers-reduced-motion: reduce)');
const reducedMotion = () => reducedQuery.matches || FORCE_REDUCED;

// ── 1. DOM 레퍼런스 ────────────────────────────────────────────────
const canvas = document.getElementById('canvas');
const dom = {
  stage: document.getElementById('stage'),
  live: document.getElementById('live'),
  hudTop: document.querySelector('.hud-top'),
  hint: document.getElementById('controls-hint'),
  title: document.getElementById('title-screen'),
  goalCard: document.getElementById('goal-card'),
  goalStart: document.getElementById('goal-start'),
  gameover: document.getElementById('gameover-card'),
  goScore: document.getElementById('go-score'),
  goCombo: document.getElementById('go-combo'),
  goRestart: document.getElementById('go-restart'),
  planCard: document.getElementById('plan-card'),
  ending: document.getElementById('ending-card'),
  endingPhoto: document.getElementById('ending-photo'),
  endingStamp: document.getElementById('ending-stamp'),
  endingDate: document.getElementById('ending-date'),
  endingSave: document.getElementById('ending-save'),
  endingReplay: document.getElementById('ending-replay'),
};

// HUD는 캔버스가 전부 그린다(제한시간 바·하트·점수·콤보·응원석) → DOM 상단 HUD는 숨김(겹침 방지).
if (dom.hudTop) dom.hudTop.style.display = 'none';

// ── 2. 엔진 결선 ───────────────────────────────────────────────────
const loader = new Loader(NAV_SCENES);
const renderer = new Renderer(canvas, loader, { debug: DEBUG });

// 마이크로게임이 쓰는 에셋 접근 kit(투명 PNG 직접). 흰선 근절: 키잉 없이 그대로 drawImage.
const kit = {
  loader,
  sprite: (f) => loader.char(f),     // 캐릭터/동작(투명 PNG)
  bg: (f) => loader.bgByFile(f),     // 마이크로게임 배경
  reduced: reducedMotion,            // 타이밍 예고(윈드업) — reduced면 애니 대신 정적 카운트다운/표적선
};
const game = new Game(kit);
game.reducedMotion = reducedMotion;
renderer.game = game;

// 모션: GSAP가 Canvas 씬 값(motion.fx)을 트윈 → renderer가 매 프레임 읽어 그린다(DOM 트윈 아님).
const motion = new Motion({ gsap: window.gsap, reducedMotion });
renderer.fx = motion.fx;

// ── 3. 에셋 프리로드(첫 6 마이크로게임 배경·동작 + 표정 팝) ──────────
// 슬라이드 residency 폐기 — 마이크로게임이 쓰는 것만 직접 당겨 캐시(eviction 없음).
// 주: alarm(1)·gaze(8)은 V타입 통컷 → 방 배경(scene-03/11) 안 깔고 중립 그라데(_bgFlat)만 → 미프리로드.
// 주: V타입(1 alarm·8 gaze·16 door·18 planning)은 통컷 → 배경 안 깔고 _bgFlat → bg 미프리로드.
const PRELOAD_BG = [
  'scene-04-bg.png', 'scene-06-bg.png', 'scene-10-bg.png', 'scene-12-bg.png', 'scene-16-bg.png', // 2~6(컷아웃)
  'scene-05-bg.png', 'scene-07-bg.png', 'scene-20-bg.png', 'scene-15-bg-topview.png', 'scene-18-bg-topview.png', // 7·10·11·12·9
  'scene-14-bg.png', 'scene-08-bg.png', 'scene-19-bg.png', // 13·15·17
];
const PRELOAD_CHAR = [
  'scene-03-C1-alarm-swat.png', 'scene-04-C1-brush-wink.png',
  'scene-06-C1-tie-attempt1.png', 'scene-06-C1-tie-attempt2.png', 'scene-06-C1-tie-giveup.png',
  'scene-12-basketball-pickup.png', 'scene-10-jump-rooftop.png', 'C1-runpose.png',
  'scene-11-bus-window.png', 'scene-21-vpose-bonus.png', 'C2-cycling.png', // 8·9·10
  'scene-08-running-sprint.png', 'scene-08-sliding-skid.png', // 15
  'scene-09-door-grab.png', 'scene-19-sunset-cycling.png', 'scene-01-C1-planning.png', // 16·17·18
];
for (const f of PRELOAD_BG) loader.bgByFile(f);
for (const f of PRELOAD_CHAR) loader.char(f);
// 표정/동작 + 멤버 토큰: C1~C6 전원. laugh/surprised=표정팝, neutral=미니캐치/밸런스 토큰, dance=따라하기.
for (let n = 1; n <= 6; n++) for (const m of ['laugh', 'surprised', 'neutral']) loader.char(`C${n}-expression-${m}.png`);
for (let n = 1; n <= 6; n++) loader.char(`C${n}-dance.png`);

// ── 4. HUD/연출 훅 ─────────────────────────────────────────────────
// 시각 HUD는 캔버스가 그린다. 여기선 접근성(aria-live)·게임오버 DOM만 갱신.
function announce(msg) { if (dom.live) dom.live.textContent = msg; }

game.onReady = (micro) => announce(`${micro.title}. ${micro.prompt} ${micro.hint}`);
game.onCheer = (n) => { announce(`응원석 멤버 ${n}명`); motion.onCheer(n); };
game.onState = (state) => motion.onState(state, game);       // READY 팝인·속도선
game.onJudge = (result) => motion.onJudge(result, game);     // 성공 콤보팝 / 실패 하트소실+셰이크

game.onGameOver = ({ score, best }) => {
  if (dom.goScore) dom.goScore.textContent = String(score);
  if (dom.goCombo) dom.goCombo.textContent = String(best);
  if (dom.gameover) dom.gameover.hidden = false;
  motion.gameOver(dom.gameover); // .go-inner DOM 트윈(허용 구간)
  announce(`게임 오버. 점수 ${score}, 최고 콤보 ${best}.`);
  dom.goRestart?.focus();
};

dom.goRestart?.addEventListener('click', () => {
  if (dom.gameover) dom.gameover.hidden = true;
  game.restart();
  announce('새 게임 시작.');
});

// ── 엔딩(6명 다 모음 = 데뷔 완성): 군무 폴라로이드 + 오리지널 카피 ──────────
// 캔버스 군무 장면[y120~480]을 정사각 캡처 → 6명 시그니처색 점 프레임 → 폴라로이드.
let endingSnapshot = null;
function captureEndingPolaroid() {
  const size = 224, cap = document.createElement('canvas');
  cap.width = cap.height = size;
  const c = cap.getContext('2d'); c.imageSmoothingEnabled = false;
  c.drawImage(canvas, 0, 120, 360, 360, 0, 0, size, size); // 군무 사각 영역 cover
  const dot = 14, gap = (size - 6 * dot) / 7; // 하단 6명 시그니처색 점 프레임
  for (let i = 0; i < 6; i++) {
    c.fillStyle = MEMBER_COLORS[i];
    c.fillRect(Math.round(gap + i * (dot + gap)), size - dot - 6, dot, dot);
    c.strokeStyle = '#fff'; c.lineWidth = 1; c.strokeRect(Math.round(gap + i * (dot + gap)) + 0.5, size - dot - 5.5, dot - 1, dot - 1);
  }
  return cap.toDataURL('image/png');
}
game.onEnding = ({ score, bonus }) => {
  if (!dom.ending) return;
  endingSnapshot = captureEndingPolaroid();
  if (dom.endingPhoto && endingSnapshot) {
    dom.endingPhoto.style.backgroundImage = `url(${endingSnapshot})`;
    dom.endingPhoto.style.backgroundSize = 'cover';
  }
  if (dom.endingStamp) dom.endingStamp.textContent = '오늘, 우리가 됐다'; // 오리지널 카피
  if (dom.endingDate) dom.endingDate.textContent = bonus ? '데뷔 완성 · 우산 히든' : '데뷔 완성 · 첫 만남';
  dom.ending.hidden = false;
  announce(`데뷔 완성. 여섯이 모였다. 점수 ${score}.`);
  dom.endingReplay?.focus();
};
dom.endingSave?.addEventListener('click', () => {
  const data = endingSnapshot || captureEndingPolaroid();
  const a = document.createElement('a'); a.href = data; a.download = '우리의 첫 만남.png';
  document.body.appendChild(a); a.click(); a.remove();
});
dom.endingReplay?.addEventListener('click', () => {
  if (dom.ending) dom.ending.hidden = true;
  game.restart();
  announce('새 게임 시작.');
});

// ── 5. 입력 수렴(키보드 / 터치 게임패드 / 캔버스 포인터) ───────────
let hintDismissed = false;
function dismissHint() { if (hintDismissed) return; hintDismissed = true; if (dom.hint) dom.hint.hidden = true; }

const KEYMAP = {
  ArrowLeft: 'left', KeyA: 'left',
  ArrowRight: 'right', KeyD: 'right',
  Space: 'jump', ArrowUp: 'jump', KeyW: 'jump',
};
function onKey(e, on) {
  const action = KEYMAP[e.code];
  if (!action) return;
  e.preventDefault();
  if (on) dismissHint();
  game.setInput(action, on);
}
addEventListener('keydown', (e) => onKey(e, true));
addEventListener('keyup', (e) => onKey(e, false));

// 터치 게임패드(#pad-left/right/jump, data-input). 좌우=이동, JUMP=탭/홀드 겸용.
for (const btn of document.querySelectorAll('#pad-left, #pad-right, #pad-jump')) {
  const action = btn.dataset.input;
  if (!action) continue;
  const press = (e) => { e.preventDefault(); dismissHint(); game.setInput(action, true); };
  const release = (e) => { e.preventDefault(); game.setInput(action, false); };
  btn.addEventListener('pointerdown', press);
  btn.addEventListener('pointerup', release);
  btn.addEventListener('pointerleave', release);
  btn.addEventListener('pointercancel', release);
}

// 캔버스 포인터(탭/스와이프) — 마이크로게임 입력. 화면 좌표를 백버퍼 논리좌표(360×640)로 환산.
function toLogical(e) {
  const r = canvas.getBoundingClientRect();
  return [((e.clientX - r.left) / r.width) * CANVAS.W, ((e.clientY - r.top) / r.height) * CANVAS.H];
}
canvas.addEventListener('pointerdown', (e) => { dismissHint(); const [x, y] = toLogical(e); game.setPointer('down', x, y); });
canvas.addEventListener('pointermove', (e) => { const [x, y] = toLogical(e); game.setPointer('move', x, y); });
const endPointer = (e) => { const [x, y] = toLogical(e); game.setPointer('up', x, y); };
canvas.addEventListener('pointerup', endPointer);
canvas.addEventListener('pointercancel', endPointer);

// ── 6. 스테이지 정수 비율 스케일(픽셀 정합) ────────────────────────
function fitStage() {
  if (!dom.stage) return;
  const raw = Math.min(innerWidth / CANVAS.W, innerHeight / CANVAS.H);
  const scale = raw >= 1 ? Math.floor(raw) : raw;
  dom.stage.style.setProperty('--scale', String(scale));
}
addEventListener('resize', fitStage, { passive: true });
fitStage();

// ── 7. 시작 흐름: PRESS START → 목표 카드 → 플레이 ─────────────────
let _started = false;
function startPlay() {
  if (_started) return; _started = true;
  if (dom.goalCard) dom.goalCard.hidden = true;
  if (dom.planCard) dom.planCard.hidden = true;
  game.sync();   // 와이어링 후 초기 HUD/배너 동기화
  game.start();  // 첫 READY부터 루프 진행
}
// P2 "오늘의 완벽한 계획" 인트로 컷: planning 1장 잠깐 → 게임 시작(곡명은 모티프, 문구 오리지널).
function showPlanIntro() {
  if (dom.goalCard) dom.goalCard.hidden = true;
  if (!dom.planCard) { startPlay(); return; }
  dom.planCard.hidden = false;
  const hold = reducedMotion() ? 300 : 1500;
  setTimeout(startPlay, hold);          // 자동 진행(탭으로 건너뛰기 가능)
  dom.planCard.addEventListener('click', startPlay, { once: true });
}
function openGoal() {
  if (dom.title) dom.title.hidden = true;
  if (dom.goalCard) dom.goalCard.hidden = false;
  else showPlanIntro();
}
dom.title?.addEventListener('click', openGoal, { once: true });
dom.goalStart?.addEventListener('click', showPlanIntro);
dom.goalCard?.addEventListener('click', showPlanIntro);

// ── 8. 루프 시작 ───────────────────────────────────────────────────
renderer.start();

// 디버그/검증 핸들.
window.cutsceneApp = { loader, renderer, game, reducedMotion, MICRO_KEYS };
