/* ═══════════════════════════════════════════════════════
 * MOQV v6.0 — UI Components & Renderers
 * ═══════════════════════════════════════════════════════
 *
 * 이 파일이 하는 일:
 * - 로그인 UI (openLogin, closeLogin, doLogin, doLogout)
 * - 네비게이션 구축 (buildNav, buildTicker)
 * - 모바일 메뉴 (toggleMobile, closeMobile)
 * - 유틸리티 (fmtDate, anim, spark)
 * - 페이지 렌더러 (renderHome, renderBoard, renderArchive)
 * - Data Hub (renderData)
 * - 기사 상세 뷰 (renderArticleView)
 * - HML Research 게시판 (renderResearch, uploadResearch 등
 * - 기사 CRUD (openEditor, saveArticle, delArticle)
 * - 관리자 대시보드 (renderAdmin)
 * ═══════════════════════════════════════════════════════ */

/* ═══ UI Helpers ═══ */
// (todayDate 설정은 main.js에서 실행)
function openLogin(){document.getElementById('loginModal').classList.add('open');document.getElementById('loginId').focus();document.getElementById('loginError').classList.remove('show')}
function closeLogin(){document.getElementById('loginModal').classList.remove('open');document.getElementById('loginId').value='';document.getElementById('loginPw').value=''}
function doLogin(){var id=document.getElementById('loginId').value.trim(),pw=document.getElementById('loginPw').value,acc=ACCOUNTS.find(function(a){return a.id===id&&a.pw===pw});if(acc){session={id:acc.id,role:acc.role,name:acc.name};closeLogin();buildNav();go(currentPage)}else{document.getElementById('loginError').classList.add('show')}}
function doLogout(){session=null;buildNav();go('home')}
// (이벤트 리스너는 main.js에서 등록)

/* ═══ Refresh indices from weekly data ═══ */
function refreshIndices(){
  if(!DB.weekly||!DB.weekly.length)return;
  var last=DB.weekly[DB.weekly.length-1],prev=DB.weekly.length>1?DB.weekly[DB.weekly.length-2]:last;
  var map=[{name:'SCFI',i:2},{name:'FBX',i:4},{name:'BDI',i:3},{name:'WCI',i:5},{name:'HRCI',i:6},{name:'USD/KRW',i:7}];
  DB.indices=map.map(function(m){var v=last[m.i],p=prev[m.i],chg=((v-p)/p*100);return{name:m.name,val:v.toLocaleString(),chg:(chg>=0?'+':'')+chg.toFixed(1)+'%',dir:chg>=0?'up':'dn'}});
}

function buildNav(){var nl=document.getElementById('navLinks'),nr=document.getElementById('navRight'),mm=document.getElementById('mobileMenu');var items=[].concat(DB.sections);if(isAdmin())items.push({id:'admin',label:'📊 Dashboard'});nl.innerHTML=items.map(function(s){return '<span class="nav-link'+(s.id===currentPage?' active':'')+'" onclick="go(\''+s.id+'\')">'+s.label+'</span>'}).join('');nr.innerHTML=session?'<span class="nav-user eng">🔑 '+session.name+'</span><span id="syncBadge" style="font-family:JetBrains Mono,monospace;font-size:10px;padding:0 8px"></span><span class="nav-btn logout eng" onclick="doLogout()">로그아웃</span>':'<span class="nav-btn login eng" onclick="openLogin()">LOGIN</span><span class="nav-btn subscribe eng">SUBSCRIBE</span>';mm.innerHTML=items.map(function(s){return '<div class="mm-link'+(s.id===currentPage?' active':'')+'" onclick="go(\''+s.id+'\');closeMobile()">'+s.label+'</div>'}).join('')+(session?'<div class="mm-link" style="color:var(--red)" onclick="doLogout();closeMobile()">로그아웃</div>':'<div class="mm-link" style="color:var(--accent)" onclick="openLogin();closeMobile()">🔐 로그인</div>')}
function buildTicker(){var items=DB.indices.map(function(i){return '<div class="tk-item"><span class="tk-label eng">'+i.name+'</span><span class="tk-val eng">'+i.val+'</span><span class="tk-'+i.dir+' eng">'+(i.dir==='up'?'▲':'▼')+i.chg.replace(/[+-]/,'')+'</span></div>'}).join('<span class="tk-sep">│</span>');document.getElementById('tickerInner').innerHTML=items+items}
function toggleMobile(){document.getElementById('hamburger').classList.toggle('open');document.getElementById('mobileMenu').classList.toggle('open')}
function closeMobile(){document.getElementById('hamburger').classList.remove('open');document.getElementById('mobileMenu').classList.remove('open')}
function fmtDate(d){return new Date(d).toLocaleDateString('ko-KR',{year:'numeric',month:'2-digit',day:'2-digit'}).replace(/\. /g,'.').replace(/\.$/,'')}
function anim(){document.querySelectorAll('.bc,.mb-card,.al-item,.admin-stat,.am-card,.ds-card').forEach(function(el,i){el.style.opacity='0';el.style.transform='translateY(10px)';setTimeout(function(){el.style.transition='all .35s ease';el.style.opacity='1';el.style.transform='translateY(0)'},i*25)})}
function spark(data,color,w,h){var max=Math.max.apply(null,data),min=Math.min.apply(null,data),rng=max-min||1;var pts=data.map(function(v,i){return(i/(data.length-1)*w).toFixed(1)+','+(h-((v-min)/rng)*h*.85-h*.05).toFixed(1)}).join(' ');var ly=(h-((data[data.length-1]-min)/rng)*h*.85-h*.05).toFixed(1);return '<svg width="'+w+'" height="'+h+'" viewBox="0 0 '+w+' '+h+'" style="display:block;max-width:100%"><polyline points="'+pts+'" fill="none" stroke="'+color+'" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="'+w+'" cy="'+ly+'" r="3" fill="'+color+'"/></svg>'}


