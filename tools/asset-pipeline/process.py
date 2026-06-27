#!/usr/bin/env python3
"""
TWS pixel cutscene — asset pipeline (perf-engineer)
SSOT: docs/기획서.md 5장(가드레일) + 3장(마스터 16색 팔레트)

Pipeline (기획서 5장 그대로):
  원본 → ① nearest-neighbor 다운스케일(Lanczos 금지, 픽셀 보존)
        → ② 16색 양자화(마스터 팔레트 고정 우선 / adaptive 16 폴백)
        → ③ 무손실 최적화(Pillow optimize; oxipng 미설치 → Pillow optimize 대체)
        → ④ 상한 초과 시 호출측에서 해상도/팔레트 감축
        → ⑤ pixelated 검증(identify로 dimensions/색수 확인)

원본(assets/generated/*)은 읽기 전용. 산출물은 동일 파일명으로 out_dir에 저장.

Usage:
  # 배경: 고정 캔버스 해상도로 resize
  process.py --kind bg --width 360 --height 640 --palette master OUTDIR file...
  # 캐릭터 스프라이트: 높이 기준 비율유지, 알파 보존
  process.py --kind sprite --height 100 --palette master OUTDIR file...
  # UI: 높이 기준 비율유지, 알파 보존
  process.py --kind ui --height 44 --palette master OUTDIR file...

--palette master  : 마스터 16색 고정 (cross-asset 색 일관성)
--palette adaptive: 이미지별 적응 16색 (식별성 우선)
"""
import argparse, os, sys, shutil, subprocess
from PIL import Image
import numpy as np

OXIPNG = shutil.which("oxipng")  # ③ 무손실 최적화: 있으면 oxipng -o max, 없으면 Pillow optimize


def lossless_opt(path):
    if OXIPNG:
        subprocess.run([OXIPNG, "-o", "max", "--strip", "safe", "-q", path],
                       check=False)

# === 마스터 16색 팔레트 (기획서 3장 hex) ===
MASTER_HEX = [
    "87CEEB",  # 하늘 밝음
    "4A9FD8",  # 하늘 중간
    "2E5F99",  # 하늘 어두움
    "7FFFD4",  # 민트(교복 셔츠)
    "1C2841",  # 남색(넥타이·바지)
    "FF8C42",  # 노을
    "F4A080",  # 살구(피부)
    "FFFACD",  # 구름 흰색
    "9E9E9E",  # 콘크리트 회색
    "1E90FF",  # 농구장 파랑
    "4A4A4A",  # 다크 그레이(아웃라인)
    "FFFFFF",  # 흰색
    "000000",  # 검은색
    "FF69B4",  # 홀로그램 핑크
    "9370DB",  # 홀로그램 퍼플
    "B0E0E6",  # 투명 우산(색만)
]
TRANSP_IDX = 255  # PNG-8 투명 인덱스 (16색은 0-15만 사용 → 255 자유)


def master_palette_image():
    pal = []
    for h in MASTER_HEX:
        pal += [int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16)]
    pal += [0, 0, 0] * (256 - len(MASTER_HEX))
    p = Image.new("P", (1, 1))
    p.putpalette(pal)
    return p


def nearest_resize(img, w, h):
    return img.resize((w, h), Image.NEAREST)


def quantize_rgb(rgb_img, palette_mode, colors=16):
    """RGB 이미지를 P모드(인덱스)로 양자화. dither 없음(픽셀아트)."""
    if palette_mode == "master":
        return rgb_img.quantize(palette=master_palette_image(), dither=Image.NONE)
    return rgb_img.quantize(colors=colors, method=Image.MEDIANCUT, dither=Image.NONE)


def target_dims(ow, oh, fit, width, height):
    """fit: exact=정확히 WxH / height=높이고정 폭 비율 / width=폭고정 높이 비율."""
    if fit == "exact":
        return width, height
    if fit == "width":
        return width, max(1, round(oh * width / ow))
    return max(1, round(ow * height / oh)), height  # height


def process_one(src, out_dir, kind, width, height, palette_mode, fit, alpha_thresh=128):
    img = Image.open(src)
    ow, oh = img.size
    has_alpha = img.mode in ("RGBA", "LA") or "transparency" in img.info

    # ① nearest 다운스케일 (비율 보존: fit 모드)
    tw, th = target_dims(ow, oh, fit, width, height)
    img = img.convert("RGBA") if has_alpha else img.convert("RGB")
    img = nearest_resize(img, tw, th)

    if has_alpha:
        arr = np.array(img)  # H,W,4
        alpha = arr[:, :, 3]
        mask = alpha >= alpha_thresh  # 픽셀아트 = 하드 엣지(이진 알파)
        rgb = Image.fromarray(arr[:, :, :3])
        # ② 양자화 (master면 16 그대로, adaptive면 투명 슬롯 위해 15색)
        q = quantize_rgb(rgb, palette_mode, colors=15)
        qa = np.array(q)
        qa[~mask] = TRANSP_IDX
        out = Image.fromarray(qa)
        out.putpalette(q.getpalette())
        out.info["transparency"] = TRANSP_IDX
    else:
        # ② 양자화
        out = quantize_rgb(img, palette_mode, colors=16)

    os.makedirs(out_dir, exist_ok=True)
    dst = os.path.join(out_dir, os.path.basename(src))
    # ③ 무손실 최적화 (Pillow optimize → oxipng -o max 추가 squeeze)
    out.save(dst, "PNG", optimize=True)
    lossless_opt(dst)
    nb = os.path.getsize(dst)
    ncolors = len(out.getcolors(maxcolors=300) or [])
    print(f"{os.path.basename(src):32s} {ow}x{oh} -> {tw}x{th}  {ncolors:2d}col  "
          f"{os.path.getsize(src):>9d} -> {nb:>7d} B ({nb/1024:5.1f}KB)")
    return nb


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--kind", required=True, choices=["bg", "sprite", "ui"])
    ap.add_argument("--width", type=int, default=360)
    ap.add_argument("--height", type=int, default=640)
    ap.add_argument("--fit", choices=["exact", "height", "width"], default=None,
                    help="기본: bg=exact, sprite/ui=height")
    ap.add_argument("--palette", default="master", choices=["master", "adaptive"])
    ap.add_argument("--alpha-thresh", type=int, default=128)
    ap.add_argument("out_dir")
    ap.add_argument("files", nargs="+")
    a = ap.parse_args()
    fit = a.fit or ("exact" if a.kind == "bg" else "height")
    total = 0
    for f in a.files:
        total += process_one(f, a.out_dir, a.kind, a.width, a.height,
                             a.palette, fit, a.alpha_thresh)
    print(f"{'TOTAL':32s} {'':18s}{'':9s}{'':5s}{total:>16d} B ({total/1024:.1f}KB)")


if __name__ == "__main__":
    main()
