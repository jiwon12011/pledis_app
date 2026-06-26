# TWS 「첫 만남은 계획대로 되지 않아」 AI 이미지 생성 프롬프트 팩

> 모든 프롬프트는 복붙 가능한 완성형. Midjourney 기준(`--niji 6`), SD 대안은 E 섹션 참고.
> 토큰·팔레트·워크플로 근거는 `docs/기획서.md` 3·5장. 작성: designer / 2026-06-26

## 공통 규칙

**공통 스타일 프리픽스** (모든 프롬프트 맨 앞):
```
pixel art, retro 8-bit style, low-poly, Korean youth summer vibes, school uniform aesthetic, clear bright colors (sky blue #87CEEB, mint green #7FFFD4, navy #1C2841), warm sunset accents, warm skin tones, isometric slightly, cel-shaded anime influence, high contrast, crisp pixel edges, no antialiasing, cheerful nostalgic mood, cinematic composition
```

**공통 네거티브 프롬프트** (모든 프롬프트 뒤):
```
--no blur, no soft edges, no photorealism, no 3D rendering, no smooth gradients, no modern design, no watercolor, no oil painting, no realistic hands/faces, no text, no logos, no oversaturation, no neon (except intentional effects), no grayscale, no upscaled noise, low quality, blurry
```

**6멤버 식별 코드**:
- **C1**: 검은색 단발 직머리 + 투명 우산
- **C2**: 브라운 긴머리 웨이브 + 파란 백팩
- **C3**: 실버 단발 보브 + 흰 비니
- **C4**: 핑크-검정 투톤 긴머리 + 노란 이어버드
- **C5**: 밤색 긴머리 스트레이트 + 초록 팔찌
- **C6**: 오렌지레드 숏헤어 + 검은 캡

> **캐릭터 콘셉트**: 원본 TWS에 맞춘 **6인조 보이그룹**(남고생). 모든 프롬프트는 `teenage boy(s)` 기준. 식별 단서(머리색·소품)는 작은 픽셀에서도 6명 구분되도록 고정. 청춘·청량 하늘색 교복(민트 셔츠·남색 넥타이·남색 바지) 유지.

---

## A. 캐릭터

### A1. 마스터 캐릭터 시트 (Character Reference) — 1회만 생성, 이후 `--cref` 소스

```
pixel art, retro 8-bit style, low-poly, Korean youth summer vibes, school uniform aesthetic, clear bright colors (sky blue #87CEEB, mint green #7FFFD4, navy #1C2841), warm sunset accents, warm skin tones, isometric slightly, cel-shaded anime influence, high contrast, crisp pixel edges, no antialiasing, cheerful nostalgic mood, cinematic composition

Six teenage boys in school uniforms, standing side by side on a white background, each with distinct identities:
- C1 (left): black short straight hair, navy school uniform with mint collar, transparent umbrella in hand
- C2 (second): brown long wavy hair, navy uniform with mint collar, small blue backpack
- C3 (middle-left): silver/light gray short bob hair, white beanie hat, navy uniform, bright-eyed expression
- C4 (middle-right): two-tone pink and black long hair with color blocking, yellow earbuds, navy uniform, confident pose
- C5 (second from right): dark brown long straight hair, navy uniform with mint collar, green wristband visible
- C6 (right): orange-red short hair, black cap, navy uniform, cheerful expression
All characters showing full body, clear identifying accessories, bright color palette, pixel-art style, male students

--no blur, no soft edges, no photorealism, no 3D rendering, no smooth gradients, no modern design, no watercolor, no oil painting, no realistic hands/faces, no text, no logos, no oversaturation, no neon (except intentional effects), no grayscale, no upscaled noise, low quality, blurry

--ar 16:9 --niji 6 --s 600
```
**설명**: 6멤버 마스터 시트 · **권장**: 1024×576 생성 → 512×288 → 인덱스 PNG-8 · **파일명**: `character-reference.png` (이후 `--cref [이미지 ID]`)

---

### A2. C1~C6 개별 전신 스프라이트 (기본 포즈)

#### C1 (검은 단발, 투명 우산)
```
pixel art, retro 8-bit style, low-poly, Korean youth summer vibes, school uniform aesthetic, clear bright colors (sky blue #87CEEB, mint green #7FFFD4, navy #1C2841), warm sunset accents, warm skin tones, isometric slightly, cel-shaded anime influence, high contrast, crisp pixel edges, no antialiasing, cheerful nostalgic mood, cinematic composition

One teenage boy with black short straight hair, navy school uniform with mint green collar, holding a transparent umbrella, standing in neutral full-body pose, bright expression, transparent background, pixel art style, isolated character sprite

--no blur, no soft edges, no photorealism, no 3D rendering, no smooth gradients, no modern design, no watercolor, no oil painting, no realistic hands/faces, no text, no logos, no oversaturation, no neon (except intentional effects), no grayscale, no upscaled noise, low quality, blurry

--cref [character-reference.png ID] --cw 100 --niji 6 --s 500 --ar 1:1
```
**파일명**: `C1-standing.png` · **권장**: 1024×1280 생성 → 80×100 → 투명 PNG

#### C2 (브라운 웨이브, 파란 백팩)
```
pixel art, retro 8-bit style, low-poly, Korean youth summer vibes, school uniform aesthetic, clear bright colors (sky blue #87CEEB, mint green #7FFFD4, navy #1C2841), warm sunset accents, warm skin tones, isometric slightly, cel-shaded anime influence, high contrast, crisp pixel edges, no antialiasing, cheerful nostalgic mood, cinematic composition

One teenage boy with brown long wavy hair, navy school uniform with mint green collar, wearing a small blue backpack, standing in neutral full-body pose, happy expression, transparent background, pixel art style, isolated character sprite

--no blur, no soft edges, no photorealism, no 3D rendering, no smooth gradients, no modern design, no watercolor, no oil painting, no realistic hands/faces, no text, no logos, no oversaturation, no neon (except intentional effects), no grayscale, no upscaled noise, low quality, blurry

--cref [character-reference.png ID] --cw 100 --niji 6 --s 500 --ar 1:1
```
**파일명**: `C2-standing.png` · 80×100 투명 PNG

#### C3 (실버 보브, 흰 비니)
```
pixel art, retro 8-bit style, low-poly, Korean youth summer vibes, school uniform aesthetic, clear bright colors (sky blue #87CEEB, mint green #7FFFD4, navy #1C2841), warm sunset accents, warm skin tones, isometric slightly, cel-shaded anime influence, high contrast, crisp pixel edges, no antialiasing, cheerful nostalgic mood, cinematic composition

One teenage boy with silver/light gray short bob hair, white beanie hat, navy school uniform with mint green collar, standing in neutral full-body pose, bright-eyed expression, transparent background, pixel art style, isolated character sprite

--no blur, no soft edges, no photorealism, no 3D rendering, no smooth gradients, no modern design, no watercolor, no oil painting, no realistic hands/faces, no text, no logos, no oversaturation, no neon (except intentional effects), no grayscale, no upscaled noise, low quality, blurry

--cref [character-reference.png ID] --cw 100 --niji 6 --s 500 --ar 1:1
```
**파일명**: `C3-standing.png` · 80×100 투명 PNG

#### C4 (핑크-검정 투톤, 노란 이어버드)
```
pixel art, retro 8-bit style, low-poly, Korean youth summer vibes, school uniform aesthetic, clear bright colors (sky blue #87CEEB, mint green #7FFFD4, navy #1C2841), warm sunset accents, warm skin tones, isometric slightly, cel-shaded anime influence, high contrast, crisp pixel edges, no antialiasing, cheerful nostalgic mood, cinematic composition

One teenage boy with two-tone pink and black long hair with color blocking pattern, yellow earbuds, navy school uniform with mint green collar, standing in confident full-body pose, happy expression, transparent background, pixel art style, isolated character sprite

--no blur, no soft edges, no photorealism, no 3D rendering, no smooth gradients, no modern design, no watercolor, no oil painting, no realistic hands/faces, no text, no logos, no oversaturation, no neon (except intentional effects), no grayscale, no upscaled noise, low quality, blurry

--cref [character-reference.png ID] --cw 100 --niji 6 --s 500 --ar 1:1
```
**파일명**: `C4-standing.png` · 80×100 투명 PNG

#### C5 (밤색 스트레이트, 초록 팔찌)
```
pixel art, retro 8-bit style, low-poly, Korean youth summer vibes, school uniform aesthetic, clear bright colors (sky blue #87CEEB, mint green #7FFFD4, navy #1C2841), warm sunset accents, warm skin tones, isometric slightly, cel-shaded anime influence, high contrast, crisp pixel edges, no antialiasing, cheerful nostalgic mood, cinematic composition

One teenage boy with dark brown/maroon long straight hair, navy school uniform with mint green collar, wearing a green wristband accessory, standing in neutral full-body pose, gentle expression, transparent background, pixel art style, isolated character sprite

--no blur, no soft edges, no photorealism, no 3D rendering, no smooth gradients, no modern design, no watercolor, no oil painting, no realistic hands/faces, no text, no logos, no oversaturation, no neon (except intentional effects), no grayscale, no upscaled noise, low quality, blurry

--cref [character-reference.png ID] --cw 100 --niji 6 --s 500 --ar 1:1
```
**파일명**: `C5-standing.png` · 80×100 투명 PNG