/* ═══ RENDERERS ═══ */
function renderHome(){
  var arts=DB.articles.filter(function(a){return a.status==='published'}).sort(function(a,b){return b.date.localeCompare(a.date)});
  if(!arts.length)return '<p style="padding:60px 0;text-align:center;color:var(--text-3)">기사가 없습니다.</p>';
  var hero=arts[0],sec3=arts.slice(1,4),latest=arts.slice(0,8),mbs=arts.filter(function(a){return a.cat==='market-brief'}).slice(0,3),trending=arts.slice().sort(function(a,b){return(b.views||0)-(a.views||0)}).slice(0,5);
  var scfiD=DB.weekly.map(function(w){return w[2]});
  var h='<section class="hero fade-up"><div><div class="hero-cat eng">'+catMeta[hero.cat].label+'</div><h1 class="hero-title" onclick="goArticle('+hero.id+')">'+hero.title+'</h1><p class="hero-excerpt">'+hero.excerpt+'</p><div class="hero-meta"><span>'+hero.author+'</span><span class="dot"></span><span>'+fmtDate(hero.date)+'</span><span class="dot"></span><span class="mono">'+hero.readMin+'분</span></div></div><div class="hero-img"><div class="hero-img-inner"><div class="hero-big eng">SUEZ</div><div class="hero-sublabel eng">RETURN TO RED SEA · 2026</div></div></div></section>';
  h+='<section class="sec-grid">'+sec3.map(function(a){return '<div class="sec-art"><div class="cat '+catMeta[a.cat].cls+' eng">'+catMeta[a.cat].label+'</div><h3 class="sec-title" onclick="goArticle('+a.id+')">'+a.title+'</h3><p class="sec-excerpt">'+a.excerpt+'</p><div class="sec-meta mono">'+fmtDate(a.date)+' · '+a.readMin+'분</div></div>'}).join('')+'</section>';
  h+='<div style="padding:28px 0;border-bottom:1px solid var(--border)"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px"><span class="sh-label eng">SCFI TREND — '+DB.weekly.length+' WEEKS</span><span style="font-family:JetBrains Mono,monospace;font-size:9px;color:var(--text-3)">'+DB.weekly[0][1]+' ~ '+DB.weekly[DB.weekly.length-1][1]+'</span></div>'+spark(scfiD,'#FF4D00',800,100)+'</div>';
  h+='<div style="padding:28px 0;border-bottom:1px solid var(--border)"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px"><span class="sh-label eng">FREIGHT INDICES</span></div><div class="ds-grid">'+DB.indices.map(function(i){return '<div class="ds-card" onclick="go(\'data-take\')"><div class="ds-index eng">'+i.name+'</div><div class="ds-val eng">'+i.val+'</div><div class="ds-chg '+i.dir+' eng">'+(i.dir==='up'?'▲':'▼')+' '+i.chg.replace(/[+-]/,'')+'</div></div>'}).join('')+'</div></div>';
  if(mbs.length){h+='<div class="sh"><span class="sh-label eng">MARKET BRIEF</span><span class="sh-line"></span><span class="sh-more" onclick="go(\'market-brief\')">전체보기 →</span></div><section class="mb-grid">'+mbs.map(function(a,i){var tg=['urgent','data','market'],ic=['⚠️','📊','💰'];return '<div class="mb-card" onclick="goArticle('+a.id+')"><div class="mb-card-top"><span class="mb-tag '+tg[i%3]+' eng">'+tg[i%3].toUpperCase()+'</span><span class="mb-icon">'+ic[i%3]+'</span></div><div class="mb-card-body"><div class="mb-title">'+a.title+'</div><div class="mb-excerpt">'+a.excerpt+'</div></div><div class="mb-card-footer"><span>'+fmtDate(a.date)+'</span><span class="mb-read eng">'+a.readMin+'분 →</span></div></div>'}).join('')+'</section>'}
  h+='<section class="two-col"><div class="col-main"><div class="sh" style="padding-top:0"><span class="sh-label eng">LATEST</span><span class="sh-line"></span></div>'+latest.map(function(a,i){return '<div class="al-item" onclick="goArticle('+a.id+')"><div class="al-num eng">'+String(i+1).padStart(2,'0')+'</div><div><div class="cat '+catMeta[a.cat].cls+' eng">'+catMeta[a.cat].label+'</div><div class="al-title">'+a.title+'</div><div class="al-meta">'+fmtDate(a.date)+' · '+a.readMin+'분</div></div></div>'}).join('')+'</div><aside class="col-side"><div class="sb-nl"><h3 class="serif">매주 월요일,<br>물류의 맥을 짚다</h3><p>핵심 뉴스와 데이터를 매주 월요일 아침 이메일로.</p><input type="email" placeholder="이메일 주소"><button>무료 구독하기</button><div class="cnt">3,200+ 물류인 구독 중</div></div><div class="sb-sh eng">TRENDING</div>'+trending.map(function(a,i){return '<div class="sb-ti" onclick="goArticle('+a.id+')"><div class="sb-tn eng">'+(i+1)+'</div><div><div class="sb-tt">'+(a.title.length>30?a.title.substring(0,30)+'…':a.title)+'</div><div class="sb-tm">조회 '+(a.views||0).toLocaleString()+'</div></div></div>'}).join('')+'</aside></section>';
  return h;
}

function renderBoard(cat){
  var m=catMeta[cat]||{label:cat.toUpperCase(),cls:'cat-dd'};
  var allArts=DB.articles.filter(function(a){return a.cat===cat}).sort(function(a,b){return b.date.localeCompare(a.date)});
  var arts=isAdmin()?allArts:allArts.filter(function(a){return a.status==='published'});
  var PER=12,total=Math.ceil(arts.length/PER),page=Math.min(boardPage,total||1);
  var shown=arts.slice((page-1)*PER,page*PER);
  var h='<div class="board"><div class="board-title serif eng">'+m.label+'</div><div class="board-desc">총 '+arts.length+'건. '+(boardDesc[cat]||'')+'</div>';
  if(isAdmin())h+='<div class="admin-bar"><div class="admin-bar-label">🔧 관리자 ('+arts.length+'건)</div><button class="btn btn-primary btn-sm" onclick="openEditor(null,\''+cat+'\')">+ 새 기사</button></div>';
  if(shown.length){h+='<div class="board-grid">'+shown.map(function(a){return '<div class="bc"><div class="cat '+m.cls+' eng">'+m.label+(isAdmin()?' <span class="status-badge status-'+a.status+'">'+a.status.toUpperCase()+'</span>':'')+'</div><div class="bc-title" onclick="goArticle('+a.id+')">'+a.title+'</div><div class="bc-excerpt">'+a.excerpt+'</div><div class="bc-footer"><span class="mono">'+fmtDate(a.date)+' · '+a.readMin+'분</span><span class="bc-read eng" onclick="goArticle('+a.id+')">READ →</span></div>'+(isAdmin()?'<div class="bc-admin"><button class="btn btn-edit btn-sm" onclick="event.stopPropagation();openEditor('+a.id+')">✏️</button><button class="btn btn-danger btn-sm" onclick="event.stopPropagation();delArticle('+a.id+',\''+cat+'\')">🗑</button></div>':'')+'</div>'}).join('')+'</div>'}else{h+='<p style="color:var(--text-3);padding:40px 0;text-align:center">기사가 없습니다.</p>'}
  if(total>1){h+='<div class="pg">'+Array.from({length:total},function(_,i){return '<span class="pg-btn'+(i+1===page?' active':'')+'" onclick="boardPage='+(i+1)+';go(\''+cat+'\')">'+(i+1)+'</span>'}).join('')+'</div>'}
  h+='</div>';return h;
}

