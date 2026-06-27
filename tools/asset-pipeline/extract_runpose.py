#!/usr/bin/env python3
"""
run-sheet에서 캐릭터 1명의 깨끗한 단일 달리기 컷을 독립 PNG로 추출.
- 캐릭터들이 가로로 겹쳐(다리 뻗음) 한 덩어리로 연결됨 → 프레임 경계(=W/8) 부근
  알파밀도 '골짜기'에서 잘라 한 캐릭터 분리.
- crop 후 최대 연결성분만 남겨 옆 프레임 조각(발끝 등) 제거 → '옆 조각 0'.
- 출력: 풀해상도 클린 PNG(이후 process.py로 16색·120px·alpha·oxipng).

Usage: extract_runpose.py SHEET.png OUT_clean.png [--frames N]
"""
import argparse
from collections import deque
import numpy as np
from PIL import Image


def largest_component(mask):
    """boolean mask → 최대 4-연결 성분만 True인 mask 반환."""
    H, W = mask.shape
    seen = np.zeros_like(mask, bool)
    best = None; best_n = 0
    for sy in range(H):
        for sx in range(W):
            if mask[sy, sx] and not seen[sy, sx]:
                q = deque([(sy, sx)]); seen[sy, sx] = True; comp = []
                while q:
                    y, x = q.popleft(); comp.append((y, x))
                    for dy, dx in ((1,0),(-1,0),(0,1),(0,-1)):
                        ny, nx = y+dy, x+dx
                        if 0 <= ny < H and 0 <= nx < W and mask[ny, nx] and not seen[ny, nx]:
                            seen[ny, nx] = True; q.append((ny, nx))
                if len(comp) > best_n:
                    best_n = len(comp); best = comp
    out = np.zeros_like(mask, bool)
    if best:
        ys, xs = zip(*best); out[list(ys), list(xs)] = True
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("sheet"); ap.add_argument("out")
    ap.add_argument("--frames", type=int, default=8)
    ap.add_argument("--thresh", type=int, default=40)
    a = ap.parse_args()

    im = np.array(Image.open(a.sheet).convert("RGBA"))
    H, W = im.shape[:2]
    alpha = im[:, :, 3]
    mask = alpha > a.thresh
    dens = mask.sum(0).astype(int)            # 컬럼별 캐릭터 픽셀수
    fw = W / a.frames

    # 프레임 경계(1..frames-1) 부근 ±40px 골짜기 = 캐릭터 사이 컷
    cuts = [0]
    for b in range(1, a.frames):
        c = int(round(b * fw))
        lo, hi = max(0, c - 45), min(W, c + 45)
        cuts.append(lo + int(np.argmin(dens[lo:hi])))
    cuts.append(W)

    # 세그먼트(=프레임별 캐릭터). 양쪽 컷 밀도 합이 최소 = 이웃과 가장 깨끗이 분리
    best = None
    for i in range(a.frames):
        l, r = cuts[i], cuts[i + 1]
        if r - l < fw * 0.5:
            continue
        edge = dens[l] + dens[r - 1]          # 컷 경계에 걸친 픽셀(낮을수록 침범 적음)
        body = dens[l:r].sum()                # 본체 충실(클수록 온전한 포즈)
        score = edge - 0.01 * body
        if best is None or score < best[0]:
            best = (score, l, r)
    _, l, r = best

    sub = im[:, l:r].copy()
    submask = sub[:, :, 3] > a.thresh
    keep = largest_component(submask)         # 최대 성분만 = 한 캐릭터, 옆 조각 제거
    sub[~keep] = 0                            # 나머지 완전 투명

    # 타이트 bbox (발=하단 자동)
    ys = np.where(keep.any(1))[0]; xs = np.where(keep.any(0))[0]
    sub = sub[ys.min():ys.max()+1, xs.min():xs.max()+1]
    Image.fromarray(sub).save(a.out)
    print(f"{a.sheet.split('/')[-1]}: cut[{l}:{r}] -> {sub.shape[1]}x{sub.shape[0]} clean")


if __name__ == "__main__":
    main()
