// src/engine/game.js
// ─────────────────────────────────────────────────────────────────────────
// 워리오웨어식 초고속 마이크로게임 컨트롤러 — "상태와 규칙"만(그리지 않는다).
//
// 상태기계:
//   READY(준비카드: 동사 프롬프트 + 1동작 지시, ~1s)
//    → PLAY(제한시간 내 입력 1동작)
//    → JUDGE(성공: 콤보+1·점수+ / 실패: 하트-1, ~0.6s 표정팝)
//      ├ 하트>0 → stage++ → 제한시간 단축 → 다음 게임 READY
//      └ 하트=0 → GAMEOVER(점수 정산 + "한 번 더!")
//
// 속도램프: limit = max(MIN, BASE − stage*STEP). 상단 제한시간 바가 줄어든다.
// 게임 순서: 첫 라운드 1→6 순차, 이후 라운드부터 셔플(재플레이성).
// reduced-motion: 제한시간 넉넉히(12s) + READY 짧게(0.3s) — 접근성 폴백.
//
// 역할 경계(단일 렌더러): game은 상태만, renderer가 game.micro.draw(ctx) 위임 + HUD.
// 입력 수렴: main이 키보드/터치/포인터를 setInput/setPointer로 모은다. update가
//   {tapped, hold, jump, left, right, pointer}로 정규화해 활성 마이크로게임에 넘긴다.
// 응원석: 클리어 누적(wins)에 따라 멤버가 늘어남(cheer 1→6) — main이 로스터 점등에 사용.
// ─────────────────────────────────────────────────────────────────────────

import { createMicro, MICRO_ORDER, MICRO_META, shuffle } from './minigames.js?v=28';

const STATE = { READY: 'ready', PLAY: 'play', JUDGE: 'judge', GAMEOVER: 'gameover', ENDING: 'ending' };

const READY_HOLD = 1.0;   // s, 준비카드 표시
const JUDGE_HOLD = 0.6;   // s, 표정 팝 연출
const BASE = 5.0;         // s, stage 0 제한시간
const MIN = 2.2;          // s, 제한시간 하한
const STEP = 0.25;        // s, stage당 단축
const START_HEARTS = 3;

export class Game {
  /** @param {{loader, sprite:(f)=>HTMLCanvasElement|null, bg:(f)=>HTMLImageElement|null}} kit */
  constructor(kit) {
    this.kit = kit;
    this.reducedMotion = () => false;
    // main이 구독하는 HUD/연출 훅(전부 옵셔널 — 엔진은 훅 없이도 동작).
    this.onHearts = null;   // (hearts)
    this.onScore = null;    // (score)
    this.onCombo = null;    // (combo)
    this.onCheer = null;    // (cheerMembers 1..6) 응원석 누적
    this.onJudge = null;    // (result, game) JUDGE 진입(판정 팝 연출) — hearts/combo 갱신 후 발화
    this.onReady = null;    // (micro) READY 진입(미션 배너 등)
    this.onState = null;    // (state)
    this.onGameOver = null; // ({score, best, stage})
    this.onEnding = null;   // ({score, best}) 6명 다 모음 = 데뷔 완성 엔딩(군무+폴라로이드)

    this.input = { left: false, right: false, jump: false };
    this.pointer = { x: 0, y: 0, down: false, justDown: false, justUp: false };
    this._jumpPrev = false;
    this.active = false;
    this.reset();
  }

  // 입력 수렴(main이 키보드/터치 버튼을 여기에 모은다).
  setInput(name, on) { if (name in this.input) this.input[name] = !!on; }
  setPointer(phase, x, y) {
    const p = this.pointer;
    if (x != null) { p.x = x; p.y = y; }
    if (phase === 'down') { p.down = true; p.justDown = true; }
    else if (phase === 'up') { p.down = false; p.justUp = true; }
  }

  start() { this.active = true; }