function renderArchive(){
  var arts=(isAdmin()?DB.articles:DB.articles.filter(function(a){return a.status==='published'})).sort(function(a,b){return b.date.localeCompare(a.date)});
  var filtered=archiveFilter?arts.filter(function(a){return a.date.startsWith(archiveFilter)}):arts;
  var months={};filtered.forEach(function(a){var m=a.date.substring(0,7);if(!months[m])months[m]=[];months[m].push(a)});
  var sortedM=Object.keys(months).sort().reverse();
  var mn={'2026-02':'2026년 2월','2026-01':'2026년 1월','2025-12':'2025년 12월','2025-11':'2025년 11월','2025-10':'2025년 10월','2025-09':'2025년 9월','2025-08':'2025년 8월'};
  var h='<div class="board"><div class="board-title serif eng"><span>Archive</span></div><div class="board-desc">ì "ì²´ '+arts.length+'건.</div>';
  var allM=['2026-02','2026-01','2025-12','2025-11','2025-10','2025-09','2025-08'];
  h+='<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:24px"><span class="pg-btn'+(archiveFilter?'':' active')+'" onclick="archiveFilter=null;go(\'archive\')">ì "ì²´ ('+arts.length+')</span>';
  allM.forEach(function(m){var cnt=arts.filter(function(a){return a.date.startsWith(m)}).length;if(cnt)h+='<span class="pg-btn'+(archiveFilter===m?' active':'')+'" onclick="filterMonth(\''+m+'\')">'+(mn[m]||m)+' ('+cnt+')</span>'});
  h+='</div>';
  sortedM.forEach(function(m){var list=months[m];h+='<div style="font-family:JetBrains Mono,monospace;font-size:12px;color:var(--accent);margin:16px 0 8px;letter-spacing:.15em">'+(mn[m]||m)+' ('+list.length+'건)</div><div class="board-grid" style="margin-bottom:16px">'+list.map(function(a){var cm=catMeta[a.cat]||{label:'',cls:''};return '<div class="bc"><div class="cat '+cm.cls+' eng">'+cm.label+'</div><div class="bc-title" onclick="goArticle('+a.id+')">'+a.title+'</div><div class="bc-excerpt">'+a.excerpt+'</div><div class="bc-footer"><span class="mono">'+fmtDate(a.date)+' · '+a.readMin+'분</span><span class="bc-read eng" onclick="goArticle('+a.id+')">READ →</span></div></div>'}).join('')+'</div>'});
  h+='</div>';return h;
}

function renderDataTake(){
  var scfiD=DB.weekly.map(function(w){return w[2]}),bdiD=DB.weekly.map(function(w){return w[3]}),fbxD=DB.weekly.map(function(w){return w[4]}),wciD=DB.weekly.map(function(w){return w[5]}),hrciD=DB.weekly.map(function(w){return w[6]}),krwD=DB.weekly.map(function(w){return w[7]});
  var arts=DB.articles.filter(function(a){return a.cat==='data-take'&&a.status==='published'}).sort(function(a,b){return b.date.localeCompare(a.date)});
  var h='<div class="board"><div class="board-title serif eng">Data <span>Take</span></div><div class="board-desc">운임 지표 트래킹 \u00b7 주간 분석 \u00b7 '+DB.weekly.length+'주간 트렌드.</div>';

  /* SECTION 1: GRAPHS */
  h+='<div class="sh"><span class="sh-label eng">\ud83d\udcca FREIGHT INDEX CHARTS</span><span class="sh-line"></span></div>';
  var idxList=[{name:'SCFI',data:scfiD,color:'#FF4D00'},{name:'BDI',data:bdiD,color:'#16A34A'},{name:'FBX',data:fbxD,color:'#2563EB'},{name:'WCI',data:wciD,color:'#7C3AED'},{name:'HRCI',data:hrciD,color:'#DC2626'},{name:'USD/KRW',data:krwD,color:'#CA8A04'}];
  h+='<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-bottom:32px">';
  idxList.forEach(function(idx){var last=idx.data[idx.data.length-1],prev=idx.data[idx.data.length-2]||last,chg=((last-prev)/prev*100);var dir=chg>=0?'up':'dn';
    h+='<div style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--r-md);padding:20px"><div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px"><div><div style="font-family:JetBrains Mono,monospace;font-size:10px;color:var(--text-3)">'+idx.name+'</div><div style="font-family:Plus Jakarta Sans,sans-serif;font-size:28px;font-weight:800">'+last.toLocaleString()+'</div><div style="font-family:JetBrains Mono,monospace;font-size:11px;color:var(--'+(dir==='up'?'green':'red')+')">'+(chg>=0?'\u25b2':'\u25bc')+' '+Math.abs(chg).toFixed(1)+'% w/w</div></div><div style="font-family:JetBrains Mono,monospace;font-size:9px;color:var(--text-3);text-align:right">HIGH: '+Math.max.apply(null,idx.data).toLocaleString()+'<br>LOW: '+Math.min.apply(null,idx.data).toLocaleString()+'</div></div>'+spark(idx.data,idx.color,300,60)+'</div>'});
  h+='</div>';

  /* SECTION 2: ANALYSIS ARTICLES */
  h+='<div class="sh"><span class="sh-label eng">\ud83d\udcdd WEEKLY ANALYSIS</span><span class="sh-line"></span></div>';
  if(isAdmin())h+='<div class="admin-bar"><div class="admin-bar-label">\ud83d\udd27 \uad00\ub9ac\uc790 ('+arts.length+'\uac74)</div><button class="btn btn-primary btn-sm" onclick="openEditor(null,\'data-take\')">+ \uc0c8 \uae30\uc0ac</button></div>';
  if(arts.length){
    var shown=arts.slice(0,12);
    h+='<div class="board-grid" style="margin-bottom:32px">'+shown.map(function(a){return '<div class="bc"><div class="cat cat-dt eng">DATA TAKE'+(isAdmin()?' <span class="status-badge status-'+a.status+'">'+a.status.toUpperCase()+'</span>':'')+'</div><div class="bc-title" onclick="goArticle('+a.id+')">'+a.title+'</div><div class="bc-excerpt">'+a.excerpt+'</div><div class="bc-footer"><span class="mono">'+fmtDate(a.date)+' \u00b7 '+a.readMin+'\ubd84</span><span class="bc-read eng" onclick="goArticle('+a.id+')">READ \u2192</span></div>'+(isAdmin()?'<div class="bc-admin"><button class="btn btn-edit btn-sm" onclick="event.stopPropagation();openEditor('+a.id+')">\u270f\ufe0f</button><button class="btn btn-danger btn-sm" onclick="event.stopPropagation();delArticle('+a.id+',\'data-take\')">\ud83d\uddd1</button></div>':'')+'</div>'}).join('')+'</div>';
  }else{
    h+='<p style="color:var(--text-3);padding:40px 0;text-align:center">\ubd84\uc11d \uae30\uc0ac\uac00 \uc5c6\uc2b5\ub2c8\ub2e4.</p>';
  }

  /* SECTION 3: DATA TABLE */
  h+='<div class="sh"><span class="sh-label eng">\ud83d\udccb WEEKLY DATA TABLE</span><span class="sh-line"></span></div><div style="overflow-x:auto;margin-bottom:32px"><table class="rt-table"><thead><tr><th>WEEK</th><th>DATE</th><th>SCFI</th><th>BDI</th><th>FBX</th><th>WCI</th><th>HRCI</th><th>KRW</th></tr></thead><tbody>';
  DB.weekly.slice().reverse().forEach(function(w){h+='<tr><td class="mono">'+w[0]+'</td><td class="mono" style="font-size:11px">'+w[1]+'</td><td class="mono" style="font-weight:700">'+w[2].toLocaleString()+'</td><td class="mono">'+w[3].toLocaleString()+'</td><td class="mono">'+w[4].toLocaleString()+'</td><td class="mono">'+w[5].toLocaleString()+'</td><td class="mono">'+w[6].toLocaleString()+'</td><td class="mono">'+w[7].toLocaleString()+'</td></tr>'});
  h+='</tbody></table></div>';
  h+='<div class="sh"><span class="sh-label eng">\ud83d\udea2 ROUTE RATES</span><span class="sh-line"></span></div>';
  Object.keys(DB.routes).sort().reverse().forEach(function(wk){var rates=DB.routes[wk];var wd=DB.weekly.find(function(w){return w[0]===wk});
    h+='<div style="margin-bottom:20px"><div style="font-family:JetBrains Mono,monospace;font-size:11px;color:var(--accent);margin-bottom:8px">'+wk+' \u00b7 \uae30\uc900: '+(wd?wd[1]:'N/A')+'</div><table class="rt-table"><thead><tr><th>ROUTE</th><th>RATE</th></tr></thead><tbody>'+rates.map(function(r){return '<tr><td>'+r[0]+'</td><td class="mono" style="font-weight:600">'+r[1]+'</td></tr>'}).join('')+'</tbody></table></div>'});
  h+='</div>';return h;
}

