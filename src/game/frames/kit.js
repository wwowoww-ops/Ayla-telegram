// عدّة رسم مشتركة للإطارات الجديدة (SVG). كل إطار يركّب أشكالًا كبيرة مختلفة حول نافذة الصورة.
const { WIN } = require("./ornate");
const SIZE = 400, TAU = Math.PI * 2;
const f = n => Number(n.toFixed(2));
const rnd = n => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const win = { x: WIN.x, y: WIN.y, w: WIN.w, h: WIN.h, r: WIN.r };
const cx = win.x + win.w / 2, cy = win.y + win.h / 2;
const L = win.x, R = win.x + win.w, T = win.y, Bt = win.y + win.h;
const mirror = s => `<g>${s}</g><g transform="translate(${SIZE} 0) scale(-1 1)">${s}</g>`;
const at = (x, y, a, s, sc = 1) => `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(a)}) scale(${sc})">${s}</g>`;
const pt = (x, y, r, deg) => [x + r * Math.cos(deg * Math.PI / 180), y + r * Math.sin(deg * Math.PI / 180)];
const star = (x, y, s, c, op = 1) => {
    if (s <= 0.05) return "";
    const a = s * 9, b = s * 2;
    return `<path d="M${f(x)} ${f(y - a)} L${f(x + b)} ${f(y - b)} L${f(x + a)} ${f(y)} L${f(x + b)} ${f(y + b)} L${f(x)} ${f(y + a)} L${f(x - b)} ${f(y + b)} L${f(x - a)} ${f(y)} L${f(x - b)} ${f(y - b)} Z" fill="${c}" opacity="${op}"/>`;
};
const twinkle = (t, n, c, seed = 0, rad = 170) => Array.from({ length: n }, (_, i) => { const a = rnd(i + seed) * TAU, r = rad * (0.9 + 0.12 * rnd(i + seed + 9)); return star(cx + r * Math.cos(a), cy + r * Math.sin(a), Math.max(0, Math.sin(TAU * (t + rnd(i + seed + 4)))) * 1.1, c); }).join("");
const glowDefs = `<filter id="g" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="5"/></filter><filter id="g2" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2"/></filter><filter id="g8" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="9"/></filter>`;
const grad = (id, stops, x2 = 0, y2 = 1) => `<linearGradient id="${id}" x1="0" y1="0" x2="${x2}" y2="${y2}">${stops.map(([o, c]) => `<stop offset="${o}" stop-color="${c}"/>`).join("")}</linearGradient>`;
const rgrad = (id, stops) => `<radialGradient id="${id}" cx=".4" cy=".35">${stops.map(([o, c]) => `<stop offset="${o}" stop-color="${c}"/>`).join("")}</radialGradient>`;
const GOLD = [[0, "#fff6c8"], [0.35, "#f6c744"], [0.7, "#b8741a"], [1, "#5a3208"]];
const SILVER = [[0, "#ffffff"], [0.4, "#b9c2d6"], [1, "#4a5570"]];
const wrap = body => `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}">${body}</svg>`;
const rr = (x, y, w, h, r, extra) => `<rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(h)}" rx="${f(r)}" ${extra}/>`;
// حلقة حول النافذة: shape = round | oct | arch | scallop | bevel
function body(shape, pad, extra) {
    const x0 = L - pad, y0 = T - pad, x1 = R + pad, y1 = Bt + pad, r = win.r + pad;
    if (shape === "oct") { const c = 34; return `<path d="M${x0 + c} ${y0} L${x1 - c} ${y0} L${x1} ${y0 + c} L${x1} ${y1 - c} L${x1 - c} ${y1} L${x0 + c} ${y1} L${x0} ${y1 - c} L${x0} ${y0 + c}Z" ${extra}/>`; }
    if (shape === "arch") return `<path d="M${x0} ${y1 - r} L${x0} ${y0 + 70} Q${x0} ${y0} ${cx} ${y0 - 14} Q${x1} ${y0} ${x1} ${y0 + 70} L${x1} ${y1 - r} Q${x1} ${y1} ${x1 - r} ${y1} L${x0 + r} ${y1} Q${x0} ${y1} ${x0} ${y1 - r}Z" ${extra}/>`;
    if (shape === "scallop") { let d = ""; const n = 14, w = (x1 - x0) / n, h = (y1 - y0) / n; for (let i = 0; i < n; i++) d += `${i ? "" : `M${x0 + 10} ${y0}`} Q${f(x0 + w * (i + 0.5))} ${y0 - 14} ${f(x0 + w * (i + 1))} ${y0}`; for (let i = 0; i < n; i++) d += ` Q${x1 + 14} ${f(y0 + h * (i + 0.5))} ${x1} ${f(y0 + h * (i + 1))}`; for (let i = 0; i < n; i++) d += ` Q${f(x1 - w * (i + 0.5))} ${y1 + 14} ${f(x1 - w * (i + 1))} ${y1}`; for (let i = 0; i < n; i++) d += ` Q${x0 - 14} ${f(y1 - h * (i + 0.5))} ${x0} ${f(y1 - h * (i + 1))}`; return `<path d="${d}Z" ${extra}/>`; }
    if (shape === "bevel") { const c = 18; return `<path d="M${x0 + c} ${y0} L${x1 - c} ${y0} L${x1} ${y0 + c} L${x1} ${y1 - c} L${x1 - c} ${y1} L${x0 + c} ${y1} L${x0} ${y1 - c} L${x0} ${y0 + c}Z" ${extra}/>`; }
    return rr(x0, y0, x1 - x0, y1 - y0, r, extra);
}
const ring = (gid, shape, pad, w) => body(shape, pad, `fill="none" stroke="url(#${gid})" stroke-width="${w}" stroke-linejoin="round"`);
const thin = (c, shape, pad, w = 1.6, op = 0.9) => body(shape, pad, `fill="none" stroke="${c}" stroke-width="${w}" opacity="${op}" stroke-linejoin="round"`);
const heart = (x, y, s, c, op = 1) => `<path transform="translate(${f(x)} ${f(y)}) scale(${s})" d="M0 8 C-12 -2 -10 -12 -4 -12 C-1 -12 0 -9 0 -8 C0 -9 1 -12 4 -12 C10 -12 12 -2 0 8Z" fill="${c}" opacity="${op}"/>`;
const paw = (x, y, s, c, op = 1) => `<g transform="translate(${f(x)} ${f(y)}) scale(${s})" fill="${c}" opacity="${op}"><ellipse cx="0" cy="4" rx="7" ry="5.5"/><ellipse cx="-8" cy="-4" rx="3" ry="4"/><ellipse cx="-3" cy="-9" rx="3" ry="4"/><ellipse cx="3" cy="-9" rx="3" ry="4"/><ellipse cx="8" cy="-4" rx="3" ry="4"/></g>`;
module.exports = { SIZE, TAU, f, rnd, win, cx, cy, L, R, T, Bt, mirror, at, pt, star, twinkle, glowDefs, grad, rgrad, GOLD, SILVER, wrap, rr, body, ring, thin, heart, paw };
