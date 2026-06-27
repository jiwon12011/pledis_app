// src/engine/minigames.js
// ─────────────────────────────────────────────────────────────────────────
// 워리오웨어식 초고속 마이크로게임 — 18게임. 입력 장르가 겹치지 않게 설계.
//   1 연타 / 2 단발탭 / 3 스와이프↑ / 4 타이밍탭 / 5 좌우이동 / 6 홀드릴리스
//   7 연속탭 / 8 타이밍탭(초단창) / 9 드래그↑×6 / 10 레인회피 / 11 시퀀스 / 12 받쳐(lean큐)
//   13 양자택일탭 / 14 길게굴리기드래그 / 15 ↓슬라이드 / 16 동시두곳탭 / 17 페이스유지탭 / 18 가로밑줄스와이프
// 합성타입(콜라주 방지): V(가구박힘=배경금지·_bgFlat) 1·8·16·18 / C(인물만+배경+그림자) 2~6·14·15·17 / M(다인물) 13.
//
// 플러그인 계약(renderer 무수정 확장 — game.micro.draw(ctx) 위임):
//   { title, prompt, hint, init(stage), update(dt, input), draw(ctx), get done(), get result() }
//   input = { tapped, hold, jump, left, right, pointer:{x,y,down,justDown,justUp} }
//     (tapped=점프상승엣지|포인터justDown, hold=점프|포인터down, jump/left/right=raw 상태)
//
// 합성/배치 규칙(designer 교정값):
//   · 접지 그림자(_shadow)를 스프라이트 그리기 전에 → 떠 보임 제거.
//   · 인게임 지시문은 _label(배경판+1px그림자) 표준 y=500(하단 게임패드 위)로 통일(겹침방지·가독성).
//   · 세로 실내: cover-fit 중앙~하단. 가로 1137: cover-fit + cropBias로 주인공 중앙.
//     탑뷰 360×360: cover 금지 → navy 레터박스 + 1:1(y140~500).
//   · HUD 안전영역 y<60 침범 금지(상단 제한시간바·하트·점수·콤보·응원석 전용).
// 흰선 근절: 캐릭터/동작/표정은 투명 PNG를 kit.sprite로 그대로 그린다(키잉/흰배경 0).
// ─────────────────────────────────────────────────────────────────────────

import { PALETTE, FONTS } from '../tokens.js?v=28';
import { MEMBER_COLORS, slotColor } from './members.js?v=28';

const W = 360, H = 640;
const HUD_SAFE_BOTTOM = 60;   // y<60 = HUD 전용(침범 금지)
const INDOOR_FLOOR_Y = 600;   // 실내 바닥선
// 지시문 표준 위치: 하단 터치 게임패드 "위"에 둔다(겹침 방지).
// 패드 좌표(캔버스 360×640 기준, index.html .gamepad 측정): 이동패드 y562~622,
// 점프패드 y534~622. → 라벨 배경판 하단이 패드 top(534)에 안 닿도록 center y=500(배경판 489~511).
const LABEL_Y = 500;
const LABEL_MAXW = W - 24;    // 라벨 배경판 최대폭(좌우 12px 여백) — 화면 밖/패드 침범 방지
// 멤버 시그니처 색은 members.js(SSOT)에서 import — 응원석/토큰 공용.
const SEQ_SYM = { left: '←', right: '→', jump: '↑' };

const clampN = (v, a, b) => (v < a ? a : v > b ? b : v);
const shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; };

// ── 공통 베이스: 결과 상태 + 합성 헬퍼(6게임+새게임 자동 적용) ──────────────
class Micro {
  // kit = { loader, sprite(file)->img, bg(file)->img }
  constructor(kit) { this.kit = kit; this.t = 0; this._done = false; this._res = null; }
  get done() { return this._done; }
  get result() { return this._res; }
  _win() { if (!this._done) { this._done = true; this._res = 'win'; } }
  _lose() { if (!this._done) { this._done = true; this._res = 'lose'; } }
  timeout() { this._lose(); } // 기본: 제한시간 초과 = 실패(액션형은 자체 _win으로 선결)

  init() {} update() {} draw() {}

  // 세로 실내/가로 공통: cover-fit + cropBias(가로 1137에서 주인공을 캔버스 중앙으로).
  _bg(ctx, file, cropBias = 0) {
    const img = this.kit.bg(file);
    if (img && img.width) {
      const s = Math.max(W / img.width, H / img.height);
      const dw = Math.round(img.width * s), dh = Math.round(img.height * s);
      ctx.drawImage(img, Math.round((W - dw) / 2 + cropBias), Math.round((H - dh) / 2), dw, dh);
    } else { ctx.fillStyle = PALETTE.skyMid; ctx.fillRect(0, 0, W, H); }
  }

