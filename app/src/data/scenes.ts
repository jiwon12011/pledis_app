// 21씬 연출 데이터 — docs/spec-scenes.md 1:1 코드화. 좌표는 배경 원본 기준 % (발끝/엉덩이 앵커).
export type PoseName =
  | 'standing' | 'waving' | 'sit' | 'dance' | 'jump' | 'slide' | 'cycling' | 'umbrella-topview'
  | 'walk' | 'run'; // walk/run은 8프레임 시트

export type MotionName = 'sway' | 'breath' | 'jumpLoop' | 'trainSway' | 'bikeBounce' | 'danceBeat';
export type IdleBKind = 'walkAbout' | 'startle' | 'shyFace' | 'slideDash' | 'shoot' | 'danceBit' | 'splashStep';
export type DblAction =
  | 'jump' | 'bigJump' | 'toggleSitStand' | 'shakeJump' | 'mirrorLaugh' | 'cutJump' | 'wave'
  | 'run3s' | 'slide' | 'peek' | 'hangJump' | 'shootNow' | 'jumpConfetti' | 'cutWobble'
  | 'reachDrop' | 'splash3' | 'minigame' | 'sunsetStop' | 'fireworkBurst' | 'credits' | 'umbrellaSpin';

export interface MemberSpec {
  x: number; y: number; scale: number;
  pose: PoseName;
  motion?: MotionName;
  reflection?: number;      // 바닥 반사 불투명도 (기획서 §4-3)
  bottomClamp?: boolean;    // scene-04: 허리 위 프레이밍 — 하단 걸침 상반신
  roam?: boolean;           // scene-18: 8자 순회
}

export interface EffectSpec {
  kind: 'clouds' | 'dropletLoop' | 'rainLines' | 'fireworkLoop' | 'confetti';
  x?: number; y?: number;
  every?: number;           // ms
  count?: number;
  clip?: { x: number; y: number; w: number; h: number }; // scene-11 창 영역 클리핑
  splashOnly?: boolean;     // scene-16: 착지 프레임만
}

export interface Hotspot { x: number; y: number; w: number; h: number; label: string; act?: 'shake' | 'splash' | 'firework' | 'blink' }

export interface SceneSpec {
  id: string; title: string; hint: string;
  aspect: '9:16' | '16:9' | '1:1';
  tier: 0 | 1 | 2 | 3; price: number;
  special?: { cut: string; x: number; y: number; w: number }; // 특수룸(멤버 미등장)
  member?: MemberSpec;
  idleB?: { every: number; kind: IdleBKind };
  pan?: { speed: number; loop?: boolean }; // 16:9 파노라마 / loop=멤버 고정 무한 이동
  effects: EffectSpec[];
  moodcuts: string[];
  moodcutAt?: { x: number; y: number };
  tapWeights: { neutral: number; laugh: number; shy: number; surprised: number };
  firstTapToast?: string;
  dbl: DblAction;
  hotspots: Hotspot[];
  mirrorSync?: { x: number; y: number; w: number; h: number };  // scene-04 거울 표정 동기화
  sleepCut?: { cut: string; x: number; y: number; w: number };  // scene-02 수면 컷
}

const W = (neutral: number, laugh: number, shy: number, surprised: number) => ({ neutral, laugh, shy, surprised });

