// خلفيات الندرة (1024×1024): شائع فضي/أبيض · غير شائع أخضر · نادر أزرق · ملحمي بنفسجي · أسطوري ذهبي · خرافي أحمر · سماوي قوس قزح كوني
const rng = seed => { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };

const PAL = [
  { n: "common",    a: "#ffffff", b: "#d5dbe4", c: "#8e99a9", ring: "#e9eef5", acc: "#ffffff" },
  { n: "uncommon",  a: "#e3ffd6", b: "#62cc72", c: "#124f31", ring: "#9bf09b", acc: "#d8ffc2" },
  { n: "rare",      a: "#dff3ff", b: "#4ca6ff", c: "#0a2a66", ring: "#8ccaff", acc: "#cfeaff" },
  { n: "epic",      a: "#f3deff", b: "#a45cff", c: "#26085a", ring: "#d3a6ff", acc: "#f0d4ff" },
  { n: "legendary", a: "#fff7cf", b: "#ffc532", c: "#7a4700", ring: "#ffe38a", acc: "#fff1a8" },
  { n: "mythic",    a: "#ffe0d3", b: "#ff4b3b", c: "#3f050f", ring: "#ff9c85", acc: "#ffc7b8" },
  { n: "celestial", a: "#ffffff", b: "#8a5cff", c: "#070826", ring: "#ffffff", acc: "#ffffff" }
];

function rays(p, n, op) {
  let s = "";
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2, w = 0.07;
    s += `<path d="M512 470 L${512 + Math.cos(a - w) * 1200} ${470 + Math.sin(a - w) * 1200} L${512 + Math.cos(a + w) * 1200} ${470 + Math.sin(a + w) * 1200} Z" fill="${p.acc}" opacity="${op}"/>`;
  }
  return `<g filter="url(#bgblur)">${s}</g>`;
}
function dots(r, n, col, minR, maxR, op, blur) {
  let s = "";
  for (let i = 0; i < n; i++) s += `<circle cx="${r() * 1024}" cy="${r() * 1024}" r="${minR + r() * (maxR - minR)}" fill="${col}" opacity="${(op * (0.4 + r() * 0.6)).toFixed(2)}"/>`;
  return blur ? `<g filter="url(#bgsoft)">${s}</g>` : s;
}
function stars(r, n, col) {
  let s = "";
  for (let i = 0; i < n; i++) {
    const x = r() * 1024, y = r() * 1024, k = 3 + r() * 9, o = 0.35 + r() * 0.65;
    s += `<path d="M${x} ${y - k} Q${x + 1} ${y - 1} ${x + k} ${y} Q${x + 1} ${y + 1} ${x} ${y + k} Q${x - 1} ${y + 1} ${x - k} ${y} Q${x - 1} ${y - 1} ${x} ${y - k}Z" fill="${col}" opacity="${o.toFixed(2)}"/>`;
  }
  return s;
}

