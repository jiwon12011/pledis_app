// src/scenes/scene-data.js
// ─────────────────────────────────────────────────────────────────────────
// 21씬 전체 메타데이터 — 출처(SSOT)는 docs/기획서.md 2장 "씬 시퀀스" 표.
// 이 파일은 "데이터만" 담는다(렌더/전환 로직 없음). 엔진은 이 데이터를 읽어 그린다.
//
// 이번 마일스톤(챕터1 수직 슬라이스)에선 씬01~03만 실제로 렌더/동작하지만,
// 상단 막 도트 7개·인원 곡선·"NN / 20" 카운터는 전체 20씬을 기준으로 그려져야
// 하므로 21씬 전부를 미리 정의한다. (씬04~21은 bg/메타만, 동작은 후속 마일스톤)
// ─────────────────────────────────────────────────────────────────────────

// 들어오는 전환 타입 — 기획서 4장 "모션 사전"의 동사와 1:1.
// 실제 전환 비주얼은 motion이 src/engine/transitions.js에서 이 타입으로 분기한다.
export const TRANSITIONS = Object.freeze({
  OPENING: 'opening', // 씬01 오프닝 — 들어오는 전환 없음
  ZOOM: 'zoom',       // 확대축소
  FALL: 'fall',       // 낙하
  SLIDE: 'slide',     // 슬라이드
  SCATTER: 'scatter', // 흩어짐
  ENTER: 'enter',     // 등장
  UNLOCK: 'unlock',   // 보너스 씬21 — 씬18 우산 6탭으로 언락(일반 네비로 진입 X)
});

// 챕터 7막 — 진행 표시(상단 도트 7개)·스테이지 맵 단위. 기획서 2장.
// scenes는 1-based 씬 번호(사람이 읽는 단위). 엔진 내부 인덱스는 0-based.
export const ACTS = Object.freeze([
  { act: 1, scenes: [1, 2, 3, 4],     title: '완벽한 하루를 위한 준비', mood: '혼자인 아침, 빈틈없는 계획' },
  { act: 2, scenes: [5, 6],           title: '다이어리 너머의 신호',   mood: '세상이 이미 나를 기다렸다' },
  { act: 3, scenes: [7, 8, 9],        title: '계획에 없던 첫 만남',     mood: '계획이 틀어지기 시작' },
  { act: 4, scenes: [10, 11, 12, 13], title: '우연이 겹치는 하루',     mood: '예상 못 한 얼굴들' },
  { act: 5, scenes: [14, 15],         title: '우리가 되는 순간',       mood: '찾아내고 숨 고르기' },
  { act: 6, scenes: [16, 17, 18],     title: '계획 없이도 괜찮아',     mood: '비가 와도, 어설퍼도' },
  { act: 7, scenes: [19, 20],         title: '이 하루의 끝에서',       mood: '노을 열주와 엔딩샷' },
]);

// 인원 곡선(씬01~20) — "혼자 → 다 함께" 계단형. 진행 인디케이터의 정서적 핵심.
// 기획서 2장: 1 1 1 1 1 1 3 3 2 4 2 3 5 6 6 6 6 6 6 6
export const POPULATION_CURVE = Object.freeze([
  1, 1, 1, 1, 1, 1, 3, 3, 2, 4, 2, 3, 5, 6, 6, 6, 6, 6, 6, 6,
]);

// 본편 씬 수(보너스 21 제외) — 카운터 "NN / 20"의 분모.
export const MAIN_SCENE_COUNT = 20;

// 씬 번호 → 막 번호 역인덱스(렌더 시 빠른 조회용).
const ACT_OF_SCENE = (() => {
  const map = {};
  for (const a of ACTS) for (const s of a.scenes) map[s] = a.act;
  return map;
})();

