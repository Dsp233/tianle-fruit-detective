
'use strict';
// QA changes navigation and its own store only. Generators, rendering, grading,
// hints, solutions and variations are the unchanged production implementations.
(function(){
 const rows=COMPETITION_REVIEWED.map(f=>({familyId:f.id,title:f.title,configuration:f.integrated?f.configurations[0]:f.id==='threeGroupBalance'?'main':f.structureKey||f.id,configurations:f.integrated?f.configurations:f.id==='threeGroupBalance'?['main','change-difference-direction','change-ratio-reference','change-goal','invalid-discrete']:[f.structureKey||f.id,...(StructuredRecipes.sourceConfigs[f.id]?[StructuredRecipes.sourceConfigs[f.id]]:[]),...(StructuredRecipes.extraConfigs[f.id]||[])],topicIds:[...f.topicIds]}));
 rows.push(...ValidationRuntime.catalog.map(f=>({familyId:f.id,title:f.title,topicIds:f.topicIds,qaValidation:true,configuration:'contract-v1',configurations:['contract-v1']})));
 const personaProfiles={"P-A":{"topicIds":["A01","A02","R01"],"sourceIds":["AMC8","original"],"excludedSkillIds":[]},"P-B":{"topicIds":["A01","A02","R01","L01"],"sourceIds":["AMC8","original"],"excludedSkillIds":[]},"P-C":{"topicIds":["A01","A02","A03","R01","L01","L02","N01","G01","C01","C02","D01","D02","D03"],"sourceIds":["AMC8","original"],"excludedSkillIds":[]},"P-D":{"topicIds":["A01","A02","R01","L01"],"sourceIds":["AMC8","original"],"excludedSkillIds":[]}};
 let current=null;
 function validate(values){
  const family=rows.find(f=>f.familyId===values.familyId);
  if(!family)throw Error('未知 familyId；请从完整题族清单选择。');
  if(values.configuration&&!family.configurations.includes(values.configuration))throw Error('配置与 familyId 不匹配，未生成替代题。');
  if(family.qaValidation){const seed=Number(values.seed);if(!/^\d+$/.test(String(values.seed))||!Number.isInteger(seed)||seed<1||seed>2147483647||Number(values.generatorRevision??1)!==1)throw Error('工程留出配置使用生成版本1及合法整数seed。');return {family,configuration:'contract-v1',topicIds:values.topicIds,excludedSkillIds:values.excludedSkillIds||[],recipe:{engine:4,familyId:family.familyId,configurationId:'contract-v1',generatorRevision:1,seed}}}
  if(['integratedWeightedPlan','integratedRatioPlan'].includes(family.familyId)){const seed=Number(values.seed);if(!Number.isInteger(seed)||seed<1||seed>2147483647||Number(values.generatorRevision??5)!==5)throw Error('综合题使用生成版本5及合法seed。');return {family,configuration:values.configuration||family.configurations[0],topicIds:values.topicIds,excludedSkillIds:values.excludedSkillIds||[],recipe:{engine:3,familyId:family.familyId,configurationId:values.configuration||family.configurations[0],generatorRevision:5,seed}}}
  const seed=Number(values.seed),revision=Number(values.generatorRevision??(family.familyId==='threeGroupBalance'||values.configuration&&values.configuration!==family.configuration?4:3));
  if(!/^\d+$/.test(String(values.seed))||!Number.isInteger(seed)||seed<1||seed>2147483647)throw Error('seed 必须为 1 至 2147483647 的整数。');
  if(![1,2,3,4,5,6].includes(revision))throw Error('generatorRevision 仅支持已登记的1至6。');
  if(revision===6&&!['digitInsert','telescopingDifferences'].includes(family.familyId))throw Error('此题族未登记生成版本6。');
  const configuration=values.configuration||family.configuration,structured=family.familyId==='threeGroupBalance'||configuration!==family.configuration;if(structured&&revision!==4)throw Error('此配置需要生成版本4。');return {family,configuration,topicIds:values.topicIds,excludedSkillIds:values.excludedSkillIds||[],recipe:{...competitionReviewedRecipe(family.familyId,seed),generatorRevision:revision,...(structured?{configurationId:configuration}:{})}};
 }
 function caseUrl(values){const v=validate(values),params=new URLSearchParams({familyId:v.family.familyId,configuration:v.configuration,seed:String(v.recipe.seed),generatorRevision:String(v.recipe.generatorRevision)});if(values.personaId)params.set('personaId',values.personaId);return '?'+params.toString()}
 function loadCase(values,fresh=false){
  if(values.personaId){if(!personaProfiles[values.personaId])throw Error("未知合成人物画像");values={...values,...personaProfiles[values.personaId]}}
  const v=validate(values),task=competitionCreate(v.recipe),teaching=SourceCatalog.teachingScope(task,{topicIds:SKILL_DATA.units.map(u=>u.id)}),required=[...SourceCatalog.taskRoutes(task).flatMap(r=>r.requiredSkills),...(teaching?teaching.methods.flatMap(m=>m.requiredSkills).concat(teaching.variation.requiredSkills):[])],scope=v.topicIds||[...new Set([...task.competition.topicIds,...required.map(id=>id.split('.')[0])])];
  if(fresh){CompetitionController.dispatch({type:'RESET_QA'});saved.competition=competitionRestoreRecords(null);saved.topicPractice.session=null;}
  const prior=topicSession(),item=prior?.items?.[0];
  const same=!fresh&&prior?.id?.startsWith('qa-')&&prior.items.length===1&&JSON.stringify(item.recipe)===JSON.stringify(task.competition.recipe);
  if(!same)saved.topicPractice.session={mode:'competition-v2',id:'qa-'+Date.now(),topicIds:[...scope],planSeed:v.recipe.seed,total:1,cursor:0,items:[{view:'competition',code:task.id,taskId:task.id,contentVersion:task.contentVersion,recipe:task.competition.recipe,openedAt:Date.now(),passed:false,draft:null,feedback:null}],exhausted:false};
  saved.topicPractice.selectedTopicIds=[...scope];saved.topicPractice.excludedSkillIds=v.excludedSkillIds;if(values.personaId)saved.topicPractice.sourceIds=[...values.sourceIds];
  Object.assign(saved.topicPractice.session,SourceCatalog.profile({...saved.topicPractice.session,topicIds:scope,excludedSkillIds:v.excludedSkillIds,sourceIds:values.sourceIds||[task.competition.sourceProvenance?.sourceId||'original'],examIds:task.competition.sourceProvenance?.examId?[task.competition.sourceProvenance.examId]:[]}));
  current={...(values.personaId?{personaId:values.personaId}:{}),familyId:v.family.familyId,configuration:v.configuration,seed:v.recipe.seed,generatorRevision:v.recipe.generatorRevision,taskId:task.id};
  topicOpenCurrent();persist();return {...current};
 }
 const protectedFixtures=['unknown-schema','string-schema','null-schema','identity-mismatch','corrupt-text'];
 function prepareProtectedFixture(name){
  if(!protectedFixtures.includes(name)||STORE!=='tianle_amc8_qa_rc'+StorageNamespaces.releaseNumber(window.__AMC8_RELEASE)+'_v1')throw Error('QA_FIXTURE_SCOPE_REQUIRED');
  const result=loadCase({familyId:'outsideAngle',configuration:'outsideAngle',seed:1,generatorRevision:3},true),task=playerTask(),scopeId=CompetitionWork.variationId(task),originals={};
  for(const id of ['main',scopeId]){
   const signature=task.competition.signature+(id==='main'?'':':'+id);
   const raw=name==='corrupt-text'?'损坏原文：'+id:{schemaVersion:name==='unknown-schema'?99:name==='string-schema'?'3':name==='null-schema'?null:2,signature:name==='identity-mismatch'?'different-task':signature,nodes:[{id:'future-node',label:'保留的原始内容'}],futureExtension:{scope:id,values:[1,'二',3]}};
   originals[id]=JSON.parse(JSON.stringify(raw));competitionState().scopes[id].sketch=raw;
  }
  persist();render();return {...result,fixture:name,originals};
 }
 window.AMC8_QA={families:rows,validate,caseUrl,loadCase,protectedFixtures,prepareProtectedFixture,current:()=>current&&({...current})};
 if(typeof document.createElement!=='function')return;
 const host=document.createElement('section');host.id='qa-controls';host.className='panel';
 host.innerHTML='<h1>Muse · RC70 定向 QA</h1><p>与主站共用生成、判题和图式代码；测试记录独立保存。143 个题族配置均可复现（其中2个受知识范围政策限制）；另有4个工程留出题族，只在QA启用，不计入正式供题。</p><form id="qa-form"><label>familyId<select name="familyId" id="qa-family"></select></label><label>配置<select name="configuration" id="qa-configuration"></select></label><label>seed<input name="seed" id="qa-seed" type="text" inputmode="numeric" pattern="[0-9]+" autocomplete="off" value="1" required></label><label>生成版本<select name="generatorRevision" id="qa-revision"><option value="6">6 · 位置与项数诊断</option><option value="5">5 · RC70 综合与迁移</option><option value="4">4 · 完整结构配置</option><option value="3">3 · RC67</option><option value="2">2 · RC66</option><option value="1">1 · 旧配方</option></select></label><button type="submit" class="primary">生成指定题目</button><button type="button" id="qa-fresh" class="secondary">清空 QA 记录并重测</button></form><p id="qa-status" role="status" aria-live="polite"></p><p><a id="qa-case-link">此用例链接</a> · <a href="history/">旧记录兼容 QA</a> · <a href="../muse/rc70/">Muse 交接资料</a> · <a href="../muse/rc70/families.html">完整题族清单</a> · <a href="../">主站</a></p>';
 const style=document.createElement('style');style.textContent='#qa-controls{max-width:1180px;margin:18px auto;padding:20px}#qa-controls h1{font-size:24px}#qa-form{display:flex;gap:12px;flex-wrap:wrap;align-items:end}#qa-form label{display:flex;flex-direction:column;gap:5px;min-width:130px}#qa-form input,#qa-form select{padding:10px;border:1px solid #aac8c0;border-radius:8px;font-size:16px;max-width:100%}#qa-family{width:330px}#qa-configuration{width:280px}#qa-controls a{color:#185c70}#qa-status{overflow-wrap:anywhere}@media(max-width:600px){#qa-controls{margin:10px}#qa-form label{width:100%}#qa-family,#qa-configuration{width:100%}}';document.head.appendChild(style);
 document.body.insertBefore(host,document.body.firstChild);
 const releaseId='rc'+StorageNamespaces.releaseNumber(window.__AMC8_RELEASE);
 host.querySelector('h1').textContent=window.__AMC8_RELEASE.siteVersion+' · 定向单题复验';
 host.querySelector('p').textContent='与正式练习共用生成、判题和提示代码；测试记录独立保存。这里每次只复验一道题，“下一题”结束本次定向用例；完整练习请使用正常入口。';
 for(const a of host.querySelectorAll('a[href]'))a.setAttribute('href',a.getAttribute('href').replace('/rc70/','/'+releaseId+'/'));
 const fixtures=document.createElement('details'),fixtureTitle=document.createElement('summary'),fixtureSelect=document.createElement('select'),fixtureButton=document.createElement('button'),fixtureNote=document.createElement('p');
 fixtureTitle.textContent='准备草图保护测试（仅重置定向 QA）';fixtureNote.textContent='先保存所需测试记录。准备后请真实操作只读面板、刷新和下载，核对原始内容；不写正式练习记录。';
 for(const id of protectedFixtures){const option=document.createElement('option');option.value=id;option.textContent=id;fixtureSelect.append(option)}
 fixtureSelect.id='qa-protected-fixture';fixtureButton.id='qa-prepare-protected';fixtureButton.type='button';fixtureButton.textContent='准备保护草图测试';
 fixtureButton.addEventListener('click',()=>{try{const result=prepareProtectedFixture(fixtureSelect.value);show(result);status.textContent='已准备 '+result.fixture+'；随后操作的结果尚未验收。'}catch(error){status.textContent=error.message}});
 fixtures.append(fixtureTitle,fixtureNote,fixtureSelect,fixtureButton);host.append(fixtures);
 const family=document.getElementById('qa-family'),configuration=document.getElementById('qa-configuration'),seed=document.getElementById('qa-seed'),revision=document.getElementById('qa-revision'),status=document.getElementById('qa-status'),link=document.getElementById('qa-case-link');
 for(const row of rows){const option=document.createElement('option');option.value=row.familyId;option.textContent=row.familyId+' · '+row.title;family.appendChild(option)}
 const persona=document.createElement('select'),personaLabel=document.createElement('label');persona.id='qa-persona';for(const [id,title] of [['','按题目所需范围复验'],['P-A','P-A 基础计算型'],['P-B','P-B 局部关系型'],['P-C','P-C 进阶推理型'],['P-D','P-D 易受提示带走型']]){const option=document.createElement('option');option.value=id;option.textContent=title;persona.append(option)}personaLabel.textContent='合成画像声明范围';personaLabel.append(persona);document.getElementById('qa-form').prepend(personaLabel);
 const values=()=>({personaId:persona.value,familyId:family.value,configuration:configuration.value,seed:seed.value,generatorRevision:revision.value});
 function show(values,fresh=false){try{const result=loadCase(values,fresh);family.value=result.familyId;persona.value=result.personaId||'';configOptions();configuration.value=result.configuration;seed.value=result.seed;revision.value=result.generatorRevision;const query=caseUrl(result);history.replaceState(null,'',query);link.href=query;status.textContent='已加载 '+result.familyId+' · '+result.configuration+' · seed '+result.seed+' · 生成版本 '+result.generatorRevision+' · '+result.taskId}catch(error){topicActive=false;open('home');status.textContent=error.message;link.removeAttribute('href')}}
 function configOptions(){const row=rows.find(r=>r.familyId===family.value);configuration.innerHTML='';for(const id of row.configurations){const option=document.createElement('option');option.value=id;option.textContent=id;configuration.appendChild(option)}configuration.value=row.configuration;revision.value=row.qaValidation?'1':['integratedWeightedPlan','integratedRatioPlan','natural-weighted'].includes(row.familyId)?'5':row.familyId==='threeGroupBalance'?'4':'3'}
 family.addEventListener('change',configOptions);configuration.addEventListener('change',()=>{const row=rows.find(r=>r.familyId===family.value);revision.value=row.qaValidation?'1':['integratedWeightedPlan','integratedRatioPlan','natural-weighted'].includes(row.familyId)?'5':row.familyId==='threeGroupBalance'||configuration.value!==row.configuration?'4':'3'});
 document.getElementById('qa-form').addEventListener('submit',event=>{event.preventDefault();show(values())});
 document.getElementById('qa-fresh').addEventListener('click',()=>show(values(),true));
 const params=new URLSearchParams(location.search),requested=params.has('familyId');
 const initial=requested?{personaId:params.get('personaId')||'',familyId:params.get('familyId'),configuration:params.get('configuration')??params.get('config')??'',seed:params.get('seed')??'1',generatorRevision:params.get('generatorRevision')??'3'}:{familyId:rows[0].familyId,seed:'1',generatorRevision:'3'};
 configOptions();show(initial);
})();

