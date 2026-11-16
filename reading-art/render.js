 const storyArtByMaterial = __ASSIGNMENTS__;
 function storyArt(material, panel, index) {
  const art = storyArtByMaterial[material.id];
  if (!art) return window.ReadingComic.panel(panel, index);
  const delivery = JSON.parse(document.getElementById('learning-delivery').textContent);
  const url = new URL(delivery.base + art.path, location.href).href;
  const start = art.cuts[index];
  const height = art.cuts[index + 1] - start;
  return `<div class="rd-story-art" data-art-panel="${index + 1}" aria-hidden="true" style="position:relative;overflow:hidden;aspect-ratio:${art.width} / ${height}"><img alt="" loading="lazy" decoding="async" src="${E(url)}" style="position:absolute;top:-${100 * start / height}%;left:0;width:100%;height:${100 * art.height / height}%;max-width:none"></div>`;
 }

 function dayOneVocabulary(material) {
  if (material.id !== 'R2-D001-CORE' && material.id !== 'R2-D001-EXTRA') return '';
  return `<aside class="rd-condition rd-vocabulary" aria-label="故事里的词"><p><strong>${rt('观察簿')}</strong>：${rt('记星星的小本子。')}</p><p><strong>${rt('图书馆修复台')}</strong>：${rt('图书馆里修书的地方。')}</p></aside>`;
 }