#### C6 (오렌지레드, 검은 캡)
```
pixel art, retro 8-bit style, low-poly, Korean youth summer vibes, school uniform aesthetic, clear bright colors (sky blue #87CEEB, mint green #7FFFD4, navy #1C2841), warm sunset accents, warm skin tones, isometric slightly, cel-shaded anime influence, high contrast, crisp pixel edges, no antialiasing, cheerful nostalgic mood, cinematic composition

One teenage boy with orange-red short hair, black cap accessory, navy school uniform with mint green collar, standing in cheerful full-body pose, bright expression, transparent background, pixel art style, isolated character sprite

--no blur, no soft edges, no photorealism, no 3D rendering, no smooth gradients, no modern design, no watercolor, no oil painting, no realistic hands/faces, no text, no logos, no oversaturation, no neon (except intentional effects), no grayscale, no upscaled noise, low quality, blurry

--cref [character-reference.png ID] --cw 100 --niji 6 --s 500 --ar 1:1
```
**파일명**: `C6-standing.png` · 80×100 투명 PNG

---

### A3. 표정 포트레이트 (자막용 상반신) — 멤버당 4감정(기본/놀람/웃음/민망)

**고정 얼굴 디스크립터** (일관성 강화 — 모든 캐릭터 프롬프트(A2·A3·A4)에 해당 멤버 구절을 끼워넣어 컷마다 얼굴 튐 방지):
| 멤버 | 얼굴 디스크립터 (영문 anchor) |
|---|---|
| C1 | `round face, calm narrow eyes, straight brows, composed serene expression, quiet vibe` |
| C2 | `oval face, warm expressive eyes, gentle brows, friendly open smile, approachable vibe` |
| C3 | `soft angular face, bright large eyes, gentle brows, innocent enthusiastic expression, curious vibe` |
| C4 | `sharp angular face, confident bold eyes, defined sharp brows, cool confident expression, trendy vibe` |
| C5 | `gentle oval face, soft gazing eyes, soft brows, kind warm expression, gentle caring vibe` |
| C6 | `youthful round face, bright cheerful eyes, playful brows, energetic happy expression, lively vibe` |

#### C1 — 기본 (Neutral)
```
pixel art, retro 8-bit style, low-poly, Korean youth summer vibes, school uniform aesthetic, clear bright colors (sky blue #87CEEB, mint green #7FFFD4, navy #1C2841), warm sunset accents, warm skin tones, isometric slightly, cel-shaded anime influence, high contrast, crisp pixel edges, no antialiasing, cheerful nostalgic mood, cinematic composition

Close-up portrait of teenage boy C1 with black short straight hair, showing neutral calm facial expression, upper body only, navy school uniform with mint collar, bright natural eyes, transparent background, pixel art style, 8-bit illustration

--no blur, no soft edges, no photorealism, no 3D rendering, no smooth gradients, no modern design, no watercolor, no oil painting, no realistic hands/faces, no text, no logos, no oversaturation, no neon (except intentional effects), no grayscale, no upscaled noise, low quality, blurry

--cref [character-reference.png ID] --cw 80 --niji 6 --s 500 --ar 3:4
```
**파일명**: `C1-expression-neutral.png` · 768×1024 생성 → 64×85 → 투명 PNG

#### C1 — 놀람 (Surprised)
```
[PREFIX 동일]

Close-up portrait of teenage boy C1 with black short straight hair, showing shocked surprised expression with wide eyes and open mouth, upper body only, navy school uniform with mint collar, transparent background, pixel art style, 8-bit illustration

[NEGATIVE 동일]

--cref [character-reference.png ID] --cw 80 --niji 6 --s 500 --ar 3:4
```
**파일명**: `C1-expression-surprised.png`

#### C1 — 웃음 (Laugh)
```
[PREFIX 동일]

Close-up portrait of teenage boy C1 with black short straight hair, showing bright happy laughing expression with big smile and closed joyful eyes, upper body only, navy school uniform with mint collar, transparent background, pixel art style, 8-bit illustration

[NEGATIVE 동일]

--cref [character-reference.png ID] --cw 80 --niji 6 --s 500 --ar 3:4
```
**파일명**: `C1-expression-laugh.png`

#### C1 — 민망 (Shy/Embarrassed)
```
[PREFIX 동일]

Close-up portrait of teenage boy C1 with black short straight hair, showing embarrassed shy expression with slight smile and rosy cheeks, upper body only, navy school uniform with mint collar, downward gaze, transparent background, pixel art style, 8-bit illustration

[NEGATIVE 동일]

--cref [character-reference.png ID] --cw 80 --niji 6 --s 500 --ar 3:4
```
**파일명**: `C1-expression-shy.png`

> C1 4종은 위에 완성. 아래 C2~C6 × 4감정 = 20개 (얼굴 디스크립터 내장). 총 24개.

#### C2 — 기본/놀람/웃음/민망 (브라운 웨이브, 파란 백팩)
```
[PREFIX]

Close-up portrait of teenage boy C2 with brown long wavy hair, oval face, warm expressive eyes, gentle brows, friendly open smile, upper body only, navy school uniform with mint collar, blue backpack visible, transparent background, pixel art style, 8-bit illustration

[NEGATIVE]
--cref [character-reference.png ID] --cw 80 --niji 6 --s 500 --ar 3:4
```
감정별 교체: `friendly open smile` → (놀람) `showing shocked surprised expression with wide eyes and open mouth, gentle brows raised` / (웃음) `showing bright happy laughing expression with big smile and closed joyful eyes` / (민망) `showing embarrassed shy expression with slight smile and rosy cheeks, downward gaze`.
**파일명**: `C2-expression-{neutral|surprised|laugh|shy}.png`

#### C3 — 4감정 (실버 보브, 흰 비니)
```
[PREFIX]

Close-up portrait of teenage boy C3 with silver/light gray short bob hair, white beanie hat, soft angular face with bright large eyes, gentle brows, innocent enthusiastic expression, upper body only, navy school uniform with mint collar, transparent background, pixel art style, 8-bit illustration

[NEGATIVE]
--cref [character-reference.png ID] --cw 80 --niji 6 --s 500 --ar 3:4
```
감정별 교체: `innocent enthusiastic expression` → (놀람) `showing shocked surprised expression with wide eyes and open mouth` / (웃음) `showing bright happy laughing expression with big smile and closed joyful eyes` / (민망) `showing embarrassed shy expression with slight smile and rosy cheeks, downward gaze`.
**파일명**: `C3-expression-{neutral|surprised|laugh|shy}.png`

#### C4 — 4감정 (핑크-검정 투톤, 노란 이어버드)
```
[PREFIX]

Close-up portrait of teenage boy C4 with two-tone pink and black long hair with color blocking, sharp angular face with confident bold eyes, defined sharp brows, cool confident expression, upper body only, navy school uniform with mint collar, yellow earbuds visible, transparent background, pixel art style, 8-bit illustration

[NEGATIVE]
--cref [character-reference.png ID] --cw 80 --niji 6 --s 500 --ar 3:4
```
감정별 교체: `cool confident expression` → (놀람) `showing shocked surprised expression with wide eyes and open mouth` / (웃음) `showing bright happy laughing expression with big smile and closed joyful eyes` / (민망) `showing embarrassed shy expression with slight smile and rosy cheeks, downward gaze`.
**파일명**: `C4-expression-{neutral|surprised|laugh|shy}.png`

#### C5 — 4감정 (밤색 스트레이트, 초록 팔찌)
```
[PREFIX]

Close-up portrait of teenage boy C5 with dark brown/maroon long straight hair, gentle oval face with soft gazing eyes, soft brows, kind warm expression, upper body only, navy school uniform with mint collar, green wristband visible, transparent background, pixel art style, 8-bit illustration

[NEGATIVE]
--cref [character-reference.png ID] --cw 80 --niji 6 --s 500 --ar 3:4
```
감정별 교체: `kind warm expression` → (놀람) `showing shocked surprised expression with wide eyes and open mouth` / (웃음) `showing bright happy laughing expression with big smile and closed joyful eyes` / (민망) `showing embarrassed shy expression with slight smile and rosy cheeks, downward gaze`.
**파일명**: `C5-expression-{neutral|surprised|laugh|shy}.png`

#### C6 — 4감정 (오렌지레드 숏, 검은 캡)
```
[PREFIX]

Close-up portrait of teenage boy C6 with orange-red short hair, black cap accessory, youthful round face with bright cheerful eyes, playful brows, energetic happy expression, upper body only, navy school uniform with mint collar, transparent background, pixel art style, 8-bit illustration

[NEGATIVE]
--cref [character-reference.png ID] --cw 80 --niji 6 --s 500 --ar 3:4
```
감정별 교체: `energetic happy expression` → (놀람) `showing shocked surprised expression with wide eyes and open mouth` / (웃음) `showing bright happy laughing expression with big smile and closed joyful eyes` / (민망) `showing embarrassed shy expression with slight smile and rosy cheeks, downward gaze`.
**파일명**: `C6-expression-{neutral|surprised|laugh|shy}.png`