function svg(rarity, seed) {
  const p = PAL[rarity], r = rng((seed || 1) * 131 + rarity * 7919);
  let extra = "";
  if (rarity === 0) extra = rays(p, 10, 0.18) + dots(r, 26, "#fff", 8, 38, 0.5, true) + dots(r, 30, "#fff", 2, 5, 0.8);
  if (rarity === 1) extra = rays(p, 9, 0.16) + dots(r, 22, "#eaffd0", 10, 40, 0.4, true) +
    Array.from({ length: 12 }, () => { const x = r() * 1024, y = r() * 1024, a = r() * 360, k = 30 + r() * 30; return `<path d="M0 0 Q${k * 0.5} ${-k * 0.5} ${k} 0 Q${k * 0.5} ${k * 0.5} 0 0Z" fill="#a6f08a" opacity=".35" transform="translate(${x} ${y}) rotate(${a})"/>`; }).join("") + dots(r, 24, "#f4ffb0", 2, 5, 0.9);
  if (rarity === 2) extra = rays(p, 12, 0.16) + Array.from({ length: 26 }, () => { const x = r() * 1024, y = r() * 1024, k = 6 + r() * 30; return `<circle cx="${x}" cy="${y}" r="${k}" fill="none" stroke="#e6f6ff" stroke-width="3" opacity=".5"/><circle cx="${x - k * 0.3}" cy="${y - k * 0.3}" r="${k * 0.18}" fill="#fff" opacity=".7"/>`; }).join("") + stars(r, 18, "#fff");
  if (rarity === 3) extra = `<g filter="url(#nebula)" opacity=".75"><rect width="1024" height="1024" fill="#d58bff"/></g>` + rays(p, 14, 0.12) + stars(r, 46, "#fff") + dots(r, 14, "#e6baff", 10, 36, 0.35, true);
  if (rarity === 4) extra = rays(p, 18, 0.26) + dots(r, 50, "#fff3b0", 2, 6, 0.9) + dots(r, 16, "#ffe27a", 12, 40, 0.45, true) + stars(r, 20, "#fff9d6");
  if (rarity === 5) extra = rays(p, 14, 0.2) + dots(r, 46, "#ff9a3c", 2, 7, 0.95) + dots(r, 18, "#ff5a3a", 12, 44, 0.4, true) + stars(r, 10, "#ffd6c2");
  if (rarity === 6) {
    extra = `<g filter="url(#nebula)" opacity=".9"><rect width="1024" height="1024" fill="#7a5cff"/></g><g filter="url(#nebula2)" opacity=".7"><rect width="1024" height="1024" fill="#ff5ca8"/></g>` +
      `<g opacity=".85">${["#ff4d4d", "#ff9f3a", "#ffe14d", "#58e86b", "#4dc3ff", "#7a5cff", "#d65cff"].map((c, i) => `<path d="M-60 ${760 + i * 16} Q512 ${300 + i * 16} 1084 ${760 + i * 16}" stroke="${c}" stroke-width="16" fill="none" opacity=".75" filter="url(#bgsoft)"/>`).join("")}</g>` +
      stars(r, 90, "#fff") + dots(r, 10, "#bfe8ff", 10, 34, 0.35, true);
  }
  const ringW = rarity >= 4 ? 10 : 6;
  return `<g>
    <defs>
      <radialGradient id="bgG" cx=".5" cy=".46" r=".78"><stop offset="0" stop-color="${p.a}"/><stop offset=".5" stop-color="${p.b}"/><stop offset="1" stop-color="${p.c}"/></radialGradient>
      <radialGradient id="bgV" cx=".5" cy=".5" r=".75"><stop offset=".6" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".55"/></radialGradient>
      <filter id="bgblur" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="6"/></filter>
      <filter id="bgsoft" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="7"/></filter>
      <filter id="nebula" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.006 0.009" numOctaves="4" seed="${(seed || 1) % 50 + 3}"/><feColorMatrix type="matrix" values="0 0 0 0 .8  0 0 0 0 .45  0 0 0 0 1  0 0 0 1.9 -.7"/></filter>
      <filter id="nebula2" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.01 0.006" numOctaves="3" seed="${(seed || 1) % 40 + 11}"/><feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 .35  0 0 0 0 .7  0 0 0 1.7 -.6"/></filter>
    </defs>
    <rect width="1024" height="1024" fill="url(#bgG)"/>${extra}
    <ellipse cx="512" cy="930" rx="420" ry="70" fill="#000" opacity=".18" filter="url(#bgsoft)"/>
    <rect width="1024" height="1024" fill="url(#bgV)"/>
    <rect x="${ringW}" y="${ringW}" width="${1024 - ringW * 2}" height="${1024 - ringW * 2}" rx="46" fill="none" stroke="${p.ring}" stroke-width="${ringW}" opacity=".9"/>
  </g>`;
}
module.exports = { svg, PAL };
