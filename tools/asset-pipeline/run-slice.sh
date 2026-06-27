#!/usr/bin/env bash
# 챕터1 수직 슬라이스 에셋 가공 (perf-engineer)
# 원본 assets/generated/* 읽기전용 → 가공본 assets/processed/* 동일 파일명
# 전체 에셋 확장 시: glob만 바꿔 재실행 (예: C1-* → C*-*, scene-01..03 → scene-*)
set -euo pipefail
cd "$(dirname "$0")/../.."   # repo root
G=assets/generated
P=assets/processed
PY=tools/asset-pipeline/process.py

# 배경: 360x640 nearest, 마스터 16색, ≤35KB/장
python3 "$PY" --kind bg --width 360 --height 640 --palette master "$P/backgrounds" \
  "$G"/backgrounds/scene-01-bg.png "$G"/backgrounds/scene-02-bg.png "$G"/backgrounds/scene-03-bg.png

# 캐릭터 C1 풀세트: 높이 280, 비율유지, 알파 보존, 마스터 16색
# (사용자 피드백: 100px는 360x640 캔버스에서 너무 작음 → 화면 절반 이상 차지하는 280px)
python3 "$PY" --kind sprite --height 280 --palette master "$P/characters" \
  "$G"/characters/C1-*.png "$G"/characters/scene-03-C1-*.png

# UI 화살표: 높이 44
python3 "$PY" --kind ui --height 44 --palette master "$P/ui" \
  "$G"/ui/arrow-left.png "$G"/ui/arrow-right.png