> `[PREFIX]`/`[NEGATIVE]`는 문서 상단 "공통 규칙"의 실제 문자열로 치환. C1 표정 프롬프트에도 위 C1 디스크립터(`round face, calm narrow eyes...`)를 끼워넣으면 일관성이 더 올라간다.

---

### A4. 씬별 특수 포즈 & 동작 스프라이트

#### 씬별 필요 포즈 맵
| 씬 | 제목 | 인원 | 필요 포즈 | 우선 |
|---|---|---|---|---|
| 01 | 완벽한 계획서 | C1 | 앉아서 계획표 작성·연필 떨어짐 | P1 |
| 02 | 밤을 베고 자다 | C1 | 책상에 엎드려 자기 | P1 |
| 03 | 알람과의 전쟁 | C1 | 알람 끄기(허우적)·핸드폰 내려치기 | P1 |
| 04 | 거울 속의 나 | C1 | 양치·거울 윙크 | P2 |
| 05 | 다이어리 속 작은 세계 | C1+미니6 | 미니 6명·한 명 발 헛딛음 | P1 |
| 06 | 완벽한 넥타이 | C1 | 넥타이(시도1/2/포기) | P2 |
| 07 | 페달을 밟으면 | C1,C2,C5 | 자전거·한 명 휘청 | P1 |
| 08 | 복도를 달려 | C1,C2,C5 | 달리기·미끄러짐 | P1 |
| 09 | 문 앞에서 굳다 | C1,C3 | 손잡이 동시·머리 부딪칠 뻔 | P2 |
| 10 | 옥상의 대형 | C1,C2,C3,C5 | 점프·한 명 반대 | P1 |
| 11 | 차창 너머 0.3초 | C1,C4 | 시선·안경 흘러내림 | P2 |
| 12 | 굴러온 농구공 | C1,C3,C6 | 공 줍기·봉 거꾸로 | P1 |
| 13 | 높이 뛰면 보인다 | C1~C5 | 5명 점프 슛 | P1 |
| 14 | 군중 속의 손 | C1~C6 | 6명 손 흔들기 | P2 |
| 15 | 바닥에 동그라미 | C1~C6 | 원형 앉기(탑뷰)·도미노 | P1 |
| 16 | 천장이 새기 시작 | C1~C6 | 올려다보기·받기 경직 | P1 |
| 17 | 비여도 괜찮아 | C1~C6 | 비 춤·미끄러짐 | P1 |
| 18 | 우산을 펼쳐 | C1~C6 | 우산 펼침(탑뷰)·뒤집힘 | P1 |
| 19 | 노을이 밀려온다 | C1~C6 | 자전거·팔 벌림·손 놓기 | P1 |
| 20 | 다리 위의 우리 | C1~C6 | 난간 기대·재채기→웃음 | P1 |
| 21 | (보너스) 첫 만남 | C1~C6 | V포즈 스탠딩 | P1 |

#### 씬01 — 계획표 작성 (C1)
```
pixel art, retro 8-bit style, low-poly, Korean youth summer vibes, school uniform aesthetic, clear bright colors (sky blue #87CEEB, mint green #7FFFD4, navy #1C2841), warm sunset accents, warm skin tones, isometric slightly, cel-shaded anime influence, high contrast, crisp pixel edges, no antialiasing, cheerful nostalgic mood, cinematic composition

Teenage character C1 with black short hair sitting at wooden desk, leaning forward concentrating on writing in planner with pencil, holding pencil down making checkmarks, serious determined expression, warm desk lamp light above, nighttime bedroom setting, pixel art style, side view

--no blur, no soft edges, no photorealism, no 3D rendering, no smooth gradients, no modern design, no watercolor, no oil painting, no realistic hands/faces, no text, no logos, no oversaturation, no neon (except intentional effects), no grayscale, no upscaled noise, low quality, blurry

--cref [character-reference.png ID] --cw 90 --niji 6 --s 500 --ar 1:1
```
**파일명**: `scene-01-C1-planning.png`

#### 씬02 — 엎드려 자기 (C1)
```
[PREFIX 동일]

Teenage character C1 with black short hair face-down sleeping at desk, head resting on planning paper, planner page sticking to cheek, peaceful sleeping expression, soft nighttime bedroom lighting, pixel art style

[NEGATIVE 동일]

--cref [character-reference.png ID] --cw 90 --niji 6 --s 500 --ar 1:1
```
**파일명**: `scene-02-C1-sleeping.png`

#### 씬03-A — 눈 못 뜬 채 알람 끄기 (C1)
```
[PREFIX 동일]

Teenage character C1 with black short hair in bed lying down with closed eyes squinting, arm reaching up blearily to silence alarm clock, barely awake sleepy expression, early morning bedroom dim lighting, pixel art style

[NEGATIVE 동일]

--cref [character-reference.png ID] --cw 90 --niji 6 --s 500 --ar 1:1
```
**파일명**: `scene-03-C1-alarm-blurry.png`

#### 씬03-B — 핸드폰 내려치기 (C1)
```
[PREFIX 동일]

Teenage character C1 with black short hair in bed, arm raised high swinging down to swat smartphone alarm, exasperated frustrated expression, phone about to be knocked over edge, early morning bedroom, pixel art style, action pose

[NEGATIVE 동일]

--cref [character-reference.png ID] --cw 90 --niji 6 --s 500 --ar 1:1
```
**파일명**: `scene-03-C1-alarm-swat.png`

#### 씬04 — 양치 윙크 (C1)
```
[PREFIX 동일]

Teenage character C1 with black short hair standing at bathroom sink, brushing teeth with toothbrush, one eye winking playfully at mirror, foamy mouth toothy grin, bright bathroom morning light, tile background, pixel art style

[NEGATIVE 동일]

--cref [character-reference.png ID] --cw 90 --niji 6 --s 500 --ar 1:1
```
**파일명**: `scene-04-C1-brush-wink.png`

#### 씬05 — 미니어처 6명 (축소 C1~C6)
```
[PREFIX 동일]

Six tiny miniature teenage boys standing on a paper map inside diary, each no more than 30 pixels tall, showing all six characters with distinct hair colors and accessories, one character with foot slipping mid-step, cute chibi proportions, diary paper texture background, pixel art isometric style, wide shot

[NEGATIVE 동일]

--niji 6 --s 500 --ar 16:9
```
**파일명**: `scene-05-miniatures-six.png` · 1024×576 → 320×180 투명 PNG

#### 씬06-A/B/C — 넥타이 (C1)
```
[PREFIX 동일]
(A 삐뚤) Teenage character C1 with black short hair standing at mirror adjusting navy school tie, tie visibly crooked tilted to one side, concentrated expression, morning bedroom mirror reflection, pixel art style
(B 재도전) ... adjusting navy school tie with both hands, tie still slightly bent, frustrated determined expression trying again ...
(C 포기) ... resigned shrug, navy school tie still crooked tilted, defeated amused expression, shoulder shrug gesture ...
[NEGATIVE 동일]
--cref [character-reference.png ID] --cw 90 --niji 6 --s 500 --ar 1:1
```
**파일명**: `scene-06-C1-tie-attempt1.png` / `-attempt2.png` / `-giveup.png`

#### 씬07 — 자전거 횡주행 (C1,C2,C5)
```
[PREFIX 동일]

Three teenage boys riding bicycles side by side on a school alley, C1 (black short hair) in front pedaling, C2 (brown wavy hair with blue backpack) in middle, C5 (dark brown long hair with green wristband) wobbling slightly to the side, morning bright natural light, horizontal scrolling perspective, pixel art style

[NEGATIVE 동일]

--cref [character-reference.png ID] --cw 95 --niji 6 --s 500 --ar 16:9
```
**파일명**: `scene-07-cycling-three.png` · 320×180 투명 PNG

#### 씬08-A/B — 달리기 / 미끄러짐 (C1,C2,C5)
```
[PREFIX 동일]
(A 달리기) Three teenage boys sprinting at full speed down a school hallway, C1 leading, C2 mid-run, C5 following close, dynamic leg positions arms pumping, bright window light streaks side, speed lines in background
(B 미끄러짐) Three teenage boys mid-skid on polished school hallway floor, feet slipping out about to fall, shocked expressions, arms windmilling for balance, school shoes sliding on shiny tile, comedic physics
[NEGATIVE 동일]
--cref [character-reference.png ID] --cw 95 --niji 6 --s 500 --ar 16:9
```
**파일명**: `scene-08-running-sprint.png` / `scene-08-sliding-skid.png`

#### 씬09-A/B — 문 손잡이 / 머리 부딪칠 뻔 (C1,C3)
```
[PREFIX 동일]
(A) Two teenage boys C1 (black short hair) and C3 (silver bob with white beanie) at classroom door, both reaching for the door handle at the exact same time, surprised expressions frozen mid-reach, awkward moment before collision
(B) ... leaning forward simultaneously to bow and greet at classroom door, heads nearly colliding together, startled embarrassed expressions, comedic
[NEGATIVE 동일]
--cref [character-reference.png ID] --cw 90 --niji 6 --s 500 --ar 1:1
```
**파일명**: `scene-09-door-grab.png` / `scene-09-bump-near.png`

