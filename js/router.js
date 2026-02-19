/* ═══════════════════════════════════════════════════════
 * MOQV v6.0 — SPA Router
 * ═══════════════════════════════════════════════════════
 *
 * 이 파일이 하는 일:
 * - 페이지 네비게이션 (go)
 * - 기사 뷰 라우팅 (goArticle)
 * - 아카이브 월 필터 (filterMonth)
 *
 * 모든 URL 라우팅은 SPA 방식 (해시 없이 메모리 라우팅)
 * ═══════════════════════════════════════════════════════ */

/* ═══ Router ═══ */
function go(p){closeMobile();currentPage=p;boardPage=1;if(p!=='archive')archiveFilter=null;buildNav();var app=document.getElementById('app');if(p==='admin'&&isAdmin())app.innerHTML=renderAdmin();else if(p==='admin'){openLogin();return}else if(p==='data')app.innerHTML=renderData();else if(p==='hml-research'){renderResearch()}else if(p==='home')app.innerHTML=renderHome();else if(p==='archive')app.innerHTML=renderArchive();else app.innerHTML=renderBoard(p);window.scrollTo({top:document.querySelector('.content').offsetTop-70,behavior:'smooth'});anim()}
function goArticle(id){closeMobile();renderArticleView(id)}
function filterMonth(m){archiveFilter=m;currentPage='archive';boardPage=1;buildNav();document.getElementById('app').innerHTML=renderArchive();window.scrollTo({top:document.querySelector('.content').offsetTop-70,behavior:'smooth'});anim()}