/* ═══ Opinion Leader ═══ */
function renderOpinionLeader(){
  var arts=DB.articles.filter(function(a){return a.cat==='opinion-leader'}).sort(function(a,b){return b.date.localeCompare(a.date)});
  var pub=isAdmin()?arts:arts.filter(function(a){return a.status==='published'});
  var h='<div class="board"><div class="board-title serif eng">Opinion <span>Leader</span></div>';
  h+='<div class="board-desc">\ub9c8\ucf13 \uc8fc\uc694 \uc778\uc0ac\ub4e4\uc758 \uc778\ud130\ubdf0, \uc778\uc0ac\uc774\ud2b8 \uc601\uc0c1, \uc20f\ud3fc \ucf58\ud150\uce20.</div>';
  if(isAdmin()){h+='<div class="admin-bar"><div class="admin-bar-label">\ud83d\udd27 \uad00\ub9ac\uc790 ('+pub.length+'\uac74)</div><button class="btn btn-primary btn-sm" onclick="openEditor(null,\'opinion-leader\')">+ \uc0c8 \ucf58\ud150\uce20</button></div>';}
  if(pub.length){
    h+='<div class="board-grid">'+pub.map(function(a){return '<div class="bc"><div class="cat cat-ol eng">OPINION LEADER'+(isAdmin()?' <span class="status-badge status-'+a.status+'">'+a.status.toUpperCase()+'</span>':'')+'</div><div class="bc-title" onclick="goArticle('+a.id+')">'+a.title+'</div><div class="bc-excerpt">'+a.excerpt+'</div><div class="bc-footer"><span class="mono">'+fmtDate(a.date)+' \u00b7 '+a.readMin+'\ubd84</span><span class="bc-read eng" onclick="goArticle('+a.id+')">READ \u2192</span></div>'+(isAdmin()?'<div class="bc-admin"><button class="btn btn-edit btn-sm" onclick="event.stopPropagation();openEditor('+a.id+')">\u270f\ufe0f</button><button class="btn btn-danger btn-sm" onclick="event.stopPropagation();delArticle('+a.id+',\'opinion-leader\')">\ud83d\uddd1</button></div>':'')+'</div>'}).join('')+'</div>';
  }else{
    h+='<div style="text-align:center;padding:80px 0">';
    h+='<div style="font-size:64px;margin-bottom:20px">\ud83c\udf99\ufe0f</div>';
    h+='<div style="font-family:Playfair Display,serif;font-size:24px;font-weight:700;margin-bottom:12px">Coming Soon</div>';
    h+='<div style="color:var(--text-2);max-width:480px;margin:0 auto;line-height:1.8;font-size:14px">';
    h+='\ud574\uc6b4 \ubb3c\ub958 \uc5c5\uacc4 \ub9ac\ub354\ub4e4\uc758 \uc778\ud130\ubdf0\uc640 \uc778\uc0ac\uc774\ud2b8\ub97c \uc601\uc0c1\uc73c\ub85c \ub9cc\ub098\ubcf4\uc138\uc694.<br>';
    h+='YouTube \uc601\uc0c1, \uc20f\ud3fc \ucf58\ud150\uce20, \ud31f\uce90\uc2a4\ud2b8 \ub4f1 \ub2e4\uc591\ud55c \ud3ec\ub9f7\uc73c\ub85c \uc900\ube44 \uc911\uc785\ub2c8\ub2e4.';
    h+='</div>';
    h+='<div style="display:flex;gap:16px;justify-content:center;margin-top:32px">';
    h+='<div style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--r-md);padding:20px 28px;text-align:center"><div style="font-size:28px;margin-bottom:8px">\ud83c\udfac</div><div style="font-family:JetBrains Mono,monospace;font-size:11px;font-weight:700">VIDEO</div><div style="font-size:11px;color:var(--text-3)">\uc778\ud130\ubdf0 \u00b7 \ud1a0\ub860</div></div>';
    h+='<div style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--r-md);padding:20px 28px;text-align:center"><div style="font-size:28px;margin-bottom:8px">\ud83d\udcf1</div><div style="font-family:JetBrains Mono,monospace;font-size:11px;font-weight:700">SHORT</div><div style="font-size:11px;color:var(--text-3)">\uc20f\ud3fc \u00b7 \ud074\ub9bd</div></div>';
    h+='<div style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--r-md);padding:20px 28px;text-align:center"><div style="font-size:28px;margin-bottom:8px">\ud83c\udfa7</div><div style="font-family:JetBrains Mono,monospace;font-size:11px;font-weight:700">PODCAST</div><div style="font-size:11px;color:var(--text-3)">\uc74c\uc131 \u00b7 \ub300\ub2f4</div></div>';
    h+='</div></div>';
  }
  h+='</div>';return h;
}