#### 씬10 — 옥상 점프 (C1,C2,C3,C5)
```
[PREFIX 동일]

Four teenage boys jumping on school rooftop at peak of jump frozen mid-air, C1 (black hair) C2 (brown wavy) C3 (silver bob) C5 (dark brown) all airborne with joyful expressions, C5 jumping opposite direction facing away from others creating dynamic composition, bright morning sky light, pixel art jumping pose style

[NEGATIVE 동일]

--cref [character-reference.png ID] --cw 95 --niji 6 --s 500 --ar 1:1
```
**파일명**: `scene-10-jump-rooftop.png`

#### 씬11 — 버스 창 시선 (C1,C4)
```
[PREFIX 동일]

Two teenage boys at moment of eye contact through moving bus window, C1 (black short hair) outside on street, C4 (pink black two-tone long hair with yellow earbuds) inside bus window, looking directly at each other across glass, melancholic brief connection, C4 wearing glasses slightly slipping down his nose, pixel art style

[NEGATIVE 동일]

--cref [character-reference.png ID] --cw 90 --niji 6 --s 500 --ar 1:1
```
**파일명**: `scene-11-bus-window.png`

#### 씬12-A/B — 공 줍기 / 봉 거꾸로 (C1,C3,C6)
```
[PREFIX 동일]
(A) Three teenage boys on subway train car, C1 bending down to pick up rolling basketball, C3 (silver bob) and C6 (orange-red short hair with black cap) watching nearby, surprised expressions, metal handrail visible
(B) One teenage boy C6 hanging upside down from subway handrail, 180 degrees inverted suspended position, shocked expression mid-tumble, legs up hair flowing down, comedic acrobatic, train interior metal bar
[NEGATIVE 동일]
--cref [character-reference.png ID] --cw 90 --niji 6 --s 500 --ar 1:1
```
**파일명**: `scene-12-basketball-pickup.png` / `scene-12-hangrail-upside.png`

#### 씬13 — 농구 점프 슛 (C1~C5)
```
[PREFIX 동일]

Five teenage boys on school rooftop basketball court all jumping simultaneously for shot at peak height, C1 C2 C3 C4 C5 with distinct hair colors all airborne synchronized jump pose, basketball rim and bright afternoon sky, pixel art slam dunk moment style, slow-motion peak action

[NEGATIVE 동일]

--cref [character-reference.png ID] --cw 95 --niji 6 --s 500 --ar 1:1
```
**파일명**: `scene-13-basketball-jump.png`

#### 씬14 — 손 흔들기 6명 (C1~C6)
```
[PREFIX 동일]

Six teenage boys in crowded school gymnasium auditorium, each waving hand to camera with happy expressions, C1 C2 C3 C4 C5 C6 all distinct with their unique hair colors and accessories, surrounded by blurred crowd background, standing at different heights, pixel art crowd scene style

[NEGATIVE 동일]

--cref [character-reference.png ID] --cw 95 --niji 6 --s 500 --ar 1:1
```
**파일명**: `scene-14-waving-crowd.png`

#### 씬15 — 탑뷰 원형 앉기 (C1~C6)
```
[PREFIX 동일]

Top-down view of six teenage boys sitting in perfect circle on school hallway floor, C1 C2 C3 C4 C5 C6 each facing inward toward center, relaxed sitting postures catching breaths, one character C4 leaning against another creating domino topple moment, viewed from directly above, pixel art isometric top-down style

[NEGATIVE 동일]

--cref [character-reference.png ID] --cw 95 --niji 6 --s 500 --ar 1:1
```
**파일명**: `scene-15-circle-sitting-topview.png` · 320×320 투명 PNG

#### 씬16 — 물방울 맞기 (C1~C6)
```
[PREFIX 동일]

Six teenage boys looking up at gymnasium ceiling leak, water droplets falling from above, all six C1 C2 C3 C4 C5 C6 with shocked surprised expressions tilting heads back, arms raised trying to catch water drops, shocked moment before water cascade, pixel art indoor gymnasium, concerned faces

[NEGATIVE 동일]

--cref [character-reference.png ID] --cw 95 --niji 6 --s 500 --ar 1:1
```
**파일명**: `scene-16-waterdrop-falling.png`

#### 씬17-A/B — 비 춤 / 미끄러짐 (C1~C6)
```
[PREFIX 동일]
(A) Six teenage boys dancing and jumping in heavy rain inside gymnasium, all silhouetted against rainstorm, dynamic dancing jumping poses, rain streaks all around, joyful energetic movement
(B) Six teenage boys sliding on wet gymnasium floor in rain, feet slipping, surprised and laughing expressions, one losing balance mid-slip, dynamic falling poses, wet tile ground reflecting light
[NEGATIVE 동일]
--cref [character-reference.png ID] --cw 95 --niji 6 --s 500 --ar 1:1
```
**파일명**: `scene-17-rain-dancing.png` / `scene-17-rain-sliding.png`

#### 씬18 — 탑뷰 우산 펼치기 (C1~C6)
```
[PREFIX 동일]

Top-down view of six teenage boys in gymnasium standing in circle formation, each holding up opening transparent umbrellas in synchronized motion, creating perfect hexagon/circle pattern from above, one umbrella inverted flipping wrong direction, rainy background, pixel art top-down isometric umbrella formation style

[NEGATIVE 동일]

--cref [character-reference.png ID] --cw 95 --niji 6 --s 500 --ar 1:1
```
**파일명**: `scene-18-umbrella-topview.png` · 320×320 투명 PNG

#### 씬19 — 노을 자전거 팔 벌림 (C1~C6)
```
pixel art, retro 8-bit style, low-poly, Korean youth summer vibes, school uniform aesthetic, clear bright colors (sky blue #87CEEB, mint green #7FFFD4, navy #1C2841), warm sunset accents (#FF8C42), warm sunset golden hour light, warm skin tones, isometric slightly, cel-shaded anime influence, high contrast, crisp pixel edges, no antialiasing, cheerful nostalgic mood, cinematic composition

Six teenage boys riding bicycles slowly in a line across a scenic sunset street, all facing camera with arms spread wide open in freedom joy, sunset golden orange light (#FF8C42) dominating sky behind silhouettes, C1 C2 C3 C4 C5 C6 on bikes in procession, peaceful slow movement, pixel art sunset golden hour romantic style

[NEGATIVE 동일]

--cref [character-reference.png ID] --cw 95 --niji 6 --s 500 --ar 16:9
```
**파일명**: `scene-19-sunset-cycling.png` · 320×180 투명 PNG

#### 씬20 — 난간 기대 엔딩샷 (C1~C6)
```
[PREFIX + sunset accents (#FF8C42), golden hour 동일]

Six teenage boys standing in a line on a pedestrian bridge leaning against railing, all facing camera with smiling warm expressions at sunset, golden sunset light (#FF8C42) behind creating silhouettes, C1 C2 C3 C4 C5 C6 close together waving hands, one character mid-sneeze then laughing, perfect ending shot moment, pixel art sunset bridge golden hour style

[NEGATIVE 동일]

--cref [character-reference.png ID] --cw 95 --niji 6 --s 500 --ar 16:9
```
**파일명**: `scene-20-ending-bridge.png` · 320×180 투명 PNG

#### 씬21 (보너스) — V포즈 스탠딩 (C1~C6)
```
[PREFIX 동일]

Six teenage boys standing full-body in victorious V-sign victory pose directly facing camera, all C1 C2 C3 C4 C5 C6 with giant smiles making peace signs with hands, perfect 8-bit pixel art standing formation, simple solid bright clean background, cheerful celebratory victory pose style, all wearing school uniforms with their signature accessories clear

[NEGATIVE 동일]

--cref [character-reference.png ID] --cw 95 --niji 6 --s 550 --ar 1:1
```
**파일명**: `scene-21-vpose-bonus.png`

---

### A5. 공용 포즈 (Generic, 각 1개)
공통 본문: `One teenage boy ... navy school uniform with mint collar ... transparent background, pixel art style` + `--cref [character-reference.png ID] --cw 100 --niji 6 --s 500 --ar 1:1`

| 포즈 | 본문 핵심 | 파일명 |
|---|---|---|
| 서기 | `simple standing neutral pose at attention, relaxed natural stance arms at sides, bright friendly expression` | `generic-standing.png` |
| 걷기 | `walking mid-stride pose, left leg forward right leg back natural walking gait, arms swinging naturally` | `generic-walking.png` |
| 달리기 | `running sprint pose, legs in dynamic running stride, arms pumping forward for speed, determined athletic stance` | `generic-running.png` |
| 자전거 | `sitting on bicycle seat pedaling, hands on handlebars, legs in pedaling motion, side view riding posture` | `generic-cycling.png` |
| 손 흔들기 | `waving hand friendly greeting gesture, one arm raised up waving, happy welcoming smile, full body` | `generic-waving.png` |

> 걷기·달리기는 단일 포즈가 아니라 **스프라이트 시트**로 뽑는다(motion: 8fps). 프레임 간 캐릭터 크기·베이스라인 고정이 픽셀 정합의 핵심.

