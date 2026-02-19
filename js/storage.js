/* ═══════════════════════════════════════════════════════
 * MOQV v6.0 — Storage Layer
 * ═══════════════════════════════════════════════════════
 *
 * 이 파일이 하는 일:
 * - IndexedDB 연결 및 CRUD (idbPut, idbGetAll, idbGet, idbDel)
 * - localStorage 폴백 (lsSet, lsGet, lsDel)
 * - 통합 저장/로드 (saveArticlesToDB, loadData)
 * - 동기화 UI 배지 (updateSyncBadge)
 * - 지표 갱신 (refreshIndices)
 *
 * 3단계 Fallback: IndexedDB → localStorage → Memory
 * ═══════════════════════════════════════════════════════ */

/* ═══ STORAGE LAYER (IndexedDB + localStorage fallback) ═══ */
var STORE_MODE='none'; // 'idb' | 'ls' | 'mem'
function openDB(){
  return new Promise(function(resolve,reject){
    if(!window.indexedDB){reject(new Error('IndexedDB not supported'));return}
    var timeout=setTimeout(function(){reject(new Error('IndexedDB open timeout'))},5000);
    try{
      var req=indexedDB.open('moqv-db',3);
      req.onblocked=function(){clearTimeout(timeout);console.warn('[MOQV] DB blocked — close other tabs');reject(new Error('DB blocked by other tab'))};
      req.onupgradeneeded=function(e){
        var db=e.target.result;
        if(!db.objectStoreNames.contains('articles'))db.createObjectStore('articles',{keyPath:'id'});
        if(!db.objectStoreNames.contains('attachments'))db.createObjectStore('attachments',{keyPath:'uid'});
        if(!db.objectStoreNames.contains('config'))db.createObjectStore('config',{keyPath:'key'});
        if(!db.objectStoreNames.contains('research'))db.createObjectStore('research',{keyPath:'id'});
      };
      req.onsuccess=function(e){clearTimeout(timeout);resolve(e.target.result)};
      req.onerror=function(e){clearTimeout(timeout);reject(e.target.error||new Error('DB open error'))};
    }catch(ex){clearTimeout(timeout);reject(ex)}
  });
}
// ── IDB helpers (all null-safe) ──
function idbPut(store,data){
  if(!idb)return Promise.resolve(false);
  return new Promise(function(resolve,reject){
    try{
      var tx=idb.transaction(store,'readwrite');
      var os=tx.objectStore(store);
      if(Array.isArray(data)){data.forEach(function(d){os.put(d)})}else{os.put(data)}
      tx.oncomplete=function(){resolve(true)};
      tx.onerror=function(e){console.error('[IDB] put error:',e);resolve(false)};
    }catch(ex){console.error('[IDB] put exception:',ex);resolve(false)}
  });
}
function idbGetAll(store){
  if(!idb)return Promise.resolve([]);
  return new Promise(function(resolve,reject){
    try{
      var tx=idb.transaction(store,'readonly');
      var os=tx.objectStore(store);
      var req=os.getAll();
      req.onsuccess=function(){resolve(req.result||[])};
      req.onerror=function(){resolve([])};
    }catch(ex){resolve([])}
  });
}
function idbGet(store,key){
  if(!idb)return Promise.resolve(null);
  return new Promise(function(resolve){
    try{
      var tx=idb.transaction(store,'readonly');
      var req=tx.objectStore(store).get(key);
      req.onsuccess=function(){resolve(req.result||null)};
      req.onerror=function(){resolve(null)};
    }catch(ex){resolve(null)}
  });
}
function idbDel(store,key){
  if(!idb)return Promise.resolve(false);
  return new Promise(function(resolve){
    try{
      var tx=idb.transaction(store,'readwrite');
      tx.objectStore(store).delete(key);
      tx.oncomplete=function(){resolve(true)};
      tx.onerror=function(){resolve(false)};
    }catch(ex){resolve(false)}
  });
}
function idbClearAndPut(store,data){
  if(!idb)return Promise.resolve(false);
  return new Promise(function(resolve){
    try{
      var tx=idb.transaction(store,'readwrite');
      var os=tx.objectStore(store);
      os.clear();
      if(Array.isArray(data)){data.forEach(function(d){os.put(d)})}else if(data){os.put(data)}
      tx.oncomplete=function(){resolve(true)};
      tx.onerror=function(e){console.error('[IDB] clearAndPut error:',e);resolve(false)};
    }catch(ex){console.error('[IDB] clearAndPut exception:',ex);resolve(false)}
  });
}

// ── localStorage helpers (fallback) ──
function lsSet(key,val){try{localStorage.setItem('moqv:'+key,JSON.stringify(val));return true}catch(e){return false}}
function lsGet(key){try{var v=localStorage.getItem('moqv:'+key);return v?JSON.parse(v):null}catch(e){return null}}
function lsDel(key){try{localStorage.removeItem('moqv:'+key)}catch(e){}}

