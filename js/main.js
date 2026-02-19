/* ═══════════════════════════════════════════════════════
 * MOQV v6.0 — Main Entry Point
 * ═══════════════════════════════════════════════════════
 *
 * 이 파일이 하는 일:
 * - 앱 초기화 (buildNav, buildTicker, loadData)
 * - 날짜 표시 설정
 * - 이벤트 리스너 등록
 *
 * ⚡ 로딩 순서: config → data → storage → api → ui → router → main
 * ═══════════════════════════════════════════════════════ */

// ── 오늘 날짜 표시 ──
document.getElementById('todayDate').textContent = new Date()
  .toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  .toUpperCase();

// ── 로그인 폼 이벤트 리스너 ──
document.getElementById('loginPw').addEventListener('keydown', function(e) {
  if (e.key === 'Enter') doLogin();
});
document.getElementById('loginId').addEventListener('keydown', function(e) {
  if (e.key === 'Enter') document.getElementById('loginPw').focus();
});

// ── 앱 시작 ──
buildNav();
buildTicker();
loadData();

console.log('[MOQV] v6.0 Modular Architecture loaded');
