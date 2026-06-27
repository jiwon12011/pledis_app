#!/usr/bin/env bash
# 전체 에셋 가공 (perf-engineer) — 855KB 가드레일 충족 구성
# 원본 assets/generated/* 읽기전용 → assets/processed/* 동일 구조·파일명
set -euo pipefail
cd "$(dirname "$0")/../.."
GB=assets/generated/backgrounds; GC=assets/generated/characters
PB=assets/processed/backgrounds;  PC=assets/processed/characters; PU=assets/processed/ui
PY="python3 tools/asset-pipeline/process.py"
M="--palette master"

# ── 배경 21 (≤35KB/장) ───────────────────────────────
# 세로 9:16 → 360x640 (캔버스 네이티브)
$PY --kind bg --fit exact --width 360 --height 640 $M "$PB" \
  "$GB"/scene-{01,02,03,04,05,06,09,11,12,13,14,16,17}-bg.png
# 가로 16:9 횡스크롤 → 높이 640(표시크기 1137x640 네이티브 = scale 1, 균일픽셀)
# 비정수 업스케일 "어른거림" 버그 방지 (기획서 5장: 런타임 비정수 스케일 금지)
$PY --kind bg --fit height --height 640 $M "$PB" \
  "$GB"/scene-{07,08,10,19,20}-bg.png
# 정사각 탑뷰 → 폭 360(360x360, 상하 패널 영역에 자연 정렬)
$PY --kind bg --fit width --width 360 $M "$PB" \
  "$GB"/scene-15-bg-topview.png "$GB"/scene-18-bg-topview.png "$GB"/scene-21-bg.png

# ── 씬 전용 스프라이트 ───────────────────────────────
# 단일 캐릭터 418² → 높이 280 (히어로 스케일)
$PY --kind sprite --fit height --height 280 $M "$PC" \
  "$GC"/scene-01-C1-planning.png "$GC"/scene-02-C1-sleeping.png \
  "$GC"/scene-03-C1-alarm-blurry.png "$GC"/scene-03-C1-alarm-swat.png \
  "$GC"/scene-04-C1-brush-wink.png "$GC"/scene-05-miniatures-six.png \
  "$GC"/scene-06-C1-tie-attempt1.png "$GC"/scene-06-C1-tie-attempt2.png "$GC"/scene-06-C1-tie-giveup.png
# 그룹/와이드 512x341 → 폭 300 (P1 풍부화 표정 예산 확보 위해 360→300 트레이드)
$PY --kind sprite --fit width --width 300 $M "$PC" \
  "$GC"/scene-07-cycling-three.png "$GC"/scene-08-running-sprint.png "$GC"/scene-08-sliding-skid.png \
  "$GC"/scene-09-bump-near.png "$GC"/scene-09-door-grab.png "$GC"/scene-10-jump-rooftop.png \
  "$GC"/scene-11-bus-window.png "$GC"/scene-12-basketball-pickup.png "$GC"/scene-12-hangrail-upside.png \
  "$GC"/scene-13-basketball-jump.png "$GC"/scene-14-waving-crowd.png "$GC"/scene-15-circle-sitting-topview.png \
  "$GC"/scene-16-waterdrop-falling.png "$GC"/scene-17-rain-dancing.png "$GC"/scene-17-rain-sliding.png \
  "$GC"/scene-18-umbrella-topview.png "$GC"/scene-19-sunset-cycling.png "$GC"/scene-20-ending-bridge.png
# 보너스(은닉) 씬21 V포즈 → 폭 300 (예산 마진 확보, 최저 우선순위)
$PY --kind sprite --fit width --width 300 $M "$PC" "$GC"/scene-21-vpose-bonus.png

# ── walk 시트 C1-C6 (정지=idle 베이크에 실사용, 프레임 높이 120) ──
# 주: run 시트는 코드에서 참조 제거됨(이동=runpose 독립 PNG, 정지폴백=walk 베이크) → 가공/추출 안 함(데드).
$PY --kind sprite --fit height --height 120 $M "$PC" "$GC"/C[1-6]-walk-sheet.png

# ── P1 풍부화: 표정 24 (C1-C6 × neutral/laugh/surprised/shy) 높이 100 ──
# 컷씬 반응(성공=laugh/실패=surprised/합류=shy)용. 855 캡 때문에 140→100 축소.
$PY --kind sprite --fit height --height 100 $M "$PC" \
  "$GC"/C[1-6]-expression-neutral.png "$GC"/C[1-6]-expression-laugh.png \
  "$GC"/C[1-6]-expression-surprised.png "$GC"/C[1-6]-expression-shy.png

# ── P3: dance ×6 (엔딩 6명 군무) + 합류 시그니처 동작 (높이 120) ──
# C4 시그니처=dance(위 포함), C1=플레이어. 시그니처: C2 자전거·C3 점프·C5 앉기·C6 손흔듦.
$PY --kind sprite --fit height --height 120 $M "$PC" \
  "$GC"/C[1-6]-dance.png "$GC"/C2-cycling.png "$GC"/C3-jump.png "$GC"/C5-sit.png "$GC"/C6-waving.png
# 주: waving은 C6만(시그니처). 나머지 멤버 waving은 미사용 → 미가공.

# ── 깨끗한 독립 달리기 컷 C1-C6 (run-sheet 프레임 침범 버그 우회) ──
# run-sheet 원본을 프레임단위로 자르면 캐릭터가 옆 프레임으로 삐져나와 잘림+옆조각.
# → 골짜기 컷 + 최대연결성분만 남겨 한 캐릭터 클린 추출 → C{n}-runpose.png(독립 이동 포즈).
# (가공본 run-sheet는 데드라 삭제됨. runpose는 generated 원본 시트에서 추출.)
TMP_RP="$(mktemp -d)"
for n in 1 2 3 4 5 6; do
  python3 tools/asset-pipeline/extract_runpose.py "$GC/C$n-run-sheet.png" "$TMP_RP/C$n-runpose.png"
done
$PY --kind sprite --fit height --height 120 $M "$PC" "$TMP_RP"/C[1-6]-runpose.png
rm -rf "$TMP_RP"

# ── UI 화살표 (높이 44) ──────────────────────────────
$PY --kind ui --fit height --height 44 $M "$PU" \
  "$GC"/../ui/arrow-left.png "$GC"/../ui/arrow-right.png
