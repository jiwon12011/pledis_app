// src/engine/motion.js
// ─────────────────────────────────────────────────────────────────────────
// GSAP 모션 — "DOM 트윈"이 아니라 Canvas 씬 값(fx)을 트윈한다(아키텍처 타협 불가).
//   GSAP가 fx의 scale/alpha/offset/dy 등을 0→1로 구동 → renderer가 매 프레임 fx를
//   읽어 HUD/오버레이를 그린다. 픽셀퍼펙트(정수 좌표)는 renderer가 Math.round로 유지.
//   예외: 게임오버 카드는 DOM(.go-inner)이라 GSAP DOM 트윈 OK(gameOver()).
//
// 연출: ① 판정 팝(성공 콤보팝/실패 하트소실+셰이크) ② 속도 가속감(READY 팝인+속도선)
//   ③ 응원석 입장(슬롯 도착 pop-in+바운스+반짝) ④ reduced-motion=즉시전환(트윈 생략).
//
// 위치/밴드 불변: fx는 "값"만 흔든다. 슬롯 중심/밴드 좌표는 renderer가 소유(여기선 안 옮김).
// ─────────────────────────────────────────────────────────────────────────

const SEAT_N = 6;

// 판정 카피(오리지널·짧게 — 원곡 가사/음원 금지). 성공/실패 풀에서 1회 픽.
const WIN_COPY = ['NICE!', 'GOOD!', 'COOL!', 'YES!', 'WOW!'];
const LOSE_COPY = ['OOPS!', 'MISS!', 'OUCH!', 'AWW...'];
const pick = (a) => a[(Math.random() * a.length) | 0];

// renderer가 motion 없이도 동작하도록 노출하는 중립값(애니 0). renderer가 fallback으로 씀.
export function neutralFx() {
  return {
    comboScale: 1, comboDY: 0, comboFlash: 0,   // 성공 콤보 숫자 팝
    judgeScale: 1, judgeCopy: '', judgeWin: true, // 판정 카피/표정 팝
    shakeX: 0, shakeY: 0, redFlash: 0,            // 실패 화면 셰이크/빨강 플래시
    heartBreakIndex: -1, heartBreak: 0,           // 실패 하트 소실(깨짐+낙하)
    readyScale: 1, readyAlpha: 1,                 // READY 카드 팝인
    whoosh: 0, whooshLines: 0,                    // 전환 속도선(가속 체감)
    seatScale: Array(SEAT_N).fill(1),             // 응원석 입장(스케일)
    seatDY: Array(SEAT_N).fill(0),                //          (낙하/바운스 offset)
    seatSpark: Array(SEAT_N).fill(0),             //          (입장 반짝 0→1)
  };
}

export class Motion {
  /** @param {{gsap?:object, reducedMotion?:()=>boolean}} opts */
  constructor({ gsap, reducedMotion } = {}) {
    this.gsap = gsap || (typeof window !== 'undefined' ? window.gsap : null);
    this.reduced = reducedMotion || (() => false);
    this.fx = neutralFx();
    this._prevCheer = null; // 누적 멤버 증가 "시점"만 입장연출(초기 동기화·재시작 제외)
  }

  _g() { return this.gsap; }

  // ── 상태 진입 ────────────────────────────────────────────────────
  onState(state, game) {
    if (state === 'ready') this._ready(game);
  }

  // READY 카드: 빠른 pop-in→hold(엔진 타이밍)→out + 전환 속도선(stage↑일수록 빠르고 촘촘).
  _ready(game) {
    const fx = this.fx, g = this._g();
    // 매 READY마다 직전 판정 잔상 정리(콤보/하트 깨짐 상태 리셋).
    fx.comboScale = 1; fx.comboDY = 0; fx.comboFlash = 0;
    fx.heartBreakIndex = -1; fx.heartBreak = 0;
    fx.shakeX = 0; fx.shakeY = 0; fx.redFlash = 0;
    if (this.reduced() || !g) {                    // 접근성: 즉시전환(팝/속도선 제거)
      fx.readyScale = 1; fx.readyAlpha = 1; fx.whoosh = 0; fx.whooshLines = 0;
      return;
    }
    g.killTweensOf(fx);
    fx.readyScale = 1.18; fx.readyAlpha = 0;
    g.to(fx, { readyScale: 1, duration: 0.22, ease: 'back.out(2.2)' });
    g.to(fx, { readyAlpha: 1, duration: 0.14 });
    const stage = game?.stage || 0;
    fx.whooshLines = Math.min(14, 5 + stage);      // 라인 수 = 속도감(단계 오를수록 더)
    fx.whoosh = 1;
    g.to(fx, { whoosh: 0, duration: Math.max(0.18, 0.4 - stage * 0.02), ease: 'power2.in' });
  }

