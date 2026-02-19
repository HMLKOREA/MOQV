# MOQV AI Agent Architecture Blueprint
## 🤖 자동 기사 생성 에이전트 가이드

> 이 문서는 MOQV v6.0 모듈화 코드베이스와 연동하여
> AI 에이전트가 기사를 자동으로 생성·발행하는 방법을 안내합니다.

---

## 1. 아키텍처 개요

```
┌──────────────────────────────────────────────────────────┐
│                    MOQV 에이전트 시스템                      │
├──────────┬───────────┬───────────┬───────────────────────┤
│  Scout   │  Writer   │ Designer  │     Publisher          │
│  에이전트  │  에이전트   │  에이전트   │     에이전트            │
│          │           │           │                       │
│ 소스수집  │  기사작성   │ 인포그래픽  │  발행·배포              │
│ 데이터추출 │  편집·교정  │ 차트생성   │  SNS 연동              │
└────┬─────┴─────┬─────┴─────┬─────┴───────────┬───────────┘
     │           │           │                 │
     └───────────┴───────────┴─────────────────┘
                         │
              ┌──────────┴──────────┐
              │   MOQV IndexedDB    │
              │   (브라우저 저장소)     │
              └─────────────────────┘
```

---

## 2. 기사 데이터 구조

모든 기사는 아래 JSON 형식을 따릅니다:

```javascript
{
  id: 1737654321000,           // 타임스탬프 기반 고유 ID
  cat: "deep-dive",            // 카테고리 (아래 목록 참조)
  title: "기사 제목",            // 한글 또는 영문
  excerpt: "2-3줄 요약",         // 목록에 표시되는 짧은 설명
  content: "<p>HTML 본문</p>",  // HTML 형식의 기사 본문
  author: "MOQV 편집팀",        // 작성자
  date: "2026-02-19",          // YYYY-MM-DD 형식
  readMin: 5,                  // 예상 읽기 시간 (분)
  status: "published",         // "published" 또는 "draft"
  tags: ["SCFI", "해운"],       // 태그 배열
  views: 0                     // 조회수
}
```

### 카테고리 목록
| 카테고리 ID | 라벨 | 용도 |
|---|---|---|
| `deep-dive` | Deep Dive | 심층 분석 기사 (2000자+ 권장) |
| `quick-take` | Quick Take | 주간 운임 트래킹·속보 (500-1000자) |
| `market-brief` | Market Brief | 격주 시장 브리핑 (1000-1500자) |
| `data` | Data Brief | 데이터 중심 기사 (차트·수치 포함) |
| `industry` | Industry | 산업 전반 뉴스·트렌드 |

### 기사 본문 HTML 컴포넌트

```html
<!-- 일반 문단 -->
<p>본문 텍스트입니다. <strong>강조</strong>는 주황색으로 표시됩니다.</p>

<!-- 데이터 박스 (핵심 수치 강조) -->
<div class="data-box">
  <strong>SCFI 1,247pt</strong> — 전주 대비 3.2% 하락<br>
  FBX 1,680pt (-3.4%), BDI 1,523pt (+4.1%)
</div>

<!-- 출처 표시 -->
<p class="source">Source: Shanghai Shipping Exchange, 2026.02.14</p>
```

---

## 3. 에이전트별 역할 가이드

### 🔍 Scout 에이전트 (소스 모니터링)
**목적:** 해운·물류 데이터와 뉴스를 수집합니다.

**데이터 소스:**
- Shanghai Shipping Exchange (SCFI)
- Freightos Baltic Index (FBX)
- Baltic Dry Index (BDI)
- World Container Index (WCI)
- Alphaliner, Drewry, Clarksons 리포트

**출력 형식:**
```json
{
  "source": "SSE",
  "date": "2026-02-14",
  "indices": {
    "SCFI": { "value": 1247, "change": -3.2 },
    "FBX":  { "value": 1680, "change": -3.4 }
  },
  "headlines": [
    "수에즈 운하 통행량 정상화 85% 도달",
    "MSC, 아시아-유럽 노선 감편 발표"
  ]
}
```

### ✍️ Writer 에이전트 (기사 작성)
**목적:** Scout의 데이터를 MOQV 스타일 기사로 변환합니다.

**작성 스타일 가이드:**
1. **제목:** 한글, 35자 이내, 핵심 수치 포함 권장
2. **첫 문단:** 결론·핵심 먼저 (역피라미드 구조)
3. **데이터 박스:** 핵심 수치는 반드시 `<div class="data-box">` 사용
4. **전문 용어:** SCFI, FBX, TEU, FEU 등은 영문 그대로 사용
5. **출처:** 모든 수치에 `<p class="source">` 태그로 출처 명시
6. **분량:** 카테고리별 권장 분량 준수

**프롬프트 예시:**
```
당신은 MOQV의 해운·물류 전문 에디터입니다.
아래 데이터를 바탕으로 Quick Take 카테고리 기사를 작성하세요.

[규칙]
- 제목: 한글 35자 이내, SCFI 수치 포함
- 본문: 500-1000자, HTML 태그 사용
- data-box: 핵심 지표 요약
- source 태그: 데이터 출처 명시
- 톤: 전문적이되 읽기 쉽게

[데이터]
SCFI: 1,247 (-3.2% w/w)
FBX: 1,680 (-3.4%)
주요 노선: 상하이→북미서안 $2,156/FEU (-2.5%)
```

