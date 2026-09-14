# AGENTS.md — nexuscontents-site

넥수스(NEXUS) 공식 홈페이지 저장소입니다. 이 문서는 이 저장소에서 작업하는
에이전트/개발자를 위한 안내입니다. 작업을 시작하기 전에 전부 읽어 주세요.

- 운영 주소: https://nexuscontents.com (www 도 같은 곳으로 연결)
- 호스팅: GitHub Pages — `main` 브랜치의 루트 폴더를 그대로 서빙
- 빌드 없음. 번들러·패키지·CI 없음. 파일을 고치고 `main`에 푸시하면 1~2분 뒤 반영됩니다.

---

## 1. 파일 구성

| 파일 | 내용 | 주의 |
|---|---|---|
| `index.html` | 사이트 전체 (HTML + CSS + JS 한 파일, 약 30KB) | 본체 |
| `hero.jpg` | 첫 화면 배경 사진 (약 50KB) | `index.html`의 CSS에서 `url("hero.jpg")`로 참조 |
| `CNAME` | `nexuscontents.com` | **삭제 금지.** 지우면 커스텀 도메인이 풀립니다 |
| `.nojekyll` | Jekyll 처리 비활성화 | **삭제 금지** |
| `.gitignore` | `.DS_Store`, `_backup/` | |

사진은 예전에 base64 data URI로 `index.html` 안에 들어 있었습니다. 파일이 98KB였고
매 페이지 로드마다 다시 내려받아야 해서 2026-09-11에 분리했습니다. 되돌리지 마세요.

---

## 2. 3개 국어 처리 방식 — 가장 중요한 부분

DOM에는 **한국어**가 들어 있고, 일본어·영어는 **속성**에 들어 있습니다.
`index.html` 맨 아래 약 50줄짜리 스크립트가 전환을 담당합니다.

| 속성 | 동작 |
|---|---|
| `data-ja="…"` / `data-en="…"` | 해당 언어에서 그 요소의 `textContent`를 교체 |
| (없음) | 한국어 = DOM에 원래 있는 텍스트. `data-ko`는 쓰지 않습니다 |
| `data-en-href="…"` | 해당 언어에서 링크 주소(`href`)를 교체 |
| `data-en-hide` | 해당 언어에서만 그 요소를 숨김 (`el.hidden`) |

언어 결정 순서: `localStorage["nexus-lang"]` → `navigator.languages` → 없으면 `en`.

### 문구를 고칠 때 지켜야 할 것

**세 언어는 서로의 번역이 아닙니다.** 각각 다른 대상을 향합니다.

| 언어 | 대상 |
|---|---|
| 한국어 | 국내 피부과·에스테틱·브랜드 (=고객사) |
| 日本語 | 일본 크리에이터 |
| English | 영어권·해외 크리에이터 및 브랜드 |

- 한 언어를 고칠 때 **다른 언어를 같이 바꾸지 마세요.** 사용자가 명시적으로 요청한
  언어만 수정합니다.
- 속성값 안에 **줄바꿈 문자를 그대로 넣을 수 있습니다.** `.hero__lead`, `.head p`,
  `.node p`에 걸린 `white-space:pre-line`이 그 줄바꿈을 화면에 그대로 표시합니다.
  줄바꿈을 쓴다면 그 CSS를 지우지 마세요.
- `<li>`를 지우면 세 언어 모두에서 사라집니다. 특정 언어에서만 빼려면 `data-en-hide`
  같은 속성을 쓰세요. (실제로 For Creators 목록 3번째 항목이 영어에서만 숨겨져 있습니다.)

---

## 3. 레이아웃 함정 — 이미 겪은 버그들입니다. 되돌리지 마세요

### 3-1. 일본어는 줄바꿈되어야 합니다
`p,li,dd,dt{word-break:keep-all}`은 한국어에는 맞지만(단어 중간에서 안 끊김),
일본어는 띄어쓰기가 없어서 문단 전체가 끊기지 않는 하나의 "단어"가 됩니다.
그러면 Process 4칸 그리드가 터지면서 페이지에 가로 스크롤이 생깁니다.

```css
html[lang="ja"] h1,html[lang="ja"] h2,html[lang="ja"] h3,
html[lang="ja"] p,html[lang="ja"] li,html[lang="ja"] dd,html[lang="ja"] dt{word-break:normal}
```
이 규칙을 유지하세요.

### 3-2. 히어로 사진의 오른쪽 여백 계산식
사진은 화면 오른쪽 끝까지 흘러나가야 합니다. 음수 마진은 **뷰포트 기준**이어야 합니다.

```css
margin-right:calc(-1 * (50vw - min(50vw, var(--max) / 2) + var(--pad)))
```
`calc(50% - 50vw)` 같은 퍼센트 기준으로 "간단하게" 바꾸면 화면 밖으로 넘칩니다.