  // 처음으로 완전 리셋(하트/점수/콤보/응원석/순서). 첫 READY 준비.
  reset() {
    this.hearts = START_HEARTS;
    this.score = 0;
    this.combo = 0;
    this.bestCombo = 0;
    this.wins = 0;
    this.stage = 0;
    // 합류 = "그 멤버의 게임을 클리어하면 그 멤버 합류"(고정 순서 폐기). 도훈(C1) 시작.
    this.collected = new Set([1]);   // 합류한 멤버 번호 집합
    this.roster = [1];               // 합류 순서(응원석은 이 순서로 L→R 점등)
    this.cheer = 1;                  // = roster.length(응원석 칸 수)
    this.bonus = false;      // 우산 히든(umbrella) 클리어 여부 → 엔딩 보너스 vpose
    this.face = null;        // JUDGE 표정 팝 {file}
    this._lastResult = null;
    this.round = 0;
    this._gameCount = 0;     // 출제 스케줄(짝수 판=미합류 멤버 게임 우선 → ~10판 페이싱)
    this._lastKey = null;
    this.timeLimit = BASE;
    this.timeLeft = BASE;
    this._beginReady();
  }

  // 게임오버 후 재시작("한 번 더!").
  restart() { this.reset(); this.active = true; this._emit(); }

  // 다음 마이크로게임 키 — "미합류 멤버의 단독 게임"을 짝수 판마다 우선 출제(페이싱 ~10판),
  //   사이 판은 변주(전체 풀에서 랜덤, 직전 반복 회피 — 다인물/이미 합류 멤버 게임 포함).
  _nextKey() {
    const uncSolo = MICRO_ORDER.filter((k) => { const m = MICRO_META[k]; return m && !m.team && !this.collected.has(+m.slot.slice(1)); });
    let pool;
    if (this._gameCount % 2 === 0 && uncSolo.length) pool = uncSolo;            // 짝수 판: 미합류 멤버 게임 우선
    else pool = MICRO_ORDER.filter((k) => k !== this._lastKey);                  // 변주(직전 반복 회피)
    if (!pool.length) pool = [...MICRO_ORDER];
    const key = pool[(Math.random() * pool.length) | 0];
    this._lastKey = key; this._gameCount++;
    return key;
  }

  _curLimit() { return this.reducedMotion() ? 12 : Math.max(MIN, BASE - this.stage * STEP); }

  _beginReady() {
    this.state = STATE.READY;
    this._t = 0;
    this.face = null;
    this.joinedMember = 0;
    this.micro = createMicro(this._nextKey(), this.kit);
    this.micro.init(this.stage);
    // 표시용 잠정값 — 권위 있는 제한시간은 _beginPlay에서 재계산(생성자 reset 시점엔 main이
    // 아직 reducedMotion을 주입 안 해, 여기서 굳히면 첫 게임만 폴백값으로 새던 버그가 있었다).
    this.timeLimit = this._curLimit();
    this.timeLeft = this.timeLimit;
    if (this.onReady) this.onReady(this.micro);
    if (this.onState) this.onState(this.state);
  }

  _beginPlay() {
    this.state = STATE.PLAY;
    this._t = 0;
    // 플레이 진입 시점에 제한시간 확정 — 현재 reducedMotion + stage를 항상 반영(첫 게임 포함).
    this.timeLimit = this._curLimit();
    this.timeLeft = this.timeLimit;
    // READY 동안 눌린 입력이 즉시 탭으로 오인되지 않게 엣지 기준 맞춤.
    this._jumpPrev = this.input.jump;
    this.pointer.justDown = this.pointer.justUp = false;
    if (this.onState) this.onState(this.state);
  }

