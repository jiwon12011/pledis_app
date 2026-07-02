// ROOM:BLUE asset pipeline — docs/spec-assets.md §6~7
// 입력: assets/generated (원본 무수정) → 출력: app/public/opt + manifest.json
import { mkdir, readdir, writeFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
// sharp는 app/node_modules에 설치됨 — app 기준으로 해석
const sharp = createRequire(path.join(ROOT, 'app', 'package.json'))('sharp');
const SRC = path.join(ROOT, 'assets', 'generated');
const OUT = path.join(ROOT, 'app', 'public', 'opt');

const manifest = { v: 1, entries: {} };
const failures = [];

const ensure = (dir) => mkdir(dir, { recursive: true });

async function record(key, absPath, extra = {}) {
  const meta = await sharp(absPath).metadata();
  const { size } = await stat(absPath);
  manifest.entries[key] = { src: `opt/${key}.webp`, w: meta.width, h: meta.height, bytes: size, ...extra };
  return size;
}

async function lqipOf(srcPath) {
  const buf = await sharp(srcPath).resize(20, 20, { fit: 'inside' }).webp({ quality: 50 }).toBuffer();
  return `data:image/webp;base64,${buf.toString('base64')}`;
}

// ---------- 배경: 1280px 리사이즈 + lossy/lossless 중 작은 쪽 + 썸네일 + LQIP ----------
async function backgrounds() {
  const dir = path.join(SRC, 'backgrounds');
  await ensure(path.join(OUT, 'bg'));
  for (const file of (await readdir(dir)).filter((f) => f.endsWith('.png'))) {
    const name = file.replace('.png', '');
    const src = path.join(dir, file);
    const base = sharp(src).resize(1280, 1280, { fit: 'inside', kernel: 'nearest' });
    const [lossy, lossless] = await Promise.all([
      base.clone().webp({ quality: 82 }).toBuffer(),
      base.clone().webp({ lossless: true, effort: 6 }).toBuffer(),
    ]);
    const chosen = lossy.length <= lossless.length ? lossy : lossless;
    const outPath = path.join(OUT, 'bg', `${name}.webp`);
    await writeFile(outPath, chosen);
    await sharp(src).resize(256, 256, { fit: 'inside' }).webp({ quality: 75 })
      .toFile(path.join(OUT, 'bg', `${name}.thumb.webp`));
    const bytes = await record(`bg/${name}`, outPath, { lqip: await lqipOf(src), thumb: `opt/bg/${name}.thumb.webp` });
    if (bytes > 350 * 1024) failures.push(`bg/${name} ${(bytes / 1024) | 0}KB > 350KB`);
  }
}

// ---------- 픽셀 유틸 ----------
async function rawOf(srcPath) {
  const { data, info } = await sharp(srcPath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  return { data, w: info.width, h: info.height };
}
const fromRaw = ({ data, w, h }) => sharp(data, { raw: { width: w, height: h, channels: 4 } });

// 연결 요소 라벨링(8방향). mask(x,y)=true 픽셀 대상.
function components({ w, h }, mask) {
  const seen = new Uint8Array(w * h);
  const comps = [];
  const stack = [];
  for (let start = 0; start < w * h; start++) {
    if (seen[start] || !mask(start % w, (start / w) | 0)) continue;
    const comp = { minX: w, minY: h, maxX: 0, maxY: 0, count: 0, touchesEdge: false };
    stack.push(start);
    seen[start] = 1;
    while (stack.length) {
      const p = stack.pop();
      const x = p % w, y = (p / w) | 0;
      comp.count++;
      comp.minX = Math.min(comp.minX, x); comp.maxX = Math.max(comp.maxX, x);
      comp.minY = Math.min(comp.minY, y); comp.maxY = Math.max(comp.maxY, y);
      if (x === 0 || y === 0 || x === w - 1 || y === h - 1) comp.touchesEdge = true;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const nx = x + dx, ny = y + dy, np = ny * w + nx;
        if (nx >= 0 && ny >= 0 && nx < w && ny < h && !seen[np] && mask(nx, ny)) { seen[np] = 1; stack.push(np); }
      }
    }
    comp.pixels = collectPixels(comp, w, h, mask); // bbox 내 재수집은 비싸서 생략 가능하지만 제거용으로 필요
    comps.push(comp);
  }
  return comps;
}
function collectPixels(comp, w, h, mask) {
  const px = [];
  for (let y = comp.minY; y <= comp.maxY; y++)
    for (let x = comp.minX; x <= comp.maxX; x++) if (mask(x, y)) px.push(y * w + x);
  return px;
}

// 밝고 저채도(배경성) 픽셀 — 순백뿐 아니라 옅은 회청 잔재까지 키잉
const isNearWhite = (d, i) => {
  const mx = Math.max(d[i], d[i + 1], d[i + 2]), mn = Math.min(d[i], d[i + 1], d[i + 2]);
  return mn >= 235 && mx - mn <= 14;
};

// 픽셀아트 엣지를 보존하면서 용량을 줄이는 near-lossless 인코딩 (ch/cut/ui용)
const NEAR = { nearLossless: true, quality: 60 };

// ---------- 캐릭터: dance/slide 8px 링 마스크, 시트는 무보정, 전부 lossless ----------
async function characters() {
  const dir = path.join(SRC, 'characters');
  const files = (await readdir(dir)).filter((f) => f.endsWith('.png'));
  for (const file of files) {
    const name = file.replace('.png', '');
    if (name.startsWith('generic-') || name === 'character-reference') continue; // spec-assets §2: 사용 금지
    const isCut = name.startsWith('scene-');
    const outDir = path.join(OUT, isCut ? 'cut' : `ch/${name.slice(0, 2)}`);
    await ensure(outDir);
    const key = isCut ? `cut/${name}` : `ch/${name.slice(0, 2)}/${name.slice(3)}`;
    const src = path.join(dir, file);
    const outPath = path.join(OUT, `${key}.webp`);
    if (/-(walk|run)-sheet$/.test(name)) {
      // 시트 칸 경계에 구워진 흰 구분선 제거: 각 181px 칸의 좌우 4px + 상하 4px 소거
      const raw = await rawOf(src);
      const CELL = 181, M = 4;
      for (let y = 0; y < raw.h; y++) for (let x = 0; x < raw.w; x++) {
        const cx = x % CELL;
        if (cx < M || cx >= CELL - M || y < M || y >= raw.h - M) raw.data[(y * raw.w + x) * 4 + 3] = 0;
      }
      await fromRaw(raw).webp(NEAR).toFile(outPath);
    } else if (/-(dance|slide)$/.test(name)) {
      // 인접 프레임 잔상 제거: 최대 연결요소(본체)만 남기고, 좌우 가장자리에 닿는 조각을 지운다
      const raw = await rawOf(src);
      const solid = (x, y) => raw.data[(y * raw.w + x) * 4 + 3] > 16;
      const comps = components(raw, solid);
      const main = comps.reduce((a, b) => (b.count > a.count ? b : a), comps[0]);
      for (const c of comps) {
        if (c === main) continue;
        if (c.minX < 24 || c.maxX > raw.w - 24) for (const p of c.pixels) raw.data[p * 4 + 3] = 0;
      }
      await fromRaw(raw).webp(NEAR).toFile(outPath);
    } else {
      // 일부 포즈/컷 가장자리에 구워진 흰 경계선 제거 — 선이 가장자리에서 최대 ~10px 안쪽까지 존재해 12px 링 소거 (패딩 넉넉해 안전)
      const raw = await rawOf(src);
      const R = 12;
      for (let y = 0; y < raw.h; y++) for (let x = 0; x < raw.w; x++) {
        if (x < R || y < R || x >= raw.w - R || y >= raw.h - R) raw.data[(y * raw.w + x) * 4 + 3] = 0;
      }
      await fromRaw(raw).webp(NEAR).toFile(outPath);
    }
    await record(key, outPath);
  }
}

// ---------- 이펙트 ----------
async function effects() {
  const dir = path.join(SRC, 'effects');
  await ensure(path.join(OUT, 'fx'));

  // 슬라이스 가장자리의 구분선 잔재 소거용 링 클리어
  const ringClear = (raw, R = 3) => {
    for (let y = 0; y < raw.h; y++) for (let x = 0; x < raw.w; x++) {
      if (x < R || y < R || x >= raw.w - R || y >= raw.h - R) raw.data[(y * raw.w + x) * 4 + 3] = 0;
    }
    return raw;
  };
  const sliceRaw = async (raw, region) => {
    const buf = await fromRaw(raw).extract(region).raw().toBuffer();
    return ringClear({ data: buf, w: region.width, h: region.height });
  };

  // clouds: 2×2 슬라이스
  const cl = await rawOf(path.join(dir, 'effect-clouds.png'));
  const halves = [[0, 0], [1, 0], [0, 1], [1, 1]];
  for (let i = 0; i < 4; i++) {
    const [cx, cy] = halves[i];
    const outPath = path.join(OUT, 'fx', `cloud-${i + 1}.webp`);
    const part = await sliceRaw(cl, { left: cx * (cl.w >> 1), top: cy * (cl.h >> 1), width: cl.w >> 1, height: cl.h >> 1 });
    await fromRaw(part).webp({ lossless: true }).toFile(outPath);
    await record(`fx/cloud-${i + 1}`, outPath);
  }

  // fireworks: 가로 5등분
  const fw = await rawOf(path.join(dir, 'effect-fireworks.png'));
  for (let i = 0; i < 5; i++) {
    const left = Math.round((fw.w * i) / 5);
    const width = Math.round((fw.w * (i + 1)) / 5) - left;
    const outPath = path.join(OUT, 'fx', `firework-f${i + 1}.webp`);
    const part = await sliceRaw(fw, { left, top: 0, width, height: fw.h });
    await fromRaw(part).webp({ lossless: true }).toFile(outPath);
    await record(`fx/firework-f${i + 1}`, outPath);
  }

  // droplets: 화이트키 → 연결요소 → x 클러스터 → 6프레임
  const dr = await rawOf(path.join(dir, 'effect-water-droplets.png'));
  for (let i = 0; i < dr.w * dr.h; i++) if (isNearWhite(dr.data, i * 4)) dr.data[i * 4 + 3] = 0;
  for (let y = 0; y < 12; y++) for (let x = 0; x < dr.w; x++) dr.data[(y * dr.w + x) * 4 + 3] = 0; // 최상단 가로 띠 아티팩트 제거
  const opaque = (x, y) => dr.data[(y * dr.w + x) * 4 + 3] > 16;
  const comps = components(dr, opaque).filter((c) => c.count > 40);
  // 6열 고정 빈: 컴포넌트 중심 x가 속한 열로 병합 (프레임이 좌→우 배열임을 이용)
  const clusters = Array.from({ length: 6 }, () => null);
  for (const c of comps) {
    const bin = Math.min(5, Math.floor(((c.minX + c.maxX) / 2) / (dr.w / 6)));
    const cur = clusters[bin];
    clusters[bin] = cur
      ? { minX: Math.min(cur.minX, c.minX), maxX: Math.max(cur.maxX, c.maxX), minY: Math.min(cur.minY, c.minY), maxY: Math.max(cur.maxY, c.maxY) }
      : { minX: c.minX, maxX: c.maxX, minY: c.minY, maxY: c.maxY };
  }
  if (clusters.some((c) => !c)) failures.push(`droplet frames ${clusters.filter(Boolean).length} != 6`);
  for (let i = 0; i < clusters.length; i++) {
    const c = clusters[i];
    if (!c) continue;
    const pad = 4;
    const left = Math.max(0, c.minX - pad), top = Math.max(0, c.minY - pad);
    const width = Math.min(dr.w, c.maxX + pad + 1) - left, height = Math.min(dr.h, c.maxY + pad + 1) - top;
    const outPath = path.join(OUT, 'fx', `droplet-f${i + 1}.webp`);
    await fromRaw(dr).extract({ left, top, width, height }).webp({ lossless: true }).toFile(outPath);
    await record(`fx/droplet-f${i + 1}`, outPath, { bbox: { left, top, width, height } });
  }

  // umbrellas: mint/purple은 가장자리 접촉 불투명 백색 덩어리 제거
  for (const color of ['blue', 'mint', 'orange', 'pink', 'purple', 'red']) {
    const src = path.join(dir, `umbrella-color-${color}.png`);
    const outPath = path.join(OUT, 'fx', `umbrella-${color}.webp`);
    if (color === 'mint' || color === 'purple') {
      const um = await rawOf(src);
      const whiteOpaque = (x, y) => {
        const i = (y * um.w + x) * 4;
        return um.data[i + 3] >= 250 && isNearWhite(um.data, i);
      };
      for (const comp of components(um, whiteOpaque)) {
        if (comp.touchesEdge) for (const p of comp.pixels) um.data[p * 4 + 3] = 0;
      }
      await fromRaw(um).webp({ lossless: true }).toFile(outPath);
    } else {
      await sharp(src).webp({ lossless: true }).toFile(outPath);
    }
    await record(`fx/umbrella-${color}`, outPath);
  }
}

// ---------- UI ----------
async function ui() {
  const dir = path.join(SRC, 'ui');
  await ensure(path.join(OUT, 'ui'));
  for (const file of (await readdir(dir)).filter((f) => f.endsWith('.png'))) {
    const name = file.replace('.png', '');
    const outPath = path.join(OUT, 'ui', `${name}.webp`);
    if (name.startsWith('arrow-')) {
      // 화살표 에셋엔 버튼 외 장식 오브젝트가 섞여 있음 → 가장 크고 정사각에 가까운 덩어리(버튼)만 크롭
      const raw = await rawOf(path.join(dir, file));
      const solid = (x, y) => raw.data[(y * raw.w + x) * 4 + 3] > 16;
      const comps = components(raw, solid).filter((c) => c.count > 100);
      const best = comps.reduce((a, b) => (score(b) > score(a) ? b : a), comps[0]);
      const pad = 6;
      const left = Math.max(0, best.minX - pad), top = Math.max(0, best.minY - pad);
      await fromRaw(raw).extract({
        left, top,
        width: Math.min(raw.w, best.maxX + pad + 1) - left,
        height: Math.min(raw.h, best.maxY + pad + 1) - top,
      }).webp({ lossless: true }).toFile(outPath);
    } else {
      await sharp(path.join(dir, file)).webp({ lossless: true }).toFile(outPath);
    }
    await record(`ui/${name}`, outPath);
  }
}
const score = (c) => {
  const w = c.maxX - c.minX + 1, h = c.maxY - c.minY + 1;
  return c.count * (Math.min(w, h) / Math.max(w, h));
};

// ---------- 실행 + 검증 게이트 ----------
await ensure(OUT);
await backgrounds();
await characters();
await effects();
await ui();

const total = Object.values(manifest.entries).reduce((s, e) => s + e.bytes, 0);
if (total > 12 * 1024 * 1024) failures.push(`total ${(total / 1048576).toFixed(1)}MB > 12MB`);
await writeFile(path.join(OUT, 'manifest.json'), JSON.stringify(manifest));
console.log(`entries: ${Object.keys(manifest.entries).length}, total: ${(total / 1048576).toFixed(2)}MB`);
if (failures.length) {
  console.error('GATE FAILURES:\n' + failures.join('\n'));
  process.exit(1);
}
console.log('all gates passed');
