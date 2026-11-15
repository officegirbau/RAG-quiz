const AVATAR_SHAPES = ['circle', 'square', 'triangle', 'diamond', 'star', 'hexagon'];
const AVATAR_COLORS = ['#e21b3c', '#1368ce', '#eaa807', '#26890c', '#864cbf', '#e2762c', '#00a3a3', '#ff66c4'];

const SHAPE_PATHS = {
  circle: '<circle cx="50" cy="50" r="40"/>',
  square: '<rect x="12" y="12" width="76" height="76" rx="12"/>',
  triangle: '<polygon points="50,10 90,85 10,85"/>',
  diamond: '<polygon points="50,8 92,50 50,92 8,50"/>',
  star: '<polygon points="50,5 61,38 95,38 67,59 78,92 50,71 22,92 33,59 5,38 39,38"/>',
  hexagon: '<polygon points="50,6 88,28 88,72 50,94 12,72 12,28"/>'
};

function avatarSVG(shape, color, size) {
  const s = size || 48;
  const path = SHAPE_PATHS[shape] || SHAPE_PATHS.circle;
  return `<svg width="${s}" height="${s}" viewBox="0 0 100 100" aria-hidden="true">${path}</svg>`;
}

function avatarHTML(avatar, size) {
  const a = avatar || { shape: 'circle', color: '#1368ce' };
  const svg = avatarSVG(a.shape, a.color, size)
    .replace('<svg ', `<svg style="fill:${a.color}" `);
  return svg;
}