// ── 캐릭터 배치 앵커 스키마 (motion이 의존하는 계약) ──────────────────────
// 렌더러 _drawChars가 이 anchor로 분기해 스프라이트를 자연 픽셀 크기로 배치한다.
// 픽셀아트라 비정수 스케일은 픽셀을 뭉개므로 bottom/topview-center는 스케일 없이
// 원본 크기 그대로 그린다(scale 옵션은 정수배만 권장, 기본 1).
//   · 'bottom'         : 발을 콘텐츠 바닥선(y=520)에 맞춤. x(0~1)로 가로 위치(기본 0.5 중앙).
//                        지면 액션/서 있는 캐릭터 기본값.
//   · 'topview-center' : 콘텐츠 영역 정중앙. 탑뷰(원형 배치)·미니어처처럼 지면을 위에서
//                        내려다보는 구도.
//   · 'full'           : 캔버스 폭(360)에 종횡비 보존 스케일, 콘텐츠 상단 정렬. 배경과
//                        동급의 풀프레임 오버레이용. (현재 가공본은 풀프레임이 아니라
//                        미사용 — perf가 360×640 오버레이를 내면 그때 지정.)
// 스프라이트시트: sheet:{frames, fps} 지정 시 가로 N프레임 스트립을 시간 기반 순환.
export const ANCHORS = Object.freeze({ BOTTOM: 'bottom', TOPVIEW_CENTER: 'topview-center', FULL: 'full' });

// 캐릭터 스프라이트 헬퍼. file + anchor(+옵션 x/scale/sheet). 좌표는 하드코딩하지
// 않는다 — 앵커 규칙으로 배치하므로 perf가 크기를 바꿔도 자연 적응한다. 가공본이
// 없으면 로더가 경고 후 스킵하므로 견고하다.
const sprite = (file, anchor = ANCHORS.BOTTOM, opts = {}) => ({ file, anchor, ...opts });

