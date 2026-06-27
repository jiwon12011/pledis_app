// src/engine/renderer.js
// ─────────────────────────────────────────────────────────────────────────
// Canvas2D 단일 렌더러 — 앱 전체에서 유일한 그리기 경로(ADR).
//
// 워리오웨어식 마이크로게임 모드: 화면 본체는 활성 마이크로게임이 자기 화면을 전부
//   그린다(game.micro.draw(ctx) 위임 1줄). 렌더러는 그 위에 HUD(제한시간 바·하트·
//   점수·콤보·응원석) + 상태 오버레이(READY 카드 / JUDGE 표정 팝 / GAMEOVER 정산)만 얹는다.
//
// 흰선 근절: 캐릭터/표정은 전부 투명 PNG를 그대로 drawImage(통짜 흰배경 그리기 0).
//   perf가 74개 스프라이트 전부 투명 재가공 완료 → 키잉/추출 경로 불필요(제거).
//
// 핵심 원칙(유지): 백버퍼 360×640 고정, DPR 곱 금지, imageSmoothingEnabled=false,
//   모든 그리기 좌표 Math.round(서브픽셀 금지), requestAnimationFrame 단일 루프.
// ─────────────────────────────────────────────────────────────────────────

import { CANVAS, PALETTE, FONTS } from '../tokens.js?v=28';
import { neutralFx } from './motion.js?v=28';
import { MEMBER_COLORS, slotName, numName } from './members.js?v=28';

// motion 미주입 시 폴백(애니 0) — 렌더러 단독 동작 보장.
const NEUTRAL_FX = neutralFx();

export class Renderer {
  /**
   * @param {HTMLCanvasElement} canvas
   * @param {import('../loader.js').Loader} loader
   * @param {{debug?: boolean}} [opts]
   */
  constructor(canvas, loader, opts = {}) {
    this.canvas = canvas;
    this.loader = loader;
    this.debug = !!opts.debug;

    canvas.width = CANVAS.W;
    canvas.height = CANVAS.H;
    const ctx = canvas.getContext('2d', { alpha: false });
    ctx.imageSmoothingEnabled = false; // 픽셀 정합 — 절대 true 금지
    this.ctx = ctx;

    this.game = null; // main이 주입(상태만 들고, 그리기는 여기서)
    this.fx = null;   // main이 motion.fx 주입 — GSAP가 트윈하는 씬 값(없으면 NEUTRAL_FX)

    this.stats = { drawCalls: 0, fps: 0 };
    this._frames = 0;
    this._lastFpsT = 0;
    this._lastT = 0;
    this._rafId = 0;
    this._running = false;
  }

  start() {
    if (this._running) return;
    this._running = true;
    const loop = (t) => { if (!this._running) return; this._frame(t); this._rafId = requestAnimationFrame(loop); };
    this._rafId = requestAnimationFrame(loop);
  }

  stop() { this._running = false; cancelAnimationFrame(this._rafId); }

  _frame(t) {
    const ctx = this.ctx;
    this.stats.drawCalls = 0;
    const dt = this._lastT ? Math.min(0.05, (t - this._lastT) / 1000) : 0;
    this._lastT = t;

    ctx.fillStyle = PALETTE.black;
    ctx.fillRect(0, 0, CANVAS.W, CANVAS.H);
    this.stats.drawCalls++;

    if (this.game) { this.game.update(dt); this._drawGame(); }
    if (this.debug) this._drawStats(ctx);
    this._tickFps(t);
  }

  _tickFps(t) {
    this._frames++;
    if (t - this._lastFpsT >= 1000) { this.stats.fps = this._frames; this._frames = 0; this._lastFpsT = t; }
  }

