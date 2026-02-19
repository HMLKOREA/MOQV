# MOQV v6.0 — The Quarterly of Vessels

> 🚢 프리미엄 해운·물류 인텔리전스 플랫폼  
> **Powered by Hamel Korea**

---

## 🆕 v6.0 변경사항 (v5.1 → v6.0)

### ✅ 한글 인코딩 수정
- UTF-8 이중인코딩(mojibake) 완전 해결
- 모든 한글 텍스트 정상 표시 (상하이→북미서안, 관리자 로그인 등)

### ✅ 모듈화 (1파일 690줄 → 11파일)
| 파일 | 역할 | 줄 수 |
|---|---|---|
| `index.html` | HTML 셸 + 다크모드 | 272 |
| `css/style.css` | 전체 CSS | 45 |
| `js/config.js` | 설정·전역변수 | 89 |
| `js/storage.js` | IndexedDB/LS 레이어 | 198 |
| `js/api.js` | CRUD·백업·PDF | 132 |
| `js/ui.js` | 렌더러·UI | 300 |
| `js/router.js` | SPA 라우팅 | 17 |
| `js/main.js` | 앱 초기화 | 31 |
| `js/data/*.js` | 시드 데이터 (3파일) | — |

### ✅ 다크모드 지원
- CSS 변수 기반 라이트/다크 전환
- 시스템 설정 자동 감지 (`prefers-color-scheme`)
- 수동 토글 버튼 (🌙/☀️)
- localStorage에 선호 테마 저장

### ✅ SEO & 접근성 개선
- `<meta description>` 추가
- `<meta theme-color>` 추가
- HTML 구조화 (시맨틱 태그)
- `preconnect` 최적화

---

## 🚀 시작하기

### 로컬 실행
```bash
# 아무 HTTP 서버로 실행 (IndexedDB는 file:// 미지원)
npx serve .
# 또는
python3 -m http.server 8080
```

브라우저에서 `http://localhost:8080` 접속

### 관리자 로그인
- ID: `admin` / PW: `moqv2026`
- ID: `hamel` / PW: `hamel2026`

---

## 📁 프로젝트 구조

```
moqv-v6/
├── index.html              ← 메인 HTML (모듈 로딩)
├── css/
│   └── style.css           ← 전체 스타일시트
├── js/
│   ├── config.js           ← 설정 & 전역 상태
│   ├── storage.js          ← 저장소 레이어
│   ├── api.js              ← 데이터 CRUD
│   ├── ui.js               ← UI 렌더링
│   ├── router.js           ← 라우팅
│   ├── main.js             ← 초기화
│   └── data/
│       ├── seed-articles.js
│       ├── seed-weekly.js
│       └── seed-routes.js
├── docs/
│   └── AI-AGENT-GUIDE.md   ← AI 에이전트 가이드
└── README.md               ← 이 파일
```

---

## 💾 데이터 저장 방식

**3단계 Fallback 시스템:**
1. **IndexedDB** (기본) — 브라우저 내장 DB, 무제한 용량
2. **localStorage** (폴백) — IDB 실패 시 자동 전환, 5MB 제한
3. **Memory** (최후) — 새로고침 시 초기화

---

## 🤖 AI 에이전트

자세한 내용은 [`docs/AI-AGENT-GUIDE.md`](docs/AI-AGENT-GUIDE.md) 참조

---

*© 2025-2026 MOQV. A Hamel Korea Publication.*