// ── Unified Save ──
async function saveArticlesToDB(){
  if(STORE_MODE==='idb'){
    var ok1=await idbClearAndPut('articles',DB.articles);
    var ok2=await idbPut('config',{key:'weekly',value:DB.weekly});
    var ok3=await idbPut('config',{key:'routes',value:DB.routes});
    await idbPut('config',{key:'meta',value:{version:'5.1',lastSync:new Date().toISOString(),articleCount:DB.articles.length}});
    if(!ok1){console.warn('[MOQV] IDB save failed, falling back to localStorage');STORE_MODE='ls';saveToLS()}
  }else if(STORE_MODE==='ls'){
    saveToLS();
  }
  updateSyncBadge('saved');
}
function saveToLS(){
  lsSet('articles',DB.articles);
  lsSet('weekly',DB.weekly);
  lsSet('routes',DB.routes);
  lsSet('meta',{version:'5.1',lastSync:new Date().toISOString(),articleCount:DB.articles.length});
}
var saveTimer=null;
function scheduleSave(){
  updateSyncBadge('saving');
  if(saveTimer)clearTimeout(saveTimer);
  saveTimer=setTimeout(function(){saveArticlesToDB()},600);
}
function updateSyncBadge(s){
  var el=document.getElementById('syncBadge');if(!el)return;
  var modeLabel=STORE_MODE==='idb'?'IndexedDB':STORE_MODE==='ls'?'localStorage':'메모리';
  var m={idle:'⏸ '+modeLabel,saving:'⏳ 저장 중...',saved:'✅ 저장됨 ('+modeLabel+')',error:'⚠️ 오류'};
  var c={idle:'var(--text-3)',saving:'var(--accent)',saved:'var(--green)',error:'var(--red)'};
  el.innerHTML='<span style="color:'+c[s]+'">'+m[s]+'</span>';
  if(s==='saved')setTimeout(function(){updateSyncBadge('idle')},2500);
}

// ── Unified Load ──
async function loadData(){
  var el=document.getElementById('app');
  el.innerHTML='<div style="text-align:center;padding:80px 0;color:var(--text-3)"><div style="font-size:32px;margin-bottom:12px">⏳</div><div id="loadStatus" style="font-family:JetBrains Mono,monospace;font-size:12px">데이터베이스 연결 중...</div></div>';
  var status=document.getElementById('loadStatus');

  // Try 1: IndexedDB
  try{
    if(status)status.textContent='IndexedDB 연결 시도...';
    idb=await openDB();
    var arts=await idbGetAll('articles');
    var wkCfg=await idbGet('config','weekly');
    var rtCfg=await idbGet('config','routes');
    if(arts&&arts.length>0){
      DB.articles=arts;
      DB.weekly=wkCfg?wkCfg.value:SEED_WEEKLY;
      DB.routes=rtCfg?rtCfg.value:SEED_ROUTES;
      STORE_MODE='idb';
      console.log('[MOQV] IndexedDB loaded:',DB.articles.length,'articles');
    }else{
      if(status)status.textContent='첫 실행 — 데이터 시드 중...';
      DB.articles=JSON.parse(JSON.stringify(SEED_ARTICLES));
      DB.weekly=JSON.parse(JSON.stringify(SEED_WEEKLY));
      DB.routes=JSON.parse(JSON.stringify(SEED_ROUTES));
      STORE_MODE='idb';
      await saveArticlesToDB();
      console.log('[MOQV] Seeded',DB.articles.length,'articles into IndexedDB');
    }
  }catch(e){
    console.warn('[MOQV] IndexedDB failed:',e.message);
    idb=null;

    // Try 2: localStorage
    if(status)status.textContent='IndexedDB 실패 → localStorage 시도...';
    var lsArts=lsGet('articles');
    if(lsArts&&lsArts.length>0){
      DB.articles=lsArts;
      DB.weekly=lsGet('weekly')||SEED_WEEKLY;
      DB.routes=lsGet('routes')||SEED_ROUTES;
      STORE_MODE='ls';
      console.log('[MOQV] localStorage loaded:',DB.articles.length,'articles');
    }else{
      // Try seeding into localStorage
      DB.articles=JSON.parse(JSON.stringify(SEED_ARTICLES));
      DB.weekly=JSON.parse(JSON.stringify(SEED_WEEKLY));
      DB.routes=JSON.parse(JSON.stringify(SEED_ROUTES));
      if(lsSet('articles',DB.articles)){
        STORE_MODE='ls';
        saveToLS();
        console.log('[MOQV] Seeded into localStorage');
      }else{
        // Fallback 3: Memory only
        STORE_MODE='mem';
        console.warn('[MOQV] All storage failed — memory only mode');
      }
    }
  }

  refreshIndices();
  buildNav();buildTicker();go('home');
  // Show storage mode in console
  console.log('[MOQV] Storage mode:',STORE_MODE,'| Articles:',DB.articles.length,'| Protocol:',location.protocol);
}