### 3-3. 수정 후 반드시 확인할 것
세 언어 각각에 대해 **380 / 768 / 1002 / 1280 / 1920px** 너비에서
`document.documentElement.scrollWidth === window.innerWidth` 인지 확인하세요.
가로 스크롤이 생기면 안 됩니다.

---

## 4. 디자인 시스템

`index.html` 상단 `:root`에 CSS 변수로 정의되어 있습니다.

- 색: `--ground` `--surface` `--surface-alt` `--ink` `--ink-soft` `--muted`
  `--line` `--line-2` `--accent`(#A8303E) `--accent-2` `--deep`(#17313A) `--deep-ink` `--deep-muted`
- 다크모드: `prefers-color-scheme` + `[data-theme="dark"]` / `[data-theme="light"]` 오버라이드
- 글꼴 (Google Fonts): Gowun Batang(한국어 제목) / IBM Plex Sans KR(한국어 본문) /
  Shippori Mincho(일본어 제목) / Noto Sans JP(일본어 본문)
- 레이아웃: `--max: 74rem` 컨테이너, `--pad`는 `clamp()` 기반 가변 좌우 여백
- 사용 중인 브레이크포인트: 34 / 44 / 52 / 56 / 60 rem

새 색이나 글꼴을 하드코딩하지 말고 기존 변수를 쓰세요.

---

## 5. 배포

```
main 에 푸시  →  GitHub Pages 자동 재빌드  →  1~2분 뒤 반영
```

- Enforce HTTPS 켜져 있음
- DNS는 Hostinger 관리 (도메인만, 호스팅은 없음)
  - `A @` → `185.199.108.153` / `.109.153` / `.110.153` / `.111.153`
  - `CNAME www` → `nexuskorea2-ui.github.io`
- 도메인 만료: 2027-09-11
- 반영이 안 보이면 캐시입니다. 시크릿 창이나 주소 뒤에 `?v=2`를 붙여 확인하세요.

---

## 6. 회사 정보 (페이지에 실제로 실려 있는 값)

- 상호: 넥수스 (NEXUS) / ネクサス
- 대표자: 김연혁 (Kim Yeonhyuk)
- 소재지: 경기도 수원시 권선구 정조로470번길 8-2, 1층 101호
- 이메일: nexuskorea2@gmail.com
- LINE 공식계정: @889twdmo — https://lin.ee/sxh9Aqg (한국어·일본어 CTA)
- Instagram: @nexus_japan2 (영어 크리에이터 CTA는 여기로 연결)

이 값을 바꿀 때는 세 언어 모두에서 일관되게 바꿔야 합니다.

---

## 7. 미해결 / 판단이 필요한 항목

작업자가 임의로 고치지 말고, 요청이 있을 때만 손대세요.

1. **영문판 표현 혼재** — 사용자가 그대로 두기로 결정한 상태입니다.
   - 히어로 소제목 `K-BEAUTY × ENGLISH-SPEAKING CREATORS`
   - For Clinics 제목 `A route to English-speaking customers`
   - 반면 본문은 "Japanese and worldwide creators"라고 되어 있습니다.
2. **영문 문법** — 사용자가 직접 쓴 문장을 그대로 유지 중입니다.
   - `NEXUS put everything together and connect both sides.` (puts / connects 가 문법상 맞음)
   - `from a foreigner point of view` (foreign visitor's 가 자연스러움)
3. **광고 규제 문구** — 한국어·일본어판에는 "표기가 없으면 처분 대상은 광고주·중개자
   측이며 크리에이터는 아니다"라는 문장이 있습니다. 미국 FTC 기준에서는 크리에이터
   본인도 책임 대상이 될 수 있어 **영문판에서는 그 단서를 뺐습니다.** 되살리지 마세요.
4. **영어권 문의 채널이 Instagram DM 하나뿐** — 영문 문의 안내 추가 검토 중.

---

## 8. 백업

- 구글드라이브 › 내 드라이브 › `Homepage` 폴더에 편집할 때마다 `index.html` 사본을 둡니다.
- 전체 수정 이력은 이 저장소의 커밋에 남습니다. 되돌릴 때는 git을 쓰세요.

---

## 9. 작업 원칙 요약

- 빌드 도구·프레임워크·패키지 매니저를 도입하지 마세요. 정적 단일 파일 사이트입니다.
- 외부 스크립트를 추가하지 마세요. 현재 외부 의존성은 Google Fonts 스타일시트 하나뿐입니다.
- 커밋은 작게, 무엇을 왜 바꿨는지 쓰세요.
- 문구 수정은 요청받은 언어만. 레이아웃을 건드렸으면 3-3의 가로 스크롤 점검을 하세요.