export const SCENES: SceneSpec[] = [
  {
    id: 'scene-01', title: '밤의 계획', hint: '모든 이야기가 시작된 책상', aspect: '9:16', tier: 0, price: 0,
    member: { x: 42, y: 96, scale: 0.26, pose: 'standing', motion: 'sway' },
    idleB: { every: 22000, kind: 'walkAbout' },
    effects: [], moodcuts: ['scene-01-C1-planning'],
    tapWeights: W(20, 40, 25, 15), dbl: 'jump',
    hotspots: [
      { x: 55, y: 8, w: 40, h: 30, label: '오늘 밤도 별이 보여' },
      { x: 8, y: 38, w: 22, h: 20, label: '스탠드 불빛이 깜빡, 인사했다', act: 'blink' },
      { x: 38, y: 60, w: 28, h: 12, label: '내일 계획: 전부 다 잘되기' },
    ],
  },
  {
    id: 'scene-02', title: '불 끄기 전', hint: '스탠드 하나만 켜진 밤', aspect: '9:16', tier: 1, price: 80,
    member: { x: 19, y: 72, scale: 0.26, pose: 'sit', motion: 'breath' },
    effects: [], moodcuts: ['scene-02-C1-sleeping'],
    sleepCut: { cut: 'scene-02-C1-sleeping', x: 21, y: 65, w: 30 },
    tapWeights: W(30, 30, 40, 0), dbl: 'toggleSitStand',
    hotspots: [
      { x: 55, y: 55, w: 20, h: 15, label: '스탠드를 만지작거렸다', act: 'blink' },
      { x: 60, y: 8, w: 35, h: 38, label: '창밖, 도시가 잠드는 중' },
    ],
  },
  {
    id: 'scene-03', title: '알람과의 전쟁', hint: '5분만 더…의 현장', aspect: '9:16', tier: 1, price: 80,
    member: { x: 35, y: 66, scale: 0.27, pose: 'standing', motion: 'breath' },
    idleB: { every: 15000, kind: 'startle' },
    effects: [], moodcuts: ['scene-03-C1-alarm-blurry', 'scene-03-C1-alarm-swat'],
    tapWeights: W(0, 30, 0, 70), dbl: 'shakeJump',
    hotspots: [
      { x: 52, y: 52, w: 14, h: 12, label: '따르릉!!!', act: 'shake' },
      { x: 60, y: 5, w: 35, h: 40, label: '아침 해가 눈부시다' },
      { x: 70, y: 50, w: 25, h: 18, label: '오늘 입을 교복' },
    ],
  },
  {
    id: 'scene-04', title: '거울 앞 윙크', hint: '양치 3분, 거울 체크 7분', aspect: '9:16', tier: 1, price: 80,
    member: { x: 50, y: 118, scale: 0.52, pose: 'standing', motion: 'sway', bottomClamp: true },
    mirrorSync: { x: 30, y: 18, w: 40, h: 32 },
    effects: [], moodcuts: ['scene-04-C1-brush-wink'],
    tapWeights: W(0, 30, 55, 15), dbl: 'mirrorLaugh',
    hotspots: [
      { x: 40, y: 70, w: 20, h: 10, label: '쏴아—', act: 'splash' },
      { x: 75, y: 40, w: 20, h: 22, label: '보송한 수건' },
    ],
  },
  {
    id: 'scene-05', title: '작은 우리들', hint: '다이어리 속 마을에 우리가 산다', aspect: '9:16', tier: 1, price: 80,
    special: { cut: 'scene-05-miniatures-six', x: 50, y: 55, w: 62 },
    effects: [], moodcuts: [],
    tapWeights: W(25, 50, 25, 0), dbl: 'cutJump',
    hotspots: [
      { x: 30, y: 35, w: 18, h: 12, label: '여기 우리 학교!' },
      { x: 60, y: 45, w: 18, h: 12, label: '관람차 타러 가자' },
      { x: 25, y: 60, w: 18, h: 12, label: '등대까지 자전거로 20분' },
    ],
  },
  {
    id: 'scene-06', title: '넥타이는 어려워', hint: '3번 시도, 3번 실패', aspect: '9:16', tier: 1, price: 80,
    member: { x: 40, y: 93, scale: 0.30, pose: 'standing' },
    idleB: { every: 18000, kind: 'shyFace' },
    effects: [], moodcuts: ['scene-06-C1-tie-attempt1', 'scene-06-C1-tie-attempt2', 'scene-06-C1-tie-giveup'],
    tapWeights: W(15, 50, 35, 0), dbl: 'wave',
    hotspots: [
      { x: 62, y: 30, w: 25, h: 35, label: '오늘의 상대: 넥타이' },
      { x: 30, y: 25, w: 25, h: 50, label: '거울 속의 나, 나쁘지 않아' },
      { x: 8, y: 68, w: 18, h: 16, label: '가방은 챙겼고…' },
    ],
  },
  {
    id: 'scene-07', title: '등굣길 산책', hint: '네모난 골목, 둥근 구름', aspect: '16:9', tier: 2, price: 150,
    member: { x: 50, y: 90, scale: 0.30, pose: 'walk' },
    pan: { speed: 12, loop: true },
    effects: [{ kind: 'clouds', count: 2 }],
    moodcuts: ['scene-07-cycling-three'], moodcutAt: { x: 18, y: 16 },
    tapWeights: W(35, 45, 20, 0), dbl: 'run3s',
    hotspots: [
      { x: 10, y: 55, w: 15, h: 25, label: '똑똑, 아무도 없나요' },
      { x: 20, y: 48, w: 8, h: 8, label: '우편함: 아무것도 없음… 또 확인' },
    ],
  },
  {
    id: 'scene-08', title: '복도 전력질주', hint: '복도에서 뛰면 안 되는데', aspect: '16:9', tier: 2, price: 150,
    member: { x: 50, y: 88, scale: 0.30, pose: 'run', reflection: 0.18 },
    idleB: { every: 12000, kind: 'slideDash' },
    pan: { speed: 18, loop: true },
    effects: [], moodcuts: ['scene-08-running-sprint', 'scene-08-sliding-skid'],
    tapWeights: W(0, 50, 0, 50), dbl: 'slide',
    hotspots: [
      { x: 70, y: 35, w: 20, h: 35, label: '덜컹—', act: 'shake' },
      { x: 88, y: 40, w: 10, h: 20, label: '축제 포스터가 붙어 있다' },
    ],
  },
  {
    id: 'scene-09', title: '그 교실 앞', hint: '들어갈까 말까, 3초 전', aspect: '9:16', tier: 2, price: 150,
    member: { x: 48, y: 92, scale: 0.31, pose: 'walk', reflection: 0.18 },
    effects: [], moodcuts: ['scene-09-bump-near', 'scene-09-door-grab'],
    tapWeights: W(20, 20, 35, 45 - 20), dbl: 'peek',
    hotspots: [
      { x: 25, y: 20, w: 50, h: 55, label: '덜컹— 아직 잠겨 있다', act: 'shake' },
      { x: 78, y: 32, w: 18, h: 25, label: '게시판: 이번 주 청소 당번' },
    ],
  },
  {
    id: 'scene-10', title: '옥상 점프', hint: '하늘이 절반인 날', aspect: '16:9', tier: 2, price: 150,
    member: { x: 38, y: 88, scale: 0.28, pose: 'jump', motion: 'jumpLoop' },
    pan: { speed: 8 },
    effects: [{ kind: 'clouds', count: 3 }],
    moodcuts: ['scene-10-jump-rooftop'],
    tapWeights: W(20, 60, 0, 20), dbl: 'bigJump',
    hotspots: [
      { x: 18, y: 28, w: 18, h: 25, label: '철렁—', act: 'shake' },
      { x: 80, y: 30, w: 15, h: 25, label: '언젠가 저기서 콘서트' },
    ],
  },
  {
    id: 'scene-11', title: '창가 자리', hint: '이 버스는 바다를 지나갑니다', aspect: '9:16', tier: 2, price: 150,
    member: { x: 26, y: 74, scale: 0.30, pose: 'sit', motion: 'trainSway' },
    effects: [{ kind: 'clouds', count: 2, clip: { x: 18, y: 8, w: 74, h: 48 } }],
    moodcuts: ['scene-11-bus-window'],
    tapWeights: W(0, 50, 30, 20), dbl: 'toggleSitStand',
    hotspots: [
      { x: 8, y: 44, w: 12, h: 10, label: '딩동— 다음 정류장', act: 'blink' },
      { x: 25, y: 8, w: 30, h: 14, label: '손잡이가 흔들, 흔들' },
      { x: 30, y: 20, w: 60, h: 35, label: '창밖으로 바다가 스쳐 간다' },
    ],
  },
  {
    id: 'scene-12', title: '빈 지하철', hint: '아무도 없는 칸은 무대가 된다', aspect: '9:16', tier: 2, price: 150,
    member: { x: 50, y: 86, scale: 0.30, pose: 'standing', motion: 'trainSway', reflection: 0.18 },
    idleB: { every: 20000, kind: 'slideDash' },
    effects: [], moodcuts: ['scene-12-hangrail-upside', 'scene-12-basketball-pickup'],
    tapWeights: W(35, 45, 0, 20), dbl: 'hangJump',
    hotspots: [
      { x: 25, y: 12, w: 50, h: 20, label: '손잡이들이 찰랑', act: 'shake' },
      { x: 38, y: 32, w: 24, h: 16, label: '다음 역은… 우리만 아는 곳' },
    ],
  },
  {
    id: 'scene-13', title: '3점 슛', hint: '인생 첫 덩크(상상)', aspect: '9:16', tier: 2, price: 150,
    member: { x: 62, y: 88, scale: 0.30, pose: 'standing', motion: 'sway', reflection: 0.18 },
    idleB: { every: 10000, kind: 'shoot' },
    effects: [], moodcuts: ['scene-13-basketball-jump'],
    tapWeights: W(20, 50, 0, 30), dbl: 'shootNow',
    hotspots: [
      { x: 5, y: 28, w: 25, h: 22, label: '스윽— 들어갔다 치자', act: 'shake' },
      { x: 2, y: 66, w: 12, h: 10, label: '벤치는 응원석' },
    ],
  },
  {
    id: 'scene-14', title: '작은 무대', hint: '6명이 서기엔 좁고, 꿈이 서기엔 넓은', aspect: '9:16', tier: 2, price: 150,
    member: { x: 50, y: 54, scale: 0.22, pose: 'waving' },
    idleB: { every: 14000, kind: 'danceBit' },
    effects: [{ kind: 'confetti', count: 12 }, { kind: 'fireworkLoop', x: 25, y: 30, every: 30000 }],
    moodcuts: ['scene-14-waving-crowd'],
    tapWeights: W(0, 70, 30, 0), dbl: 'jumpConfetti',
    hotspots: [
      { x: 35, y: 15, w: 30, h: 12, label: '조명이 우리를 따라온다', act: 'blink' },
      { x: 0, y: 55, w: 20, h: 30, label: '짝짝짝—' },
      { x: 80, y: 55, w: 20, h: 30, label: '짝짝짝—' },
    ],
  },
  {
    id: 'scene-15', title: '동그란 회의', hint: '둘러앉으면 회의, 흩어지면 술래잡기', aspect: '1:1', tier: 3, price: 250,
    special: { cut: 'scene-15-circle-sitting-topview', x: 50, y: 52, w: 58 },
    effects: [], moodcuts: [],
    tapWeights: W(25, 50, 25, 0), dbl: 'cutWobble',
    hotspots: [
      { x: 42, y: 2, w: 16, h: 10, label: '똑똑' },
      { x: 40, y: 45, w: 20, h: 14, label: '오늘의 안건: 저녁 메뉴' },
    ],
  },
  {
    id: 'scene-16', title: '빗방울 하나', hint: '천장에서 여름이 샌다', aspect: '9:16', tier: 3, price: 250,
    member: { x: 66, y: 90, scale: 0.30, pose: 'standing' },
    effects: [{ kind: 'dropletLoop', x: 50, y: 91, every: 3500, splashOnly: true }],
    moodcuts: ['scene-16-waterdrop-falling'],
    tapWeights: W(25, 20, 0, 55), dbl: 'reachDrop',
    hotspots: [
      { x: 44, y: 86, w: 14, h: 8, label: '퐁—', act: 'splash' },
      { x: 40, y: 50, w: 55, h: 15, label: '무대 커튼 뒤엔 뭐가 있을까' },
    ],
  },
  {
    id: 'scene-17', title: '빗속의 춤', hint: '젖는 김에, 제대로', aspect: '9:16', tier: 3, price: 250,
    member: { x: 50, y: 88, scale: 0.32, pose: 'dance', motion: 'danceBeat', reflection: 0.28 },
    idleB: { every: 16000, kind: 'splashStep' },
    effects: [
      { kind: 'dropletLoop', x: 52, y: 88, every: 2200 },
      { kind: 'rainLines', count: 20 },
    ],
    moodcuts: ['scene-17-rain-dancing', 'scene-17-rain-sliding'],
    tapWeights: W(0, 65, 0, 35), dbl: 'splash3',
    hotspots: [
      { x: 30, y: 85, w: 15, h: 8, label: '첨벙!', act: 'splash' },
      { x: 0, y: 15, w: 28, h: 40, label: '쏴아—' },
    ],
  },
  {
    id: 'scene-18', title: '우산 산책', hint: '비 갠 코트는 나만의 산책로', aspect: '1:1', tier: 3, price: 250,
    member: { x: 50, y: 50, scale: 0.17, pose: 'umbrella-topview', roam: true },
    effects: [], moodcuts: ['scene-18-umbrella-topview'],
    tapWeights: W(30, 40, 30, 0), dbl: 'minigame',
    hotspots: [
      { x: 16, y: 18, w: 14, h: 12, label: '참방', act: 'splash' },
      { x: 74, y: 18, w: 14, h: 12, label: '참방', act: 'splash' },
      { x: 62, y: 45, w: 14, h: 12, label: '참방', act: 'splash' },
      { x: 18, y: 70, w: 14, h: 12, label: '참방', act: 'splash' },
    ],
  },
  {
    id: 'scene-19', title: '노을 페달', hint: '페달 두 번에 노을 한 뼘', aspect: '16:9', tier: 3, price: 250,
    member: { x: 50, y: 83, scale: 0.27, pose: 'cycling', motion: 'bikeBounce' },
    pan: { speed: 10, loop: true },
    effects: [],
    moodcuts: ['scene-19-sunset-cycling'],
    tapWeights: W(20, 30, 50, 0), dbl: 'sunsetStop',
    hotspots: [
      { x: 8, y: 30, w: 10, h: 40, label: '가로등이 깜빡, 켜졌다', act: 'blink' },
      { x: 2, y: 45, w: 10, h: 10, label: '등대가 깜빡, 하고 인사했다' },
    ],
  },
  {
    id: 'scene-20', title: '다리 위에서', hint: '노을과 불꽃 사이', aspect: '16:9', tier: 3, price: 250,
    member: { x: 38, y: 92, scale: 0.28, pose: 'waving' },
    pan: { speed: 8 },
    effects: [{ kind: 'fireworkLoop', x: 65, y: 26, every: 9000 }],
    moodcuts: ['scene-20-ending-bridge'],
    firstTapToast: '여기까지 와줘서 고마워',
    tapWeights: W(0, 60, 40, 0), dbl: 'fireworkBurst',
    hotspots: [
      { x: 88, y: 15, w: 10, h: 60, label: '랜턴에 불이 들어왔다', act: 'blink' },
      { x: 60, y: 45, w: 30, h: 15, label: '도시의 불빛이 하나둘 켜진다' },
    ],
  },
  {
    id: 'scene-21', title: '스물한 번째 장면', hint: '전부 모은 사람에게만 보이는 것', aspect: '1:1', tier: 0, price: 0,
    special: { cut: 'scene-21-vpose-bonus', x: 50, y: 74, w: 66 },
    effects: [
      { kind: 'fireworkLoop', x: 25, y: 22, every: 6000 },
      { kind: 'fireworkLoop', x: 75, y: 28, every: 7500 },
      { kind: 'confetti', count: 16 },
    ],
    moodcuts: [],
    tapWeights: W(0, 70, 30, 0), dbl: 'credits',
    hotspots: [
      { x: 2, y: 62, w: 14, h: 14, label: '흰 꽃이 만개했다' },
      { x: 84, y: 62, w: 14, h: 14, label: '흰 꽃이 만개했다' },
    ],
  },
];

export const sceneById = (id: string) => SCENES.find((s) => s.id === id);

/** 배경 매니페스트 키 */
export const bgKey = (s: SceneSpec) =>
  `bg/${s.id}${s.aspect === '1:1' && s.id !== 'scene-21' ? '-bg-topview' : '-bg'}`;
