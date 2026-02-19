/* ═══════════════════════════════════════════════════════
 * MOQV v6.0 — API & Data Operations
 * ═══════════════════════════════════════════════════════
 *
 * 이 파일이 하는 일:
 * - 첨부파일 CRUD (getAtts, addAtt, removeAtt)
 * - 파일 유틸리티 (readFileAsDataURL, fmtSize)
 * - 백업/복원 (exportAllData, importData, resetToSeed)
 * - PDF 내보내기 (exportPDF)
 * ═══════════════════════════════════════════════════════ */

/* ═══ Attachment CRUD ═══ */
async function getAtts(articleId){
  if(STORE_MODE==='idb'){
    try{var all=await idbGetAll('attachments');return all.filter(function(a){return a.articleId===articleId})}catch(e){return[]}
  }else if(STORE_MODE==='ls'){
    var all=lsGet('attachments')||[];return all.filter(function(a){return a.articleId===articleId});
  }
  return[];
}
async function addAtt(articleId){
  if(!canAttach()){alert('첨부파일은 Pro 구독 이상에서 이용 가능합니다.');return}
  var input=document.createElement('input');input.type='file';input.multiple=true;
  input.accept='.pdf,.docx,.xlsx,.pptx,.csv,.json,.png,.jpg,.jpeg,.svg';
  input.onchange=async function(e){
    var files=Array.from(e.target.files);if(!files.length)return;
    var existing=await getAtts(articleId);
    if(existing.length+files.length>5){alert('기사당 최대 5개 첨부 가능');return}
    for(var i=0;i<files.length;i++){
      var f=files[i];
      if(f.size>10*1024*1024){alert(f.name+': 10MB 초과');continue}
      var dataUrl=await readFileAsDataURL(f);
      var attItem={uid:articleId+'_'+Date.now()+'_'+i,articleId:articleId,name:f.name,size:fmtSize(f.size),type:f.type,date:new Date().toISOString().split('T')[0],dataUrl:dataUrl};
      if(STORE_MODE==='idb'){await idbPut('attachments',attItem)}
      else if(STORE_MODE==='ls'){var arr=lsGet('attachments')||[];arr.push(attItem);lsSet('attachments',arr)}
    }
    goArticle(articleId);
  };
  input.click();
}
function readFileAsDataURL(f){return new Promise(function(res,rej){var r=new FileReader();r.onload=function(){res(r.result)};r.onerror=rej;r.readAsDataURL(f)})}
async function removeAtt(uid,articleId){
  if(!confirm('첨부파일을 삭제하시겠습니까?'))return;
  if(STORE_MODE==='idb'){await idbDel('attachments',uid)}
  else if(STORE_MODE==='ls'){var arr=lsGet('attachments')||[];arr=arr.filter(function(a){return a.uid!==uid});lsSet('attachments',arr)}
  goArticle(articleId);
}
function fmtSize(b){if(b<1024)return b+'B';if(b<1048576)return(b/1024).toFixed(1)+'KB';return(b/1048576).toFixed(1)+'MB'}

/* ═══ Export / Import (Backup) ═══ */
async function exportAllData(){
  var atts=STORE_MODE==='idb'?await idbGetAll('attachments'):(lsGet('attachments')||[]);
  var research=STORE_MODE==='idb'?await idbGetAll('research'):(lsGet('research')||[]);
  var payload={version:'5.1',exported:new Date().toISOString(),articles:DB.articles,weekly:DB.weekly,routes:DB.routes,attachments:atts,research:research};
  var blob=new Blob([JSON.stringify(payload)],{type:'application/json'});
  var url=URL.createObjectURL(blob);
  var a=document.createElement('a');a.href=url;a.download='moqv-backup-'+new Date().toISOString().split('T')[0]+'.json';a.click();
  URL.revokeObjectURL(url);
  alert('백업 완료!\n\n기사 '+DB.articles.length+'건, 첨부 '+atts.length+'개, 리서치 '+research.length+'건 포함');
}
async function importData(){
  var input=document.createElement('input');input.type='file';input.accept='.json';
  input.onchange=async function(e){
    var f=e.target.files[0];if(!f)return;
    var text=await f.text();
    try{
      var data=JSON.parse(text);
      if(!data.articles||!data.weekly){alert('유효하지 않은 백업 파일');return}
      if(!confirm('현재 데이터를 백업 파일로 교체하시겠습니까?\n\n기사: '+data.articles.length+'건\n첨부: '+(data.attachments?data.attachments.length:0)+'개\n\n기존 데이터는 사라집니다.'))return;
      DB.articles=data.articles;DB.weekly=data.weekly;DB.routes=data.routes||{};
      await saveArticlesToDB();
      if(data.attachments){
        if(STORE_MODE==='idb'){await idbClearAndPut('attachments',data.attachments)}
        else if(STORE_MODE==='ls'){lsSet('attachments',data.attachments)}
      }
      if(data.research){
        if(STORE_MODE==='idb'){await idbClearAndPut('research',data.research)}
        else if(STORE_MODE==='ls'){lsSet('research',data.research)}
      }
      refreshIndices();buildTicker();go(currentPage);
      alert('복원 완료: '+DB.articles.length+'건');
    }catch(err){alert('파일 파싱 오류: '+err.message)}
  };
  input.click();
}
async function resetToSeed(){
  if(!confirm('모든 데이터를 초기 상태(101건)로 되돌리시겠습니까?\n\n추가한 기사·첨부파일이 모두 삭제됩니다.'))return;
  DB.articles=JSON.parse(JSON.stringify(SEED_ARTICLES));
  DB.weekly=JSON.parse(JSON.stringify(SEED_WEEKLY));
  DB.routes=JSON.parse(JSON.stringify(SEED_ROUTES));
  await saveArticlesToDB();
  await idbClearAndPut('attachments',[]);
  await idbClearAndPut('research',[]);
  if(STORE_MODE==='ls'){lsDel('attachments');lsDel('research')}
  refreshIndices();buildTicker();go('admin');
  alert('초기화 완료: '+SEED_ARTICLES.length+'건으로 복원');
}