  // V타입(비네트) 전용: 가구·창틀이 스프라이트에 이미 박힌 통컷 → 방 배경 금지.
  // 중립 세로 그라데만 깔고 스프라이트를 주피사체로 키워 "한 컷 일러스트"로(콜라주 방지).
  _bgFlat(ctx, top, bottom) {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, top); g.addColorStop(1, bottom);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  }

  // 탑뷰 360×360: cover 금지 → navy 레터박스 + 1:1 블릿(y140~500), 라벨은 하단 띠.
  _bgTopview(ctx, file) {
    ctx.fillStyle = PALETTE.navy; ctx.fillRect(0, 0, W, H);
    const img = this.kit.bg(file);
    if (img && img.width) ctx.drawImage(img, 0, 140, 360, 360);
  }

  // 캐릭터/동작: 투명 PNG 중심정렬(흰배경 근절). 미로드면 스킵(견고).
  // facing<0이면 수평 반전(진행 방향 바라보기) — 픽셀 정합 유지(좌표 Math.round, 스무딩 off는 전역).
  _spr(ctx, file, cx, cy, scale = 1, facing = 1) {
    const cv = this.kit.sprite(file);
    if (!cv || !cv.width) return;
    const w = Math.round(cv.width * scale), h = Math.round(cv.height * scale);
    const left = Math.round(cx - w / 2), top = Math.round(cy - h / 2);
    if (facing < 0) { ctx.save(); ctx.translate(left + w, top); ctx.scale(-1, 1); ctx.drawImage(cv, 0, 0, w, h); ctx.restore(); }
    else ctx.drawImage(cv, left, top, w, h);
  }

  // 발밑 접지 타원 그림자 — 스프라이트 그리기 "전에" 호출(떠 보임 제거).
  _shadow(ctx, x, footY, w) {
    ctx.fillStyle = 'rgba(15,20,30,.28)';
    ctx.beginPath();
    ctx.ellipse(Math.round(x), footY, Math.round(w * 0.40), 9, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // 지시문: 배경판(rgba(20,28,46,.55)) + 1px 그림자 + 본문. center, 표준 y=500(패드 위).
  _label(ctx, text, y = LABEL_Y, color) {
    ctx.font = `12px ${FONTS.pixelKo}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const tw = Math.ceil(ctx.measureText(text).width);
    const pw = Math.min(tw + 16, LABEL_MAXW), ph = 22;  // 배경판 폭 클램프(패드/화면밖 침범 방지)
    ctx.fillStyle = 'rgba(20,28,46,.55)';
    ctx.fillRect(Math.round((W - pw) / 2), Math.round(y - ph / 2), pw, ph);
    ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillText(text, W / 2 + 1, y + 1);
    ctx.fillStyle = color || PALETTE.cloud; ctx.fillText(text, W / 2, y);
    ctx.textAlign = 'start'; ctx.textBaseline = 'alphabetic';
  }

  _gauge(ctx, x, y, w, h, frac, color) {
    ctx.fillStyle = 'rgba(255,255,255,.18)'; ctx.fillRect(x, y, w, h);
    ctx.fillStyle = color || PALETTE.sunset; ctx.fillRect(x, y, Math.round(w * clampN(frac, 0, 1)), h);
  }

  // ── 타이밍 예고 링(윈드업→히트 윈도우) ────────────────────────────────────
  // 단발 타이밍탭(wink·gaze)에서 "언제 누를지"를 미리 보이게 한다.
  //   approach 0→1: 외곽 노을 링이 표적 반경(R)까지 수축 — 1에 도달=히트 시작(예고).
  //   active=true(히트 윈도우): 밝은 번쩍 + 맥동 링 + 십자 반짝("지금!").
  //   reduced=true: 애니 대신 정적 표적 링 + 카운트다운 숫자(3·2·1), 히트 시 정적 채움(접근성).
  _aimRing(ctx, cx, cy, approach, active, reduced, R = 28) {
    cx = Math.round(cx); cy = Math.round(cy);
    ctx.save();
    if (active) {
      const pulse = reduced ? 1 : 0.6 + 0.4 * Math.abs(Math.sin(this.t * 22));
      ctx.fillStyle = `rgba(127,255,212,${(0.3 * pulse).toFixed(3)})`;
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fill();
      ctx.lineWidth = 3; ctx.strokeStyle = PALETTE.cloud;
      const rr = Math.round(R + (reduced ? 0 : pulse * 5));
      ctx.beginPath(); ctx.arc(cx, cy, rr, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = PALETTE.cloud; // 십자 반짝(히트 강조)
      ctx.fillRect(cx - 1, cy - R - 9, 2, 6); ctx.fillRect(cx - 1, cy + R + 3, 2, 6);
      ctx.fillRect(cx - R - 9, cy - 1, 6, 2); ctx.fillRect(cx + R + 3, cy - 1, 6, 2);
    } else if (approach > 0 && approach < 1) {
      const a = clampN(approach, 0, 1);
      ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(255,255,255,.32)'; // 표적 링(어디를 볼지 고정)
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.stroke();
      if (reduced) {
        const n = Math.max(1, Math.ceil((1 - a) * 3)); // 정적 카운트다운(한 박자씩)
        ctx.fillStyle = PALETTE.sunset; ctx.font = `20px ${FONTS.pixelEn}`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(String(n), cx, cy);
      } else {
        const rr = Math.round(R + (1 - a) * 64); // 64→0 수축(1에서 표적에 안착)
        ctx.lineWidth = 3; ctx.strokeStyle = PALETTE.sunset;
        ctx.beginPath(); ctx.arc(cx, cy, rr, 0, Math.PI * 2); ctx.stroke();
      }
    }
    ctx.restore();
    ctx.textAlign = 'start'; ctx.textBaseline = 'alphabetic';
  }

  // ── 스와이프-업 예고(tie) ────────────────────────────────────────────────
  // "위로 올려"를 분명히: 위로 흐르는 3겹 셰브론(점멸 고조). reduced면 정적 셰브론 스택.
  _swipeUpCue(ctx, cx, baseY, reduced) {
    cx = Math.round(cx);
    for (let i = 0; i < 3; i++) {
      let oy, alpha;
      if (reduced) { oy = -i * 15; alpha = 1 - i * 0.3; }
      else { const ph = (this.t * 1.8 + i * 0.34) % 1; oy = -Math.round(ph * 46); alpha = Math.sin(ph * Math.PI); }
      const y = Math.round(baseY + oy);
      ctx.globalAlpha = clampN(alpha, 0, 1);
      ctx.strokeStyle = PALETTE.sunset; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(cx - 16, y + 12); ctx.lineTo(cx, y - 4); ctx.lineTo(cx + 16, y + 12); ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }
}

// ① 알람과의 전쟁 · "꺼!" — 연타.
class MashAlarm extends Micro {
  init(stage) { this.need = 8 + Math.min(8, stage); this.taps = 0; this.shake = 0; }
  update(dt, input) {
    this.t += dt; if (this.shake > 0) this.shake -= dt;
    if (input.tapped) { this.taps++; this.shake = 0.12; if (this.taps >= this.need) this._win(); }
  }
  draw(ctx) {
    // V타입: scene-03 방 배경 금지(가구가 스프라이트에 이미 박힘) → 중립 그라데 + 스프라이트 확대.
    this._bgFlat(ctx, '#243049', '#10131f');
    const jx = W / 2 + (this.shake > 0 ? (Math.random() * 2 - 1) * 6 : 0);
    // scale 1.5, 책상(콘텐츠) 바닥을 캔버스 y≈615에 앵커(허공에 안 뜨게). 콘텐츠 botPad 48px 반영.
    this._spr(ctx, 'scene-03-C1-alarm-swat.png', jx, 478, 1.5);
    // 스프라이트가 하단을 채우므로 게이지/라벨은 상단 빈 영역(y200~260)으로.
    this._gauge(ctx, (W - 220) / 2, 210, 220, 14, this.taps / this.need, PALETTE.sunset);
    this._label(ctx, `연타! ${this.taps} / ${this.need}`, 252);
  }
}

// ② 거울 속의 나 · "탭!" — 단발 타이밍 탭.
class TapWink extends Micro {
  init(stage) { this.lo = 0.7 + Math.random() * 0.8; this.dur = Math.max(0.3, 0.6 - stage * 0.02); }
  get _active() { return this.t >= this.lo && this.t <= this.lo + this.dur; }
  update(dt, input) { this.t += dt; if (input.tapped) { this._active ? this._win() : this._lose(); } }
  draw(ctx) {
    this._bg(ctx, 'scene-04-bg.png');
    this._spr(ctx, 'scene-04-C1-brush-wink.png', W / 2, 310, 0.95);
    // 윈드업 예고: lo 직전 0.9s 동안 링이 수축 → 히트 순간(반짝)을 미리 알린다.
    const reduced = this.kit.reduced && this.kit.reduced();
    const approach = (this.t - (this.lo - 0.9)) / 0.9;
    this._aimRing(ctx, W / 2 + 40, 246, approach, this._active, reduced, 30);
    if (this._active) this._label(ctx, '지금 탭!', LABEL_Y, PALETTE.mint);
    else if (this.t < this.lo) this._label(ctx, reduced ? '카운트다운 0에 탭!' : '신호가 모이면 탭!');
    else this._label(ctx, '반짝일 때 탭!');
  }
}

// ③ 완벽한 넥타이 · "올려!" — 위로 스와이프(키보드 JUMP).
const TIES = ['scene-06-C1-tie-attempt1.png', 'scene-06-C1-tie-attempt2.png', 'scene-06-C1-tie-giveup.png'];
class TieSwipe extends Micro {
  init() { this.n = 0; this.fromY = null; }
  update(dt, input) {
    this.t += dt; const p = input.pointer;
    if (p.justDown) this.fromY = p.y;
    if (p.justUp && this.fromY != null) { (this.fromY - p.y > 40) ? this._win() : (this.n = Math.min(2, this.n + 1)); this.fromY = null; }
    if (input.tapped) this._win();
  }
  draw(ctx) {
    this._bg(ctx, 'scene-06-bg.png');
    this._spr(ctx, TIES[this.n], W / 2, 300, 0.95);
    // "지금 위로!" — 위로 흐르는 셰브론으로 스와이프 방향·타이밍을 분명히(콜투액션 고조).
    const reduced = this.kit.reduced && this.kit.reduced();
    this._swipeUpCue(ctx, W / 2, 178, reduced);
    const col = reduced ? PALETTE.cloud : (Math.sin(this.t * 6) > 0 ? PALETTE.sunset : PALETTE.mint);
    this._label(ctx, reduced ? '위로 올려!' : '지금 위로 올려!', LABEL_Y, col);
  }
}

// ④ 굴러온 농구공 · "맞춰!" — 타이밍탭.
class BasketTiming extends Micro {
  init(stage) {
    this.pos = 0; this.dir = 1; this.speed = 1.05 + stage * 0.04;
    const zw = Math.max(0.16, 0.28 - stage * 0.01); this.zlo = 0.5 - zw / 2; this.zhi = 0.5 + zw / 2;
  }
  update(dt, input) {
    this.t += dt; this.pos += this.dir * this.speed * dt;
    if (this.pos >= 1) { this.pos = 1; this.dir = -1; } else if (this.pos <= 0) { this.pos = 0; this.dir = 1; }
    if (input.tapped) { (this.pos >= this.zlo && this.pos <= this.zhi) ? this._win() : this._lose(); }
  }
  draw(ctx) {
    this._bg(ctx, 'scene-12-bg.png');
    this._spr(ctx, 'scene-12-basketball-pickup.png', W / 2, 322, 1); // 하단 빈 바닥 메움
    const bw = 240, bh = 16, bx = (W - bw) / 2, by = 460;
    ctx.fillStyle = 'rgba(255,255,255,.18)'; ctx.fillRect(bx, by, bw, bh);
    ctx.fillStyle = PALETTE.sunset; ctx.fillRect(Math.round(bx + this.zlo * bw), by, Math.round((this.zhi - this.zlo) * bw), bh);
    const mx = Math.round(bx + this.pos * bw);
    ctx.fillStyle = PALETTE.white; ctx.fillRect(mx - 2, by - 6, 4, bh + 12);
    this._label(ctx, '림에 맞춰 탭!');
  }
}

// ⑤ 천장이 샌다 · "피해!" — 좌우 이동. (designer 최우선 합성 교정: scale 1.4 + 접지 그림자)
class DodgeDrops extends Micro {
  init(stage) {
    this.x = W / 2; this.dodged = 0; this.need = 3; this.drops = []; this.spawned = 0;
    this.fall = 210 + stage * 8; this.gap = Math.max(0.45, 0.7 - stage * 0.02); this.spawnT = 0.25;
    this.face = 1; // 마지막 이동 방향(스프라이트 수평 플립)
  }
  update(dt, input) {
    this.t += dt; const sp = 250;
    if (input.left) { this.x -= sp * dt; this.face = -1; }
    if (input.right) { this.x += sp * dt; this.face = 1; }
    if (input.pointer.down) { const tx = input.pointer.x; if (tx < this.x - 2) this.face = -1; else if (tx > this.x + 2) this.face = 1; this.x += clampN(tx - this.x, -sp * dt, sp * dt); }
    this.x = clampN(this.x, 44, W - 44);
    this.spawnT -= dt;
    if (this.spawned < this.need && this.spawnT <= 0) { this.drops.push({ x: 60 + Math.random() * (W - 120), y: 110 }); this.spawned++; this.spawnT = this.gap; }
    for (const d of this.drops) {
      if (d.done) continue; d.y += this.fall * dt;
      if (d.y >= 545) { // 캐릭터 몸통 밴드(scale 1.4 → 발 600)
        if (Math.abs(d.x - this.x) < 46) { this._lose(); return; }
        d.done = true; this.dodged++; if (this.dodged >= this.need) this._win();
      }
    }
  }
  draw(ctx) {
    this._bg(ctx, 'scene-16-bg.png');
    this._shadow(ctx, this.x, INDOOR_FLOOR_Y, 126);
    // C1-runpose scale 1.4, footY=600 → cy = 600 - (120*1.4)/2 = 516. 진행 방향으로 수평 플립.
    this._spr(ctx, 'C1-runpose.png', this.x, 516, 1.4, this.face);
    for (const d of this.drops) {
      if (d.done) continue;
      ctx.fillStyle = PALETTE.courtBlue;
      ctx.beginPath(); ctx.ellipse(Math.round(d.x), Math.round(d.y), 9, 13, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.7)'; // 1px 하이라이트
      ctx.fillRect(Math.round(d.x) - 2, Math.round(d.y) - 6, 1, 3);
    }
    this._label(ctx, `피해! ${this.dodged} / ${this.need}`);
  }
}

// ⑥ 높이 뛰면 보인다 · "모아서!" — 홀드→릴리스.
class ChargeJump extends Micro {
  init(stage) {
    this.charge = 0; this.released = false; this.rate = 0.92;
    const zc = 0.82, zw = Math.max(0.1, 0.2 - stage * 0.006); this.zlo = zc - zw / 2; this.zhi = zc + zw / 2;
  }
  update(dt, input) {
    this.t += dt; if (this.released) return;
    if (input.hold) {
      this.charge += this.rate * dt;
      if (this.charge >= 1.12) { this.charge = 1.12; this.released = true; this._lose(); }
    } else if (this.charge > 0.05) {
      this.released = true;
      (this.charge >= this.zlo && this.charge <= this.zhi) ? this._win() : this._lose();
    }
  }
  draw(ctx) {
    this._bg(ctx, 'scene-10-bg.png', 0);
    const jy = 430 - Math.round(clampN(this.charge, 0, 1) * 130);
    this._spr(ctx, 'scene-10-jump-rooftop.png', W / 2, jy, 1);
    const gx = 304, gy = 180, gh = 260, gw = 18;
    ctx.fillStyle = 'rgba(255,255,255,.18)'; ctx.fillRect(gx, gy, gw, gh);
    ctx.fillStyle = PALETTE.mint; ctx.fillRect(gx, Math.round(gy + gh * (1 - this.zhi)), gw, Math.round(gh * (this.zhi - this.zlo)));
    const fh = Math.round(gh * clampN(this.charge, 0, 1));
    ctx.fillStyle = PALETTE.sunset; ctx.fillRect(gx, gy + gh - fh, gw, fh);
    this._label(ctx, '꾹 눌렀다 정점에서 떼!');
  }
}

// ⑦ 작은 세계 · "다 잡아!" — 연속탭. 다이어리 위 미니 6인을 시간 내 전부 탭.
class MiniCatch extends Micro {
  init() {
    this.targets = [];
    for (let i = 0; i < 6; i++) this.targets.push({ x: 60 + Math.random() * (W - 120), y: 140 + Math.random() * 330, hit: false, m: i + 1 });
    this.got = 0; this.r = 30;
  }
  update(dt, input) {
    this.t += dt; const p = input.pointer;
    if (p.justDown) {
      let best = null, bd = this.r * this.r;
      for (const t of this.targets) { if (t.hit) continue; const d = (t.x - p.x) ** 2 + (t.y - p.y) ** 2; if (d <= bd) { bd = d; best = t; } }
      if (best) { best.hit = true; this.got++; if (this.got >= this.targets.length) this._win(); }
    }
  }
  draw(ctx) {
    this._bg(ctx, 'scene-05-bg.png');
    for (const t of this.targets) { if (t.hit) continue; this._shadow(ctx, t.x, t.y + 20, 44); this._spr(ctx, `C${t.m}-expression-neutral.png`, t.x, t.y, 0.4); }
    this._label(ctx, `다 잡아! ${this.got} / 6`);
  }
}

// ⑧ 0.3초 · "지금!" — 초단 창 타이밍탭(버스창 너머 눈 마주침).
class BusGaze extends Micro {
  init() { this.lo = 0.6 + Math.random() * 0.9; this.dur = 0.3; }
  get _active() { return this.t >= this.lo && this.t <= this.lo + this.dur; }
  update(dt, input) { this.t += dt; if (input.tapped) { this._active ? this._win() : this._lose(); } }
  draw(ctx) {
    // V타입: scene-11 버스 실내 금지(창틀이 이미 "바깥 보는 창") → 주광 하늘 그라데 + 창틀 확대.
    this._bgFlat(ctx, '#a9d4ef', '#dceef7');
    // scale 1.25, 창틀(콘텐츠) 바닥을 y≈560에 앵커. 인물·창틀이 한 컷으로.
    this._spr(ctx, 'scene-11-bus-window.png', W / 2, 475, 1.25);
    // 0.3s 초단창 — 무예고면 못 맞힌다. 눈 위치로 수축하는 링으로 "지금"을 예고.
    const reduced = this.kit.reduced && this.kit.reduced();
    const approach = (this.t - (this.lo - 0.9)) / 0.9;
    if (this._active) {
      ctx.fillStyle = PALETTE.sunset;
      for (const sx of [-26, 26]) { ctx.beginPath(); ctx.arc(W / 2 + sx, 405, 6, 0, Math.PI * 2); ctx.fill(); }
    }
    this._aimRing(ctx, W / 2, 405, approach, this._active, reduced, 34);
    if (this._active) this._label(ctx, '지금 탭!', LABEL_Y, PALETTE.mint);
    else if (this.t < this.lo) this._label(ctx, reduced ? '카운트다운 0에 탭!' : '눈이 마주칠 때 탭!');
    else this._label(ctx, '눈 마주치면 탭!');
  }
}

// ⑨ 여섯 개의 우산 · "펴!" — 위로 드래그 6회(원형 우산). 다 펴면 폭죽+vpose.
class UmbrellaOpen extends Micro {
  init() {
    this.open = 0; this.need = 6; this.fromY = null; this.spots = [];
    for (let i = 0; i < 6; i++) { const a = -Math.PI / 2 + i * Math.PI / 3; this.spots.push({ x: 180 + Math.cos(a) * 95, y: 320 + Math.sin(a) * 95, c: MEMBER_COLORS[i] }); }
  }
  _openOne() { if (this.open < this.need) { this.open++; if (this.open >= this.need) this._win(); } }
  update(dt, input) {
    this.t += dt; const p = input.pointer;
    if (p.justDown) this.fromY = p.y;
    if (p.justUp && this.fromY != null) { if (this.fromY - p.y > 30) this._openOne(); this.fromY = null; }
    if (input.tapped) this._openOne();
  }
  draw(ctx) {
    this._bgTopview(ctx, 'scene-18-bg-topview.png');
    if (this._done && this._res === 'win') {
      this._spr(ctx, 'scene-21-vpose-bonus.png', W / 2, 320, 0.9);
      ctx.fillStyle = PALETTE.cloud;
      for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; ctx.fillRect(Math.round(W / 2 + Math.cos(a) * 72 - 2), Math.round(320 + Math.sin(a) * 72 - 2), 4, 4); }
    } else {
      for (let i = 0; i < 6; i++) {
        const s = this.spots[i], o = i < this.open;
        ctx.fillStyle = o ? s.c : 'rgba(255,255,255,.16)';
        ctx.beginPath(); ctx.arc(Math.round(s.x), Math.round(s.y), o ? 26 : 16, 0, Math.PI * 2); ctx.fill();
        if (o) { ctx.strokeStyle = PALETTE.white; ctx.lineWidth = 1; ctx.stroke(); }
      }
    }
    this._label(ctx, `펴! ${this.open} / ${this.need}`);
  }
}

// ⑩ 페달을 밟아 · "피해!" — 위/아래 레인 전환(좌/우 스와이프·←→). 회피5와 구조 공유.
class PedalDodge extends Micro {
  init(stage) {
    this.lane = 0; this.dodged = 0; this.need = 3; this.obs = []; this.spawned = 0; this.spawnT = 0.3;
    this.speed = 260 + stage * 12; this.gap = Math.max(0.5, 0.85 - stage * 0.02);
    this._pl = false; this._pr = false; this._sx = null; this.px = 110; this.laneY = [470, 545];
  }
  update(dt, input) {
    this.t += dt;
    if (input.left && !this._pl) this.lane = 0;
    if (input.right && !this._pr) this.lane = 1;
    this._pl = input.left; this._pr = input.right;
    const p = input.pointer;
    if (p.justDown) this._sx = p.x;
    if (p.justUp && this._sx != null) { const dx = p.x - this._sx; if (dx < -25) this.lane = 0; else if (dx > 25) this.lane = 1; this._sx = null; }
    this.spawnT -= dt;
    if (this.spawned < this.need && this.spawnT <= 0) { this.obs.push({ x: W + 20, lane: Math.random() < 0.5 ? 0 : 1 }); this.spawned++; this.spawnT = this.gap; }
    for (const o of this.obs) {
      if (o.done) continue; o.x -= this.speed * dt;
      if (o.x <= this.px) { if (o.lane === this.lane) { this._lose(); return; } o.done = true; this.dodged++; if (this.dodged >= this.need) this._win(); }
    }
  }
  draw(ctx) {
    this._bg(ctx, 'scene-07-bg.png', 260); // cropBias: 좌측 바닥이 보이게(주인공 좌측 1/3)
    const cy = this.laneY[this.lane];
    this._shadow(ctx, this.px, cy + 56, 96);
    this._spr(ctx, 'C2-cycling.png', this.px, cy, 1.15);
    ctx.fillStyle = PALETTE.sunset;
    for (const o of this.obs) { if (o.done) continue; const oy = this.laneY[o.lane]; ctx.fillRect(Math.round(o.x - 12), Math.round(oy - 14), 24, 40); }
    this._label(ctx, `피해! ${this.dodged} / ${this.need}  (위/아래)`);
  }
}

// ⑪ 다 함께 · "따라 해!" — 방향 시퀀스(←→↑). 머리 위 화살표 순서대로 입력.
class CopyDance extends Micro {
  init(stage) {
    const len = 3 + Math.min(2, Math.floor(stage / 3));
    const opts = ['left', 'right', 'jump']; this.seq = [];
    for (let i = 0; i < len; i++) this.seq.push(opts[(Math.random() * 3) | 0]);
    this.idx = 0; this._pl = false; this._pr = false; this._pj = false;
  }
  update(dt, input) {
    this.t += dt; const edges = [];
    if (input.left && !this._pl) edges.push('left');
    if (input.right && !this._pr) edges.push('right');
    if (input.jump && !this._pj) edges.push('jump');
    this._pl = input.left; this._pr = input.right; this._pj = input.jump;
    for (const e of edges) {
      if (e === this.seq[this.idx]) { this.idx++; if (this.idx >= this.seq.length) this._win(); }
      else { this._lose(); return; }
    }
  }
  draw(ctx) {
    this._bg(ctx, 'scene-20-bg.png', 0);
    for (let i = 0; i < 6; i++) { const x = 40 + i * 56; this._shadow(ctx, x, 560, 46); this._spr(ctx, `C${i + 1}-dance.png`, x, 520, 0.5); }
    ctx.font = `24px ${FONTS.pixelEn}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (let i = 0; i < this.seq.length; i++) {
      const x = W / 2 + (i - (this.seq.length - 1) / 2) * 36;
      ctx.fillStyle = i < this.idx ? PALETTE.mint : (i === this.idx ? PALETTE.sunset : PALETTE.cloud);
      ctx.fillText(SEQ_SYM[this.seq[i]], x, 300);
    }
    ctx.textAlign = 'start'; ctx.textBaseline = 'alphabetic';
    this._label(ctx, '화살표 순서대로!');
  }
}

// ⑫ 동그라미 · "받쳐!" — 멤버별 lean + 머리 위 화살표 큐 + 도미노(추상 막대 폐기, 재설계).
//   랜덤 1명이 랜덤 방향으로 기울기 시작(0.8s 화살표 예고) → 기우는 쪽 탭하면 똑바로(laugh 팝) →
//   다음 멤버. 3명 받치면 클리어. 놓치면 옆으로 쓰러지며 인접 2명 흔들(surprised) 0.6s 후 재시도.
class BalanceCatch extends Micro {
  init(stage) {
    this.members = [];
    for (let i = 0; i < 6; i++) { const a = -Math.PI / 2 + i * Math.PI / 3; this.members.push({ x: 180 + Math.cos(a) * 92, y: 320 + Math.sin(a) * 92, lean: 0, dir: 0 }); }
    this.need = 3; this.saved = 0;
    this.leanRate = 0.7 + stage * 0.05;  // 기울기 속도 stage 가속
    this.cue = 0.8;                       // 머리 위 화살표 예고(s)
    this.active = -1; this.phase = 'cue'; this.phaseT = 0; this.flash = null;
    this._pl = false; this._pr = false;
    this._pick();
  }
  _pick() { this.active = (Math.random() * 6) | 0; const m = this.members[this.active]; m.lean = 0; m.dir = Math.random() < 0.5 ? -1 : 1; this.phase = 'cue'; this.phaseT = this.cue; }
  _fail() { this.phase = 'domino'; this.phaseT = 0.6; } // 인접 2명 연쇄 흔들(슬랩스틱)→재시도(게임오버 아님, 시간은 흐름)
  update(dt, input) {
    this.t += dt;
    if (this.flash && (this.flash.t -= dt) <= 0) this.flash = null;
    const lt = input.left && !this._pl, rt = input.right && !this._pr;
    this._pl = input.left; this._pr = input.right;
    const m = this.members[this.active];
    if (this.phase === 'domino') { this.phaseT -= dt; if (this.phaseT <= 0) { m.lean = 0; this._pick(); } return; }
    if (this.phase === 'cue') { this.phaseT -= dt; if (this.phaseT <= 0) this.phase = 'lean'; }
    else if (this.phase === 'lean') { m.lean += m.dir * this.leanRate * dt; if (Math.abs(m.lean) >= 1) { this._fail(); return; } }
    // 기우는 쪽으로 탭하면 받침(laugh 팝)→다음. 반대 탭=흔들 가중.
    const want = m.dir < 0 ? lt : rt, wrong = m.dir < 0 ? rt : lt;
    if (want) { this.flash = { idx: this.active, t: 0.4 }; this.saved++; (this.saved >= this.need) ? this._win() : this._pick(); }
    else if (wrong) { m.lean += m.dir * 0.18; if (Math.abs(m.lean) >= 1) this._fail(); }
  }
  draw(ctx) {
    this._bgTopview(ctx, 'scene-15-bg-topview.png');
    const adj = [(this.active + 5) % 6, (this.active + 1) % 6];
    for (let i = 0; i < 6; i++) {
      const m = this.members[i]; let ox = 0, oy = 0, mood = 'neutral';
      if (i === this.active) { ox = Math.round(m.lean * 8); oy = Math.round(Math.abs(m.lean) * 4); if (this.phase === 'domino') mood = 'surprised'; }
      else if (this.phase === 'domino' && adj.includes(i)) { ox = Math.round((Math.random() * 2 - 1) * 3); mood = 'surprised'; }
      if (this.flash && this.flash.idx === i) mood = 'laugh';
      this._spr(ctx, `C${i + 1}-expression-${mood}.png`, m.x + ox, m.y + oy, 0.42);
    }
    // 화살표는 기우는 당사자 머리 위에만(전역 라벨/막대 제거 — 당사자가 곧 그림).
    if (this.active >= 0 && this.phase !== 'domino') {
      const m = this.members[this.active];
      ctx.fillStyle = PALETTE.sunset; ctx.font = `22px ${FONTS.pixelEn}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(m.dir < 0 ? '←' : '→', m.x, m.y - 38);
      ctx.textAlign = 'start'; ctx.textBaseline = 'alphabetic';
    }
    ctx.fillStyle = PALETTE.cloud; ctx.font = `12px ${FONTS.pixelKo}`; ctx.textAlign = 'center';
    ctx.fillText(`받쳐! ${this.saved} / ${this.need}`, W / 2, 120); ctx.textAlign = 'start';
  }
}

// ⑬ 군중 속의 너 · "찾아 탭!" — 양자택일 탭(M). 웃는 우리 멤버(3)만 탭, 모르는 학생(neutral)=실패.
class CrowdFind extends Micro {
  init() {
    const pos = []; for (let r = 0; r < 2; r++) for (let c = 0; c < 3; c++) pos.push({ x: 80 + c * 100, y: 250 + r * 150 });
    const ids = shuffle([1, 2, 3, 4, 5, 6]);
    this.faces = pos.map((p, i) => ({ x: p.x, y: p.y, member: i < 3, id: ids[i], hit: false }));
    shuffle(this.faces);
    this.got = 0; this.need = 3; this.r = 40;
  }
  update(dt, input) {
    this.t += dt; const p = input.pointer;
    if (p.justDown) {
      const f = this.faces.find((f) => !f.hit && Math.abs(f.x - p.x) < this.r && Math.abs(f.y - p.y) < this.r);
      if (f) { if (f.member) { f.hit = true; this.got++; if (this.got >= this.need) this._win(); } else this._lose(); }
    }
  }
  draw(ctx) {
    this._bg(ctx, 'scene-14-bg.png');
    for (const f of this.faces) {
      if (f.member) {
        this._spr(ctx, `C${f.id}-expression-laugh.png`, f.x, f.y, 0.6);
        if (f.hit) { ctx.strokeStyle = PALETTE.mint; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(f.x, f.y, 30, 0, Math.PI * 2); ctx.stroke(); }
      } else { ctx.globalAlpha = 0.6; this._spr(ctx, `C${f.id}-expression-neutral.png`, f.x, f.y, 0.55); ctx.globalAlpha = 1; }
    }
    this._label(ctx, `찾아 탭! ${this.got} / ${this.need}`);
  }
}

// ⑭ 굴러온 공 · "끝까지!" — 길게 굴리기 드래그(C). 공을 오른쪽 끝 존까지 굴려라(놓으면 감속복귀).
class RollToEnd extends Micro {
  init() { this.ball = { x: 74, y: 432 }; this.goalX = 312; this.dragging = false; }
  update(dt, input) {
    this.t += dt; const p = input.pointer, b = this.ball;
    if (p.justDown && Math.abs(p.x - b.x) < 44 && Math.abs(p.y - b.y) < 44) this.dragging = true;
    if (this.dragging && p.down) b.x = clampN(p.x, 50, 332);
    if (p.justUp) this.dragging = false;
    if (b.x >= this.goalX) { this._win(); return; }
    if (!this.dragging && b.x > 74) { b.x -= 130 * dt; if (b.x < 74) b.x = 74; } // 감속 복귀
  }
  draw(ctx) {
    this._bg(ctx, 'scene-12-bg.png');
    this._spr(ctx, 'scene-12-basketball-pickup.png', 92, 322, 0.85);
    ctx.fillStyle = 'rgba(127,255,212,.25)'; ctx.fillRect(this.goalX - 4, 392, 52, 84); // 골 존
    this._shadow(ctx, this.ball.x, 470, 40);
    ctx.fillStyle = PALETTE.sunset; ctx.beginPath(); ctx.arc(Math.round(this.ball.x), Math.round(this.ball.y), 16, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = PALETTE.white; ctx.lineWidth = 2; ctx.stroke();
    this._label(ctx, '오른쪽 끝까지 굴려!');
  }
}

// ⑮ 복도를 달려 · "미끄러져!" — ↓ 스와이프 슬라이드(C). 낮은 장애물 아래로 미끄러져 통과.
class SlideUnder extends Micro {
  init(stage) {
    this.obs = []; this.spawned = 0; this.need = 3; this.passed = 0; this.spawnT = 0.4;
    this.speed = 300 + stage * 14; this.gap = Math.max(0.55, 0.9 - stage * 0.02); this.slideT = 0; this.px = 120; this._sy = null;
  }
  update(dt, input) {
    this.t += dt; if (this.slideT > 0) this.slideT -= dt;
    const p = input.pointer;
    if (p.justDown) this._sy = p.y;
    if (p.justUp && this._sy != null) { if (p.y - this._sy > 34) this.slideT = 0.45; this._sy = null; }
    if (input.tapped) this.slideT = 0.45; // 키보드(JUMP=슬라이드) 접근성
    this.spawnT -= dt;
    if (this.spawned < this.need && this.spawnT <= 0) { this.obs.push({ x: W + 20 }); this.spawned++; this.spawnT = this.gap; }
    for (const o of this.obs) {
      if (o.done) continue; o.x -= this.speed * dt;
      if (o.x <= this.px) { if (this.slideT > 0) { o.done = true; this.passed++; if (this.passed >= this.need) this._win(); } else { this._lose(); return; } }
    }
  }
  draw(ctx) {
    this._bg(ctx, 'scene-08-bg.png', 180);
    const sliding = this.slideT > 0;
    this._shadow(ctx, this.px, 600, sliding ? 120 : 90);
    this._spr(ctx, sliding ? 'scene-08-sliding-skid.png' : 'scene-08-running-sprint.png', this.px, sliding ? 560 : 520, 1.1);
    ctx.fillStyle = PALETTE.sunset; // 낮은 장애물(매달린 바)
    for (const o of this.obs) { if (o.done) continue; ctx.fillRect(Math.round(o.x - 16), 470, 32, 46); }
    this._label(ctx, `미끄러져! ${this.passed} / ${this.need}`);
  }
}

// ⑯ 문 앞에서 · "동시에!" — 두 곳 동시 탭(V, 문 통컷). 양쪽 손잡이를 ←+→ 동시(±0.2s).
class DoorBoth extends Micro {
  // tol 0.4s — 단일터치 폴백: 좌→우(또는 우→좌) 핸들을 빠르게 두 번 탭해도 클리어.
  // (키보드/패드 ←+→ 동시는 즉시 win, 멀티터치 두 손가락도 동시 입력 → 즉시.)
  init() { this.tol = 0.4; this.lT = null; this.rT = null; this._pl = false; this._pr = false; }
  _check() { if (this.lT != null && this.rT != null && Math.abs(this.lT - this.rT) <= this.tol) this._win(); }
  update(dt, input) {
    this.t += dt;
    if (input.left && input.right) { this._win(); return; } // 둘 다 눌림(게임패드/키보드)
    const lt = input.left && !this._pl, rt = input.right && !this._pr;
    this._pl = input.left; this._pr = input.right;
    if (lt) this.lT = this.t; if (rt) this.rT = this.t;
    const p = input.pointer;
    if (p.justDown) { if (p.x < W / 2) this.lT = this.t; else this.rT = this.t; } // 양쪽 손잡이 탭
    this._check();
  }
  draw(ctx) {
    this._bgFlat(ctx, '#cfe2f2', '#9bb8d6');
    this._spr(ctx, 'scene-09-door-grab.png', W / 2, 470, 1.25); // 두 인물+문 통컷(V)
    const pulse = 0.4 + 0.4 * Math.abs(Math.sin(this.t * 6));
    ctx.fillStyle = `rgba(255,140,66,${pulse.toFixed(2)})`; // 양쪽 손잡이 강조
    ctx.beginPath(); ctx.arc(150, 470, 9, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(210, 470, 9, 0, Math.PI * 2); ctx.fill();
    this._label(ctx, '양쪽 손잡이 동시에!');
  }
}

// ⑰ 노을을 달려 · "페이스 유지!" — 일정 간격 탭(C). 박자 맞춰 페달, 빠르/느리면 휘청.
class PaceRide extends Micro {
  init(stage) {
    this.beat = Math.max(0.42, 0.62 - stage * 0.01); this.tol = 0.16; this.next = this.beat;
    this.good = 0; this.bad = 0; this.need = 5; this.maxBad = 2; this.wobble = 0;
  }
  update(dt, input) {
    this.t += dt; if (this.wobble > 0) this.wobble -= dt;
    if (input.tapped) {
      if (Math.abs(this.t - this.next) <= this.tol) { this.good++; this.next = this.t + this.beat; if (this.good >= this.need) this._win(); }
      else { this.bad++; this.wobble = 0.3; this.next = this.t + this.beat; if (this.bad > this.maxBad) this._lose(); }
    }
    if (this.t > this.next + this.tol) { this.bad++; this.wobble = 0.3; this.next = this.t + this.beat; if (this.bad > this.maxBad) this._lose(); } // 놓침
  }
  draw(ctx) {
    this._bg(ctx, 'scene-19-bg.png', 0);
    const wob = this.wobble > 0 ? Math.round((Math.random() * 2 - 1) * 4) : 0;
    this._shadow(ctx, W / 2 + wob, 600, 110);
    this._spr(ctx, 'scene-19-sunset-cycling.png', W / 2 + wob, 470, 1.0);
    const toBeat = clampN(1 - (this.next - this.t) / this.beat, 0, 1);
    ctx.strokeStyle = PALETTE.sunset; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(W / 2, 150, Math.round(8 + (1 - toBeat) * 30), 0, Math.PI * 2); ctx.stroke();
    if (Math.abs(this.t - this.next) < this.tol) { ctx.fillStyle = PALETTE.mint; ctx.beginPath(); ctx.arc(W / 2, 150, 8, 0, Math.PI * 2); ctx.fill(); }
    this._label(ctx, `페이스 유지! ${this.good} / ${this.need}`);
  }
}

// ⑱ 완벽한 계획서 · "밑줄 쫙!" — 가로 긋기 스와이프(V, 배경 없음). 항목마다 →로 밑줄.
class Underline extends Micro {
  init() { this.need = 4; this.done_ = 0; this._sx = null; this.lines = []; for (let i = 0; i < this.need; i++) this.lines.push({ y: 150 + i * 42, drawn: false }); }
  _mark() { if (this.done_ < this.need) { this.lines[this.done_].drawn = true; this.done_++; if (this.done_ >= this.need) this._win(); } }
  update(dt, input) {
    this.t += dt; const p = input.pointer;
    if (p.justDown) this._sx = p.x;
    if (p.justUp && this._sx != null) { if (p.x - this._sx > 40) this._mark(); this._sx = null; }
    if (input.tapped) this._mark(); // 키보드 접근성
  }
  draw(ctx) {
    this._bgFlat(ctx, '#fdf6e3', '#e8dcc0'); // 종이/계획표 톤
    for (let i = 0; i < this.need; i++) {
      const ln = this.lines[i], y = ln.y;
      ctx.fillStyle = 'rgba(28,40,65,.5)'; ctx.fillRect(70, y - 2, 180, 4);
      if (ln.drawn) { ctx.strokeStyle = PALETTE.sunset; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(70, y + 11); ctx.lineTo(250, y + 11); ctx.stroke(); }
      else if (i === this.done_) { ctx.fillStyle = PALETTE.mint; ctx.fillText('→', 262, y + 4); } // 다음 항목 표시
    }
    this._spr(ctx, 'scene-01-C1-planning.png', W / 2, 470, 0.7);
    this._label(ctx, `밑줄 쫙! ${this.done_} / ${this.need}`);
  }
}

// ── 레지스트리(첫 라운드 순차 1→18, 이후 셔플). 메타 = 오리지널 카피. ──────────
// slot = 그 게임이 내세우는 멤버 슬롯(C1~C6) → 시그니처색 틴트 + 판정 표정 주인공.
//   (지금은 색/표정만 사용. 이름은 members.js 매핑 확정 후.)  C1=주인공(아침/계획 루틴).
const SPECS = {
  alarm:     { slot: 'C1', title: '알람과의 전쟁',     prompt: '꺼!',    hint: '마구 연타!',       make: (k) => new MashAlarm(k) },
  wink:      { slot: 'C1', title: '거울 속의 나',       prompt: '탭!',    hint: '반짝일 때 한 번',   make: (k) => new TapWink(k) },
  tie:       { slot: 'C1', title: '완벽한 넥타이',     prompt: '올려!',  hint: '위로 스와이프',     make: (k) => new TieSwipe(k) },
  hoop:      { slot: 'C4', title: '굴러온 농구공',     prompt: '맞춰!',  hint: '림에서 타이밍 탭',   make: (k) => new BasketTiming(k) },
  leak:      { slot: 'C5', title: '천장이 샌다',       prompt: '피해!',  hint: '좌우로 움직여',     make: (k) => new DodgeDrops(k) },
  charge:    { slot: 'C3', title: '높이 뛰면 보인다',   prompt: '모아서!', hint: '꾹→정점에 떼',    make: (k) => new ChargeJump(k) },
  catch:     { slot: 'C2', title: '작은 세계',         prompt: '다 잡아!', hint: '미니를 전부 탭',   make: (k) => new MiniCatch(k) },
  gaze:      { slot: 'C2', title: '0.3초',             prompt: '지금!',  hint: '눈 마주치면 탭',   make: (k) => new BusGaze(k) },
  umbrella:  { slot: 'C6', title: '여섯 개의 우산',     prompt: '펴!',    hint: '위로 스와이프 ×6',  make: (k) => new UmbrellaOpen(k) },
  pedal:     { slot: 'C2', title: '페달을 밟아',       prompt: '피해!',  hint: '위/아래로 피해',   make: (k) => new PedalDodge(k) },
  copy:      { slot: 'C4', title: '다 함께',           prompt: '따라 해!', hint: '화살표 순서대로',  make: (k) => new CopyDance(k) },
  balance:   { slot: 'C5', title: '동그라미',          prompt: '받쳐!',  hint: '기우는 쪽 탭',      make: (k) => new BalanceCatch(k) },
  crowd:     { slot: 'C5', title: '군중 속의 너',       prompt: '찾아 탭!', hint: '웃는 멤버만',     make: (k) => new CrowdFind(k) },
  roll:      { slot: 'C4', title: '굴러온 공',         prompt: '끝까지!', hint: '오른쪽 끝까지 굴려', make: (k) => new RollToEnd(k) },
  slide:     { slot: 'C3', title: '복도를 달려',       prompt: '미끄러져!', hint: '아래로 스와이프', make: (k) => new SlideUnder(k) },
  door:      { slot: 'C2', title: '문 앞에서',         prompt: '동시에!', hint: '양쪽 손잡이 동시', make: (k) => new DoorBoth(k) },
  pace:      { slot: 'C6', title: '노을을 달려',       prompt: '페이스!', hint: '일정 박자로 탭',   make: (k) => new PaceRide(k) },
  underline: { slot: 'C1', title: '완벽한 계획서',     prompt: '밑줄 쫙!', hint: '→로 긋기',        make: (k) => new Underline(k) },
};

export const MICRO_ORDER = Object.freeze(['alarm', 'wink', 'tie', 'hoop', 'leak', 'charge', 'catch', 'gaze', 'umbrella', 'pedal', 'copy', 'balance', 'crowd', 'roll', 'slide', 'door', 'pace', 'underline']);
export const MICRO_KEYS = MICRO_ORDER;
export { shuffle };

// 다인물 게임 — 담당 멤버 한 명이 아니라 "다 함께"로 표기.
const MULTI = new Set(['crowd', 'door', 'copy', 'umbrella', 'balance']);

// 키 → {slot, team} 메타(게임 진행 스케줄러가 "미합류 멤버 게임 우선 출제"에 사용).
export const MICRO_META = Object.freeze(Object.fromEntries(
  MICRO_ORDER.map((k) => [k, { slot: SPECS[k].slot, team: MULTI.has(k) }]),
));

/** key + kit → 마이크로게임 인스턴스(메타 주입). 미등록 key는 alarm으로 안전 폴백. */
export function createMicro(key, kit) {
  const s = SPECS[key] || SPECS.alarm;
  const m = s.make(kit);
  m.key = key; m.title = s.title; m.prompt = s.prompt; m.hint = s.hint;
  m.slot = s.slot || 'C1'; m.color = slotColor(m.slot); // 시그니처색 틴트(렌더러가 읽음)
  m.team = MULTI.has(key);                                // true=다인물("다 함께")
  return m;
}