  // ── 게임 그리기 ───────────────────────────────────────────────────
  _drawGame() {
    const ctx = this.ctx, g = this.game, fx = this.fx || NEUTRAL_FX;
    if (g.state === 'gameover') { this._drawGameOver(g); return; }
    if (g.state === 'ending') { this._drawEnding(g); return; }

    // 실패 화면 셰이크 — 게임+HUD 전체를 정수 px만큼 흔든다(픽셀퍼펙트 유지).
    const sx = Math.round(fx.shakeX || 0), sy = Math.round(fx.shakeY || 0);
    const shaking = sx !== 0 || sy !== 0;
    if (shaking) { ctx.save(); ctx.translate(sx, sy); }

    // 마이크로게임이 자기 화면 전부 그림(단일 렌더러 위임).
    if (g.micro && g.micro.draw) { g.micro.draw(ctx); this.stats.drawCalls++; }
    else { ctx.fillStyle = PALETTE.skyMid; ctx.fillRect(0, 0, CANVAS.W, CANVAS.H); this.stats.drawCalls++; }

    this._drawHud(g, fx);
    if (g.state === 'ready') this._drawReady(g, fx);
    if (g.state === 'judge') this._drawJudge(g, fx);

    if (shaking) ctx.restore();

    // 실패 빨강 플래시 — 셰이크와 무관하게 화면 전체(흔들리지 않게 restore 뒤).
    if (fx.redFlash > 0) {
      ctx.fillStyle = `rgba(255,48,48,${(fx.redFlash * 0.32).toFixed(3)})`;
      ctx.fillRect(0, 0, CANVAS.W, CANVAS.H); this.stats.drawCalls++;
    }
  }