#### 걷기 스프라이트 시트 (8프레임 가로 스트립)
```
pixel art, retro 8-bit style, low-poly, Korean youth summer vibes, school uniform aesthetic, clear bright colors (sky blue #87CEEB, mint green #7FFFD4, navy #1C2841), warm sunset accents, warm skin tones, isometric slightly, cel-shaded anime influence, high contrast, crisp pixel edges, no antialiasing, cheerful nostalgic mood, cinematic composition

Animated walking motion sprite sheet showing one teenage boy character in school uniform walking from left to right, 8 animation frames arranged horizontally in a single row strip, natural walking gait with alternating leg positions and swinging arms, consistent character size and baseline alignment across all frames for pixel-perfect spriting, side profile view, bright confident posture, transparent background, pixel art walking cycle style

--no blur, no soft edges, no photorealism, no 3D rendering, no smooth gradients, no modern design, no watercolor, no oil painting, no realistic hands/faces, no text, no logos, no oversaturation, no neon (except intentional effects), no grayscale, no upscaled noise, low quality, blurry

--niji 6 --s 500 --ar 8:1
```
**파일명**: `generic-walk-sheet.png` · 640×80 (8×1, 각 80×80) · 프레임 간 발위치·머리높이 고정

#### 달리기 스프라이트 시트 (8프레임 가로 스트립)
```
pixel art, retro 8-bit style, low-poly, Korean youth summer vibes, school uniform aesthetic, clear bright colors (sky blue #87CEEB, mint green #7FFFD4, navy #1C2841), warm sunset accents, warm skin tones, isometric slightly, cel-shaded anime influence, high contrast, crisp pixel edges, no antialiasing, cheerful nostalgic mood, cinematic composition

Animated running motion sprite sheet showing one teenage boy character in school uniform sprinting from left to right, 8 animation frames arranged horizontally in a single row strip, dynamic running stride with high leg lift and pumping arms, consistent character size and baseline alignment across all frames for pixel-perfect spriting, side profile athletic pose, determined energetic expression, transparent background, pixel art running cycle style

--no blur, no soft edges, no photorealism, no 3D rendering, no smooth gradients, no modern design, no watercolor, no oil painting, no realistic hands/faces, no text, no logos, no oversaturation, no neon (except intentional effects), no grayscale, no upscaled noise, low quality, blurry

--niji 6 --s 500 --ar 8:1
```
**파일명**: `generic-run-sheet.png` · 640×80 (8×1, 각 80×80) · 프레임 간 발위치·머리높이·팔스윙·y베이스라인 일관

---

## B. 배경 (21씬) — 캐릭터 없는 풀씬 (복붙 완성형)

> 인물 없음("no characters"). 시간대 진행: 밤(01~02)→새벽(03)→아침(04~06)→낮(07~14)→비/저녁(16~18)→노을(19~20)→축제(21). 세로 9:16 / 횡스크롤·와이드(07·08·19·20) 16:9 / 탑뷰(15·18) 1:1. 전부 `--niji 6 --s 500`, 인덱스 PNG-8 ≤35KB.

### 씬01 — 완벽한 계획서 (밤 책상)
```
pixel art, retro 8-bit style, low-poly, Korean youth summer vibes, school uniform aesthetic, clear bright colors (sky blue #87CEEB, mint green #7FFFD4, navy #1C2841), warm sunset accents, warm skin tones, isometric slightly, cel-shaded anime influence, high contrast, crisp pixel edges, no antialiasing, cheerful nostalgic mood, cinematic composition

Bedroom desk at night with warm desk lamp illuminating a wooden study desk, planner and pencils scattered on surface, comfortable office chair beside, soft yellow warm lamp light (#F4A080 glow) casting against dark window behind, cozy intimate study space atmosphere, night-time interior, no characters, pixel art style

--no blur, no soft edges, no photorealism, no 3D rendering, no smooth gradients, no modern design, no watercolor, no oil painting, no realistic hands/faces, no text, no logos, no oversaturation, no neon (except intentional effects), no grayscale, no upscaled noise, low quality, blurry

--ar 9:16 --niji 6 --s 500
```
576×1024 → 320×480 · `scene-01-bg.png`

### 씬02 — 밤을 베고 자다 (침실 늦밤)
```
pixel art, retro 8-bit style, low-poly, Korean youth summer vibes, school uniform aesthetic, clear bright colors (sky blue #87CEEB, mint green #7FFFD4, navy #1C2841), warm sunset accents, warm skin tones, isometric slightly, cel-shaded anime influence, high contrast, crisp pixel edges, no antialiasing, cheerful nostalgic mood, cinematic composition

Bedroom interior nighttime with single bed with rumpled white sheets, wooden desk beside it with homework scattered, soft nighttime cool blue lighting (#4A9FD8) filtering through closed window, warm desk lamp corner light still on, sleeping atmosphere, no characters, pixel art style

--no blur, no soft edges, no photorealism, no 3D rendering, no smooth gradients, no modern design, no watercolor, no oil painting, no realistic hands/faces, no text, no logos, no oversaturation, no neon (except intentional effects), no grayscale, no upscaled noise, low quality, blurry

--ar 9:16 --niji 6 --s 500
```
576×1024 → 320×480 · `scene-02-bg.png`

### 씬03 — 알람과의 전쟁 (새벽 침실)
```
pixel art, retro 8-bit style, low-poly, Korean youth summer vibes, school uniform aesthetic, clear bright colors (sky blue #87CEEB, mint green #7FFFD4, navy #1C2841), warm sunset accents, warm skin tones, isometric slightly, cel-shaded anime influence, high contrast, crisp pixel edges, no antialiasing, cheerful nostalgic mood, cinematic composition

Bedroom at early dawn with soft purple-blue twilight atmosphere (#2E5F99 sky) before sunrise entering through window, bed positioned in center frame, alarm clock on nightstand glowing urgently, first light of dawn barely visible outside, sleepy half-awake atmosphere, no characters, pixel art style

--no blur, no soft edges, no photorealism, no 3D rendering, no smooth gradients, no modern design, no watercolor, no oil painting, no realistic hands/faces, no text, no logos, no oversaturation, no neon (except intentional effects), no grayscale, no upscaled noise, low quality, blurry

--ar 9:16 --niji 6 --s 500
```
576×1024 → 320×480 · `scene-03-bg.png`

### 씬04 — 거울 속의 나 (아침 욕실)
```
pixel art, retro 8-bit style, low-poly, Korean youth summer vibes, school uniform aesthetic, clear bright colors (sky blue #87CEEB, mint green #7FFFD4, navy #1C2841), warm sunset accents, warm skin tones, isometric slightly, cel-shaded anime influence, high contrast, crisp pixel edges, no antialiasing, cheerful nostalgic mood, cinematic composition

Bathroom with white ceramic sink counter and large round mirror, light blue-gray tile walls clean and bright, warm morning natural light (#87CEEB tinted) streaming in, toothbrush holder on counter, soap bubbles floating near mirror surface, morning bathroom preparation space, no characters, pixel art style

--no blur, no soft edges, no photorealism, no 3D rendering, no smooth gradients, no modern design, no watercolor, no oil painting, no realistic hands/faces, no text, no logos, no oversaturation, no neon (except intentional effects), no grayscale, no upscaled noise, low quality, blurry

--ar 9:16 --niji 6 --s 500
```
576×1024 → 320×480 · `scene-04-bg.png`

### 씬05 — 다이어리 속 작은 세계 (미니어처 지도)
```
pixel art, retro 8-bit style, low-poly, Korean youth summer vibes, school uniform aesthetic, clear bright colors (sky blue #87CEEB, mint green #7FFFD4, navy #1C2841), warm sunset accents, warm skin tones, isometric slightly, cel-shaded anime influence, high contrast, crisp pixel edges, no antialiasing, cheerful nostalgic mood, cinematic composition

Opened diary on wooden desk with decorative colored paper pages, intricate map design on inner page showing miniature landscape with tiny trees and roads and pathways drawn in detail, diorama effect creating depth illusion, storybook magical atmosphere, no characters, pixel art style

--no blur, no soft edges, no photorealism, no 3D rendering, no smooth gradients, no modern design, no watercolor, no oil painting, no realistic hands/faces, no text, no logos, no oversaturation, no neon (except intentional effects), no grayscale, no upscaled noise, low quality, blurry

--ar 9:16 --niji 6 --s 500
```
576×1024 → 320×480 · `scene-05-bg.png`

### 씬06 — 완벽한 넥타이 (아침 방 거울)
```
pixel art, retro 8-bit style, low-poly, Korean youth summer vibes, school uniform aesthetic, clear bright colors (sky blue #87CEEB, mint green #7FFFD4, navy #1C2841), warm sunset accents, warm skin tones, isometric slightly, cel-shaded anime influence, high contrast, crisp pixel edges, no antialiasing, cheerful nostalgic mood, cinematic composition

Bedroom with full-length standing mirror reflecting room, wooden wardrobe cabinet beside, bright morning sunlight (#87CEEB golden tint) streaming in through window, well-lit mirror space with smooth reflection surface ready, morning preparation space, no characters, pixel art style

--no blur, no soft edges, no photorealism, no 3D rendering, no smooth gradients, no modern design, no watercolor, no oil painting, no realistic hands/faces, no text, no logos, no oversaturation, no neon (except intentional effects), no grayscale, no upscaled noise, low quality, blurry

--ar 9:16 --niji 6 --s 500
```
576×1024 → 320×480 · `scene-06-bg.png`

