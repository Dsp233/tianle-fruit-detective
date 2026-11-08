/* AMC8 W1 isolated preview review overlay.
 * Runs in a same-origin shell; does not modify product runtime files.
 * Notes live under a namespaced key, never in the learning-record namespace.
 */
(()=>{
  'use strict';
  if(window.__AMC8_REVIEW_OVERLAY_LOADED__)return;
  window.__AMC8_REVIEW_OVERLAY_LOADED__=true;
  const host=document.createElement('div');
  host.id='amc8-review-layer';
  host.setAttribute('data-review-layer','');
  host.style.cssText='position:fixed;inset:0;z-index:2147483000;pointer-events:none;';
  const root=host.attachShadow({mode:'open'});
  const uiStyle=document.createElement('link');
  uiStyle.rel='stylesheet';uiStyle.href=new URL('./review-overlay.css',document.currentScript?.src||document.baseURI).href;
  root.append(uiStyle);
  const surface=document.createElement('div');
  surface.className='review-surface';
  surface.innerHTML='<div class="review-overlay" id="review-overlay" aria-hidden="true"><div id="review-highlight" class="review-highlight" hidden></div><div id="review-markers" class="review-markers"></div></div><div class="review-banner" id="review-banner" hidden><span class="review-live-dot"></span>评审模式 · 移到元素上高亮，点击添加意见 · 退出后可正常操作</div>\n<nav class="review-toolbar" aria-label="评审工具">\n      <button class="review-btn review-mode-btn" type="button" id="toggle-review" aria-pressed="false"><span aria-hidden="true">✎</span><span id="mode-label">评审模式</span></button>\n      <button class="review-btn review-list-btn" type="button" id="open-list"><span aria-hidden="true">☷</span>评审清单 <span class="review-toolbar-count" id="toolbar-count">0</span></button>\n      <span id="review-save-status" class="review-save-status" role="status" aria-live="polite"></span>\n    </nav>\n<div id="panel-backdrop" class="panel-backdrop" hidden></div>\n  <aside class="review-panel" id="review-panel" role="dialog" aria-modal="true" aria-labelledby="panel-title" hidden>\n    <header class="panel-header"><div><p class="review-eyebrow">REVIEW NOTES</p><h2 id="panel-title">评审清单</h2></div><button type="button" class="icon-btn" id="close-list" aria-label="关闭评审清单">×</button></header>\n    <div class="panel-body">\n      <div class="form-row"><label>版本号<input id="review-version" maxlength="80" autocomplete="off" placeholder="W1-RC-c8575da" spellcheck="false"></label><label>日期<input id="review-date" type="date"></label></div>\n      <div class="form-row"><label>清单标题<input id="review-list-title" maxlength="100"></label><label>导出文件名<input id="export-filename" maxlength="120"></label></div>\n      <div class="form-row"><label>处理状态<select id="review-filter"><option value="">全部</option><option value="open">待处理</option><option value="processed">已处理</option></select></label></div>\n      <div class="panel-actions"><button type="button" id="toggle-markers" class="secondary-btn">隐藏标注</button><button type="button" id="copy-md" class="primary-btn">复制清单（Markdown）</button><button type="button" id="download-md" class="secondary-btn">下载 .md 文件</button></div>\n      <p class="panel-help">包含每条编号、处理状态、分类、页面路径、元素定位、所在卡片、修改意见和提出人。处理后的意见也会保留在导出清单里。</p>\n      <div class="list-summary"><strong id="list-summary">0 条意见</strong><span id="list-storage-warning"></span></div>\n      <div id="review-items" class="review-items"></div>\n    </div>\n  </aside>\n\n  <div id="edit-backdrop" class="edit-backdrop" hidden></div>\n  <section id="edit-modal" class="edit-modal" role="dialog" aria-modal="true" aria-labelledby="edit-title" hidden>\n    <header class="edit-head"><div><p class="review-eyebrow">ADD / EDIT</p><h2 id="edit-title">添加评审意见</h2></div><button type="button" class="icon-btn" id="close-edit" aria-label="关闭编辑窗口">×</button></header>\n    <form id="annotation-form">\n      <div class="target-summary"><div id="target-page"></div><strong id="target-element"></strong><small id="target-card"></small></div>\n      <label class="field-label" for="note-category">分类</label>\n      <select id="note-category" required><option>交互</option><option>视觉</option><option>内容</option><option>遗漏</option><option>Bug</option></select>\n      <label class="field-label" for="note-text">修改意见 <span class="required">*</span></label>\n      <textarea id="note-text" rows="4" maxlength="3000" required placeholder="例如：第 7 天选项点击区域过小，建议整个卡片都可以点击。"></textarea>\n      <label class="field-label" for="note-reporter">提出人（可不填）</label>\n      <input id="note-reporter" maxlength="80" autocomplete="name" placeholder="匿名 / 张老师 / Franz">\n      <div class="edit-foot"><div class="edit-manage" id="edit-manage" hidden><button type="button" id="mark-processed" class="secondary-btn">标为已处理</button><button type="button" id="delete-annotation" class="danger-btn">删除</button></div><button type="button" id="cancel-edit" class="secondary-btn">取消</button><button type="submit" class="primary-btn" id="save-annotation">保存意见</button></div>\n    </form>\n  </section>\n';
  root.append(surface);
  (document.body||document.documentElement).append(host);
  const BUILD_SHA='c8575da9d28c40b5bf79412928a0be8c397e7094';
  const KEY='tianle_w1_device_review_v1';
  const CATEGORY=new Set(['交互','视觉','内容','遗漏','Bug']);
  const $=id=>root.getElementById(id);
  const ui={
    highlight:$('review-highlight'),
    overlay:$('review-overlay'),markers:$('review-markers'),banner:$('review-banner'),
    toggle:$('toggle-review'),modeLabel:$('mode-label'),openList:$('open-list'),
    panel:$('review-panel'),panelBackdrop:$('panel-backdrop'),closeList:$('close-list'),
    edit:$('edit-modal'),editBackdrop:$('edit-backdrop'),closeEdit:$('close-edit'),cancelEdit:$('cancel-edit'),
    form:$('annotation-form'),editManage:$('edit-manage'),markProcessed:$('mark-processed'),deleteAnnotation:$('delete-annotation'),category:$('note-category'),note:$('note-text'),reporter:$('note-reporter'),
    targetPage:$('target-page'),targetElement:$('target-element'),targetCard:$('target-card'),editTitle:$('edit-title'),
    version:$('review-version'),date:$('review-date'),fileName:$('export-filename'),listTitle:$('review-list-title'),panelTitle:$('panel-title'),filter:$('review-filter'),list:$('review-items'),
    listSummary:$('list-summary'),hiddenButton:$('toggle-markers'),copy:$('copy-md'),download:$('download-md'),
    toolbarCount:$('toolbar-count'),total:null,saveStatus:$('review-save-status'),storeWarning:$('list-storage-warning')
  };
  const today=()=>{const d=new Date();return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-')};
  let review=false,visible=true,editingId=null,pendingTarget=null,nextId=1,notes=[];
  let metadata={version:'W1-RC-c8575da',date:today(),title:'评审清单',filename:''};
  let retargetId=null;
  let pointer=null,lastSelectionAt=0,frameBound=null,refreshScheduled=false;
  let qaDownloadClick=false;
  let storageUsable=true,lastFocus=null;
  const plain=x=>x&&typeof x==='object'&&!Array.isArray(x);
  const limit=(value,length=150)=>String(value??'').replace(/\s+/g,' ').trim().slice(0,length);
  function notify(s){ui.saveStatus.textContent=s;ui.saveStatus.title=s}
  function load(){
    try{
      const raw=localStorage.getItem(KEY);if(!raw)return;
      const data=JSON.parse(raw);if(!plain(data)||!Array.isArray(data.notes))return;
      notes=data.notes.filter(n=>plain(n)&&Number.isSafeInteger(n.id)&&n.id>0&&typeof n.text==='string'&&typeof n.path==='string')
        .slice(0,2000).map(n=>({...n,status:n.status==='processed'?'processed':'open'}));
      nextId=Math.max(1,Number.isSafeInteger(data.nextId)?data.nextId:1,...notes.map(n=>n.id+1));
      if(plain(data.metadata)){
        if(typeof data.metadata.title==='string')metadata.title=limit(data.metadata.title,100)||metadata.title;
        if(typeof data.metadata.filename==='string')metadata.filename=cleanFileName(data.metadata.filename);
        if(typeof data.metadata.version==='string')metadata.version=limit(data.metadata.version,80)||metadata.version;
        if(typeof data.metadata.date==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(data.metadata.date))metadata.date=data.metadata.date;
      }
      if(typeof data.visible==='boolean')visible=data.visible;
    }catch(_){storageUsable=false;notify('评审存储不可读，请及时导出 Markdown。')}
  }
  function persist(){
    try{localStorage.setItem(KEY,JSON.stringify({schema:1,build:BUILD_SHA,notes,nextId,metadata,visible}));storageUsable=true;return true}
    catch(_){storageUsable=false;notify('浏览器未能保存批注，请尽快复制或下载 Markdown。');return false}
  }
  function cssEscape(value){
    if(window.CSS&&typeof window.CSS.escape==='function')return window.CSS.escape(value);
    return String(value).replace(/[^a-zA-Z0-9_-]/g,c=>'\\'+c.charCodeAt(0).toString(16)+' ');
  }
  function selectorOf(el,doc){
    if(!(el instanceof doc.defaultView.Element))return 'body';
    if(el.id)return '#'+cssEscape(el.id);
    const path=[];let current=el;
    for(let depth=0;depth<7&&current&&current.nodeType===1;depth++){
      let segment=current.localName.toLowerCase();
      const id=current.id;if(id){segment='#'+cssEscape(id);path.unshift(segment);break}
      const action=current.getAttribute('data-action');
      if(action&&action.length<100)segment+='[data-action="'+action.replace(/["\\]/g,'\\$&')+'"]';
      const siblings=current.parentElement?[...current.parentElement.children].filter(x=>x.localName===current.localName):[];
      if(siblings.length>1)segment+=':nth-of-type('+(siblings.indexOf(current)+1)+')';
      path.unshift(segment);current=current.parentElement;
      if(current===doc.body){path.unshift('body');break}
    }
    return path.join(' > ').slice(0,500)||'body';
  }
  function displayLabel(el){
    const tag=el.localName?.toLowerCase()||'element';
    let name=el.getAttribute?.('aria-label')||el.getAttribute?.('title')||el.getAttribute?.('placeholder')||'';
    if(!name){const heading=el.querySelector?.('h1,h2,h3,.title');name=heading?.textContent||el.textContent||''}
    // Never record entered values or contenteditable body text.
    if(el.matches?.('input,textarea,[contenteditable]'))name=el.getAttribute('aria-label')||el.getAttribute('placeholder')||tag;
    return tag+(name?' · '+limit(name,85):'');
  }
  function sectionOf(el){
    const card=el.closest?.('[data-question-id],[data-question],[data-material-id],[data-day],[data-card],article,[role="group"],.rd-card,.card,.question,.panel,section,li')||null;
    if(!card)return '页面主体';
    const data=[...card.attributes].filter(a=>/^data-(?:question-id|question|material-id|day|card|action)$/.test(a.name))
      .slice(0,3).map(a=>a.name+'='+limit(a.value,32));
    const title=card.querySelector('h1,h2,h3,h4,.title,[data-card-title]')?.textContent||card.getAttribute('aria-label')||'';
    return limit((card.localName||'card')+(data.length?' ['+data.join(', ')+']':'')+(title?' · '+title:''),170);
  }
  function frameWindow(){return window}
  function framePath(){const w=frameWindow();if(!w)return '/';return w.location.pathname+w.location.search+w.location.hash}
  function headingOf(doc){
    const headings=[...doc.querySelectorAll('h1,h2,h3')];
    const visibleHeading=headings.find(h=>{const r=h.getBoundingClientRect();return r.height>0&&r.top>=0&&r.top<doc.defaultView.innerHeight});
    return limit(visibleHeading?.textContent||doc.title||'未命名页面',100);
  }
  function targetFrom(el,point){
    const w=frameWindow();if(!w||!el||el.nodeType!==1)return null;
    const doc=w.document,r=el.getBoundingClientRect();
    const x=point?.x??(r.left+r.width/2),y=point?.y??(r.top+r.height/2);
    return {path:framePath(),pageTitle:headingOf(doc),selector:selectorOf(el,doc),element:displayLabel(el),card:sectionOf(el),
      relativeX:Math.max(0,Math.min(1,Number.isFinite(r.width)&&r.width?(x-r.left)/r.width:.5)),
      relativeY:Math.max(0,Math.min(1,Number.isFinite(r.height)&&r.height?(y-r.top)/r.height:.5)),
      viewportX:Math.max(0,Math.min(1,x/Math.max(1,w.innerWidth))),viewportY:Math.max(0,Math.min(1,y/Math.max(1,w.innerHeight)))};
  }
  function hover(el){
    if(!review||!visible||!el||el.nodeType!==1||el.closest?.('#amc8-review-layer')){ui.highlight.hidden=true;return}
    const w=frameWindow();if(!w){ui.highlight.hidden=true;return}
    const r=el.getBoundingClientRect();if(!r.height||!r.width||r.bottom<0||r.right<0){ui.highlight.hidden=true;return}
    ui.highlight.hidden=false;
    ui.highlight.style.left=Math.max(0,r.left)+'px';ui.highlight.style.top=Math.max(0,r.top)+'px';
    ui.highlight.style.width=Math.min(r.width,w.innerWidth-Math.max(0,r.left))+'px';
    ui.highlight.style.height=Math.min(r.height,w.innerHeight-Math.max(0,r.top))+'px';
  }
  function openAdd(el,p){
    const t=targetFrom(el,p);if(!t)return;
    lastSelectionAt=Date.now();pendingTarget=t;editingId=retargetId;retargetId=null;
    openEditor();
  }
  function attachFrame(){
    const w=frameWindow();if(!w){notify('预览页面必须与评审页部署在同一 HTTPS 域名，才能定位元素。');return}
    const doc=w.document;
    if(frameBound?.doc===doc)return;
    if(frameBound){try{frameBound.observer.disconnect()}catch(_){}}
    const swallow=e=>{if(!review||e.composedPath?.().includes(host))return;e.stopImmediatePropagation();if(e.cancelable&&['click','dblclick','submit','contextmenu','mousedown','mouseup','keydown','dragstart'].includes(e.type))e.preventDefault()};
    const onPointerDown=e=>{if(!review||e.composedPath?.().includes(host))return;pointer={x:e.clientX,y:e.clientY,time:Date.now(),target:e.target};if(e.pointerType!=='touch'&&e.cancelable)e.preventDefault();swallow(e)};
    const onPointerMove=e=>{if(review&&!e.composedPath?.().includes(host)){hover(e.target)} };
    const onPointerUp=e=>{
      if(!review||e.composedPath?.().includes(host))return;
      const start=pointer;pointer=null;
      e.stopImmediatePropagation();
      if(start&&Math.hypot(e.clientX-start.x,e.clientY-start.y)<12&&Date.now()-start.time<1300&&ui.edit.hidden){
        openAdd(e.target,{x:e.clientX,y:e.clientY});
      }
    };
    const onClick=e=>{
      if(!review||e.composedPath?.().includes(host)||qaDownloadClick)return;
      swallow(e);
      // Desktop accessibility/synthetic click fallback; pointerup already handles normal taps.
      if(Date.now()-lastSelectionAt<600)return;
      if(e.detail===0)openAdd(e.target,{x:e.clientX,y:e.clientY});
    };
    const onKey=e=>{if(review&&!e.composedPath?.().includes(host)&&['Enter',' '].includes(e.key)){swallow(e)}};
    const registrations=[
      ['pointerdown',onPointerDown],['pointermove',onPointerMove],['pointerup',onPointerUp],
      ['click',onClick],['dblclick',swallow],['mousedown',swallow],['mouseup',swallow],
      ['touchstart',swallow],['touchend',swallow],['contextmenu',swallow],
      ['submit',swallow],['dragstart',swallow],['keydown',onKey]
    ];
    for(const [type,handler] of registrations)w.addEventListener(type,handler,{capture:true,passive:false});
    w.addEventListener('scroll',schedulePins,true);w.addEventListener('resize',schedulePins,true);
    const observer=new w.MutationObserver(schedulePins);
    if(doc.body)observer.observe(doc.body,{childList:true,subtree:true,attributes:true,attributeFilter:['hidden','class','style','aria-expanded']});
    frameBound={win:w,doc,observer};schedulePins();
    notify('当前页面已准备评审。');
  }
  function schedulePins(){if(refreshScheduled)return;refreshScheduled=true;requestAnimationFrame(()=>{refreshScheduled=false;renderPins()})}
  function locate(note){
    const w=frameWindow();if(!w||framePath()!==note.path||(note.pageTitle&&headingOf(w.document)!==note.pageTitle))return null;
    try{
      const el=w.document.querySelector(note.selector);
      return el&&displayLabel(el)===note.element&&sectionOf(el)===note.card?el:null;
    }catch(_){return null}
  }
  function renderPins(){
    ui.markers.replaceChildren();ui.banner.hidden=!review||!visible;ui.hiddenButton.textContent=visible?'隐藏标注':'显示标注';
    if(!visible){ui.highlight.hidden=true;return}
    const w=frameWindow();if(!w)return;
    for(const note of notes){
      const el=locate(note);if(!el)continue;
      const r=el.getBoundingClientRect();if(!r.width||!r.height||r.bottom<0||r.top>w.innerHeight||r.right<0||r.left>w.innerWidth)continue;
      const x=Math.max(13,Math.min(w.innerWidth-13,r.left+r.width*(note.relativeX??.5)));
      const y=Math.max(13,Math.min(w.innerHeight-13,r.top+r.height*(note.relativeY??.5)));
      const pin=document.createElement('button');pin.type='button';pin.className='review-pin'+(note.status==='processed'?' processed':'');pin.textContent=String(note.id);pin.style.left=x+'px';pin.style.top=y+'px';pin.title=`#${note.id} · ${note.category} · ${note.status==='processed'?'已处理':'待处理'} · ${limit(note.text,60)}`;
      pin.setAttribute('aria-label','编辑评审意见 #'+note.id);pin.addEventListener('click',e=>{e.stopPropagation();openExisting(note.id)});
      ui.markers.append(pin);
    }
  }
  function syncCounts(){
    const n=notes.length,open=notes.filter(x=>x.status!=='processed').length;
    
    ui.toolbarCount.textContent=String(n);
    ui.listSummary.textContent=`${n} 条 · ${open} 待处理 · ${n-open} 已处理`;
    ui.storeWarning.textContent=storageUsable?'':'未持久化，请立即导出';
  }
  function setReview(enabled){
    review=!!enabled;pointer=null;surface.classList.toggle('is-review',review);ui.toggle.setAttribute('aria-pressed',String(review));
    ui.modeLabel.textContent=review?'退出评审':'评审模式';
    ui.toggle.title=review?'退出评审后可正常操作学习页面':'打开批注模式，不触发应用交互';
    if(!review){retargetId=null;ui.highlight.hidden=true;ui.banner.hidden=true}
    else attachFrame();
    renderPins();notify(review?'已开启评审：点击手机内任意元素添加意见。':'已退出评审：手机内可以正常操作。');
  }
  function openPanel(){
    lastFocus=document.activeElement;ui.panel.hidden=false;ui.panelBackdrop.hidden=false;
    ui.version.value=metadata.version;ui.date.value=metadata.date;
    ui.listTitle.value=metadata.title;updateExportSettings();renderList();ui.version.focus();
  }
  function closePanel(){ui.panel.hidden=true;ui.panelBackdrop.hidden=true;lastFocus?.focus?.()}
  function openEditor(){
    if(!pendingTarget)return;
    lastFocus=document.activeElement;ui.edit.hidden=false;ui.editBackdrop.hidden=false;
    ui.editTitle.textContent=editingId==null?'添加评审意见':`修改意见 #${editingId}`;
    ui.targetPage.textContent=`页面：${pendingTarget.path} · ${pendingTarget.pageTitle||''}`;
    ui.targetElement.textContent=`元素：${pendingTarget.element} (${pendingTarget.selector})`;
    ui.targetCard.textContent=`卡片：${pendingTarget.card}`;
    const existing=notes.find(x=>x.id===editingId);
    ui.editManage.hidden=!existing;ui.markProcessed.textContent=existing?.status==='processed'?'重新打开':'标为已处理';
    ui.category.value=existing?.category||'交互';ui.note.value=existing?.text||'';ui.reporter.value=existing?.reporter||'';
    ui.note.focus();
  }
  function closeEditor(){ui.edit.hidden=true;ui.editBackdrop.hidden=true;pendingTarget=null;editingId=null;lastFocus?.focus?.()}
  function openExisting(id){
    const old=notes.find(x=>x.id===id);if(!old)return;
    closePanel();editingId=id;pendingTarget={path:old.path,pageTitle:old.pageTitle,selector:old.selector,element:old.element,card:old.card,relativeX:old.relativeX,relativeY:old.relativeY,viewportX:old.viewportX,viewportY:old.viewportY};openEditor();
  }
  function save(e){
    e.preventDefault();if(!pendingTarget)return;
    const txt=ui.note.value.trim(),category=ui.category.value;
    if(!txt){ui.note.focus();return}if(!CATEGORY.has(category))return;
    const reporter=limit(ui.reporter.value,80);const now=new Date().toISOString();
    if(editingId!==null){const n=notes.find(x=>x.id===editingId);if(n){Object.assign(n,pendingTarget);n.text=txt;n.category=category;n.reporter=reporter;n.updatedAt=now}}
    else{
      notes.push({id:nextId++,...pendingTarget,category,text:txt,reporter,status:'open',version:metadata.version,build:BUILD_SHA,createdAt:now,updatedAt:now});
    }
    persist();closeEditor();syncCounts();renderPins();renderList();notify('意见已保存，可在评审清单中编辑或导出。');
  }
  function closeAll(){if(!ui.edit.hidden){closeEditor();return}if(!ui.panel.hidden){closePanel();return}if(review)setReview(false)}
  function addButton(parent,label,cb,className=''){
    const b=document.createElement('button');b.type='button';b.textContent=label;b.className=className;b.addEventListener('click',cb);parent.append(b);return b;
  }
  function renderList(){
    ui.list.replaceChildren();syncCounts();
    if(!notes.length){const empty=document.createElement('p');empty.className='note-empty';empty.textContent='暂无评审意见。开启评审模式，点击页面元素添加第一条。';ui.list.append(empty);return}
    const matching=notes.filter(n=>!ui.filter.value||n.status===ui.filter.value);
    if(!matching.length){const empty=document.createElement('p');empty.className='note-empty';empty.textContent='没有符合筛选条件的意见。';ui.list.append(empty);return}
    for(const n of matching.sort((a,b)=>a.id-b.id)){
      const card=document.createElement('article');card.className='review-note';
      const top=document.createElement('div');top.className='note-top';
      for(const [cl,txt] of [['note-id','#'+n.id],['note-category',n.category],['note-status'+(n.status==='processed'?' done':''),n.status==='processed'?'已处理':'待处理']]){
        const span=document.createElement('span');span.className=cl;span.textContent=txt;top.append(span);
      }
      const meta=document.createElement('div');meta.className='note-meta';meta.textContent=`${n.path} · ${n.element} · ${n.card}${n.reporter?' · '+n.reporter:''}`;
      const message=document.createElement('p');message.className='note-text';message.textContent=n.text;
      const actions=document.createElement('div');actions.className='note-actions';
      const onRecordedPage=n.path===framePath()&&(!n.pageTitle||headingOf(document)===n.pageTitle);
      if(onRecordedPage&&!locate(n))meta.textContent+=' · 定位待确认';
      addButton(actions,'修改',()=>openExisting(n.id));
      addButton(actions,n.status==='processed'?'重新打开':'标为已处理',()=>{n.status=n.status==='processed'?'open':'processed';n.updatedAt=new Date().toISOString();persist();renderList();renderPins()});
      addButton(actions,'删除',()=>{if(window.confirm(`确定删除 #${n.id} 吗？此操作不可撤销。`)){notes=notes.filter(x=>x.id!==n.id);persist();renderList();renderPins()}},'delete');
      addButton(actions,'重新定位',()=>{closePanel();setReview(true);retargetId=n.id;notify('请选择这条意见的新位置，然后保存。')});
      card.append(top,meta,message,actions);ui.list.append(card);
    }
  }
  function cleanFileName(value){
    return limit(value,120).replace(/[\\/:*?"<>|\x00-\x1f]/g,'-').replace(/(?:\.md)+$/i,'').replace(/[. ]+$/,'');
  }
  function fileName(){
    const v=cleanFileName(metadata.version||'W1-RC').replace(/\s+/g,'_')||'W1-RC';
    return metadata.filename?`${metadata.filename}.md`:`${v}_评审清单_${metadata.date||today()}.md`;
  }
  function updateExportSettings(){
    ui.panelTitle.textContent=metadata.title;
    ui.fileName.value=metadata.filename?fileName():'';
    ui.fileName.placeholder=fileName();
  }
  function escMd(value){return String(value??'').replace(/\r?\n/g,'<换行>').replace(/\|/g,'\\|').replace(/</g,'&lt;').replace(/>/g,'&gt;')}
  function md(){
    const title=`${escMd(metadata.title)} · ${metadata.version} · ${metadata.date}`;
    const active=notes.filter(n=>n.status!=='processed').length;
    const out=[`# ${title}`,'',`- **版本号**：${metadata.version}`,`- **评审日期**：${metadata.date}`,`- **原始冻结构建**：\`${BUILD_SHA}\``,`- **意见数量**：${notes.length}（待处理 ${active} / 已处理 ${notes.length-active}）`,'- **说明**：本文件由同源预览站的评审批注工具导出。元素选择器和所在卡片用于在对应版本中定位，页面调整后需要核对。','', '| 编号 | 状态 | 分类 | 页面路径 | 位置 / 元素 | 所在卡片 | 意见 | 提出人 |','|---|---|---|---|---|---|---|---|'];
    for(const n of [...notes].sort((a,b)=>a.id-b.id))out.push(`| #${n.id} | ${n.status==='processed'?'已处理':'待处理'} | ${escMd(n.category)} | \`${escMd(n.path)}\` | ${escMd(n.element)}（\`${escMd(n.selector)}\`） | ${escMd(n.card)} | ${escMd(n.text)} | ${escMd(n.reporter||'—')} |`);
    out.push('','## 逐条定位详情','');
    for(const n of [...notes].sort((a,b)=>a.id-b.id)){
      out.push(`### #${n.id} · ${n.category} · ${n.status==='processed'?'已处理':'待处理'}`,'',`- 页面路径：\`${n.path}\``,`- 页面标题：${n.pageTitle||'—'}`,`- 元素选择器：\`${n.selector}\``,`- 点击元素：${n.element}`,`- 所在卡片：${n.card}`,`- 相对位置：x=${Number(n.relativeX??.5).toFixed(3)}, y=${Number(n.relativeY??.5).toFixed(3)}`,`- 提出人：${n.reporter||'—'}`,`- 记录时版本：${n.version||metadata.version}`,`- 运行源码 SHA：\`${n.build||BUILD_SHA}\``,`- 创建时间：${n.createdAt||'—'}`,'',`**修改意见：** ${String(n.text).trim().replace(/\n/g,'  \n')}`,'');
    }
    return out.join('\n')+'\n';
  }
  async function copyMd(){
    const content=md();let ok=false;
    try{if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(content);ok=true}}catch(_){/* fall through */}
    if(!ok){
      const ta=document.createElement('textarea');ta.value=content;ta.style.position='fixed';ta.style.left='-9999px';document.body.append(ta);ta.select();try{ok=document.execCommand('copy')}catch(_){}ta.remove();
    }
    notify(ok?'Markdown 清单已复制。':'浏览器禁止自动复制，请下载 .md 文件。');
  }
  function downloadMd(){
    const bytes=new Blob(['\ufeff',md()],{type:'text/markdown;charset=utf-8'});
    const url=URL.createObjectURL(bytes),a=document.createElement('a');a.href=url;a.download=fileName();document.body.append(a);qaDownloadClick=true;try{a.click()}finally{qaDownloadClick=false}a.remove();setTimeout(()=>URL.revokeObjectURL(url),5000);
    notify(`已准备下载：${fileName()}`);
  }
  load();ui.version.value=metadata.version;ui.date.value=metadata.date;

  syncCounts();renderPins();updateExportSettings();
  attachFrame();
  ui.toggle.addEventListener('click',()=>setReview(!review));ui.openList.addEventListener('click',openPanel);
  ui.closeList.addEventListener('click',closePanel);ui.panelBackdrop.addEventListener('click',closePanel);
  ui.closeEdit.addEventListener('click',closeEditor);ui.cancelEdit.addEventListener('click',closeEditor);ui.editBackdrop.addEventListener('click',closeEditor);
  ui.form.addEventListener('submit',save);
  ui.markProcessed.addEventListener('click',()=>{const n=notes.find(x=>x.id===editingId);if(!n)return;n.status=n.status==='processed'?'open':'processed';n.updatedAt=new Date().toISOString();persist();closeEditor();renderList();renderPins();notify('意见状态已更新。')});
  ui.deleteAnnotation.addEventListener('click',()=>{const n=notes.find(x=>x.id===editingId);if(!n||!window.confirm('确定删除 #'+n.id+' 吗？此操作不可撤销。'))return;notes=notes.filter(x=>x.id!==n.id);persist();closeEditor();renderList();renderPins();notify('意见已删除。')});
  ui.hiddenButton.addEventListener('click',()=>{visible=!visible;persist();renderPins();notify(visible?'已显示标注。':'已隐藏标注及高亮，可截图。')});
  ui.version.addEventListener('input',()=>{metadata.version=limit(ui.version.value,80)||'W1-RC';persist();updateExportSettings()});
  ui.date.addEventListener('input',()=>{if(/^\d{4}-\d{2}-\d{2}$/.test(ui.date.value)){metadata.date=ui.date.value;persist();updateExportSettings()}});
  ui.listTitle.addEventListener('input',()=>{metadata.title=limit(ui.listTitle.value,100)||'评审清单';persist();ui.panelTitle.textContent=metadata.title});
  ui.fileName.addEventListener('input',()=>{metadata.filename=cleanFileName(ui.fileName.value);persist()});
  ui.fileName.addEventListener('blur',updateExportSettings);
  ui.filter.addEventListener('change',renderList);
  ui.copy.addEventListener('click',copyMd);ui.download.addEventListener('click',downloadMd);
  document.addEventListener('keydown',e=>{if(e.key==='Escape')closeAll()});
  window.addEventListener('resize',schedulePins);
  // Keep pins attached to SPA transitions without changing app behavior.
  document.addEventListener('visibilitychange',schedulePins);
})();
