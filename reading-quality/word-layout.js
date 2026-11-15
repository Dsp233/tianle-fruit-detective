 // Stable build-time dictionary: browser ICU versions must not change line units.
 const readingWords=__READING_WORDS__;
 const readingWordSet=new Set(readingWords);
 function readingUnits(text){
  const a=Array.from(text),units=[];let pending='';
  for(let i=0;i<a.length;){
   let word=a[i],n=1;
   if(/[\u3400-\u9fff]/u.test(word)){
    for(let size=Math.min(6,a.length-i);size>1;size--){const candidate=a.slice(i,i+size).join('');if(readingWordSet.has(candidate)){word=candidate;n=size;break;}}
   }else if(/[A-Za-z0-9]/.test(word)){
    while(n<6&&i+n<a.length&&/[A-Za-z0-9:]/.test(a[i+n]))word+=a[i+n++];
   }
   if(/^[，。！？；：、,.!?;:）】》」』”’％%]+$/u.test(word)&&units.length){units[units.length-1]+=word;}
   else if(/^[（【《「『“‘]+$/u.test(word)){pending+=word;}
   else {units.push(pending+word);pending='';}
   i+=n;
  }
  if(pending){if(units.length)units[units.length-1]+=pending;else units.push(pending);}
  return units;
 }
 function rt(value,{clickable=false,mode=null,reference=null,offset=0,focus=null}={}){
  const text=String(value??''),whole=reference||text,key=hash(whole),pins=pronounce(whole),c=paintState?paintState.current:engine?.current(),setting=paintState?paintState.settings:engine?.snapshot().settings;
  ui.texts.set(key,whole);const m=mode||c?.session.pinyinMode||setting?.pinyin||'all',focusChars=new Set(Array.from((focus||c?.material.focusWords||[]).join('')));
  let i=0;
  return readingUnits(text).map(word=>{
   const cells=Array.from(word).map(char=>{const pos=(i++)+offset;if(!/[\u3400-\u9fff]/u.test(char))return E(char);
    const visible=m==='all'||m==='focus'&&focusChars.has(char)||m==='demand'&&ui.tapped.has(key+':'+pos);
    return `<span class="rd-char" data-rd-key="${key}" data-rd-index="${pos}" ${clickable?`role="button" tabindex="0" data-action="rdChar" data-key="${key}" data-index="${pos}" aria-label="${E(char)}，查看拼音和听读"`:''}><span class="rd-pinyin" aria-hidden="${!visible}">${visible?E(pins[pos]||''):''}</span><span class="rd-base">${E(char)}</span></span>`;
   }).join('');
   return /^\s+$/u.test(word)?cells:`<span class="rd-word" data-pinyin-mode="${m}">${cells}</span>`;
  }).join('');
 }
