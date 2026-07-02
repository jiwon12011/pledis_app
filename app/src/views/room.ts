// 홈(룸) — 레이어 스택 + 멤버 행동 FSM (기획서 §3-2, §5 / spec-scenes)
import { SCENES, sceneById, bgKey, type SceneSpec, type DblAction, type IdleBKind } from '../data/scenes';
import { save, commit, prefersReducedMotion, type MemberId } from '../core/store';
import { earnTap, canUnlock, TAP_DAILY_CAP } from '../core/economy';
import { asset, url, ensureDecoded, preload } from '../engine/assets';
import { MemberSprite, playDroplet, playFirework } from '../engine/sprite';
import { toast } from './ui';

type Expression = 'neutral' | 'laugh' | 'shy' | 'surprised';

interface Nav { goCollection(): void; goSettings(): void }

export function renderRoom(root: HTMLElement, nav: Nav) {
  root.innerHTML = `
    <div class="room">
      <div class="stage-wrap"><div class="stage"></div></div>
      <div class="hud hud-top">
        <span class="droplets" aria-label="물방울 잔액">💧 <b>0</b></span>
        <span class="scene-title"></span>
      </div>
      <div class="hud hud-bottom">
        <button class="nav-arrow prev" aria-label="이전 장면"><img alt=""></button>
        <button class="hud-btn col" aria-label="도감">📚<span>도감</span></button>
        <button class="hud-btn set" aria-label="설정">⚙️<span>설정</span></button>
        <button class="nav-arrow next" aria-label="다음 장면"><img alt=""></button>
      </div>
      <div class="sleep-overlay" hidden><div class="zzz">Z z z…</div></div>
      <div class="modal" hidden></div>
    </div>`;

  const roomEl = root.querySelector<HTMLElement>('.room')!;
  const stage = root.querySelector<HTMLElement>('.stage')!;
  const stageWrap = root.querySelector<HTMLElement>('.stage-wrap')!;
  const hudDroplets = root.querySelector<HTMLElement>('.droplets b')!;
  const hudTitle = root.querySelector<HTMLElement>('.scene-title')!;
  const sleepOverlay = root.querySelector<HTMLElement>('.sleep-overlay')!;
  const modal = root.querySelector<HTMLElement>('.modal')!;
  root.querySelector<HTMLImageElement>('.prev img')!.src = url('ui/arrow-left');
  root.querySelector<HTMLImageElement>('.next img')!.src = url('ui/arrow-right');

  const reduced = prefersReducedMotion();

  // ---------- 씬 상태 ----------
  let scene: SceneSpec = sceneById(save.currentScene) ?? SCENES[0];
  let sprite: MemberSprite | null = null;
  let reflection: MemberSprite | null = null;
  let anchor: HTMLElement | null = null;
  let bubbleTimer = 0;
  let tapBurst: number[] = [];
  let idleTimer = 0;
  let idleBTimer = 0;
  let sleeping = false;
  let mirrorImg: HTMLImageElement | null = null;
  let intervals: number[] = [];
  let raf = 0;
  let panT = 0;
  let roamT = 0;
  let facing = 1;
  let disposed = false;

  const basePose = () => scene.member?.pose ?? 'standing';

  function updateHud() {
    hudDroplets.textContent = String(save.droplets);
    hudTitle.textContent = `📍 ${scene.title}`;
  }

  // ---------- 스테이지 레이아웃(배경 cover 좌표계) ----------
  function layoutStage() {
    const e = asset(bgKey(scene));
    const vw = stageWrap.clientWidth, vh = stageWrap.clientHeight;
    // 9:16=모바일 cover/데스크톱 세로맞춤, 16:9=세로맞춤(가로 오버플로=파노라마), 1:1=contain 레터박스
    const s = scene.aspect === '1:1'
      ? Math.min(vw / e.w, vh / e.h)
      : scene.aspect === '16:9' || vw > vh
        ? vh / e.h
        : Math.max(vw / e.w, vh / e.h);
    stage.style.width = `${e.w * s}px`;
    stage.style.height = `${e.h * s}px`;
    stage.style.left = `${(vw - e.w * s) / 2}px`;
    stage.style.top = `${(vh - e.h * s) / 2}px`;
  }
  window.addEventListener('resize', layoutStage);

  // ---------- 씬 구축 ----------
  async function buildScene() {
    clearTimers();
    stage.innerHTML = '';
    sleeping = false;
    sleepOverlay.hidden = true;
    facing = 1;
    panT = 0;

    const bgEntry = asset(bgKey(scene));
    layoutStage();
    stage.style.backgroundImage = `url("${bgEntry.lqip}")`;

    const bg = document.createElement('img');
    bg.className = 'bg';
    bg.alt = scene.title;
    bg.src = url(bgKey(scene));
    stage.appendChild(bg);

    const fxBack = div('fx-layer fx-back');
    const memberLayer = div('member-layer');
    const fxFront = div('fx-layer fx-front');
    const hotspotLayer = div('hotspot-layer');
    stage.append(fxBack, memberLayer, fxFront, hotspotLayer);

    // 멤버 or 특수룸 컷
    if (scene.special) {
      const cut = document.createElement('img');
      cut.className = 'special-cut';
      cut.alt = '';
      cut.src = url(`cut/${scene.special.cut}`);
      cut.style.left = `${scene.special.x}%`;
      cut.style.top = `${scene.special.y}%`;
      cut.style.width = `${scene.special.w}%`;
      cut.addEventListener('pointerdown', onMemberTap);
      memberLayer.appendChild(cut);
      anchor = cut as unknown as HTMLElement;
      sprite = null; reflection = null;
    } else if (scene.member) {
      const m = scene.member;
      anchor = div('member-anchor');
      anchor.style.left = `${m.x}%`;
      anchor.style.top = `${m.y}%`;
      anchor.style.setProperty('--member-scale', String(m.scale));
      if (m.bottomClamp) anchor.classList.add('bottom-clamp');

      sprite = new MemberSprite(save.member as MemberId);
      sprite.setPose(m.pose);
      sprite.el.classList.add('member-main');
      if (m.motion && !reduced) sprite.el.classList.add(`motion-${m.motion}`);
      anchor.appendChild(sprite.el);

      if (m.reflection) {
        reflection = new MemberSprite(save.member as MemberId);
        reflection.setPose(m.pose);
        reflection.el.classList.add('member-reflection');
        reflection.el.style.opacity = String(m.reflection);
        anchor.appendChild(reflection.el);
      } else reflection = null;

      anchor.addEventListener('pointerdown', onMemberTap);
      memberLayer.appendChild(anchor);
    }

    // scene-04 거울 표정 동기화
    mirrorImg = null;
    if (scene.mirrorSync) {
      mirrorImg = document.createElement('img');
      mirrorImg.className = 'mirror-face';
      mirrorImg.alt = '';
      mirrorImg.src = url(`ch/${save.member}/expression-neutral`);
      Object.assign(mirrorImg.style, rectStyle(scene.mirrorSync));
      fxFront.appendChild(mirrorImg);
    }

    // 이펙트
    for (const fx of scene.effects) {
      if (fx.kind === 'clouds' && !reduced) spawnClouds(fxBack, fx.count ?? 2, fx.clip);
      if (fx.kind === 'dropletLoop') {
        intervals.push(window.setInterval(() => {
          if (!document.hidden) playDroplet(fxFront, fx.x!, fx.y!, { splashOnly: fx.splashOnly });
        }, fx.every ?? 3000));
      }
      if (fx.kind === 'fireworkLoop' && !reduced) {
        intervals.push(window.setInterval(() => {
          if (!document.hidden) playFirework(fxFront, fx.x!, fx.y!);
        }, fx.every ?? 9000));
        playFirework(fxFront, fx.x!, fx.y!);
      }
      if (fx.kind === 'rainLines' && !reduced) spawnRain(fxFront, fx.count ?? 20);
      if (fx.kind === 'confetti' && !reduced) spawnConfetti(fxFront, fx.count ?? 12);
    }

    // scene-18 우산 색 오버레이
    if (scene.id === 'scene-18' && sprite) {
      const cap = document.createElement('img');
      cap.className = 'umbrella-cap';
      cap.alt = '';
      cap.src = url(`fx/umbrella-${save.umbrellaColor}`);
      sprite.el.appendChild(cap);
    }

    // 핫스팟
    for (const h of scene.hotspots) {
      const b = document.createElement('button');
      b.className = 'hotspot';
      b.setAttribute('aria-label', h.label);
      Object.assign(b.style, rectStyle(h));
      b.addEventListener('pointerdown', (ev) => {
        ev.stopPropagation();
        toast(h.label);
        if (h.act === 'shake') shakeStage();
        if (h.act === 'splash') playDroplet(fxFront, h.x + h.w / 2, h.y + h.h, { splashOnly: true });
        if (h.act === 'firework') playFirework(fxFront, h.x + h.w / 2, h.y);
        if (h.act === 'blink') blinkAt(fxFront, h);
      });
      hotspotLayer.appendChild(b);
    }

    // 무드컷 비네트 (3초 후 등장)
    if (scene.moodcuts.length) {
      window.setTimeout(() => {
        if (disposed || scene.moodcuts.length === 0) return;
        const at = scene.moodcutAt ?? { x: 82, y: 14 };
        const v = div('moodcut');
        v.style.left = `${at.x}%`;
        v.style.top = `${at.y}%`;
        v.innerHTML = `<img class="mc-frame" alt="" src="${url('ui/cutscene-frame-small')}">
                       <img class="mc-cut" alt="기억 조각 보기" src="${url(`cut/${scene.moodcuts[0]}`)}">`;
        v.addEventListener('pointerdown', (ev) => { ev.stopPropagation(); openCutModal(); });
        // 컷 여러 장이면 비네트 안에서 자동 순환 (scene-06 tie 3컷 등)
        if (scene.moodcuts.length > 1) {
          let i = 0;
          intervals.push(window.setInterval(() => {
            i = (i + 1) % scene.moodcuts.length;
            v.querySelector<HTMLImageElement>('.mc-cut')!.src = url(`cut/${scene.moodcuts[i]}`);
          }, 4000));
        }
        stage.appendChild(v);
      }, 3000);
    }

    // IDLE_B
    if (scene.idleB && !reduced) {
      idleBTimer = window.setInterval(() => { if (!document.hidden && !sleeping) runIdleB(scene.idleB!.kind); }, scene.idleB.every);
      intervals.push(idleBTimer);
    }

    // 첫 방문 안내 — "이 페이지에서 뭘 하는지" (1회)
    if (!save.flags.homeHintSeen) {
      save.flags.homeHintSeen = true;
      commit();
      const coach = div('coach');
      coach.innerHTML = `
        <div class="coach-card">
          <h3>여기는 ${save.names[save.member]}의 여름 방</h3>
          <p>👆 <b>멤버를 탭</b>하면 인사하고 물방울(💧)을 줘요</p>
          <p>👆👆 <b>더블탭</b>은 장면마다 다른 반응</p>
          <p>◀ ▶ · 스와이프로 <b>다른 장면</b>으로</p>
          <p>📚 <b>도감</b>에서 물방울로 새 장면 해금 — 총 21곳!</p>
          <p class="coach-dismiss">탭해서 시작하기</p>
        </div>`;
      coach.addEventListener('pointerdown', (ev) => { ev.stopPropagation(); coach.remove(); });
      roomEl.appendChild(coach);
    }

    // scene-21 첫 진입 크레딧
    if (scene.id === 'scene-21' && !save.flags.seen21Credit) {
      save.flags.seen21Credit = true;
      commit();
      window.setTimeout(showCredits, 1200);
    }

    updateHud();
    resetIdle();
    startTicker();
    preloadNeighbors();
  }

  // ---------- 팬/순회 티커 ----------
  function startTicker() {
    cancelAnimationFrame(raf);
    let last = performance.now();
    const tick = (now: number) => {
      if (disposed) return;
      const dt = Math.min(50, now - last) / 1000;
      last = now;
      if (scene.pan && !reduced) {
        panT += dt;
        const e = asset(bgKey(scene));
        const vw = stageWrap.clientWidth;
        const overflow = Math.max(0, stage.clientWidth - vw);
        if (overflow > 0) {
          const phase = 0.5 - 0.5 * Math.cos((2 * Math.PI * panT) / 90); // 45s 편도 왕복
          const x = -overflow * phase;
          stage.style.transform = `translateX(${x}px)`;
          if (scene.pan.loop && sprite) {
            const dir = Math.sin((2 * Math.PI * panT) / 90) >= 0 ? 1 : -1;
            if (dir !== facing) { facing = dir; sprite.el.style.setProperty('--facing', String(dir)); }
          }
        }
        void e;
      }
      if (scene.member?.roam && anchor && !reduced && !sleeping) {
        roamT += dt;
        const cx = 50 + 22 * Math.sin((2 * Math.PI * roamT) / 40);
        const cy = 50 + 18 * Math.sin((4 * Math.PI * roamT) / 40); // 8자
        anchor.style.left = `${cx}%`;
        anchor.style.top = `${cy}%`;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
  }

  // ---------- 멤버 FSM ----------
  function onMemberTap(ev: PointerEvent) {
    ev.stopPropagation();
    resetIdle();
    if (sleeping) { wake(); return; }

    const now = Date.now();
    tapBurst = [...tapBurst.filter((t) => now - t < 2500), now];

    if (scene.special) { runDbl(scene.dbl === 'credits' ? 'cutJump' : scene.dbl); earnAndToast(); return; }

    if (tapBurst.length >= 5) { tapBurst = []; tickle(); return; }
    showExpression(pickExpression());
    heartsAt(ev);
    earnAndToast();
    if (scene.firstTapToast && !sessionFlag(`ft-${scene.id}`)) toast(scene.firstTapToast);
  }

  function earnAndToast() {
    const got = earnTap();
    updateHud();
    if (got === 0 && !sessionFlag('tapcap')) toast(`오늘의 탭 물방울은 여기까지 (${TAP_DAILY_CAP}/${TAP_DAILY_CAP})`);
  }

  const sessionFlags = new Set<string>();
  function sessionFlag(key: string): boolean {
    if (sessionFlags.has(key)) return true;
    sessionFlags.add(key);
    return false;
  }

  function pickExpression(): Expression {
    const w = scene.tapWeights;
    const total = w.neutral + w.laugh + w.shy + w.surprised;
    let r = Math.random() * total;
    for (const [name, weight] of Object.entries(w)) {
      r -= weight;
      if (r <= 0) return name as Expression;
    }
    return 'laugh';
  }

  function showExpression(expr: Expression, ms = 1500) {
    if (!anchor) return;
    anchor.querySelector('.bubble')?.remove();
    const b = div('bubble');
    b.innerHTML = `<img alt="${expr}" src="${url(`ch/${save.member}/expression-${expr}`)}">`;
    anchor.appendChild(b);
    if (mirrorImg) mirrorImg.src = url(`ch/${save.member}/expression-${expr}`);
    clearTimeout(bubbleTimer);
    bubbleTimer = window.setTimeout(() => {
      b.remove();
      if (mirrorImg) mirrorImg.src = url(`ch/${save.member}/expression-neutral`);
    }, ms);
  }

  function tickle() {
    showExpression('surprised', 900);
    window.setTimeout(() => showExpression('laugh', 1600), 900);
    shakeStage();
  }

  function setPoseBoth(pose: Parameters<MemberSprite['setPose']>[0]) {
    sprite?.setPose(pose);
    reflection?.setPose(pose);
  }

  function tempPose(pose: Parameters<MemberSprite['setPose']>[0], ms: number, after?: () => void) {
    setPoseBoth(pose);
    window.setTimeout(() => { if (!disposed && !sleeping) { setPoseBoth(basePose()); after?.(); } }, ms);
  }

  function runIdleB(kind: IdleBKind) {
    switch (kind) {
      case 'walkAbout': {
        if (!anchor || !scene.member) break;
        setPoseBoth('walk');
        const from = scene.member.x, to = from + (Math.random() < 0.5 ? -14 : 14);
        anchor.style.transition = 'left 2.2s linear';
        anchor.style.left = `${to}%`;
        window.setTimeout(() => {
          anchor!.style.left = `${from}%`;
          window.setTimeout(() => { anchor!.style.transition = ''; setPoseBoth(basePose()); }, 2300);
        }, 2300);
        break;
      }
      case 'startle': tempPose('jump', 900); shakeStage(); break;
      case 'shyFace': showExpression('shy'); break;
      case 'slideDash': tempPose('slide', 1100); break;
      case 'shoot': tempPose('jump', 1200); shakeStage(); break;
      case 'danceBit': tempPose('dance', 2000); break;
      case 'splashStep': {
        tempPose('slide', 1100);
        const fx = stage.querySelector<HTMLElement>('.fx-front');
        if (fx && scene.member) playDroplet(fx, scene.member.x, scene.member.y, { splashOnly: true });
        break;
      }
    }
  }

  function runDbl(action: DblAction) {
    const fx = stage.querySelector<HTMLElement>('.fx-front');
    const m = scene.member;
    switch (action) {
      case 'jump': case 'shakeJump': case 'hangJump': case 'peek':
        tempPose('jump', 900);
        if (action === 'shakeJump') shakeStage();
        break;
      case 'bigJump': anchor?.classList.add('big-jump'); tempPose('jump', 1100, () => anchor?.classList.remove('big-jump')); break;
      case 'toggleSitStand': setPoseBoth(sprite?.pose === 'sit' ? 'standing' : 'sit'); break;
      case 'mirrorLaugh': if (mirrorImg) { mirrorImg.src = url(`ch/${save.member}/expression-laugh`); window.setTimeout(() => { if (mirrorImg) mirrorImg.src = url(`ch/${save.member}/expression-neutral`); }, 2000); } break;
      case 'cutJump': case 'cutWobble': {
        const cut = stage.querySelector<HTMLElement>('.special-cut');
        cut?.classList.add(action === 'cutJump' ? 'cut-jump' : 'cut-wobble');
        window.setTimeout(() => cut?.classList.remove('cut-jump', 'cut-wobble'), 700);
        if (scene.id === 'scene-15' && fx) playFirework(fx, 50, 20);
        if (scene.id === 'scene-21' && fx) { playFirework(fx, 30, 20); playFirework(fx, 70, 25); }
        break;
      }
      case 'wave': tempPose('waving', 1500); break;
      case 'run3s': tempPose('run', 3000); break;
      case 'slide': case 'splash3': {
        tempPose('slide', 1200);
        if (fx && m) {
          playDroplet(fx, m.x - 6, m.y, { splashOnly: true });
          if (action === 'splash3') {
            window.setTimeout(() => playDroplet(fx, m.x + 6, m.y, { splashOnly: true }), 200);
            window.setTimeout(() => playDroplet(fx, m.x, m.y + 3, { splashOnly: true }), 400);
          }
        }
        break;
      }
      case 'shootNow': tempPose('jump', 1200); shakeStage(); break;
      case 'jumpConfetti': tempPose('jump', 900); if (fx) spawnConfetti(fx, 24, true); break;
      case 'reachDrop': {
        if (!anchor || !m) break;
        setPoseBoth('walk');
        anchor.style.transition = 'left 1.6s ease';
        anchor.style.left = '53%';
        window.setTimeout(() => { setPoseBoth('waving'); }, 1700);
        window.setTimeout(() => {
          anchor!.style.left = `${m.x}%`;
          window.setTimeout(() => { anchor!.style.transition = ''; setPoseBoth(basePose()); }, 1700);
        }, 3400);
        break;
      }
      case 'minigame': toast('우산 미니게임은 곧 열려요 ☔'); break;
      case 'sunsetStop': tempPose('standing', 15000); break;
      case 'fireworkBurst': if (fx) { playFirework(fx, 58, 22); window.setTimeout(() => playFirework(fx, 70, 30), 300); window.setTimeout(() => playFirework(fx, 64, 18), 600); } break;
      case 'umbrellaSpin': break;
      case 'credits': showCredits(); break;
    }
  }

  // 더블탭 감지 (멤버/컷 대상)
  let lastTap = 0;
  stage.addEventListener('pointerdown', () => {
    resetIdle();
    const now = Date.now();
    if (now - lastTap < 300) {
      runDbl(scene.dbl);
      if (scene.id === 'scene-18') cycleUmbrella();
      lastTap = 0;
    } else lastTap = now;
  });

  function cycleUmbrella() {
    const order = ['blue', 'mint', 'orange', 'pink', 'purple', 'red'] as const;
    save.umbrellaColor = order[(order.indexOf(save.umbrellaColor) + 1) % order.length];
    commit();
    const cap = stage.querySelector<HTMLImageElement>('.umbrella-cap');
    if (cap) cap.src = url(`fx/umbrella-${save.umbrellaColor}`);
    toast(`우산 색: ${save.umbrellaColor}`);
  }

  // ---------- 수면 ----------
  function resetIdle() {
    clearTimeout(idleTimer);
    idleTimer = window.setTimeout(goSleep, 90_000);
  }
  function goSleep() {
    if (scene.special || !sprite) return;
    sleeping = true;
    setPoseBoth('sit');
    sleepOverlay.hidden = false;
    if (scene.sleepCut) {
      const c = document.createElement('img');
      c.className = 'sleep-cut';
      c.alt = '';
      c.src = url(`cut/${scene.sleepCut.cut}`);
      c.style.left = `${scene.sleepCut.x}%`;
      c.style.top = `${scene.sleepCut.y}%`;
      c.style.width = `${scene.sleepCut.w}%`;
      stage.appendChild(c);
    }
  }
  function wake() {
    sleeping = false;
    sleepOverlay.hidden = true;
    stage.querySelector('.sleep-cut')?.remove();
    setPoseBoth(basePose());
    showExpression('surprised', 2000);
    resetIdle();
  }
  sleepOverlay.addEventListener('pointerdown', wake);

  // ---------- 씬 전환 ----------
  async function goScene(delta: 1 | -1) {
    const idx = SCENES.findIndex((s) => s.id === scene.id);
    const target = SCENES[idx + delta];
    if (!target) { bounce(); return; }
    if (!save.unlocked.includes(target.id)) {
      bounce();
      const { lack } = canUnlock(target.id);
      toast(target.tier === 0 ? '20곳을 모두 모으면 열려요' : `「${target.title}」 💧${target.price}${lack > 0 ? ` (💧${lack} 부족)` : ' — 도감에서 해금!'}`);
      return;
    }
    roomEl.classList.add('switching');
    await ensureDecoded(bgKey(target));
    scene = target;
    save.currentScene = target.id;
    commit();
    await buildScene();
    roomEl.classList.remove('switching');
  }

  function preloadNeighbors() {
    const idx = SCENES.findIndex((s) => s.id === scene.id);
    const keys = [SCENES[idx - 1], SCENES[idx + 1]]
      .filter((s): s is SceneSpec => !!s && save.unlocked.includes(s.id))
      .map(bgKey);
    preload(keys);
  }

  root.querySelector('.prev')!.addEventListener('click', () => goScene(-1));
  root.querySelector('.next')!.addEventListener('click', () => goScene(1));
  root.querySelector('.col')!.addEventListener('click', nav.goCollection);
  root.querySelector('.set')!.addEventListener('click', nav.goSettings);

  // 스와이프
  let touchX: number | null = null;
  stageWrap.addEventListener('touchstart', (e) => { touchX = e.touches[0].clientX; }, { passive: true });
  stageWrap.addEventListener('touchend', (e) => {
    if (touchX === null) return;
    const dx = e.changedTouches[0].clientX - touchX;
    touchX = null;
    if (Math.abs(dx) > 60) goScene(dx < 0 ? 1 : -1);
  }, { passive: true });

  // HUD 소등 (8s)
  let hudTimer = 0;
  const hudWake = () => {
    roomEl.classList.remove('hud-dim');
    clearTimeout(hudTimer);
    hudTimer = window.setTimeout(() => roomEl.classList.add('hud-dim'), 8000);
  };
  roomEl.addEventListener('pointerdown', hudWake);
  hudWake();

  // ---------- 보조 ----------
  function openCutModal() {
    let i = 0;
    const render = () => {
      modal.innerHTML = `
        <div class="modal-card cut-modal">
          <div class="cut-holder">
            <img class="mc-frame" alt="" src="${url('ui/cutscene-frame-small')}">
            <img class="mc-cut" alt="기억 조각" src="${url(`cut/${scene.moodcuts[i]}`)}">
          </div>
          ${scene.moodcuts.length > 1 ? `
            <button class="cut-prev" aria-label="이전 컷"><img alt="" src="${url('ui/arrow-left')}"></button>
            <button class="cut-next" aria-label="다음 컷"><img alt="" src="${url('ui/arrow-right')}"></button>` : ''}
          <button class="modal-close" aria-label="닫기">✕</button>
        </div>`;
      modal.querySelector('.modal-close')!.addEventListener('click', () => { modal.hidden = true; });
      modal.querySelector('.cut-prev')?.addEventListener('click', () => { i = (i - 1 + scene.moodcuts.length) % scene.moodcuts.length; render(); });
      modal.querySelector('.cut-next')?.addEventListener('click', () => { i = (i + 1) % scene.moodcuts.length; render(); });
    };
    render();
    modal.hidden = false;
  }

  function showCredits() {
    modal.innerHTML = `
      <div class="modal-card credits">
        <h2>스물한 번째 장면</h2>
        <p>밤의 책상에서 시작해<br>콘페티가 내리는 옥상까지—</p>
        <p><b>당신의 여름에게.</b></p>
        <p class="fine">ROOM:BLUE · 비공식 팬메이드 · FANMADE<br>특정 소속사와 무관한 팬 창작물입니다</p>
        <button class="modal-close btn">닫기</button>
      </div>`;
    modal.querySelector('.modal-close')!.addEventListener('click', () => { modal.hidden = true; });
    modal.hidden = false;
  }

  function shakeStage() {
    stage.classList.remove('shake');
    void stage.offsetWidth;
    stage.classList.add('shake');
  }
  function bounce() {
    stageWrap.classList.remove('bounce');
    void stageWrap.offsetWidth;
    stageWrap.classList.add('bounce');
  }
  function heartsAt(ev: PointerEvent) {
    if (reduced) return;
    const h = div('heart');
    h.textContent = '♡';
    h.style.left = `${ev.clientX}px`;
    h.style.top = `${ev.clientY}px`;
    document.body.appendChild(h);
    window.setTimeout(() => h.remove(), 900);
  }
  function blinkAt(parent: HTMLElement, r: { x: number; y: number; w: number; h: number }) {
    const g = div('blink-glow');
    Object.assign(g.style, rectStyle(r));
    parent.appendChild(g);
    window.setTimeout(() => g.remove(), 700);
  }

  function clearTimers() {
    intervals.forEach(clearInterval);
    intervals = [];
    clearTimeout(idleTimer);
    clearTimeout(bubbleTimer);
    cancelAnimationFrame(raf);
  }

  buildScene();

  return {
    dispose() {
      disposed = true;
      clearTimers();
      window.removeEventListener('resize', layoutStage);
    },
    refresh() { updateHud(); },
  };
}

// ---------- 이펙트 스포너 ----------
function spawnClouds(layer: HTMLElement, count: number, clip?: { x: number; y: number; w: number; h: number }) {
  let host = layer;
  if (clip) {
    host = div('clip-region');
    Object.assign(host.style, rectStyle(clip));
    layer.appendChild(host);
  }
  for (let i = 0; i < count; i++) {
    const c = document.createElement('img');
    c.className = 'fx-cloud';
    c.alt = '';
    c.src = `${import.meta.env.BASE_URL}opt/fx/cloud-${(i % 4) + 1}.webp`;
    c.style.top = `${clip ? 10 + i * 28 : 8 + i * 7}%`;
    c.style.width = `${clip ? 42 : 16 + i * 4}%`;
    c.style.animationDuration = `${(clip ? 24 : 70) + i * 9}s`;
    c.style.animationDelay = `${-i * 13}s`;
    host.appendChild(c);
  }
}

function spawnRain(layer: HTMLElement, count: number) {
  const host = div('rain-layer');
  for (let i = 0; i < count; i++) {
    const drop = div('rain-line');
    drop.style.left = `${(i * 97) % 100}%`;
    drop.style.animationDuration = `${0.7 + ((i * 7) % 10) / 14}s`;
    drop.style.animationDelay = `${-((i * 13) % 20) / 10}s`;
    host.appendChild(drop);
  }
  layer.appendChild(host);
}

function spawnConfetti(layer: HTMLElement, count: number, once = false) {
  const colors = ['#f7c6d0', '#fde9a9', '#bcd9f2', '#cfe8d8'];
  const host = div(once ? 'confetti-burst' : 'confetti-loop');
  for (let i = 0; i < count; i++) {
    const p = div('confetti');
    p.style.left = `${(i * 61) % 100}%`;
    p.style.background = colors[i % colors.length];
    p.style.animationDuration = `${2.6 + ((i * 11) % 20) / 10}s`;
    p.style.animationDelay = once ? '0s' : `${-((i * 17) % 30) / 10}s`;
    host.appendChild(p);
  }
  layer.appendChild(host);
  if (once) window.setTimeout(() => host.remove(), 4000);
}

const div = (cls: string) => {
  const d = document.createElement('div');
  d.className = cls;
  return d;
};
const rectStyle = (r: { x: number; y: number; w: number; h: number }) => ({
  left: `${r.x}%`, top: `${r.y}%`, width: `${r.w}%`, height: `${r.h}%`,
});
