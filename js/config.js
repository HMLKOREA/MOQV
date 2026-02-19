/* ═══════════════════════════════════════════════════════
 * MOQV v6.0 — Configuration & Global State
 * ═══════════════════════════════════════════════════════
 * 
 * 이 파일이 하는 일:
 * - 관리자 계정 설정 (ACCOUNTS)
 * - 구독 등급 설정 (SUBS)
 * - 전역 상태 변수들 (session, currentPage 등)
 * - 카테고리 메타데이터 (catMeta)
 * - 라이브 데이터베이스 객체 (DB)
 *
 * ⚠️ 보안 주의: ACCOUNTS는 프로토타입용 하드코딩입니다.
 *   실서비스에서는 반드시 서버 인증으로 교체하세요.
 * ═══════════════════════════════════════════════════════ */

// ── 관리자 계정 (프로토타입용) ──
const ACCOUNTS = [
  { id: 'admin', pw: 'moqv2026', role: 'admin', name: '관리자' },
  { id: 'hamel', pw: 'hamel2026', role: 'admin', name: 'Hamel Korea' }
];

// ── 구독 등급 ──
const SUBS = {
  free:       { label: 'Free',       pdf: false, archive: 3,   data: false, attach: false },
  basic:      { label: 'Basic',      pdf: true,  archive: 6,   data: true,  attach: false, price: '₩9,900/월' },
  pro:        { label: 'Pro',        pdf: true,  archive: 999, data: true,  attach: true,  price: '₩29,900/월' },
  enterprise: { label: 'Enterprise', pdf: true,  archive: 999, data: true,  attach: true,  price: '문의' }
};

// ── 전역 상태 변수 ──
let session = null;          // 현재 로그인된 사용자 정보
let currentPage = 'home';    // 현재 표시 중인 페이지
let editId = null;           // 편집 중인 기사 ID
let archiveFilter = null;    // 아카이브 월 필터
let boardPage = 1;           // 게시판 현재 페이지
let userSub = 'free';        // 사용자 구독 등급
let idb = null;              // IndexedDB 인스턴스

// ── 권한 체크 헬퍼 ──
const isAdmin   = () => session && session.role === 'admin';
const getSub    = () => isAdmin() ? SUBS.enterprise : SUBS[userSub];
const canPDF    = () => getSub().pdf;
const canAttach = () => getSub().attach;

// ── 라이브 데이터베이스 (메모리) ──
const DB = {
  articles: [],
  weekly: [],
  routes: {},
  indices: [
    { name: 'SCFI',    val: '1,247', chg: '-3.2%', dir: 'dn' },
    { name: 'FBX',     val: '1,680', chg: '-3.4%', dir: 'dn' },
    { name: 'BDI',     val: '1,523', chg: '+4.1%', dir: 'up' },
    { name: 'WCI',     val: '1,690', chg: '-4.0%', dir: 'dn' },
    { name: 'HRCI',    val: '892',   chg: '-5.7%', dir: 'dn' },
    { name: 'USD/KRW', val: '1,438', chg: '-0.3%', dir: 'dn' }
  ],
  sections: [
    { id: 'home',            label: 'Home' },
    { id: 'market-brief',    label: 'Market Brief' },
    { id: 'data-take',       label: 'Data Take' },
    { id: 'deep-dive',       label: 'Deep Dive' },
    { id: 'hml-research',    label: 'HML Research' },
    { id: 'opinion-leader',  label: 'Opinion Leader' },
    { id: 'inner-circle',    label: 'Inner Circle' },
    { id: 'archive',         label: 'Archive' }
  ]
};

// ── 카테고리 메타데이터 ──
const catMeta = {
  'deep-dive':      { label: 'DEEP DIVE',       cls: 'cat-dd',   bg: 'var(--accent-soft)', color: 'var(--accent)' },
  'data-take':      { label: 'DATA TAKE',        cls: 'cat-dt',   bg: 'var(--green-soft)',  color: 'var(--green)' },
  'market-brief':   { label: 'MARKET BRIEF',     cls: 'cat-mb',   bg: 'var(--red-soft)',    color: 'var(--red)' },
  'hml-research':   { label: 'HML RESEARCH',     cls: 'cat-hml',  bg: '#F3EEFF',            color: '#6D28D9' },
  'opinion-leader': { label: 'OPINION LEADER',   cls: 'cat-ol',   bg: '#FFF7ED',            color: '#EA580C' },
  'inner-circle':   { label: 'INNER CIRCLE',     cls: 'cat-ic',   bg: '#F0FDF4',            color: '#16A34A' }
};

// ── 게시판 설명 ──
const boardDesc = {
  'deep-dive':      '구조적 변화를 심층 분석합니다.',
  'data-take':      '주간 SCFI 트래킹, 운임 속보, 핵심 지표를 주간 단위로 아카이빙.',
  'market-brief':   '해상·벌크·항공·물류 격주 브리핑.',
  'hml-research':   '하멜코리아 자체 리서치 보고서 및 분석 자료.',
  'opinion-leader': '마켓 주요 인사 인터뷰, 인사이트 영상, 숏폼 콘텐츠.',
  'inner-circle':   '업계 모임, 오픈마이크, 교육 프로그램. 오프라인·온라인 커뮤니티.',
  'archive':        '2025년 8월 창간호부터 전체 기사.'
};