  // ── 판정 팝(성공/실패, 0.6s 안) ──────────────────────────────────
  onJudge(result, game) {
    const fx = this.fx, g = this._g();
    fx.judgeWin = result === 'win';
    fx.judgeCopy = pick(result === 'win' ? WIN_COPY : LOSE_COPY);
    if (this.reduced() || !g) {                    // 접근성: 즉시전환(팝/셰이크/플래시 제거)
      fx.judgeScale = 1; fx.comboScale = 1; fx.comboDY = 0; fx.comboFlash = 0;
      fx.shakeX = 0; fx.shakeY = 0; fx.redFlash = 0;
      fx.heartBreakIndex = -1; fx.heartBreak = result === 'win' ? 0 : 1;
      return;
    }
    g.killTweensOf(fx);
    // 카피/표정 팝(공통).
    fx.judgeScale = 0.6;
    g.to(fx, { judgeScale: 1, duration: 0.28, ease: 'back.out(3)' });
    if (result === 'win') {
      // 성공: 콤보 숫자 팝(1→1.3→1) + 살짝 상승 + 민트 플래시.
      fx.comboScale = 1.3; fx.comboDY = -8; fx.comboFlash = 1;
      g.to(fx, { comboScale: 1, comboDY: 0, duration: 0.34, ease: 'back.out(2)' });
      g.to(fx, { comboFlash: 0, duration: 0.4, ease: 'power1.out' });
    } else {
      // 실패: 잃은 하트 = 방금 빈 칸 인덱스(0-based = 현재 hearts). 깨짐+낙하+빨강 플래시.
      fx.heartBreakIndex = game ? game.hearts : -1;
      fx.heartBreak = 0;
      g.to(fx, { heartBreak: 1, duration: 0.5, ease: 'power2.in' });
      fx.redFlash = 0.5;
      g.to(fx, { redFlash: 0, duration: 0.45, ease: 'power1.out' });
      this._shake(5); // 가벼운 화면 셰이크(정수 px·멀미 금지)
    }
  }

  // 화면 셰이크 — fx.shakeX/Y를 감쇠 흔들기. renderer가 Math.round로 정수 px 유지.
  _shake(amp) {
    const fx = this.fx, g = this._g();
    if (this.reduced() || !g) { fx.shakeX = 0; fx.shakeY = 0; return; }
    const o = { p: 0 };
    g.to(o, {
      p: 1, duration: 0.4, ease: 'none',
      onUpdate: () => { const k = (1 - o.p) * amp; fx.shakeX = (Math.random() * 2 - 1) * k; fx.shakeY = (Math.random() * 2 - 1) * k; },
      onComplete: () => { fx.shakeX = 0; fx.shakeY = 0; },
    });
  }

  // ── 응원석 멤버 입장 ─────────────────────────────────────────────
  // 누적(cheer)이 늘 때만 1회. 초기 동기화/재시작(감소·동일)은 애니 없이 베이스라인.
  onCheer(n) {
    if (this._prevCheer == null || n <= this._prevCheer) { this._prevCheer = n; this._resetSeats(); return; }
    for (let i = this._prevCheer; i < n; i++) this._seatEnter(i);
    this._prevCheer = n;
  }

  _resetSeats() {
    const fx = this.fx, g = this._g();
    if (g) { g.killTweensOf(fx.seatScale); g.killTweensOf(fx.seatDY); g.killTweensOf(fx.seatSpark); }
    for (let i = 0; i < SEAT_N; i++) { fx.seatScale[i] = 1; fx.seatDY[i] = 0; fx.seatSpark[i] = 0; }
  }

  // 슬롯 i 입장: 위에서 pop-in(scale 0→1) + 바운스 착지 + 반짝(확장 링 1→0).
  _seatEnter(i) {
    const fx = this.fx, g = this._g();
    if (this.reduced() || !g) { fx.seatScale[i] = 1; fx.seatDY[i] = 0; fx.seatSpark[i] = 0; return; }
    fx.seatScale[i] = 0; fx.seatDY[i] = -14; fx.seatSpark[i] = 1;
    g.to(fx.seatScale, { [i]: 1, duration: 0.42, ease: 'back.out(2.6)' });
    g.to(fx.seatDY, { [i]: 0, duration: 0.5, ease: 'bounce.out' });
    g.to(fx.seatSpark, { [i]: 0, duration: 0.55, ease: 'power1.out' });
  }

  // ── 게임오버 카드(DOM 트윈 허용 구간) ────────────────────────────
  gameOver(cardEl) {
    const g = this._g();
    if (!cardEl) return;
    const inner = cardEl.querySelector('.go-inner');
    if (this.reduced() || !g || !inner) return; // 접근성: 즉시 표시(트윈 생략)
    g.fromTo(inner, { scale: 0.82, opacity: 0, y: 16 }, { scale: 1, opacity: 1, y: 0, duration: 0.4, ease: 'back.out(1.8)' });
    const num = cardEl.querySelector('.go-score-num');
    if (num) g.fromTo(num, { scale: 0.4 }, { scale: 1, duration: 0.5, delay: 0.12, ease: 'back.out(3)' });
  }
}