  _judge(result) {
    this.state = STATE.JUDGE;
    this._t = 0;
    this._lastResult = result;
    this.joinedMember = 0; // 이번 판정에 합류한 멤버 번호(>0이면 합류카드)
    if (result === 'win') {
      this.combo++;
      if (this.combo > this.bestCombo) this.bestCombo = this.combo;
      this.score += 100 * (1 + Math.floor(this.combo / 2)); // 콤보 보너스
      this.wins++;
      // 합류 매칭: 방금 클리어한 게임의 담당 멤버가 단독(team 아님)·미합류면 그 멤버가 합류.
      const n = this.micro && this.micro.slot ? +this.micro.slot.slice(1) : 0;
      if (n && this.micro && !this.micro.team && !this.collected.has(n)) {
        this.collected.add(n); this.roster.push(n); this.cheer = this.roster.length; this.joinedMember = n;
      }
      if (this.micro && this.micro.key === 'umbrella') this.bonus = true; // 우산 히든 클리어
    } else {
      this.hearts = Math.max(0, this.hearts - 1);
      this.combo = 0;
    }
    // 성공=laugh / 실패=surprised 표정 0.4~0.6s 팝(어설픔=정체성).
    // 그 게임의 주인공 멤버(micro.slot)가 반응 — 시그니처색 정체성과 일관.
    const mn = this.micro && this.micro.slot ? +this.micro.slot.slice(1) : this.cheer;
    this.face = { file: `C${mn}-expression-${result === 'win' ? 'laugh' : 'surprised'}.png` };
    this._emit();
    if (this.onJudge) this.onJudge(result, this); // hearts/combo 확정 후 — 판정 팝이 잃은 하트 인덱스를 읽음
    if (this.onState) this.onState(this.state);
  }

  _emit() {
    if (this.onHearts) this.onHearts(this.hearts);
    if (this.onScore) this.onScore(this.score);
    if (this.onCombo) this.onCombo(this.combo);
    if (this.onCheer) this.onCheer(this.cheer);
  }

  // main이 와이어링 후 1회 호출 — 초기 HUD/배너 동기화(생성자 reset 시엔 훅이 null).
  sync() { this._emit(); if (this.onReady) this.onReady(this.micro); if (this.onState) this.onState(this.state); }

  // 매 프레임(렌더러 rAF). dt(초)는 렌더러가 clamp.
  update(dt) {
    if (dt <= 0 || !this.active) return;
    this._t += dt;

    const tapped = (this.input.jump && !this._jumpPrev) || this.pointer.justDown;
    this._jumpPrev = this.input.jump;
    const input = {
      tapped,
      hold: this.input.jump || this.pointer.down,
      jump: this.input.jump,   // 시퀀스(따라하기)의 ↑ 방향 — raw 상태(미니게임이 자체 엣지 검출)
      left: this.input.left,
      right: this.input.right,
      pointer: this.pointer,
    };

    if (this.state === STATE.READY) {
      if (this._t >= (this.reducedMotion() ? 0.3 : READY_HOLD)) this._beginPlay();
    } else if (this.state === STATE.PLAY) {
      this.micro.update(dt, input);
      this.timeLeft -= dt;
      if (this.micro.done) this._judge(this.micro.result || 'win');
      else if (this.timeLeft <= 0) { this.micro.timeout?.(); this._judge(this.micro.result || 'lose'); }
    } else if (this.state === STATE.JUDGE) {
      if (this._t >= JUDGE_HOLD) {
        this.face = null;
        if (this.hearts <= 0) {
          this.state = STATE.GAMEOVER;
          if (this.onGameOver) this.onGameOver({ score: this.score, best: this.bestCombo, stage: this.stage });
          if (this.onState) this.onState(this.state);
        } else if (this.cheer >= 6) {
          // 6명 다 모음 = 데뷔 완성 엔딩(군무 + 폴라로이드). 게임 진행 멈추고 보상 화면.
          this.state = STATE.ENDING; this._t = 0;
          if (this.onEnding) this.onEnding({ score: this.score, best: this.bestCombo, bonus: this.bonus });
          if (this.onState) this.onState(this.state);
        } else { this.stage++; this._beginReady(); }
      }
    }
    // 포인터 엣지 소비(한 프레임만 유효).
    this.pointer.justDown = this.pointer.justUp = false;
  }
}
