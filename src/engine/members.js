// src/engine/members.js
// ─────────────────────────────────────────────────────────────────────────
// 멤버 단일 소스 테이블(SSOT) — TWS 팬게임 정체성의 데이터 축.
//   slot  : 스프라이트/표정 파일 접두(C1~C6) — 에셋 매핑 키.
//   color : 시그니처색(카드·게이지·응원석·판정 틴트) — 16색 팔레트 내.
//   name  : 멤버 실명 — 사용자 매핑 확정 시 채움(지금은 null, 미표시).
//   nick  : 별명/캐치프레이즈 — 합류카드·이름표(P1/P3)에서 사용 예정(지금은 null).
//
// ★ 이름/별명 주입 지점: 사용자 매핑이 확정되면 아래 name/nick만 채우면
//   합류 인트로 카드·응원석 이름표가 자동으로 붙도록 다른 코드는 이 테이블만 참조한다.
//   (지금 단계: 이름 미표시 — color/slot만 사용. P1/P3는 보류.)
// ─────────────────────────────────────────────────────────────────────────

export const MEMBERS = Object.freeze([
  { slot: 'C1', color: '#B0E0E6', name: '도훈', nick: null }, // 하늘 — 주인공(아침 루틴)
  { slot: 'C2', color: '#1E90FF', name: '영재', nick: null }, // 파랑
  { slot: 'C3', color: '#FFFFFF', name: '경민', nick: null }, // 흰색
  { slot: 'C4', color: '#FF69B4', name: '신유', nick: null }, // 핑크
  { slot: 'C5', color: '#7FFFD4', name: '한진', nick: null }, // 민트
  { slot: 'C6', color: '#FF8C42', name: '지훈', nick: null }, // 주황
]);

// 시그니처색 배열(렌더러 응원석·미니게임 토큰 공용 — 단일 소스).
export const MEMBER_COLORS = MEMBERS.map((m) => m.color);

// 'C3' → 3 (1-based). 잘못된 slot은 1로 폴백.
export const slotNum = (slot) => { const i = MEMBERS.findIndex((m) => m.slot === slot); return i < 0 ? 1 : i + 1; };
// 'C3' → 시그니처색. 미존재 시 흰색.
export const slotColor = (slot) => (MEMBERS.find((m) => m.slot === slot) || { color: '#FFFFFF' }).color;
// 'C3' → 이름(매핑 전이면 null). 표시는 전부 이 함수로만(단일 소스).
export const slotName = (slot) => (MEMBERS.find((m) => m.slot === slot) || {}).name || null;
// 1-based 번호 → 이름. 응원석/합류카드용.
export const numName = (n) => (MEMBERS[n - 1] || {}).name || null;
