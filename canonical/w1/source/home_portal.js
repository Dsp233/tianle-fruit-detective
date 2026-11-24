'use strict';
window.__AMC8_HOME_PANDA="data:image/webp;base64,__AMC8_HOME_PANDA_BASE64__";
const LearningPortal=(()=>{
 const book='<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M16 8v19M16 8C11 4 6 4 3 6v18c4-2 9-1 13 3 4-4 9-5 13-3V6c-3-2-8-2-13 2Z"/><path d="M7 10c2 0 4 1 5 2M20 12c1-1 3-2 5-2"/></svg>';
 const detective='<svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="14" cy="13" r="9"/><path d="m21 20 8 8M10 13h8M14 9v8"/></svg>';
 function page(){return `<section class="learning-home" data-home-hub><div class="dojo-hero"><div><span class="dojo-kicker">天乐的功夫学堂</span><h1>今天，练哪一招？</h1><p>和熊猫一起找线索、想办法。<br>读懂故事，解开数学谜题。</p></div><img class="dojo-art" src="${window.__AMC8_HOME_PANDA}" alt="竹林庭院里，功夫熊猫陪你读故事、想数学" width="960" height="640" fetchpriority="high"></div><div class="dojo-paths"><button type="button" class="dojo-path reading" data-action="reading" aria-label="进入阅读训练"><span class="dojo-path-icon">${book}</span><span class="dojo-path-title">阅读训练</span><small>读故事 · 找线索 · 说理由</small><span class="dojo-path-cta">去读故事 →</span></button><button type="button" class="dojo-path math" data-action="home" aria-label="进入数学侦探"><span class="dojo-path-icon">${detective}</span><span class="dojo-path-title">数学侦探</span><small>用学过的知识，挑战新谜题</small><span class="dojo-path-cta">去解谜题 →</span></button></div><p class="dojo-note">先自己想一想，遇到难题再找提示。</p></section>`}
 return {page};
})();