### 씬07 — 페달을 밟으면 (아침 골목 횡스크롤)
```
pixel art, retro 8-bit style, low-poly, Korean youth summer vibes, school uniform aesthetic, clear bright colors (sky blue #87CEEB, mint green #7FFFD4, navy #1C2841), warm sunset accents, warm skin tones, isometric slightly, cel-shaded anime influence, high contrast, crisp pixel edges, no antialiasing, cheerful nostalgic mood, cinematic composition

Suburban narrow alley street between residential buildings for horizontal scrolling perspective, bright morning sunlight (#87CEEB) creating long shadows on pavement cycling roadway, trees lining both sides of path, fresh morning atmosphere, no characters, pixel art horizontal scene

--no blur, no soft edges, no photorealism, no 3D rendering, no smooth gradients, no modern design, no watercolor, no oil painting, no realistic hands/faces, no text, no logos, no oversaturation, no neon (except intentional effects), no grayscale, no upscaled noise, low quality, blurry

--ar 16:9 --niji 6 --s 500
```
1024×576 → 320×180 · `scene-07-bg.png`

### 씬08 — 복도를 달려 (학교 복도 속도감)
```
pixel art, retro 8-bit style, low-poly, Korean youth summer vibes, school uniform aesthetic, clear bright colors (sky blue #87CEEB, mint green #7FFFD4, navy #1C2841), warm sunset accents, warm skin tones, isometric slightly, cel-shaded anime influence, high contrast, crisp pixel edges, no antialiasing, cheerful nostalgic mood, cinematic composition

School hallway corridor stretching forward with rows of large windows on one side bright morning natural light creating speed lines, polished white and gray (#9E9E9E) tile floor reflecting window light, doorways spaced along hallway walls, speed line perspective effect, no characters, pixel art style

--no blur, no soft edges, no photorealism, no 3D rendering, no smooth gradients, no modern design, no watercolor, no oil painting, no realistic hands/faces, no text, no logos, no oversaturation, no neon (except intentional effects), no grayscale, no upscaled noise, low quality, blurry

--ar 16:9 --niji 6 --s 500
```
1024×576 → 320×180 · `scene-08-bg.png`

### 씬09 — 문 앞에서 굳다 (교실 문 앞)
```
pixel art, retro 8-bit style, low-poly, Korean youth summer vibes, school uniform aesthetic, clear bright colors (sky blue #87CEEB, mint green #7FFFD4, navy #1C2841), warm sunset accents, warm skin tones, isometric slightly, cel-shaded anime influence, high contrast, crisp pixel edges, no antialiasing, cheerful nostalgic mood, cinematic composition

Classroom wooden door exterior hallway view with glass window panel on door, school hallway floor and clean white walls, morning school interior bright natural light, focused on door handle and frame, clean bright school atmosphere, no characters, pixel art style

--no blur, no soft edges, no photorealism, no 3D rendering, no smooth gradients, no modern design, no watercolor, no oil painting, no realistic hands/faces, no text, no logos, no oversaturation, no neon (except intentional effects), no grayscale, no upscaled noise, low quality, blurry

--ar 9:16 --niji 6 --s 500
```
576×1024 → 320×480 · `scene-09-bg.png`

### 씬10 — 옥상의 대형 (맑은 낮 하늘)
```
pixel art, retro 8-bit style, low-poly, Korean youth summer vibes, school uniform aesthetic, clear bright colors (sky blue #87CEEB, mint green #7FFFD4, navy #1C2841), warm sunset accents, warm skin tones, isometric slightly, cel-shaded anime influence, high contrast, crisp pixel edges, no antialiasing, cheerful nostalgic mood, cinematic composition

Rooftop of school building in bright sunny midday with clear brilliant sky (#87CEEB) overhead dominating frame, concrete and metal rooftop railings and safety edges visible, wide open unobstructed sky view, joyful optimistic daytime atmosphere, no characters, pixel art style

--no blur, no soft edges, no photorealism, no 3D rendering, no smooth gradients, no modern design, no watercolor, no oil painting, no realistic hands/faces, no text, no logos, no oversaturation, no neon (except intentional effects), no grayscale, no upscaled noise, low quality, blurry

--ar 9:16 --niji 6 --s 500
```
576×1024 → 320×480 · `scene-10-bg.png`

### 씬11 — 차창 너머 0.3초 (버스 내부)
```
pixel art, retro 8-bit style, low-poly, Korean youth summer vibes, school uniform aesthetic, clear bright colors (sky blue #87CEEB, mint green #7FFFD4, navy #1C2841), warm sunset accents, warm skin tones, isometric slightly, cel-shaded anime influence, high contrast, crisp pixel edges, no antialiasing, cheerful nostalgic mood, cinematic composition

Bus interior cabin window view showing urban street passing by during motion, comfortable bus seats rows visible, window glass pane with urban street shops and scenery visible outside, traveling transit moment, no characters, pixel art style

--no blur, no soft edges, no photorealism, no 3D rendering, no smooth gradients, no modern design, no watercolor, no oil painting, no realistic hands/faces, no text, no logos, no oversaturation, no neon (except intentional effects), no grayscale, no upscaled noise, low quality, blurry

--ar 9:16 --niji 6 --s 500
```
576×1024 → 320×480 · `scene-11-bg.png`

### 씬12 — 굴러온 농구공 (지하철 내부)
```
pixel art, retro 8-bit style, low-poly, Korean youth summer vibes, school uniform aesthetic, clear bright colors (sky blue #87CEEB, mint green #7FFFD4, navy #1C2841), warm sunset accents, warm skin tones, isometric slightly, cel-shaded anime influence, high contrast, crisp pixel edges, no antialiasing, cheerful nostalgic mood, cinematic composition

Subway train car interior with bright fluorescent ceiling lights, multiple rows of seats arranged neatly, metal handrails and poles vertical throughout cabin, side window reflecting interior cabin space, clean modern transit vehicle interior, no characters, pixel art style

--no blur, no soft edges, no photorealism, no 3D rendering, no smooth gradients, no modern design, no watercolor, no oil painting, no realistic hands/faces, no text, no logos, no oversaturation, no neon (except intentional effects), no grayscale, no upscaled noise, low quality, blurry

--ar 9:16 --niji 6 --s 500
```
576×1024 → 320×480 · `scene-12-bg.png`

### 씬13 — 높이 뛰면 보인다 (옥상 농구장)
```
pixel art, retro 8-bit style, low-poly, Korean youth summer vibes, school uniform aesthetic, clear bright colors (sky blue #87CEEB, mint green #7FFFD4, navy #1C2841), warm sunset accents, warm skin tones, isometric slightly, cel-shaded anime influence, high contrast, crisp pixel edges, no antialiasing, cheerful nostalgic mood, cinematic composition

School rooftop outdoor basketball court in bright midday sunshine with clear blue sky (#87CEEB), basketball hoop rim and backboard clearly visible, white court boundary lines marked on ground, wide open joyful daytime sports facility, no characters, pixel art style

--no blur, no soft edges, no photorealism, no 3D rendering, no smooth gradients, no modern design, no watercolor, no oil painting, no realistic hands/faces, no text, no logos, no oversaturation, no neon (except intentional effects), no grayscale, no upscaled noise, low quality, blurry

--ar 9:16 --niji 6 --s 500
```
576×1024 → 320×480 · `scene-13-bg.png`

### 씬14 — 군중 속의 손 (강당 군중)
```
pixel art, retro 8-bit style, low-poly, Korean youth summer vibes, school uniform aesthetic, clear bright colors (sky blue #87CEEB, mint green #7FFFD4, navy #1C2841), warm sunset accents, warm skin tones, isometric slightly, cel-shaded anime influence, high contrast, crisp pixel edges, no antialiasing, cheerful nostalgic mood, cinematic composition

School gymnasium auditorium interior with large crowd gathering, stadium tiered seating structure visible, crowd of many people as blurred anonymous silhouettes of other students baked into background, lively social athletic atmosphere, no foreground characters, pixel art style

--no blur, no soft edges, no photorealism, no 3D rendering, no smooth gradients, no modern design, no watercolor, no oil painting, no realistic hands/faces, no text, no logos, no oversaturation, no neon (except intentional effects), no grayscale, no upscaled noise, low quality, blurry

--ar 9:16 --niji 6 --s 500
```
576×1024 → 320×480 · `scene-14-bg.png` (군중은 배경에 굽기 — perf 가드레일)

