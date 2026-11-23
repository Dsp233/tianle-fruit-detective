'use strict';
// This page has no storage writer or migration path.
(function(){
 const release=window.__AMC8_RELEASE,list=document.getElementById('sources'),status=document.getElementById('status');
 function download(keys){
  try{
   const payload=StorageNamespaces.archive(localStorage,release,keys);
   if(!payload.entries.length){status.textContent=payload.errors.length?'无法读取所选记录，请保留原浏览器与页面。':'所选来源没有保存记录。';return}
   const url=URL.createObjectURL(new Blob([JSON.stringify(payload,null,2)],{type:'application/json'})),a=document.createElement('a');
   try{a.href=url;a.download='tianle-record-archive-'+Date.now()+'.json';a.click();status.textContent='已请求导出 '+payload.entries.length+' 个来源；原记录保持不变。'+(payload.errors.length?' 部分来源读取失败，错误已写入导出文件。':'')+'请确认浏览器的下载结果。'}finally{setTimeout(()=>URL.revokeObjectURL(url),1000)}
  }catch{status.textContent='导出未成功，请保留原浏览器与页面后重试。'}
 }
 for(const row of StorageNamespaces.inspect(localStorage,release)){
  const section=document.createElement('section'),label=document.createElement('label'),check=document.createElement('input'),text=document.createElement('span'),button=document.createElement('button');
  check.type='checkbox';check.value=row.key;check.checked=row.present;check.disabled=!row.present;
  text.textContent=row.label+'：'+(row.error?'无法读取':row.present?row.bytes+' 字节':'暂无保存记录');
  label.append(check,text);button.textContent='导出这一来源';button.disabled=!row.present;button.addEventListener('click',()=>download([row.key]));section.append(label,button);list.append(section);
 }
 document.getElementById('export').addEventListener('click',()=>download([...list.querySelectorAll('input:checked')].map(n=>n.value)));
})();
