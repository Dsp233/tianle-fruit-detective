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