### 씬15 — 바닥에 동그라미 (복도 탑뷰)
```
pixel art, retro 8-bit style, low-poly, Korean youth summer vibes, school uniform aesthetic, clear bright colors (sky blue #87CEEB, mint green #7FFFD4, navy #1C2841), warm sunset accents, warm skin tones, isometric slightly, cel-shaded anime influence, high contrast, crisp pixel edges, no antialiasing, cheerful nostalgic mood, cinematic composition

School hallway floor top-down view shot directly from above, polished white and gray (#9E9E9E) tile floor with circular pattern marked, hallway walls visible on sides, classroom doorways spaced around perimeter, bright natural daylight overhead, no characters, pixel art top-down isometric style

--no blur, no soft edges, no photorealism, no 3D rendering, no smooth gradients, no modern design, no watercolor, no oil painting, no realistic hands/faces, no text, no logos, no oversaturation, no neon (except intentional effects), no grayscale, no upscaled noise, low quality, blurry

--ar 1:1 --niji 6 --s 500
```
320×320 · `scene-15-bg-topview.png`

### 씬16 — 천장이 새기 시작 (체육관 천장)
```
pixel art, retro 8-bit style, low-poly, Korean youth summer vibes, school uniform aesthetic, clear bright colors (sky blue #87CEEB, mint green #7FFFD4, navy #1C2841), warm sunset accents, warm skin tones, isometric slightly, cel-shaded anime influence, high contrast, crisp pixel edges, no antialiasing, cheerful nostalgic mood, cinematic composition

Gymnasium indoor ceiling structure with metal and plastic light fixtures, white ceiling panels showing visible leak damage spots and water stains, gymnasium floor far below, indoor sports facility architecture, afternoon daylight filtering through damage, no characters, pixel art style

--no blur, no soft edges, no photorealism, no 3D rendering, no smooth gradients, no modern design, no watercolor, no oil painting, no realistic hands/faces, no text, no logos, no oversaturation, no neon (except intentional effects), no grayscale, no upscaled noise, low quality, blurry

--ar 9:16 --niji 6 --s 500
```
576×1024 → 320×480 · `scene-16-bg.png`

### 씬17 — 비여도 괜찮아 (체육관 폭우)
```
pixel art, retro 8-bit style, low-poly, Korean youth summer vibes, school uniform aesthetic, clear bright colors (sky blue #87CEEB, mint green #7FFFD4, navy #1C2841), warm sunset accents, warm skin tones, isometric slightly, cel-shaded anime influence, high contrast, crisp pixel edges, no antialiasing, cheerful nostalgic mood, cinematic composition

Gymnasium interior during heavy rainfall with water streaming from ceiling down to floor in sheets, wet reflective surfaces on gymnasium floor, dark moody rainy atmospheric lighting (#4A9FD8), no characters, pixel art style (note: 빗줄기 파티클은 코드 렌더 — 배경엔 젖은 무드만)

--no blur, no soft edges, no photorealism, no 3D rendering, no smooth gradients, no modern design, no watercolor, no oil painting, no realistic hands/faces, no text, no logos, no oversaturation, no neon (except intentional effects), no grayscale, no upscaled noise, low quality, blurry

--ar 9:16 --niji 6 --s 500
```
576×1024 → 320×480 · `scene-17-bg.png`

### 씬18 — 우산을 펼쳐 (체육관 탑뷰)
```
pixel art, retro 8-bit style, low-poly, Korean youth summer vibes, school uniform aesthetic, clear bright colors (sky blue #87CEEB, mint green #7FFFD4, navy #1C2841), warm sunset accents, warm skin tones, isometric slightly, cel-shaded anime influence, high contrast, crisp pixel edges, no antialiasing, cheerful nostalgic mood, cinematic composition

Gymnasium interior top-down view shot directly from above, open floor space with wet rain puddles reflecting overhead, rainy wet slippery surfaces, ceiling structure and light fixtures visible high above, ready for umbrella formation scene, no characters no umbrellas yet, pixel art top-down style

--no blur, no soft edges, no photorealism, no 3D rendering, no smooth gradients, no modern design, no watercolor, no oil painting, no realistic hands/faces, no text, no logos, no oversaturation, no neon (except intentional effects), no grayscale, no upscaled noise, low quality, blurry

--ar 1:1 --niji 6 --s 500
```
320×320 · `scene-18-bg-topview.png`

### 씬19 — 노을이 밀려온다 (노을 거리 횡스크롤)
```
pixel art, retro 8-bit style, low-poly, Korean youth summer vibes, school uniform aesthetic, clear bright colors (sky blue #87CEEB, mint green #7FFFD4, navy #1C2841), warm sunset accents (#FF8C42), warm sunset golden hour light, warm skin tones, isometric slightly, cel-shaded anime influence, high contrast, crisp pixel edges, no antialiasing, cheerful nostalgic mood, cinematic composition

Urban street scene at golden hour sunset with warm golden orange sky (#FF8C42) dominating horizon line, residential and shop buildings lining street on both sides, long dramatic shadows cast by sunset angle, romantic warm color palette throughout, no characters, pixel art horizontal scene

--no blur, no soft edges, no photorealism, no 3D rendering, no smooth gradients, no modern design, no watercolor, no oil painting, no realistic hands/faces, no text, no logos, no oversaturation, no neon (except intentional effects), no grayscale, no upscaled noise, low quality, blurry

--ar 16:9 --niji 6 --s 500
```
1024×576 → 320×180 · `scene-19-bg.png`

### 씬20 — 다리 위의 우리 (다리 난간 노을)
```
pixel art, retro 8-bit style, low-poly, Korean youth summer vibes, school uniform aesthetic, clear bright colors (sky blue #87CEEB, mint green #7FFFD4, navy #1C2841), warm sunset accents (#FF8C42), warm sunset golden hour light, warm skin tones, isometric slightly, cel-shaded anime influence, high contrast, crisp pixel edges, no antialiasing, cheerful nostalgic mood, cinematic composition

Pedestrian bridge with sturdy metal railing barrier, warm golden sunset sky (#FF8C42) creating dramatic backlighting behind bridge structure, river or street visible far below bridge deck, serene peaceful golden hour transitional moment, no characters, pixel art style

--no blur, no soft edges, no photorealism, no 3D rendering, no smooth gradients, no modern design, no watercolor, no oil painting, no realistic hands/faces, no text, no logos, no oversaturation, no neon (except intentional effects), no grayscale, no upscaled noise, low quality, blurry

--ar 16:9 --niji 6 --s 500
```
1024×576 → 320×180 · `scene-20-bg.png`

### 씬21 — (보너스) 우리들의 첫 만남 (8비트 스탠딩 배경)
```
pixel art, retro 8-bit style, low-poly, Korean youth summer vibes, school uniform aesthetic, clear bright colors (sky blue #87CEEB, mint green #7FFFD4, navy #1C2841), warm sunset accents, warm skin tones, isometric slightly, cel-shaded anime influence, high contrast, crisp pixel edges, no antialiasing, cheerful nostalgic mood, cinematic composition

Simple bright solid background for standing character shot with subtle gradient or pattern, retro 8-bit video game style backdrop, cheerful celebratory palette color harmony (#87CEEB to #FF8C42 fade), clean simple composition, no characters, pixel art victory celebration background

--no blur, no soft edges, no photorealism, no 3D rendering, no smooth gradients, no modern design, no watercolor, no oil painting, no realistic hands/faces, no text, no logos, no oversaturation, no neon (except intentional effects), no grayscale, no upscaled noise, low quality, blurry

--ar 1:1 --niji 6 --s 500
```
320×320 · `scene-21-bg.png`

---

## C. 이펙트 (투명 PNG 스프라이트 시트 / 코드 렌더 구분)

> perf 결론 반영: 비·낙하숫자·흩어짐 조각은 **코드 렌더**(개별 이미지 X), 우산·폭죽·구름·물방울은 **이미지 스탬프**.

| 이펙트 | 생성 방식 | 프레임 | 권장 해상도 | 파일명 |
|---|---|---|---|---|
| 비 빗줄기 | **코드 렌더** (단일 path stroke ≤200) | — | — | (이미지 X) |
| 물방울 | AI 이미지 | 6 | 96×64 | `effect-water-droplets.png` |
| 낙하 숫자 0-9 | **코드 권장** (픽셀폰트) | 40 | 160×64(선택시) | `effect-falling-numbers.png` |
| 흩어짐 조각 | **코드 렌더** (fillRect ≤12) | — | — | (이미지 X) |
| 우산 6색 | AI 이미지 | 1 (각) | 64×64 ×6 | `umbrella-color-{red/blue/mint/pink/orange/purple}.png` |
| 픽셀 폭죽 | AI 이미지 | 12 | 512×64 | `effect-fireworks.png` |
| 구름 | AI 이미지 (정적) | 4모양 | 256×128 | `effect-clouds.png` |

**AI 생성 이펙트 = 총 10개 파일**(물방울 1 + 우산 6 + 폭죽 1 + 구름 1, 숫자 선택 시 +1).

### C2. 물방울 (6프레임)
```
[PREFIX 동일]

Animated water droplet falling particle effect sprite sheet, single water droplet ball shape falling down animation, 6 frames showing droplet fall progression impact, light blue color (#87CEEB), falling motion gravity effect, transparent background, pixel art water droplet particle style

[NEGATIVE 동일]

--niji 6 --s 400 --ar 16:9
```
**파일명**: `effect-water-droplets.png` · 96×64 (6×1) 투명 PNG

