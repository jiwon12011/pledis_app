// src/loader.js
// ─────────────────────────────────────────────────────────────────────────
// 에셋 로더 — 이미지 디코드 + 씬 단위 상주(residency) 관리.
//
// 로딩 정책(기획서 5장):
//   · 현재 씬 N의 N±1 항상 상주
//   · N±2는 requestIdleCallback로 한가할 때 프리로드
//   · N-2 이하(반경 2 밖)는 캐시에서 해제 → 메모리 상한 유지
//   · 씬01 BG는 index.html이 <link rel=preload fetchpriority=high>로 먼저 당김
//
// 견고성: 가공본(assets/processed/*)이 아직 없을 수 있다. onerror/누락 시
//   콘솔 경고만 남기고 계속 진행한다. 렌더러는 이미지가 없으면 폴백을 그린다.
//
// 파일 소유권: 이 파일은 developer 소유. 에셋 자체는 perf가 assets/processed에 생성.
// ─────────────────────────────────────────────────────────────────────────

// 경로 스킴 — 통합 계약 고정값.
const DIR = Object.freeze({
  bg: 'assets/processed/backgrounds/',
  char: 'assets/processed/characters/',
  ui: 'assets/processed/ui/',
});

// requestIdleCallback 폴백(Safari 등 미지원 브라우저 대비).
const onIdle =
  typeof requestIdleCallback === 'function'
    ? requestIdleCallback
    : (cb) => setTimeout(() => cb({ didTimeout: false, timeRemaining: () => 16 }), 1);

// 단일 이미지의 캐시 엔트리: { img, status: 'loading'|'ok'|'error' }.
export class Loader {
  /** @param {ReadonlyArray<object>} scenes scene-data의 NAV_SCENES(또는 SCENES) */
  constructor(scenes) {
    this.scenes = scenes;
    /** @type {Map<string, {img: HTMLImageElement, status: string}>} path → 엔트리 */
    this.cache = new Map();
    this.residencyRadius = 1; // N±1 상주
    this.preloadRadius = 2;   // N±2 프리로드
  }

  // 경로 → 이미지. 없으면 비동기로 로드 시작하고 현재 상태의 img를 돌려준다.
  // status가 'ok'가 아니면 렌더러는 폴백을 그린다.
  #image(path) {
    let entry = this.cache.get(path);
    if (entry) return entry;

    const img = new Image();
    entry = { img, status: 'loading' };
    this.cache.set(path, entry);

    img.decoding = 'async';
    img.addEventListener('load', () => {
      // decode()로 메인스레드 디코드 비용을 프레임 밖으로 — 첫 draw 지터 방지.
      img.decode?.().then(
        () => { entry.status = 'ok'; },
        () => { entry.status = 'ok'; }, // decode 실패해도 load됐으면 그릴 수 있음
      );
      entry.status = entry.status === 'error' ? 'error' : 'ok';
    });
    img.addEventListener('error', () => {
      entry.status = 'error';
      console.warn(`[loader] 에셋 누락/로드 실패(계속 진행): ${path}`);
    });
    img.src = path;
    return entry;
  }

  // 씬 인덱스 → 배경 이미지(없으면 null). 렌더러가 매 프레임 호출.
  bg(index) {
    const scene = this.scenes[index];
    if (!scene) return null;
    const entry = this.#image(DIR.bg + scene.bg);
    return entry.status === 'ok' ? entry.img : null;
  }

  // 배경 파일명 → 이미지(없으면 null). 플레이형 레벨이 씬 인덱스 없이 직접 쓸 때.
  bgByFile(file) {
    const entry = this.#image(DIR.bg + file);
    return entry.status === 'ok' ? entry.img : null;
  }

  // 캐릭터 스프라이트 파일명 → 이미지(없으면 null). 온디맨드 로드·캐시.
  char(file) {
    const entry = this.#image(DIR.char + file);
    return entry.status === 'ok' ? entry.img : null;
  }

  // UI 스프라이트(화살표 등) — DOM에서 못 쓰는 경우용. 현재는 CSS로 그리므로 예비.
  ui(file) {
    const entry = this.#image(DIR.ui + file);
    return entry.status === 'ok' ? entry.img : null;
  }

  // 현재 씬이 바뀔 때마다 호출 — 상주/프리로드/해제를 갱신한다.
  setActive(index) {
    const n = this.scenes.length;

    // 1) 상주: N±1 즉시 로드(이미 캐시면 무시).
    for (let d = -this.residencyRadius; d <= this.residencyRadius; d++) {
      const i = index + d;
      if (i >= 0 && i < n) this.#loadScene(i);
    }

    // 2) 프리로드: N±2는 한가할 때.
    onIdle(() => {
      for (const d of [-this.preloadRadius, this.preloadRadius]) {
        const i = index + d;
        if (i >= 0 && i < n) this.#loadScene(i);
      }
    });

    // 3) 해제: 반경 2 밖의 BG 캐시 제거(메모리 상한).
    this.#evict(index);
  }

  // 씬 한 개의 BG + (있으면) 캐릭터들을 로드 시작.
  #loadScene(index) {
    const scene = this.scenes[index];
    if (!scene) return;
    this.#image(DIR.bg + scene.bg);
    for (const c of scene.chars ?? []) this.#image(DIR.char + c.file);
  }

  // 현재 씬 기준 반경 밖 BG 엔트리를 캐시에서 제거. (캐릭터는 공유될 수 있어 보존)
  #evict(index) {
    const keep = new Set();
    for (let d = -this.preloadRadius; d <= this.preloadRadius; d++) {
      const s = this.scenes[index + d];
      if (s) keep.add(DIR.bg + s.bg);
    }
    for (const path of this.cache.keys()) {
      if (path.startsWith(DIR.bg) && !keep.has(path)) {
        const entry = this.cache.get(path);
        if (entry) entry.img.src = ''; // 브라우저가 디코드 버퍼를 회수하도록
        this.cache.delete(path);
      }
    }
  }
}