/* ═══ Inner Circle ═══ */
function renderInnerCircle(){
  var arts=DB.articles.filter(function(a){return a.cat==='inner-circle'}).sort(function(a,b){return b.date.localeCompare(a.date)});
  var pub=isAdmin()?arts:arts.filter(function(a){return a.status==='published'});
  var h='<div class="board"><div class="board-title serif eng">Inner <span>Circle</span></div>';
  h+='<div class="board-desc">\uc5c5\uacc4 \ubaa8\uc784, \uc624\ud508\ub9c8\uc774\ud06c, \uad50\uc721 \ud504\ub85c\uadf8\ub7a8. \uc624\ud504\ub77c\uc778\u00b7\uc628\ub77c\uc778 \ucee4\ubba4\ub2c8\ud2f0.</div>';
  if(isAdmin()){h+='<div class="admin-bar"><div class="admin-bar-label">\ud83d\udd27 \uad00\ub9ac\uc790 ('+pub.length+'\uac74)</div><button class="btn btn-primary btn-sm" onclick="openEditor(null,\'inner-circle\')">+ \uc0c8 \uc774\ubca4\ud2b8</button></div>';}
  if(pub.length){
    h+='<div class="board-grid">'+pub.map(function(a){return '<div class="bc"><div class="cat cat-ic eng">INNER CIRCLE'+(isAdmin()?' <span class="status-badge status-'+a.status+'">'+a.status.toUpperCase()+'</span>':'')+'</div><div class="bc-title" onclick="goArticle('+a.id+')">'+a.title+'</div><div class="bc-excerpt">'+a.excerpt+'</div><div class="bc-footer"><span class="mono">'+fmtDate(a.date)+' \u00b7 '+a.readMin+'\ubd84</span><span class="bc-read eng" onclick="goArticle('+a.id+')">READ \u2192</span></div>'+(isAdmin()?'<div class="bc-admin"><button class="btn btn-edit btn-sm" onclick="event.stopPropagation();openEditor('+a.id+')">\u270f\ufe0f</button><button class="btn btn-danger btn-sm" onclick="event.stopPropagation();delArticle('+a.id+',\'inner-circle\')">\ud83d\uddd1</button></div>':'')+'</div>'}).join('')+'</div>';
  }else{
    h+='<div style="text-align:center;padding:80px 0">';
    h+='<div style="font-size:64px;margin-bottom:20px">\ud83e\udd1d</div>';
    h+='<div style="font-family:Playfair Display,serif;font-size:24px;font-weight:700;margin-bottom:12px">Coming Soon</div>';
    h+='<div style="color:var(--text-2);max-width:480px;margin:0 auto;line-height:1.8;font-size:14px">';
    h+='\ud574\uc6b4 \ubb3c\ub958 \uc804\ubb38\uac00\ub4e4\uc774 \ubaa8\uc774\ub294 \ud504\ub9ac\ubbf8\uc5c4 \ucee4\ubba4\ub2c8\ud2f0\ub97c \uc900\ube44\ud558\uace0 \uc788\uc2b5\ub2c8\ub2e4.<br>';
    h+='\uc624\ud504\ub77c\uc778 \ubaa8\uc784, \uc628\ub77c\uc778 \uc138\ubbf8\ub098, \uc624\ud508\ub9c8\uc774\ud06c \ub4f1 \ub2e4\uc591\ud55c \ud504\ub85c\uadf8\ub7a8\uc774 \uace7 \uc2dc\uc791\ub429\ub2c8\ub2e4.';
    h+='</div>';
    h+='<div style="display:flex;gap:16px;justify-content:center;margin-top:32px">';
    h+='<div style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--r-md);padding:20px 28px;text-align:center"><div style="font-size:28px;margin-bottom:8px">\ud83c\udfe2</div><div style="font-family:JetBrains Mono,monospace;font-size:11px;font-weight:700">MEETUP</div><div style="font-size:11px;color:var(--text-3)">\uc624\ud504\ub77c\uc778 \ubaa8\uc784</div></div>';
    h+='<div style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--r-md);padding:20px 28px;text-align:center"><div style="font-size:28px;margin-bottom:8px">\ud83c\udfa4</div><div style="font-family:JetBrains Mono,monospace;font-size:11px;font-weight:700">OPEN MIC</div><div style="font-size:11px;color:var(--text-3)">\uc8fc\uc694 \uc778\uc0ac \ubc1c\ud45c</div></div>';
    h+='<div style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--r-md);padding:20px 28px;text-align:center"><div style="font-size:28px;margin-bottom:8px">\ud83d\udcda</div><div style="font-family:JetBrains Mono,monospace;font-size:11px;font-weight:700">EDUCATION</div><div style="font-size:11px;color:var(--text-3)">\uad50\uc721 \u00b7 \uc138\ubbf8\ub098</div></div>';
    h+='</div></div>';
  }
  h+='</div>';return h;
}

/* ═══ Article View (async for attachments) ═══ */
async function renderArticleView(id){
  var a=DB.articles.find(function(x){return x.id===id});if(!a){document.getElementById('app').innerHTML='<p>기사를 찾을 수 없습니다.</p>';return}
  var cm=catMeta[a.cat]||{label:'',cls:'',bg:'',color:''};
  a.views=(a.views||0)+1;scheduleSave();
  var atts=await getAtts(id);
  var h='<article class="article-view"><div class="av-back" onclick="go(\''+a.cat+'\')">← '+cm.label+'</div><div class="av-cat" style="background:'+cm.bg+';color:'+cm.color+'">'+cm.label+'</div><h1 class="av-title">'+a.title+'</h1><div class="av-meta"><span>'+a.author+'</span><span class="dot"></span><span>'+fmtDate(a.date)+'</span><span class="dot"></span><span class="mono">'+a.readMin+'분</span><span class="dot"></span><span class="mono">조회 '+(a.views||0).toLocaleString()+'</span></div><div class="av-body">'+a.content+'</div>';
  if(a.tags&&a.tags.length){h+='<div class="av-tags">'+a.tags.map(function(t){return '<span>#'+t+'</span>'}).join('')+'</div>'}
  if(atts.length>0){
    h+='<div style="margin-top:24px;padding:16px;background:var(--blue-soft);border-radius:var(--r-md)"><div style="font-family:JetBrains Mono,monospace;font-size:11px;color:var(--blue);margin-bottom:8px">📎 첨부파일 ('+atts.length+'개)</div>';
    atts.forEach(function(att){
      var icon=att.type.indexOf('pdf')>=0?'📄':att.type.indexOf('image')>=0?'🖼️':att.type.indexOf('sheet')>=0||att.type.indexOf('csv')>=0?'📊':'📁';
      h+='<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 12px;background:var(--bg-card);border-radius:var(--r);margin-bottom:4px"><div style="display:flex;align-items:center;gap:8px"><span style="font-size:18px">'+icon+'</span><div><div style="font-size:13px;font-weight:500">'+att.name+'</div><div style="font-family:JetBrains Mono,monospace;font-size:10px;color:var(--text-3)">'+att.size+' · '+att.date+'</div></div></div><div style="display:flex;gap:4px">';
      if(canAttach()&&att.dataUrl){h+='<a href="'+att.dataUrl+'" download="'+att.name+'" class="btn btn-outline btn-sm" style="text-decoration:none">⬇ 다운로드</a>'}else if(!canAttach()){h+='<span class="btn btn-outline btn-sm" style="opacity:.5">🔒 Pro 필요</span>'}
      if(isAdmin()){h+='<button class="btn btn-danger btn-sm" onclick="removeAtt(\''+att.uid+'\','+id+')">✕</button>'}
      h+='</div></div>';
    });
    h+='</div>';
  }
  if(isAdmin()){h+='<div style="margin-top:12px;display:flex;gap:8px"><button class="btn btn-outline btn-sm" onclick="addAtt('+id+')">📎 첨부파일 추가</button><button class="btn btn-edit btn-sm" onclick="openEditor('+id+')">✏️ 수정</button></div>'}
  h+='<div class="av-share"><div class="av-share-title">공유 & 내보내기</div><div class="av-share-btns"><span class="av-share-btn" onclick="exportPDF('+id+')">'+(canPDF()?'📄 PDF':'🔒 PDF (구독 필요)')+'</span><span class="av-share-btn">LinkedIn</span><span class="av-share-btn">X</span><span class="av-share-btn" onclick="navigator.clipboard.writeText(location.href).then(function(){alert(\'링크 복사됨\')})">🔗 링크 복사</span></div></div></article>';
  document.getElementById('app').innerHTML=h;
  window.scrollTo({top:document.querySelector('.content').offsetTop-70,behavior:'smooth'});
}