// 전체 21씬 메타. bg 파일명은 assets/processed/backgrounds/ 기준(로더가 경로 조립).
// people: 화면 인원수(인원 곡선과 일치). transition: 원본 기획의 "들어오는 전환"
//   메타(역사적 기록) — 연출이 단일 수평 패닝으로 통일돼 엔진은 분기하지 않는다.
//   자막(subtitle)은 사용하지 않으므로 필드에서 제거했다.
// chars: 씬마다 그 배경에 맞춰 그려진 "씬 전용 스프라이트"를 얹는다(범용 스프라이트를
//   엉뚱한 배경에 올려 떠 보이던 이전 문제를 해소 — team-lead+ideator 방향, 2026-06-26).
//   실측 가공본 크기: 01~06=280×280(정사각 비네트), 07~20=360×240(가로 밴드),
//   21=360×360. 그래서 지면 액션은 bottom, 탑뷰/미니어처(05·15·18)는 topview-center.
//   대표 스프라이트가 여럿인 씬(03 알람·06 넥타이·08 복도·12 농구·17 비)은 대표 1컷만.
export const SCENES = Object.freeze([
  { id: 1,  title: '완벽한 계획서',          bg: 'scene-01-bg.png',          people: 1, transition: TRANSITIONS.OPENING, chars: [sprite('scene-01-C1-planning.png')] },
  { id: 2,  title: '밤을 베고 자다',          bg: 'scene-02-bg.png',          people: 1, transition: TRANSITIONS.ZOOM,    chars: [sprite('scene-02-C1-sleeping.png')] },
  { id: 3,  title: '알람과의 전쟁',          bg: 'scene-03-bg.png',          people: 1, transition: TRANSITIONS.FALL,    chars: [sprite('scene-03-C1-alarm-swat.png')] },
  { id: 4,  title: '거울 속의 나',           bg: 'scene-04-bg.png',          people: 1, transition: TRANSITIONS.SLIDE,   chars: [sprite('scene-04-C1-brush-wink.png')] },
  { id: 5,  title: '다이어리 속 작은 세계',  bg: 'scene-05-bg.png',          people: 1, transition: TRANSITIONS.ZOOM,    chars: [sprite('scene-05-miniatures-six.png', ANCHORS.TOPVIEW_CENTER)] },
  { id: 6,  title: '완벽한 넥타이',          bg: 'scene-06-bg.png',          people: 1, transition: TRANSITIONS.SLIDE,   chars: [sprite('scene-06-C1-tie-attempt1.png')] },
  { id: 7,  title: '페달을 밟으면 세상이 온다', bg: 'scene-07-bg.png',        people: 3, transition: TRANSITIONS.ENTER,   chars: [sprite('scene-07-cycling-three.png')] },
  { id: 8,  title: '복도를 달려',            bg: 'scene-08-bg.png',          people: 3, transition: TRANSITIONS.SLIDE,   chars: [sprite('scene-08-running-sprint.png')] },
  { id: 9,  title: '문 앞에서 굳다',         bg: 'scene-09-bg.png',          people: 2, transition: TRANSITIONS.ENTER,   chars: [sprite('scene-09-door-grab.png')] },
  { id: 10, title: '옥상의 대형',            bg: 'scene-10-bg.png',          people: 4, transition: TRANSITIONS.SCATTER, chars: [sprite('scene-10-jump-rooftop.png')] },
  { id: 11, title: '차창 너머 0.3초',        bg: 'scene-11-bg.png',          people: 2, transition: TRANSITIONS.SLIDE,   chars: [sprite('scene-11-bus-window.png')] },
  { id: 12, title: '굴러온 농구공',          bg: 'scene-12-bg.png',          people: 3, transition: TRANSITIONS.FALL,    chars: [sprite('scene-12-basketball-pickup.png')] },
  { id: 13, title: '높이 뛰면 보인다',       bg: 'scene-13-bg.png',          people: 5, transition: TRANSITIONS.ZOOM,    chars: [sprite('scene-13-basketball-jump.png')] },
  { id: 14, title: '군중 속의 손',           bg: 'scene-14-bg.png',          people: 6, transition: TRANSITIONS.SCATTER, chars: [sprite('scene-14-waving-crowd.png')] },
  { id: 15, title: '바닥에 동그라미',        bg: 'scene-15-bg-topview.png',  people: 6, transition: TRANSITIONS.SLIDE,   chars: [sprite('scene-15-circle-sitting-topview.png', ANCHORS.TOPVIEW_CENTER)] },
  { id: 16, title: '천장이 새기 시작했다',   bg: 'scene-16-bg.png',          people: 6, transition: TRANSITIONS.FALL,    chars: [sprite('scene-16-waterdrop-falling.png')] },
  { id: 17, title: '비여도 괜찮아',          bg: 'scene-17-bg.png',          people: 6, transition: TRANSITIONS.ENTER,   chars: [sprite('scene-17-rain-dancing.png')] },
  { id: 18, title: '우산을 펼쳐',            bg: 'scene-18-bg-topview.png',  people: 6, transition: TRANSITIONS.ZOOM,    chars: [sprite('scene-18-umbrella-topview.png', ANCHORS.TOPVIEW_CENTER)] },
  { id: 19, title: '노을이 밀려온다',        bg: 'scene-19-bg.png',          people: 6, transition: TRANSITIONS.SLIDE,   chars: [sprite('scene-19-sunset-cycling.png')] },
  { id: 20, title: '다리 위의 우리',         bg: 'scene-20-bg.png',          people: 6, transition: TRANSITIONS.ZOOM,    chars: [sprite('scene-20-ending-bridge.png')] },
  // 보너스: 일반 네비로 진입하지 않음. 씬18 우산 6탭 언락(경로 비공개).
  { id: 21, title: '우리들의 첫 만남',       bg: 'scene-21-bg.png',          people: 6, transition: TRANSITIONS.UNLOCK,  bonus: true, chars: [sprite('scene-21-vpose-bonus.png')] },
].map((s) => ({ ...s, act: ACT_OF_SCENE[s.id] ?? null, chars: s.chars ?? [] })));

// 일반 네비게이션이 다루는 씬(보너스 제외) — 엔진은 이 배열로 이웃/경계를 계산.
export const NAV_SCENES = Object.freeze(SCENES.filter((s) => !s.bonus));

// 응원석/에셋풀 참고: 워리오웨어식 마이크로게임으로 재기획되며 횡스크롤 레벨 데이터
//   (LEVELS·LEVEL_ORDER·worldW/groundY/exitX·gate)는 폐기됐다. 위의 ACTS·POPULATION_CURVE·
//   멤버 식별(C1~C6)·씬전용 스프라이트(SCENES.chars)는 응원석/에셋풀로 보존한다.
//   마이크로게임 정의는 src/engine/minigames.js, 진행 규칙은 src/engine/game.js.
