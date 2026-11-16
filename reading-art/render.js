 const storyArtByMaterial = __ASSIGNMENTS__;
 function storyArt(material, panel, index) {
  const art = storyArtByMaterial[material.id];
  if (!art) return window.ReadingComic.panel(panel, index);
  const delivery = JSON.parse(document.getElementById('learning-delivery').textContent);
  const url = new URL(delivery.base + art.path, location.href).href;
  return `<div class="rd-story-art" data-art-panel="${index + 1}" aria-hidden="true" style="position:relative;overflow:hidden;aspect-ratio:${art.width} / ${art.height / 3}"><img alt="" loading="lazy" decoding="async" src="${E(url)}" style="position:absolute;top:-${index * 100}%;left:0;width:100%;height:300%;max-width:none"></div>`;
 }