/* ═══ HML Research Board ═══ */
var researchPage=1;
async function renderResearch(){
  var app=document.getElementById('app');
  app.innerHTML='<div style="text-align:center;padding:60px 0;color:var(--text-3)"><div style="font-size:24px">⏳</div></div>';
  var items=[];
  if(STORE_MODE==='idb'){try{items=await idbGetAll('research')}catch(e){}}
  else if(STORE_MODE==='ls'){items=lsGet('research')||[]}
  items.sort(function(a,b){return b.date.localeCompare(a.date)});
  var PER=10,total=Math.ceil(items.length/PER)||1,page=Math.min(researchPage,total);
  var shown=items.slice((page-1)*PER,page*PER);
  var h='<div class="board"><div class="board-title serif eng">HML <span>Research</span></div><div class="board-desc">하멜코리아 자체 리서치 보고서 및 분석 자료. 총 '+items.length+'건.</div>';
  if(isAdmin()){
    h+='<div class="admin-bar"><div class="admin-bar-label">🔧 관리자 — 파일 업로드 게시판</div><button class="btn btn-primary btn-sm" onclick="uploadResearch()">+ 리서치 업로드</button></div>';
  }
  if(shown.length){
    h+='<div class="research-list">';
    shown.forEach(function(item,idx){
      var num=(page-1)*PER+idx+1;
      var icon=getFileIcon(item.fileType);
      var sizeTxt=item.fileSize||'';
      h+='<div class="research-item">';
      h+='<div class="ri-num eng">'+String(num).padStart(2,'0')+'</div>';
      h+='<div class="ri-icon">'+icon+'</div>';
      h+='<div class="ri-body">';
      h+='<div class="ri-title">'+item.title+'</div>';
      if(item.desc){h+='<div class="ri-desc">'+item.desc+'</div>'}
      h+='<div class="ri-meta"><span class="cat cat-hml eng" style="font-size:9px;background:#F3EEFF;color:#6D28D9">'+item.fileType.toUpperCase()+'</span>';
      h+='<span class="mono">'+item.fileName+'</span>';
      if(sizeTxt){h+='<span class="mono">'+sizeTxt+'</span>'}
      h+='<span class="mono">'+fmtDate(item.date)+'</span>';
      if(item.tags&&item.tags.length){item.tags.forEach(function(t){h+='<span style="font-size:10px;color:var(--text-3)">#'+t+'</span>'})}
      h+='</div></div>';
      h+='<div class="ri-actions">';
      if(item.dataUrl){h+='<a href="'+item.dataUrl+'" download="'+item.fileName+'" class="btn btn-outline btn-sm" style="text-decoration:none">⬇ 다운로드</a>'}
      if(item.fileType==='pdf'&&item.dataUrl){h+='<button class="btn btn-outline btn-sm" onclick="previewResearch(\''+item.id+'\')">👁 미리보기</button>'}
      if(isAdmin()){h+='<button class="btn btn-edit btn-sm" onclick="editResearch(\''+item.id+'\')">✏️</button>';h+='<button class="btn btn-danger btn-sm" onclick="deleteResearch(\''+item.id+'\')">🗑</button>'}
      h+='</div></div>';
    });
    h+='</div>';
  }else{
    h+='<div style="text-align:center;padding:60px 0;color:var(--text-3)">';
    if(isAdmin()){h+='<div style="font-size:48px;margin-bottom:16px">📂</div><div style="font-size:14px;margin-bottom:8px">아직 등록된 리서치가 없습니다</div><div style="font-size:12px;color:var(--text-3)">위 [+ 리서치 업로드] 버튼으로 첫 리서치를 등록하세요.</div>'}
    else{h+='<div style="font-size:48px;margin-bottom:16px">🔒</div><div style="font-size:14px">리서치 자료가 준비 중입니다.</div>'}
    h+='</div>';
  }
  if(total>1){h+='<div class="pg">'+Array.from({length:total},function(_,i){return '<span class="pg-btn'+(i+1===page?' active':'')+'" onclick="researchPage='+(i+1)+';renderResearch()">'+(i+1)+'</span>'}).join('')+'</div>'}
  h+='</div>';
  app.innerHTML=h;anim();
}
function getFileIcon(type){
  var t=(type||'').toLowerCase();
  if(t==='pdf')return '📄';if(t==='xlsx'||t==='xls'||t==='csv')return '📊';
  if(t==='pptx'||t==='ppt')return '📽️';if(t==='docx'||t==='doc')return '📝';
  if(t==='png'||t==='jpg'||t==='jpeg'||t==='svg'||t==='gif')return '🖼️';
  if(t==='zip'||t==='rar')return '🗜️';return '📁';
}
function uploadResearch(){
  if(!isAdmin()){alert('관리자만 업로드 가능합니다.');return}
  var input=document.createElement('input');input.type='file';input.multiple=true;
  input.accept='.pdf,.docx,.doc,.xlsx,.xls,.csv,.pptx,.ppt,.png,.jpg,.jpeg,.svg,.gif,.zip,.json,.txt,.md,.hwp,.hwpx';
  input.onchange=async function(e){
    var files=Array.from(e.target.files);if(!files.length)return;
    for(var i=0;i<files.length;i++){
      var f=files[i];
      if(f.size>15*1024*1024){alert(f.name+': 15MB 초과. 건너뜁니다.');continue}
      var ext=f.name.split('.').pop().toLowerCase();
      var title=prompt('리서치 제목을 입력하세요:\n\n파일: '+f.name+' ('+fmtSize(f.size)+')',f.name.replace('.'+ext,''));
      if(!title)continue;
      var desc=prompt('설명 (선택사항):\n\n간단한 설명이나 요약을 적어주세요.','');
      var tags=prompt('태그 (쉼표로 구분, 선택사항):\n\n예: 시장분석, SCFI, 2026','');
      var dataUrl=await readFileAsDataURL(f);
      var item={id:'res_'+Date.now()+'_'+i,title:title,desc:desc||'',fileName:f.name,fileSize:fmtSize(f.size),fileType:ext,date:new Date().toISOString().split('T')[0],tags:tags?tags.split(',').map(function(t){return t.trim()}).filter(Boolean):[],dataUrl:dataUrl};
      if(STORE_MODE==='idb'){await idbPut('research',item)}
      else if(STORE_MODE==='ls'){var arr=lsGet('research')||[];arr.push(item);lsSet('research',arr)}
    }
    renderResearch();
  };
  input.click();
}
async function editResearch(id){
  if(!isAdmin())return;
  var item=null;
  if(STORE_MODE==='idb'){try{item=await idbGet('research',id)}catch(e){}}
  else if(STORE_MODE==='ls'){var arr=lsGet('research')||[];item=arr.find(function(r){return r.id===id})||null}
  if(!item)return;
  var title=prompt('제목 수정:',item.title);
  if(title===null)return;
  var desc=prompt('설명 수정:',item.desc||'');
  var tags=prompt('태그 수정 (쉼표 구분):',(item.tags||[]).join(', '));
  item.title=title||item.title;
  item.desc=desc||'';
  item.tags=tags?tags.split(',').map(function(t){return t.trim()}).filter(Boolean):[];
  if(STORE_MODE==='idb'){await idbPut('research',item)}
  else if(STORE_MODE==='ls'){var arr=lsGet('research')||[];var idx=arr.findIndex(function(r){return r.id===id});if(idx>=0)arr[idx]=item;lsSet('research',arr)}
  renderResearch();
}
async function deleteResearch(id){
  if(!isAdmin())return;
  if(!confirm('이 리서치를 삭제하시겠습니까?\n\n파일이 영구 삭제됩니다.'))return;
  if(STORE_MODE==='idb'){await idbDel('research',id)}
  else if(STORE_MODE==='ls'){var arr=lsGet('research')||[];arr=arr.filter(function(r){return r.id!==id});lsSet('research',arr)}
  renderResearch();
}
async function previewResearch(id){
  var item=null;
  if(STORE_MODE==='idb'){try{item=await idbGet('research',id)}catch(e){}}
  else if(STORE_MODE==='ls'){var arr=lsGet('research')||[];item=arr.find(function(r){return r.id===id})||null}
  if(!item||!item.dataUrl)return;
  var w=window.open('','_blank');
  w.document.write('<html><head><title>'+item.title+' — HML Research</title><style>*{margin:0;padding:0}body{background:#1a1a1a}iframe{width:100%;height:100vh;border:none}</style></head><body><iframe src="'+item.dataUrl+'"></iframe></body></html>');
  w.document.close();
}