  // 상단 HUD: 제한시간 바 + 하트×3 + 점수 + 콤보 + 응원석.
  _drawHud(g, fx = NEUTRAL_FX) {
    const ctx = this.ctx, W = CANVAS.W;
    // 제한시간 바(PLAY 중 줄어듦, 그 외엔 가득). 30% 미만이면 노을색 경고 + 맥동(긴박감 가속).
    const frac = g.state === 'play' ? Math.max(0, g.timeLeft / g.timeLimit) : 1;
    // 트랙을 더 어둡게: 흰색(C3)·밝은 시그니처 게이지가 밝은 배경 위에서도 대비 확보.
    ctx.fillStyle = 'rgba(16,22,38,.72)'; ctx.fillRect(0, 0, W, 8);
    // 시그니처색 틴트: 이 게임의 담당 멤버 색으로 제한시간 바를 채운다(30% 미만은 노을 경고).
    const sig = (g.micro && g.micro.color) || PALETTE.mint;
    const fillW = Math.round(W * frac);
    ctx.fillStyle = frac < 0.3 ? PALETTE.sunset : sig;
    ctx.fillRect(0, 0, fillW, 8);
    ctx.fillStyle = 'rgba(16,22,38,.5)'; ctx.fillRect(0, 7, fillW, 1); // 하단 1px 어두운 엣지(흰 게이지 윤곽)
    // 잔여 30% 미만: 흰 펄스를 덧입혀 깜빡(잔여 적을수록 빠르게). reduced면 펄스 제거.
    if (frac < 0.3 && !(g.reducedMotion && g.reducedMotion())) {
      const speed = 6 + (0.3 - frac) / 0.3 * 12;
      const pulse = 0.5 + 0.5 * Math.abs(Math.sin(performance.now() / 1000 * speed));
      ctx.fillStyle = `rgba(255,255,255,${(0.5 * pulse).toFixed(3)})`;
      ctx.fillRect(0, 0, Math.round(W * frac), 8);
    }

    // 하트×3(픽셀 하트 path). 실패 시 잃은 하트는 깨짐+낙하 연출(heartBreak 0→1).
    for (let i = 0; i < 3; i++) {
      if (i === fx.heartBreakIndex && fx.heartBreak < 1) {
        const p = fx.heartBreak;
        ctx.save();
        ctx.globalAlpha = 1 - p;
        this._heart(16 + i * 20, Math.round(16 + p * 14), Math.round(13 * (1 - p * 0.6)), '#ff3b3b');
        ctx.restore();
      } else {
        this._heart(16 + i * 20, 16, 13, i < g.hearts ? '#ff6b6b' : 'rgba(255,255,255,.22)');
      }
    }

    // 점수(우상단).
    ctx.fillStyle = PALETTE.cloud; ctx.textAlign = 'right'; ctx.textBaseline = 'top';
    ctx.font = `15px ${FONTS.pixelEn}`;
    ctx.fillText(String(g.score).padStart(5, '0'), W - 8, 16);

    // 콤보(중앙 x180,y18, 2 이상부터). 성공 판정 시 팝(scale 1→1.3→1 + 상승 + 민트 플래시).
    if (g.combo >= 2) {
      const cs = fx.comboScale || 1, cdy = fx.comboDY || 0;
      ctx.save();
      ctx.translate(W / 2, Math.round(18 + cdy));
      if (cs !== 1) ctx.scale(cs, cs);
      ctx.textAlign = 'center'; ctx.textBaseline = 'top'; ctx.font = `12px ${FONTS.pixelEn}`;
      ctx.fillStyle = fx.comboFlash > 0.5 ? PALETTE.mint : PALETTE.sunset;
      ctx.fillText(`COMBO x${g.combo}`, 0, 0);
      ctx.restore();
    }

    // ── 응원석: 누적 멤버(cheer)만큼 칸 점등(혼자→다 함께). 최대 6명. ──────────────
    // [정적 레이아웃 — motion 입장연출 부착 지점] 모두 정수좌표(픽셀퍼펙트).
    //   칸 크기 SEAT=14, 간격 SEAT_GAP=4(피치 18), 행 y=SEAT_Y=38(칸 y38~52).
    //   전체폭 total=104 → 좌상단 SEAT_X0=128(=round((360-104)/2)).
    //   슬롯 i(0~5) 좌상단 x = 128 + i*18  → 38,  중심 = (135+i*18, 45).
    //   슬롯 중심 x: [135,153,171,189,207,225], y=45 공통.
    const SEAT = 14, SEAT_GAP = 4, SEAT_Y = 38, SEAT_N = 6;
    const SEAT_X0 = Math.round((W - (SEAT_N * SEAT + (SEAT_N - 1) * SEAT_GAP)) / 2); // =128
    for (let i = 0; i < SEAT_N; i++) {
      const x = SEAT_X0 + i * (SEAT + SEAT_GAP), lit = i < g.cheer;
      if (!lit) { ctx.fillStyle = 'rgba(255,255,255,.14)'; ctx.fillRect(x, SEAT_Y, SEAT, SEAT); continue; }
      // 입장 트윈: 슬롯 중심 고정(135+i*18, 45) 기준 scale/dy로만 흔든다(밴드 불변).
      const sc = fx.seatScale[i] ?? 1, dy = fx.seatDY[i] ?? 0, spark = fx.seatSpark[i] ?? 0;
      const cx = x + SEAT / 2, cy = SEAT_Y + SEAT / 2 + dy;       // 안정 시 (135+i*18, 45)
      const half = (SEAT / 2) * sc;
      const bx = Math.round(cx - half), by = Math.round(cy - half), bw = Math.max(1, Math.round(half * 2));
      // 응원석은 "합류 순서(roster)"대로 점등 — 실제 모은 멤버의 시그니처색(고정 인덱스 아님).
      const mem = (g.roster && g.roster[i]) || (i + 1);
      ctx.fillStyle = MEMBER_COLORS[mem - 1];
      ctx.fillRect(bx, by, bw, bw);
      ctx.strokeStyle = PALETTE.white; ctx.lineWidth = 1; ctx.strokeRect(bx + 0.5, by + 0.5, bw - 1, bw - 1);
      if (spark > 0) { // 입장 반짝 — 중심 기준 확장 링이 퍼지며 페이드.
        const grow = Math.round((1 - spark) * 6);
        ctx.strokeStyle = `rgba(255,255,255,${spark.toFixed(3)})`;
        ctx.strokeRect(Math.round(cx) - half - grow + 0.5, Math.round(cy) - half - grow + 0.5, Math.round((half + grow) * 2) - 1, Math.round((half + grow) * 2) - 1);
      }
    }

    // 응원석 이름표 — 합류 멤버 칸 아래. 단일 소스(members.js).
    // 슬롯 피치 18px 안에 2글자 8px는 16px폭·Galmuri 원생(11px) 미만이라 흐릿/빽빽 → 이니셜 1글자 11px
    // (원생크기=또렷, 11px폭 < 18px피치=충돌없음). 색+이니셜로 글랜서블 식별, 전체 이름은 합류카드에 표기.
    ctx.textAlign = 'center'; ctx.textBaseline = 'top'; ctx.font = `11px ${FONTS.pixelKo}`;
    for (let i = 0; i < g.cheer && i < SEAT_N; i++) {
      const mem = (g.roster && g.roster[i]) || (i + 1); // 합류 순서대로 실제 멤버
      const nm = numName(mem); if (!nm) continue;
      const ini = nm[0];
      const cx = SEAT_X0 + i * (SEAT + SEAT_GAP) + SEAT / 2;
      ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillText(ini, cx + 1, SEAT_Y + SEAT + 4); // 1px 그림자(가독)
      ctx.fillStyle = MEMBER_COLORS[mem - 1] === '#FFFFFF' ? PALETTE.cloud : MEMBER_COLORS[mem - 1];
      ctx.fillText(ini, cx, SEAT_Y + SEAT + 3);
    }

    ctx.textAlign = 'start'; ctx.textBaseline = 'alphabetic';
    this.stats.drawCalls += 6;
  }