### C5. 우산 변색 6색 (각 64×64)
공통 본문: `Single simple umbrella icon top-view shape, solid {COLOR} color ({HEX}), umbrella canopy circle with handle below, clean geometric outline, pixel art umbrella icon sprite, white border outline, transparent background` + `--niji 6 --s 300 --ar 1:1`

| 색 | HEX | 파일명 |
|---|---|---|
| 빨강 | `#FF0000` | `umbrella-color-red.png` |
| 파랑 | `#1E90FF` | `umbrella-color-blue.png` |
| 민트 | `#7FFFD4` | `umbrella-color-mint.png` |
| 핫핑크 | `#FF69B4` | `umbrella-color-pink.png` |
| 노을 | `#FF8C42` | `umbrella-color-orange.png` |
| 퍼플 | `#9370DB` | `umbrella-color-purple.png` |

### C6. 픽셀 폭죽 (12프레임)
```
[PREFIX 동일]

Celebratory pixel art fireworks burst explosion sprite sheet, small confetti square and triangle pieces bursting outward radially, 12 animation frames showing full burst expansion and fade, colorful multi-color confetti using palette colors (#FF8C42, #FF69B4, #1E90FF, #7FFFD4), bright joyful celebration effect, pixel art festive fireworks style, transparent background, semi-transparent particles

[NEGATIVE 동일]

--niji 6 --s 450 --ar 1:1
```
**파일명**: `effect-fireworks.png` · 512×64 (12×1) 투명 PNG

### C7. 구름 (정적 4모양)
```
[PREFIX 동일]

Fluffy white cloud sprites multiple different cloud shapes and sizes for background scenery, 4 variations cloud white color (#FFFACD or pure white #FFFFFF), soft rounded cloud puffs, pixel art cloud style, stationary cloud shapes for sky backgrounds, transparent background, no animation just static assets

[NEGATIVE 동일]

--niji 6 --s 400 --ar 16:9
```
**파일명**: `effect-clouds.png` · 256×128 투명 PNG

### 코드 렌더 이펙트 참고 스니펫
```javascript
// 비 — 단일 path stroke (씬17, ≤200)
ctx.strokeStyle = '#4A9FD8'; ctx.lineWidth = 1; ctx.globalAlpha = 0.7;
ctx.beginPath();
for (const p of rainPool) { ctx.moveTo(p.x, p.y); ctx.lineTo(p.x + 2, p.y + 8); }
ctx.stroke();

// 흩어짐 조각 (씬10·14, ≤12)
for (let i = 0; i < 12; i++) {
  const a = (Math.PI * 2 / 12) * i;
  ctx.fillStyle = palette[i % palette.length];
  ctx.fillRect(Math.round(cx + Math.cos(a) * r), Math.round(cy + Math.sin(a) * r), 4, 4);
}
// 낙하 숫자 — VT323 폰트로 fillText (씬03)
```

---

## D. UI — 전부 코드/CSS/픽셀폰트 (AI 생성 X)

> 텍스트·아이콘은 AI 렌더가 불안정 → 폰트/CSS로 처리해 픽셀 정합 보장. **이미지 파일 0개.**

| UI 요소 | 방식 | 핵심 |
|---|---|---|
| `< >` 버튼 | CSS + 폰트 | 44×44px, color `#1C2841`/bg `#FFFFFF`/border 2px `#4A4A4A`, focus outline 2px `#FF8C42` |
| 막 도트 7개 | CSS div | 8px 원, 비활성 `#9E9E9E`/현재 막 `#FF8C42` |
| `08 / 20` 카운터 | 텍스트 | VT323 14px `#1C2841` |
| 자막 패널 | CSS | bg `rgba(28,40,65,0.95)` + `#FFFFFF`, 대비 12.5:1, NeoDunggeunmo 12px/1.4 |
| 타이틀 "8비트의 첫 만남" | 픽셀폰트 | Press Start 2P + NeoDunggeunmo, `#1E90FF` + text-shadow 2px `#FF8C42` |

```css
.nav-btn{width:44px;height:44px;font-size:24px;font-weight:bold;color:#1C2841;background:#fff;border:2px solid #4A4A4A;image-rendering:pixelated}
.nav-btn:focus{outline:2px solid #FF8C42}
.dot{width:8px;height:8px;border-radius:50%;background:#9E9E9E;border:1px solid #4A4A4A;display:inline-block;margin:0 4px}
.dot.active{background:#FF8C42}
.subtitle-panel{background:rgba(28,40,65,.95);color:#fff;padding:12px 16px;text-align:center;font-family:'NeoDunggeunmo',sans-serif;font-size:12px;line-height:1.4;border-top:1px solid #4A9FD8}
.title-logo{font-family:'Press Start 2P','NeoDunggeunmo',serif;font-size:24px;color:#1E90FF;text-shadow:2px 2px #FF8C42;letter-spacing:2px;text-align:center;image-rendering:pixelated}
```

---

## E. 생성 순서 & QA

### E1. Phase별 생성 순서
1. **Phase 1 — 마스터+챕터1 검증(~5분)**: 마스터 시트(A1) → `character-reference.png`(cref ID 기록) → 챕터1 배경 3개(B1·B2·B3). 검증: 6멤버 식별성 / 밤→새벽 조명 구분 / 16색 양자화.
2. **Phase 2 — 캐릭터+표정(~40분)**: C1~C6 전신 6 → 표정 24(4×6). 검증: --cref 일관성 ≥90% / 악세 명확.
3. **Phase 3 — 특수 포즈(~60분)**: P1 우선(씬01~12 ~20개) → 공용 포즈 5 → P2 보조. 검증: 핵심동작·어설픔 / 멀티캐릭터 식별 / 탑뷰·횡스크롤 구도.
4. **Phase 4 — 배경 21(~70분)**: B4~B21. 검증: 챕터 조명 진행(밤→낮→노을) / 특수 구도 / ≤35KB.
5. **Phase 5 — 이펙트(~15분)**: 물방울·우산6·폭죽·구름(AI) + 비·숫자·흩어짐(코드 별도). 검증: 우산 6색 구분 / 폭죽 12프레임 / 구름 4모양.
- 전체 예상 ~4.5~5시간(순차, MJ Fast).

### E2. 후처리 (생성 후 필수)
설치: `brew install pngquant oxipng` (mac) / `apt-get install pngquant oxipng` (linux) / `choco install pngquant oxipng` (win).
```bash
# 16색 양자화 + 무손실 압축 (assets/generated/**/*.png)
for f in assets/generated/**/*.png; do
  pngquant --colors 16 --output "${f%.png}-t.png" "$f"
  oxipng -o max "${f%.png}-t.png"
  mv "${f%.png}-t.png" "$f"
done
du -sh assets/generated   # 목표 ≤855KB
```
PowerShell 버전:
```powershell
Get-ChildItem assets/generated -Recurse -Include *.png | ForEach-Object {
  $t = $_.FullName.Replace(".png","-t.png")
  & pngquant --colors 16 --output $t $_.FullName
  & oxipng -o max $t
  Remove-Item $_.FullName; Rename-Item $t $_.FullName
}
```

### E3. QA 체크리스트
| 항목 | 기준 | 담당 |
|---|---|---|
| 색상 | 16색 팔레트 고정 | perf |
| 포맷 | 인덱스 PNG-8 | perf |
| 배경 1장 | ≤35KB | perf |
| 전체 에셋 | ≤855KB | perf |
| C1~C6 식별 | 60px+ 명확 | designer |
| --cref 일관성 | ≥90% | designer |
| 표정 4종 | 동일 캐릭터 | designer |
| 배경 분위기 | 밤→낮→노을 진행 | designer |
| 특수 구도 | 탑뷰/횡스크롤 정확 | designer |
| 이펙트 프레임 | 물방울 6·폭죽 12 | motion |
| Canvas 픽셀 | `image-rendering:pixelated` 2배 확대 선명 | developer |
| 모바일 60fps | 씬17 비 ≤200 | perf |

### E4. 파일 네이밍 규칙
```
characters/  character-reference.png · C1~C6-standing.png · C1~C6-expression-{neutral|surprised|laugh|shy}.png
             scene-01-C1-planning.png … scene-21-vpose-bonus.png · generic-{standing|walking|running|cycling|waving}.png
backgrounds/ scene-01-bg.png … scene-21-bg.png  (탑뷰: scene-15/18-bg-topview.png)
effects/     effect-water-droplets.png · effect-fireworks.png · effect-clouds.png · umbrella-color-{red|blue|mint|pink|orange|purple}.png
ui/          (없음 — 코드/CSS/폰트)
```

### E5. 렌더링 직전 최종 체크
```
[ ] character-reference.png 로드, cref ID 확보
[ ] 챕터1 배경 3개 밤→새벽 구분
[ ] pngquant 16색 + 배경 <35KB
[ ] C1~C6 전신 6 + 표정 24 완료
[ ] 특수 포즈 P1 20개+ 완료
[ ] 배경 B4~B21 조명 진행 확인
[ ] 우산 6 + 폭죽 + 구름 생성
[ ] 네이밍 규칙 준수 + palette-fix 실행
[ ] 전체 ≤855KB
[ ] Canvas pixelated 2배 렌더 선명
[ ] 씬17 비 ≤200 프로파일링
```
