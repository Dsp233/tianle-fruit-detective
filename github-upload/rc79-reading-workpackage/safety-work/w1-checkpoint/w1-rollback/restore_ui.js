'use strict';
(()=>{
 const $=id=>document.getElementById(id),limit=32000000;
 const errors={UNIFIED_EXPORT_REQUIRED:'请选择从学习页面导出的完整记录。',MATH_EXPORT_MISMATCH:'导出后数学记录发生了变化，或读取失败。请回到原页面等待保存，再重新导出。',ACADEMY_EXPORT_MISMATCH:'学院记录与导出内容不一致，请重新导出。',MATH_BACKUP_EXPORT_MISMATCH:'数学历史备份与导出内容不一致，请重新导出。',MISSING_EXACT_FIX15_RECORD:'导出文件中没有可核对的 FIX15 原始阅读记录。请保留原数据并检查导出。',ORIGINAL_DOES_NOT_MATCH_CURRENT_UPGRADE:'旧阅读原文与当前升级记录不匹配，已停止。',SOURCE_CHANGED_DURING_PREPARATION:'制作档案时原记录发生变化，请关闭其他页面并重新导出。',PROFILE_NOT_EMPTY:'当前环境已有网站数据。请换用全新的隔离浏览器环境。',LOCK_OR_STORAGE_UNAVAILABLE:'此浏览器不能提供所需的保存锁或存储；请换用支持的浏览器，不要强行恢复。',LOCK_BUSY:'其他页面正在使用记录。请关闭其他学习页面后重试。',STORAGE_WRITE_OR_READ_FAILED:'存储写入或校验失败。请保留恢复档案，换用新的隔离环境重试；不要打开旧版继续学习。',RESTORE_NOT_CONFIRMED:'写入后校验未通过。请保留档案，换用新的隔离环境重试。'};
 const message=code=>errors[code]||`无法安全完成（${String(code||'未知原因')}）。请保留原文件和原浏览器数据。`;
 const environment=()=>typeof Fix15FreshRestore!=='undefined'&&window.__AMC8_READING_DATA&&window.ReadingEngine&&window.crypto?.subtle&&localStorage;
 async function file(id){const f=$(id).files?.[0];if(!f)throw Error('请选择文件。');if(f.size>limit)throw Error('文件过大，未读取。');return f.text()}
 $('prepare').addEventListener('click',async()=>{const out=$('prepareStatus');out.textContent='';try{
  if(!environment())throw Error('固定版本组件或浏览器存储不可用。');if(!$('sourceConfirm').checked)throw Error('请先完成并确认第一步准备。');
  const result=await Fix15FreshRestore.prepare({exportText:await file('export'),sourceStorage:localStorage,oldData:window.__AMC8_READING_DATA,oldEngine:window.ReadingEngine});
  if(!result.ok){out.textContent=message(result.code);return}
  const url=URL.createObjectURL(new Blob([result.archive],{type:'application/json'})),link=document.createElement('a');link.href=url;link.download='tianle-fix15-recovery-archive.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  out.textContent='已发起档案下载。请确认文件已保存，再到新的隔离浏览器环境执行第二步。原记录未更改。';
 }catch(e){out.textContent=e.message||'无法读取文件；原记录未更改。'}});
 $('restore').addEventListener('click',async()=>{const out=$('restoreStatus');out.textContent='';$('openFixedVersion').hidden=true;try{
  if(!environment())throw Error('固定版本组件或浏览器存储不可用。');if(!$('targetConfirm').checked)throw Error('请先确认第二步使用的是新的隔离环境。');
  const result=await Fix15FreshRestore.restoreFresh({archive:await file('archive'),storage:localStorage,locks:navigator.locks,confirmedFreshProfile:true,oldData:window.__AMC8_READING_DATA,oldEngine:window.ReadingEngine});
  if(result.ok){$('openFixedVersion').hidden=false;out.textContent='记录已写入并完成原文校验。请保留恢复档案，打开此隔离环境中的 FIX15 学习页面核对。未提交草稿仍保存在档案中。';}
  else out.textContent=message(result.code);
 }catch(e){out.textContent=e.message||'恢复未完成，请保留原文件。'}});
 $('inspect').addEventListener('click',async()=>{const out=$('draftStatus');out.textContent='';try{
  const archive=JSON.parse(await file('archive'));if(archive?.schema!=='tianle-fix15-isolated-restore-v1'||typeof archive.exportText!=='string')throw Error('这不是可识别的恢复档案。');
  const doc=JSON.parse(archive.exportText);if(doc?.format!=='tianle-record-backup-v1')throw Error('档案中没有可识别的完整导出。');
  const draft={currentTaskDraft:doc.currentTaskDraft??null,rtmDraft:doc.rtmDraft??null,pendingJointAttemptIds:doc.pendingJointAttemptIds??[]};
  out.textContent='仅供人工核对；不会写入记录或授予通过。\n'+JSON.stringify(draft,null,2);
 }catch(e){out.textContent=e.message||'无法读取草稿。'}});
})();