### 🎨 Designer 에이전트 (인포그래픽)
**목적:** 기사에 삽입할 차트와 인포그래픽을 생성합니다.

현재 MOQV는 SVG 기반 `spark()` 함수로 미니 차트를 렌더링합니다.
향후 Chart.js 또는 D3.js 연동 시 Designer 에이전트가 활성화됩니다.

### 📡 Publisher 에이전트 (발행)
**목적:** 작성된 기사를 MOQV DB에 저장하고 발행합니다.

**기사 삽입 코드:**
```javascript
// 새 기사 생성
var newArticle = {
  id: Date.now(),
  cat: 'quick-take',
  title: 'W07 SCFI 1,247pt — 3주 연속 하락세',
  excerpt: '상하이 컨테이너 운임지수(SCFI) 1,247pt...',
  content: '<p>...</p>',
  author: 'MOQV AI Writer',
  date: new Date().toISOString().split('T')[0],
  readMin: 3,
  status: 'published',
  tags: ['SCFI', 'Weekly', 'W07'],
  views: 0
};

// DB에 추가
DB.articles.push(newArticle);
scheduleSave();  // IndexedDB에 자동 저장

// 페이지 갱신
go(currentPage);
```

---

## 4. 주간 데이터 업데이트 방법

### 지표 데이터 추가
```javascript
// DB.weekly 배열에 새 주차 추가
// 형식: [Week, Date, SCFI, BDI, FBX, WCI, HRCI, USD/KRW]
DB.weekly.push(["W08", "2026-02-14", 1215, 1540, 1650, 1670, 885, 1442]);

// 지표 자동 갱신
refreshIndices();
buildTicker();

// DB 저장
scheduleSave();
```

### 노선 요율 추가
```javascript
// DB.routes 객체에 새 주차 추가
DB.routes["W08"] = [
  ["상하이→북미서안", "$2,050/FEU"],
  ["상하이→북유럽", "$2,920/TEU"],
  // ... 8개 노선
];

scheduleSave();
```

---

## 5. 파일 구조 참조

```
moqv-v6/
├── index.html           ← HTML 셸 + 다크모드 + 스크립트 로딩
├── css/
│   └── style.css        ← 전체 CSS (라이트/다크모드)
├── js/
│   ├── config.js        ← 설정, 전역변수, 카테고리
│   ├── storage.js       ← IndexedDB/localStorage 레이어
│   ├── api.js           ← CRUD, 백업, PDF
│   ├── ui.js            ← 렌더러, 애니메이션
│   ├── router.js        ← SPA 라우팅
│   ├── main.js          ← 앱 초기화
│   └── data/
│       ├── seed-articles.js  ← 시드 기사 101건
│       ├── seed-weekly.js    ← 시드 주간지표 28주
│       └── seed-routes.js    ← 시드 노선요율 7주
└── docs/
    └── AI-AGENT-GUIDE.md ← 이 문서
```

### 스크립트 로딩 순서 (중요!)
```
config.js → seed-*.js → storage.js → api.js → ui.js → router.js → main.js
```
모든 파일이 전역 스코프를 공유하므로, 순서가 바뀌면 에러가 발생합니다.

---

## 6. Claude Code 연동 가이드

### Claude Code에서 기사 자동 생성하기
```bash
# 1. MOQV 프로젝트 폴더로 이동
cd /path/to/moqv-v6

# 2. Claude Code에 기사 작성 요청
claude "MOQV Quick Take 기사를 작성해줘. 
  SCFI 1,215pt (-2.6% w/w), 
  상하이→북미서안 $2,050/FEU,
  제목은 한글로, HTML 본문 형식으로."

# 3. 생성된 기사를 seed-articles.js에 추가하거나
#    브라우저 콘솔에서 직접 삽입
```

### 브라우저 콘솔에서 직접 삽입
```javascript
// 개발자 도구 (F12) → Console 탭에서 실행
DB.articles.push({
  id: Date.now(),
  cat: 'quick-take',
  title: 'AI가 생성한 기사 제목',
  excerpt: 'AI 요약문...',
  content: '<p>AI가 생성한 본문...</p>',
  author: 'MOQV AI Writer',
  date: '2026-02-19',
  readMin: 3,
  status: 'published',
  tags: ['AI', 'Auto'],
  views: 0
});
scheduleSave();
go('home');
```

---

## 7. 보안 참고사항

⚠️ 현재 프로토타입 단계에서의 제한사항:

1. **계정 하드코딩:** `config.js`의 ACCOUNTS는 프로토타입용입니다.
   실서비스에서는 서버 인증(JWT 등)으로 교체 필요
2. **XSS 취약점:** `innerHTML` 직접 사용 중. DOMPurify 추가 권장
3. **대용량 파일:** base64로 IndexedDB에 저장 중. 10MB+ 파일은 서버 스토리지 권장
4. **CSP:** Content Security Policy 헤더 설정 권장

---

*이 문서는 MOQV v6.0 기준입니다. 최종 수정: 2026-02-19*