  _heart(x, y, s, color) {
    const ctx = this.ctx;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x, y + s * 0.3);
    ctx.bezierCurveTo(x, y, x - s * 0.5, y, x - s * 0.5, y + s * 0.3);
    ctx.bezierCurveTo(x - s * 0.5, y + s * 0.55, x, y + s * 0.8, x, y + s);
    ctx.bezierCurveTo(x, y + s * 0.8, x + s * 0.5, y + s * 0.55, x + s * 0.5, y + s * 0.3);
    ctx.bezierCurveTo(x + s * 0.5, y, x, y, x, y + s * 0.3);
    ctx.closePath(); ctx.fill();
  }

  // READY 준비카드: 딤 + (전환 속도선) + 게임 제목/동사 프롬프트(크게)/1동작 지시 — 빠른 pop-in.
  _drawReady(g, fx = NEUTRAL_FX) {
    const ctx = this.ctx, W = CANVAS.W, H = CANVAS.H, m = g.micro;
    ctx.fillStyle = 'rgba(20,28,46,.8)'; ctx.fillRect(0, 0, W, H);

    // 전환 속도선(가속 체감) — whoosh 1→0 동안 가로 스트릭이 뻗으며 페이드. stage↑일수록 촘촘/빠름.
    if (fx.whoosh > 0) {
      const n = Math.max(1, fx.whooshLines | 0), a = fx.whoosh * 0.45;
      ctx.fillStyle = `rgba(127,255,212,${a.toFixed(3)})`; // 민트 스트릭
      const len = Math.round(40 + (1 - fx.whoosh) * (W - 40));
      for (let i = 0; i < n; i++) {
        const yy = Math.round((i + 0.5) / n * H);
        ctx.fillRect(W - len, yy, len, 2);
      }
      this.stats.drawCalls++;
    }

    const a = fx.readyAlpha ?? 1, sc = fx.readyScale ?? 1;
    ctx.save();
    ctx.globalAlpha = a;
    ctx.translate(W / 2, H / 2);
    if (sc !== 1) ctx.scale(sc, sc);
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    // 제목/순간/밑줄 = 담당 멤버 시그니처색(팬게임 정체성). 흰색(C3=경민)도 실제 흰색을 쓰되
    // 1px 어두운 그림자/외곽선을 받쳐 dim·밝은 배경/표정 위에서 묻히지 않게(흰색 정체성 유지+가독).
    const sig = m.color || PALETTE.cloud;
    const sigSh = 'rgba(10,14,22,.85)'; // 시그니처 텍스트/밑줄 대비용 어두운 받침
    // P3 담당 멤버 표시("지금 누구의 한 컷") — 단일 소스 이름. 다인물=다 함께.
    const who = m.team ? '다 함께' : slotName(m.slot);
    if (who) {
      ctx.font = `12px ${FONTS.pixelKo}`;
      ctx.fillStyle = sigSh; ctx.fillText(`${who}의 순간`, 1, -103);
      ctx.fillStyle = sig;   ctx.fillText(`${who}의 순간`, 0, -104);
    }
    ctx.font = `13px ${FONTS.pixelKo}`;
    ctx.fillStyle = sigSh; ctx.fillText(m.title, 1, -77);
    ctx.fillStyle = sig;   ctx.fillText(m.title, 0, -78);
    ctx.fillStyle = PALETTE.sunset; ctx.font = `44px ${FONTS.pixelKo}`;
    ctx.fillText(m.prompt, 0, 0);
    // 동사 프롬프트 아래 시그니처색 밑줄 — 1px 어두운 테두리로 흰색도 보이게.
    ctx.fillStyle = sigSh; ctx.fillRect(-41, 26, 82, 5);
    ctx.fillStyle = sig;   ctx.fillRect(-40, 27, 80, 3);
    ctx.fillStyle = PALETTE.mint; ctx.font = `15px ${FONTS.pixelKo}`;
    ctx.fillText(m.hint, 0, 66);
    ctx.restore();
    ctx.textAlign = 'start'; ctx.textBaseline = 'alphabetic';
    this.stats.drawCalls += 4;
  }

  // JUDGE 표정 팝(투명 PNG 직접) + 오리지널 카피 — 어설픔=정체성. judgeScale로 팝(0.6→1).
  _drawJudge(g, fx = NEUTRAL_FX) {
    const ctx = this.ctx, W = CANVAS.W, H = CANVAS.H, win = g._lastResult === 'win';
    const js = fx.judgeScale ?? 1;
    if (g.face) {
      const img = this.loader.char(g.face.file);
      if (img && img.width) {
        const s = Math.round(130 * js);
        // 표정팝을 위로 올려(−64) 하단 게이지(y460)·라벨밴드(y500)·동작 스프라이트와 겹침 분리.
        ctx.drawImage(img, Math.round(W / 2 - s / 2), Math.round(H / 2 - s / 2 - 64), s, s);
        this.stats.drawCalls++;
      }
    }
    const copy = fx.judgeCopy || (win ? 'NICE!' : 'MISS!');
    ctx.save();
    ctx.translate(W / 2, H / 2 + 36); // 표정팝 아래로 따라 올림(겹침 분리, 게이지밴드 위 유지)
    if (js !== 1) ctx.scale(js, js);
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = `30px ${FONTS.pixelEn}`;
    ctx.fillStyle = 'rgba(10,14,22,.8)'; ctx.fillText(copy, 2, 2); // 그림자(밝은 동작 위 가독)
    ctx.fillStyle = win ? PALETTE.mint : '#ff6b6b'; ctx.fillText(copy, 0, 0);
    ctx.restore();

    // P1 합류 카드: 이번 승리로 새 멤버가 합류했으면 "○○ 합류!" + 시그니처색 띠(0.6s 판정창 내).
    const jm = g.joinedMember;
    if (jm) {
      const nm = numName(jm), col = MEMBER_COLORS[jm - 1];
      ctx.save();
      ctx.translate(W / 2, H / 2 + 80); // 합류카드도 함께 올림(judge 스택 위로 분리, 게이지밴드 위)
      if (js !== 1) ctx.scale(js, js);
      ctx.fillStyle = col; ctx.fillRect(-70, -15, 140, 30);
      ctx.fillStyle = col === '#FFFFFF' ? PALETTE.navy : PALETTE.white;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = `15px ${FONTS.pixelKo}`;
      ctx.fillText(nm ? `${nm} 합류!` : '멤버 합류!', 0, 0);
      ctx.restore();
      this.stats.drawCalls++;
    }
    ctx.textAlign = 'start'; ctx.textBaseline = 'alphabetic';
    this.stats.drawCalls++;
  }

  // GAMEOVER 정산(점수·최고콤보). "한 번 더!" 버튼은 DOM 오버레이가 담당(접근성).
  _drawGameOver(g) {
    const ctx = this.ctx, W = CANVAS.W, H = CANVAS.H;
    ctx.fillStyle = PALETTE.navy; ctx.fillRect(0, 0, W, H);
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = PALETTE.sunset; ctx.font = `30px ${FONTS.pixelEn}`;
    ctx.fillText('GAME OVER', W / 2, H / 2 - 96);
    ctx.fillStyle = PALETTE.cloud; ctx.font = `15px ${FONTS.pixelEn}`;
    ctx.fillText('SCORE', W / 2, H / 2 - 36);
    ctx.fillStyle = PALETTE.white; ctx.font = `40px ${FONTS.pixelEn}`;
    ctx.fillText(String(g.score), W / 2, H / 2 + 6);
    ctx.fillStyle = PALETTE.mint; ctx.font = `13px ${FONTS.pixelKo}`;
    ctx.fillText(`최고 콤보 ${g.bestCombo}`, W / 2, H / 2 + 48);
    ctx.textAlign = 'start'; ctx.textBaseline = 'alphabetic';
    this.stats.drawCalls += 4;
  }

  // ENDING(데뷔 완성): 6명 군무 + vpose 단체 + 시그니처색 색종이 + ONE TEAM.
  //   폴라로이드(main)가 이 프레임의 [y120~480] 사각을 캡처 → 텍스트는 그 밖(상/하단)에 둬 깨끗한 사진.
  _drawEnding(g) {
    const ctx = this.ctx, W = CANVAS.W, H = CANVAS.H, t = this._lastT / 1000;
    const grd = ctx.createLinearGradient(0, 0, 0, H);
    grd.addColorStop(0, '#FF8C42'); grd.addColorStop(1, PALETTE.navy);
    ctx.fillStyle = grd; ctx.fillRect(0, 0, W, H);
    // 시그니처색 색종이(정수좌표, 천천히 낙하).
    for (let i = 0; i < 24; i++) {
      ctx.fillStyle = MEMBER_COLORS[i % 6];
      const x = Math.round((i * 67) % W), y = Math.round((t * 36 + i * 53) % (H + 40)) - 20;
      ctx.fillRect(x, y, 4, 4);
    }
    // vpose 단체(중앙 상단, 캡처 사각 안).
    const vp = this.loader.char('scene-21-vpose-bonus.png');
    if (vp && vp.width) { const s = 150; ctx.drawImage(vp, Math.round(W / 2 - s / 2), 150, s, s); this.stats.drawCalls++; }
    // 6명 군무(한 줄, 엇박 bob — 캡처 사각 안).
    const n = 6, sz = 50, gap = Math.round((W - n * sz) / (n + 1));
    for (let i = 1; i <= n; i++) {
      const img = this.loader.char(`C${i}-dance.png`);
      if (!img || !img.width) continue;
      const left = gap + (i - 1) * (sz + gap), bob = Math.round(3 * Math.sin(t * 6 + i));
      ctx.drawImage(img, left, Math.round(372) - bob, sz, sz); this.stats.drawCalls++;
    }
    // ONE TEAM(오리지널) — 캡처 사각(120~480) 밖 하단에.
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = PALETTE.cloud; ctx.font = `26px ${FONTS.pixelEn}`;
    ctx.fillText('ONE TEAM', W / 2, 540);
    ctx.fillStyle = PALETTE.mint; ctx.font = `12px ${FONTS.pixelKo}`;
    ctx.fillText('여섯이 모여, 오늘 우리가 됐다', W / 2, 572);
    ctx.textAlign = 'start'; ctx.textBaseline = 'alphabetic';
    this.stats.drawCalls += 3;
  }

  _drawStats(ctx) {
    ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillRect(2, 60, 120, 26);
    ctx.fillStyle = PALETTE.mint; ctx.font = `8px ${FONTS.pixelEn}`;
    ctx.fillText(`fps ${this.stats.fps}`, 6, 70);
    ctx.fillText(`draw ${this.stats.drawCalls}  st ${this.game?.state || '-'}`, 6, 81);
    this.stats.drawCalls += 3;
  }
}