/* ═══ Article CRUD ═══ */
function openEditor(id,cat){
  editId=id||null;var a=id?DB.articles.find(function(x){return x.id===id}):null;
  document.getElementById('modalTitle').textContent=a?'✏️ 기사 수정':'✏️ 새 기사';
  document.getElementById('ed-title').value=a?a.title:'';
  document.getElementById('ed-cat').value=a?a.cat:(cat||'deep-dive');
  document.getElementById('ed-status').value=a?a.status:'draft';
  document.getElementById('ed-excerpt').value=a?a.excerpt:'';
  document.getElementById('ed-content').value=a?a.content:'';
  document.getElementById('ed-author').value=a?a.author:'MOQV 편집팀';
  document.getElementById('ed-tags').value=a?(a.tags||[]).join(', '):'';
  document.getElementById('editorModal').classList.add('open');
}
function closeEditor(){document.getElementById('editorModal').classList.remove('open');editId=null}
function saveArticle(){
  var title=document.getElementById('ed-title').value.trim();if(!title){alert('제목을 입력하세요');return}
  var data={title:title,cat:document.getElementById('ed-cat').value,status:document.getElementById('ed-status').value,excerpt:document.getElementById('ed-excerpt').value.trim(),content:document.getElementById('ed-content').value,author:document.getElementById('ed-author').value.trim()||'MOQV 편집팀',tags:document.getElementById('ed-tags').value.split(',').map(function(t){return t.trim()}).filter(Boolean),date:new Date().toISOString().split('T')[0],readMin:Math.max(1,Math.ceil(document.getElementById('ed-content').value.length/800)),views:0};
  if(editId){var idx=DB.articles.findIndex(function(a){return a.id===editId});if(idx>=0){data.id=editId;data.views=DB.articles[idx].views;data.date=DB.articles[idx].date;DB.articles[idx]=Object.assign(DB.articles[idx],data)}}else{data.id=Date.now();DB.articles.push(data)}
  scheduleSave();closeEditor();go(currentPage);
}
function delArticle(id,cat){
  if(!confirm('삭제하시겠습니까? (영구 삭제)'))return;
  DB.articles=DB.articles.filter(function(a){return a.id!==id});
  scheduleSave();go(cat||currentPage);
}

