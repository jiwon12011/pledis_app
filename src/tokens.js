// ─────────────────────────────────────────────────────────────────────────
// tokens.js — TWS 픽셀 컷씬 앱 디자인 토큰 (SSOT: docs/기획서.md 3·6·7장)
// 소유: designer. developer는 아래 이름/구조 그대로 import 한다.
//   import { CANVAS, LAYOUT, PALETTE, FONTS } from './tokens.js'
// 색·치수는 기획서 값을 그대로 코드화 — 새 값을 만들지 않는다.
// ─────────────────────────────────────────────────────────────────────────

// 논리 캔버스 360×640 (9:16, 모바일 세로). 1 논리px = 2 물리px(CSS pixelated).
// Canvas 내부 해상도 고정 — DPR 곱 금지(기획서 5장).
export const CANVAS = { W: 360, H: 640 };

// ── 화면 레이아웃 (기획서 6장 ASCII → 360×640 픽셀 좌표 환산) ──────────────
// 세로 밴드(위→아래), 합계 = 640, 모두 4/8px 그리드 위:
//   상태바   y=0   h=40   (640 - 480 - 40 - 80 으로 도출)
//   콘텐츠   y=40  h=480  ← LAYOUT.content (메인 씬 그리는 영역, 풀폭 360)
//   자막     y=520 h=40   ← subtitleH (남색 패널, DOM 오버레이)
//   네비+인디 y=560 h=80   ← navH (< 도트7 08/20 >, DOM 오버레이)
//
// 콘텐츠 밴드 안의 "씬 아트 세이프박스"(기획서 6장 "320×400 중앙",
// 3장 배경 콘텐츠 ~320×480 권장): x=20, y=80, w=320, h=400 (중앙 정렬).
// 좌우 20px·상하 40px 프레임 여백. 핵심 캐릭터/후크는 이 박스 안에 배치.
export const LAYOUT = {
  subtitleH: 40,
  navH: 80,
  statusH: 40,
  // 메인 씬 그리기 영역(상태바·자막·네비 예약 반영한 가용 영역)
  content: { x: 0, y: 40, w: 360, h: 480 },
  // 씬 아트 세이프박스(중앙 320×400) — 작화/구도 가이드
  safe: { x: 20, y: 80, w: 320, h: 400 },
  // UI 밴드 좌표(자막/네비 패널 배치용)
  subtitle: { x: 0, y: 520, w: 360, h: 40 },
  nav: { x: 0, y: 560, w: 360, h: 80 },
  status: { x: 0, y: 0, w: 360, h: 40 },
  // 인터랙션 최소 타깃(기획서 6장): 버튼 ≥44×44px
  tapMin: 44,
};

// ── 마스터 팔레트 (기획서 3장, 16색 고정) ─────────────────────────────────
export const PALETTE = {
  skyLight:  '#87CEEB', // 하늘 밝음
  skyMid:    '#4A9FD8', // 하늘 중간
  skyDark:   '#2E5F99', // 하늘 어두움
  mint:      '#7FFFD4', // 민트 (교복 셔츠)
  navy:      '#1C2841', // 남색 (넥타이·바지) — 자막 패널 베이스
  sunset:    '#FF8C42', // 노을 — 포커스 테두리 색
  skin:      '#F4A080', // 살구 (피부)
  cloud:     '#FFFACD', // 구름 흰색
  concrete:  '#9E9E9E', // 콘크리트 회색
  courtBlue: '#1E90FF', // 농구장 파랑
  outline:   '#4A4A4A', // 다크 그레이 (아웃라인)
  white:     '#FFFFFF',
  black:     '#000000',
  holoPink:  '#FF69B4', // 홀로그램 핑크
  holoPurple:'#9370DB', // 홀로그램 퍼플
  umbrella:  '#B0E0E6', // 투명 우산 — 렌더 시 50% 알파 적용 (rgba(176,224,230,.5))
};

// ── 폰트 (기획서 2·3장: 픽셀 비트맵, 필기체 금지) ──────────────────────────
// pixelKo: 한글 둥근 픽셀 — Galmuri11(가독성 우수, 한+영 픽셀) 우선,
//          NeoDunggeunmo 대체. 자막·UI 한글 본문에 사용.
// pixelEn: 영문 픽셀 — 타이틀은 Press Start 2P, 본문/숫자는 VT323.
export const FONTS = {
  pixelKo: "'Galmuri11', 'NeoDunggeunmo', 'DungGeunMo', monospace",
  pixelEn: "'Press Start 2P', 'VT323', 'Galmuri11', monospace",
};