/* ═══ PDF Export (safe string concat) ═══ */
async function exportPDF(id){
  if(!canPDF()){alert('PDF 내보내기는 Basic 이상 구독이 필요합니다.');return}
  var a=DB.articles.find(function(x){return x.id===id});if(!a)return;
  var cm=catMeta[a.cat]||{label:''};
  var atts=await getAtts(id);
  var p=[];
  p.push('<!DOCTYPE html><html><head><meta charset="UTF-8"><title>');
  p.push(a.title+' — MOQV<');p.push('/title><style>');
  p.push("@import url('https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@400;700;900&family=Noto+Sans+KR:wght@300;400;700&family=JetBrains+Mono:wght@400&display=swap');");
  p.push('*{margin:0;padding:0;box-sizing:border-box}body{font-family:Noto Sans KR,sans-serif;padding:60px;max-width:800px;margin:0 auto;color:#1a1a1a;line-height:1.8}');
  p.push('.hd{border-bottom:3px double #D0CAC0;padding-bottom:16px;margin-bottom:32px;display:flex;justify-content:space-between;align-items:flex-end}');
  p.push('.lg{font-family:JetBrains Mono,monospace;font-size:24px;font-weight:800;letter-spacing:.1em}.lg b{color:#FF4D00;font-weight:800}');
  p.push('.ct{font-family:JetBrains Mono,monospace;font-size:11px;letter-spacing:.15em;color:#FF4D00;margin-bottom:12px}');
  p.push('h1{font-family:Noto Serif KR,serif;font-size:28px;font-weight:900;line-height:1.4;margin-bottom:16px}');
  p.push('.mt{font-size:13px;color:#8a8a8a;margin-bottom:24px;padding-bottom:16px;border-bottom:1px solid #E2DED6}');
  p.push('.bd{font-family:Noto Serif KR,serif;font-size:15px;line-height:2}.bd p{margin-bottom:16px}.bd strong{color:#FF4D00}');
  p.push('.data-box{background:#F3EFE9;border-left:4px solid #FF4D00;padding:14px 18px;margin:20px 0;font-family:Noto Sans KR,sans-serif;font-size:13px;line-height:1.7;border-radius:0 6px 6px 0}');
  p.push('.source{font-family:JetBrains Mono,monospace;font-size:11px;color:#8a8a8a}');
  p.push('.at{margin-top:24px;padding:16px;background:#EFF6FF;border-radius:8px}.at h4{font-size:13px;margin-bottom:8px;color:#2563EB}.at div{font-size:12px;padding:3px 0}');
  p.push('.ft{margin-top:40px;padding-top:16px;border-top:1px solid #E2DED6;font-family:JetBrains Mono,monospace;font-size:9px;color:#8a8a8a;text-align:center}');
  p.push('@media print{body{padding:40px}@page{margin:2cm}}<');p.push('/style><');p.push('/head><body>');
  p.push('<div class="hd"><div class="lg">MO<b>Q</b>V</div><div style="text-align:right;font-family:JetBrains Mono,monospace;font-size:10px;color:#8a8a8a">THE QUARTERLY OF VESSELS<br>POWERED BY HAMEL KOREA</div></div>');
  p.push('<div class="ct">'+cm.label+'</div>');
  p.push('<h1>'+a.title+'</h1>');
  p.push('<div class="mt">'+a.author+' · '+a.date+' · '+a.readMin+'분 읽기</div>');
  p.push('<div class="bd">'+a.content+'</div>');
  if(atts.length>0){p.push('<div class="at"><h4>📎 첨부파일 ('+atts.length+')</h4>');atts.forEach(function(att){p.push('<div>📄 '+att.name+' ('+att.size+')</div>')});p.push('</div>')}
  p.push('<div class="ft">© MOQV — Powered by Hamel Korea · '+new Date().toISOString().split('T')[0]+'</div>');
  p.push('<scr');p.push('ipt>setTimeout(function(){window.print()},500)<');p.push('/scr');p.push('ipt>');
  p.push('<');p.push('/body><');p.push('/html>');
  var w=window.open('','_blank');w.document.write(p.join(''));w.document.close();
}