/* ═══ Admin Dashboard ═══ */
function renderAdmin(){
  var allArts=DB.articles;var pub=allArts.filter(function(a){return a.status==='published'});
  var cats={};allArts.forEach(function(a){cats[a.cat]=(cats[a.cat]||0)+1});
  var totalViews=allArts.reduce(function(s,a){return s+(a.views||0)},0);
  var h='<div class="board"><div class="board-title serif">📊 <span>Dashboard</span></div><div class="board-desc">MOQV 관리자 대시보드</div>';
  // Storage banner
  h+='<div style="background:'+(STORE_MODE==='idb'?'var(--green-soft)':STORE_MODE==='ls'?'rgba(234,179,8,.1)':'var(--red-soft)')+';border:1px solid '+(STORE_MODE==='idb'?'rgba(22,163,74,.2)':STORE_MODE==='ls'?'rgba(234,179,8,.3)':'rgba(220,38,38,.2)')+';border-radius:var(--r-md);padding:16px 20px;margin-bottom:20px"><div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px"><div><span style="font-family:JetBrains Mono,monospace;font-size:12px;color:'+(STORE_MODE==='idb'?'var(--green)':STORE_MODE==='ls'?'#CA8A04':'var(--red)')+';font-weight:700">💾 '+(STORE_MODE==='idb'?'IndexedDB ACTIVE':STORE_MODE==='ls'?'localStorage MODE (IDB 실패 → 자동 전환)':'MEMORY ONLY (저장 불가)')+'</span><div style="font-size:12px;color:var(--text-2);margin-top:4px">'+(STORE_MODE==='mem'?'⚠️ 새로고침 시 데이터가 사라집니다. 백업을 권장합니다.':'기사·첨부파일이 자동 저장됩니다. 새로고침해도 유지됩니다.')+'</div></div><div style="display:flex;gap:6px;flex-wrap:wrap"><button class="btn btn-outline btn-sm" onclick="exportAllData()">📦 전체 백업</button><button class="btn btn-outline btn-sm" onclick="importData()">📂 복원</button><button class="btn btn-danger btn-sm" onclick="resetToSeed()">🔄 초기화</button></div></div></div>';
  // Stats
  h+='<div class="admin-stats"><div class="admin-stat"><div class="num">'+allArts.length+'</div><div class="label">전체 기사</div></div><div class="admin-stat"><div class="num">'+pub.length+'</div><div class="label">Published</div></div><div class="admin-stat"><div class="num">'+DB.weekly.length+'</div><div class="label">주간 데이터</div></div><div class="admin-stat"><div class="num">'+totalViews.toLocaleString()+'</div><div class="label">총 조회수</div></div></div>';
  // DB map
  h+='<div class="sh"><span class="sh-label eng">DATABASE MAP</span><span class="sh-line"></span></div>';
  h+='<div style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--r-md);padding:20px;margin-bottom:20px;font-family:JetBrains Mono,monospace;font-size:11px;line-height:2.2;color:var(--text-2)">';
  h+='<div style="color:var(--accent);font-weight:700;margin-bottom:8px">'+(STORE_MODE==='idb'?'IndexedDB "moqv-db"':STORE_MODE==='ls'?'localStorage (moqv:*)':'Memory Only')+'</div>';
  h+='<div style="padding-left:16px;border-left:2px solid var(--border)">';
  h+='📁 <strong>articles</strong> — '+allArts.length+'건 (기사 원본)<br>';
  h+='📁 <strong>attachments</strong> — 첨부파일 (base64, 기사별 max 5개)<br>';
  h+='📁 <strong>research</strong> — HML Research 파일 (관리자 업로드)<br>';
  h+='📁 <strong>config</strong> — weekly 지표 ('+DB.weekly.length+'주), routes ('+Object.keys(DB.routes).length+'회), meta<br>';
  h+='</div>';
  h+='<div style="margin-top:12px;padding-top:12px;border-top:1px solid var(--border);color:var(--text-3)">💡 백업: 📦 전체 백업 → JSON 다운로드 · 📂 복원 → JSON 업로드</div></div>';
  // Category
  h+='<div style="display:grid;grid-template-columns:repeat(5,1fr);gap:8px;margin-bottom:24px">';
  Object.entries(catMeta).forEach(function(e){h+='<div style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--r);padding:12px;text-align:center"><div style="font-family:JetBrains Mono,monospace;font-size:10px;color:'+e[1].color+'">'+e[1].label+'</div><div style="font-size:24px;font-weight:800">'+(cats[e[0]]||0)+'</div></div>'});
  h+='</div>';
  // Agent monitor
  h+='<div class="sh"><span class="sh-label eng">AGENT MONITOR</span><span class="sh-line"></span></div><div class="am-grid"><div class="am-card scout"><div style="font-size:20px">🔍</div><div style="font-weight:700;margin-top:4px">Scout</div><div style="font-size:12px;color:var(--text-3)">소스 모니터링</div><div class="am-status am-on">ACTIVE</div></div><div class="am-card writer"><div style="font-size:20px">✍️</div><div style="font-weight:700;margin-top:4px">Writer</div><div style="font-size:12px;color:var(--text-3)">기사 작성</div><div class="am-status am-on">ACTIVE</div></div><div class="am-card designer"><div style="font-size:20px">🎨</div><div style="font-weight:700;margin-top:4px">Designer</div><div style="font-size:12px;color:var(--text-3)">인포그래픽</div><div class="am-status am-off">STANDBY</div></div><div class="am-card publisher"><div style="font-size:20px">📡</div><div style="font-weight:700;margin-top:4px">Publisher</div><div style="font-size:12px;color:var(--text-3)">배포</div><div class="am-status am-off">STANDBY</div></div></div>';
  // Subscriptions
  h+='<div class="sh"><span class="sh-label eng">SUBSCRIPTIONS</span><span class="sh-line"></span></div><div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:24px">';
  Object.entries(SUBS).forEach(function(e){var k=e[0],v=e[1];
    h+='<div style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--r-md);padding:16px"><div style="font-weight:700;margin-bottom:4px">'+v.label+'</div><div style="font-family:JetBrains Mono,monospace;font-size:11px;color:var(--text-2);line-height:1.8">PDF: '+(v.pdf?'✅':'❌')+'<br>첨부: '+(v.attach?'✅':'❌')+'<br>Data: '+(v.data?'✅':'❌')+'<br>아카이브: '+(v.archive>=999?'전체':v.archive+'개월')+'</div>'+(v.price?'<div style="color:var(--accent);font-weight:600;margin-top:4px;font-family:JetBrains Mono,monospace;font-size:12px">'+v.price+'</div>':'')+'</div>'});
  h+='</div>';
  // Articles table
  h+='<div class="sh"><span class="sh-label eng">ARTICLES ('+allArts.length+')</span><span class="sh-line"></span><button class="btn btn-primary btn-sm" onclick="openEditor()">+ 새 기사</button></div>';
  h+='<div style="overflow-x:auto"><table class="admin-table"><thead><tr><th>ID</th><th>CAT</th><th>TITLE</th><th>DATE</th><th>STATUS</th><th>VIEWS</th><th>ACT</th></tr></thead><tbody>';
  allArts.slice().sort(function(a,b){return b.date.localeCompare(a.date)}).slice(0,30).forEach(function(a){var cm=catMeta[a.cat]||{label:'',cls:''};
    h+='<tr><td class="mono" style="font-size:10px">'+a.id+'</td><td><span class="cat '+cm.cls+' eng" style="font-size:9px">'+cm.label+'</span></td><td style="max-width:260px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;cursor:pointer" onclick="goArticle('+a.id+')">'+a.title+'</td><td class="mono" style="font-size:10px">'+a.date+'</td><td><span class="status-badge status-'+a.status+'">'+a.status.toUpperCase()+'</span></td><td class="mono">'+(a.views||0).toLocaleString()+'</td><td style="white-space:nowrap"><button class="btn btn-edit btn-sm" onclick="openEditor('+a.id+')">✏️</button> <button class="btn btn-danger btn-sm" onclick="delArticle('+a.id+')">🗑</button></td></tr>'});
  h+='</tbody></table></div>';
  if(allArts.length>30)h+='<p style="text-align:center;padding:12px;font-family:JetBrains Mono,monospace;font-size:11px;color:var(--text-3)">최근 30건 표시 (전체 '+allArts.length+'건)</p>';
  h+='</div>';return h;
}
