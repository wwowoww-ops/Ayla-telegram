// مجموعات إطارات إضافية: عناصر، ندرة، خاصة، زعماء (حصرية)، وأساطير (إنجازات صعبة).
// كل إطار = لون + معدن + زخرفة علوية + جانبية + سفلية + مؤثر متحرك. كلها تُرسم بالكود.
const { WIN } = require("./framesOrnate");
const SIZE = 400, TAU = Math.PI * 2;
const f = n => Number(n.toFixed(2));
const rnd = n => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const mirror = s => `<g>${s}</g><g transform="translate(${SIZE} 0) scale(-1 1)">${s}</g>`;
const star = (x, y, s, c) => {
    if (s <= 0.05) return "";
    const a = s * 9, b = s * 2;
    return `<path d="M${f(x)} ${f(y - a)} L${f(x + b)} ${f(y - b)} L${f(x + a)} ${f(y)} L${f(x + b)} ${f(y + b)} L${f(x)} ${f(y + a)} L${f(x - b)} ${f(y + b)} L${f(x - a)} ${f(y)} L${f(x - b)} ${f(y - b)} Z" fill="${c}"/>`;
};

// ألوان: a فاتح، b متوسط، c داكن، glow توهج، gem جوهرة
const PAL = {
    fire:   { a: "#fed7aa", b: "#ef4444", c: "#450a0a", glow: "#fb923c", gem: "#fef08a" },
    water:  { a: "#bae6fd", b: "#0ea5e9", c: "#0c2d48", glow: "#38bdf8", gem: "#e0f7ff" },
    plant:  { a: "#bbf7d0", b: "#22c55e", c: "#052e16", glow: "#4ade80", gem: "#dcfce7" },
    earth:  { a: "#e7c9a5", b: "#b45309", c: "#2a1405", glow: "#d6a15c", gem: "#fde68a" },
    thunder:{ a: "#fef9c3", b: "#eab308", c: "#2b2200", glow: "#fde047", gem: "#ffffff" },
    light:  { a: "#fffbeb", b: "#fbbf24", c: "#5c3a00", glow: "#fde68a", gem: "#ffffff" },
    dark:   { a: "#e9d5ff", b: "#7e22ce", c: "#13001f", glow: "#a855f7", gem: "#f3e8ff" },
    gray:   { a: "#f3f4f6", b: "#9ca3af", c: "#1f2937", glow: "#d1d5db", gem: "#ffffff" },
    green:  { a: "#bbf7d0", b: "#16a34a", c: "#052e16", glow: "#4ade80", gem: "#f0fdf4" },
    blue:   { a: "#bfdbfe", b: "#2563eb", c: "#0b1e4a", glow: "#60a5fa", gem: "#eff6ff" },
    purple: { a: "#e9d5ff", b: "#9333ea", c: "#2e1065", glow: "#c084fc", gem: "#faf5ff" },
    orange: { a: "#fed7aa", b: "#f97316", c: "#431407", glow: "#fb923c", gem: "#fff7ed" },
    red:    { a: "#fecaca", b: "#dc2626", c: "#450a0a", glow: "#f87171", gem: "#fef2f2" },
    gold:   { a: "#fef08a", b: "#f59e0b", c: "#5c3a00", glow: "#fbbf24", gem: "#fffbeb" },
    rose:   { a: "#fecdd3", b: "#f43f5e", c: "#4c0519", glow: "#fb7185", gem: "#fff1f2" },
    ice:    { a: "#e0f2fe", b: "#7dd3fc", c: "#0c4a6e", glow: "#bae6fd", gem: "#ffffff" },
    cyber:  { a: "#a5f3fc", b: "#06b6d4", c: "#08131a", glow: "#e879f9", gem: "#ffffff" },
    galaxy: { a: "#c7d2fe", b: "#6366f1", c: "#0b0b2a", glow: "#a78bfa", gem: "#ffffff" },
    bone:   { a: "#f5f5f4", b: "#a8a29e", c: "#1c1917", glow: "#ef4444", gem: "#fecaca" }
};
// ألوان المعدن: [فاتح, متوسط, داكن]
const METAL = {
    steel:    ["#8d8a9c", "#3b3946", "#1b1a22"], gold: ["#fde68a", "#b45309", "#451a03"], obsidian: ["#3f3f56", "#17172a", "#07070f"],
    ice:      ["#e0f2fe", "#7dd3fc", "#0c4a6e"], wood: ["#a16207", "#713f12", "#2a1405"], bone: ["#f5f5f4", "#a8a29e", "#44403c"],
    rose:     ["#fecdd3", "#f43f5e", "#4c0519"], silver: ["#f4f4f8", "#9c9aac", "#55536a"]
};

// ---------- الزخارف العلوية: back خلف الإطار، front فوقه ----------
const TOP = {
    crown: (p, t) => ({ front: `<path d="M150 82 L156 36 L176 62 L200 22 L224 62 L244 36 L250 82 Z" fill="url(#gold)" stroke="#fff" stroke-opacity=".6" stroke-width="2" stroke-linejoin="round"/><circle cx="200" cy="40" r="7" fill="${p.glow}"/><circle cx="156" cy="42" r="5" fill="${p.gem}"/><circle cx="244" cy="42" r="5" fill="${p.gem}"/>` }),
    crescent: (p, t) => ({ front: `<mask id="cm"><rect width="400" height="100" fill="#fff"/><circle cx="216" cy="46" r="26" fill="#000"/></mask><circle cx="200" cy="52" r="32" fill="${p.glow}" filter="url(#g)" opacity=".4"/><circle cx="200" cy="52" r="30" fill="${p.a}" mask="url(#cm)"/>${star(236, 36, 0.7 + 0.3 * Math.sin(TAU * t), p.gem)}` }),
    halo: (p, t) => ({ front: `<ellipse cx="200" cy="40" rx="62" ry="14" fill="none" stroke="${p.glow}" stroke-width="9" filter="url(#g)" opacity="${f(0.5 + 0.3 * Math.sin(TAU * t))}"/><ellipse cx="200" cy="40" rx="62" ry="14" fill="none" stroke="${p.a}" stroke-width="3.5"/>` }),
    horns: (p) => ({ back: mirror(`<path d="M104 104 C58 84 62 30 114 6 C100 42 112 76 140 96 Z" fill="${p.c}" stroke="url(#silver)" stroke-width="2.5" stroke-linejoin="round"/><path d="M100 92 C76 70 84 40 108 22" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="2"/>`) }),
    wings: (p) => ({ back: mirror(`<path d="M188 74 Q110 8 22 40 Q92 44 150 84 Z" fill="${p.c}"/><path d="M188 76 Q112 22 36 46 Q100 56 154 88 Z" fill="${p.b}"/><path d="M188 84 Q120 42 66 64 Q112 72 156 96 Z" fill="${p.a}" opacity=".9"/><path d="M188 74 Q110 8 22 40" fill="none" stroke="url(#silver)" stroke-width="3.5" stroke-linecap="round"/>`) }),
    flames: (p, t) => { let s = ""; for (let i = 0; i < 13; i++) { const x = 100 + i * 17, h = 44 + 20 * Math.sin(TAU * (t * 2 + i * 0.27)) + (i % 2) * 12; s += `<path d="M${x - 10} 84 Q${x - 4} ${f(84 - h * 0.5)} ${x} ${f(84 - h)} Q${x + 4} ${f(84 - h * 0.5)} ${x + 10} 84 Z" fill="${["#ef4444", "#f97316", "#fde047"][i % 3]}" opacity=".92"/>`; } return { back: s }; },
    leaves: (p, t) => ({ back: mirror(`<path d="M150 86 Q112 30 70 40 Q96 74 150 90 Z" fill="${p.b}" stroke="${p.c}" stroke-width="2"/><path d="M160 84 Q140 28 104 20 Q112 62 160 90 Z" fill="${p.a}" stroke="${p.c}" stroke-width="2"/><path d="M150 86 Q110 50 78 44" fill="none" stroke="${p.c}" stroke-width="1.5"/>`) }),
    gemrow: (p, t, n) => { let s = ""; for (let i = 0; i < n; i++) { const x = 200 + (i - (n - 1) / 2) * 34; s += `<path d="M${x} 54 L${x + 11} 68 L${x} 84 L${x - 11} 68 Z" fill="${p.glow}" stroke="url(#silver)" stroke-width="2"/><path d="M${x} 54 L${x + 11} 68 L${x} 68 Z" fill="#fff" opacity=".4"/>`; } return { front: s }; },
    crystals: (p, t) => { let s = ""; [[120, 54], [150, 30], [200, 14], [250, 30], [280, 54]].forEach(([x, y], i) => { s += `<path d="M${x - 13} 86 L${x} ${y} L${x + 13} 86 Z" fill="${i % 2 ? p.a : p.b}" stroke="#fff" stroke-opacity=".7" stroke-width="1.5"/>`; }); return { back: s }; },
    spikes: (p) => { let s = ""; for (let i = 0; i < 9; i++) { const x = 104 + i * 24, h = 30 + (i % 2) * 22; s += `<path d="M${x - 9} 86 L${x} ${86 - h} L${x + 9} 86 Z" fill="${p.c}" stroke="${p.a}" stroke-width="1.6"/>`; } return { back: s }; },
    lantern: (p, t) => ({ front: `<path d="M200 4 L200 24" stroke="${p.a}" stroke-width="3"/><path d="M178 34 L222 34 L214 78 L186 78 Z" fill="${p.glow}" stroke="url(#gold)" stroke-width="3"/><path d="M184 28 L216 28 L222 34 L178 34 Z" fill="url(#gold)"/><path d="M186 78 L214 78 L206 86 L194 86 Z" fill="url(#gold)"/><ellipse cx="200" cy="56" rx="${f(9 + 2 * Math.sin(TAU * t))}" ry="14" fill="#fff" opacity=".55" filter="url(#g2)"/>` }),
    fireworks: (p, t) => { let s = ""; [[96, 52, 0], [304, 52, 0.4], [200, 30, 0.7]].forEach(([x, y, o], i) => { const k = (t + o) % 1; for (let j = 0; j < 10; j++) { const a = j / 10 * TAU, r = 6 + 24 * k; s += `<circle cx="${f(x + Math.cos(a) * r)}" cy="${f(y + Math.sin(a) * r)}" r="${f(2.6 * (1 - k) + 0.5)}" fill="${["#fde047", "#f472b6", "#67e8f9"][i]}" opacity="${f(1 - k)}"/>`; } }); return { front: s }; },
    skull: (p) => ({ front: `<ellipse cx="200" cy="46" rx="24" ry="22" fill="${p.a}" stroke="${p.c}" stroke-width="2"/><rect x="188" y="58" width="24" height="16" rx="4" fill="${p.a}" stroke="${p.c}" stroke-width="2"/><circle cx="190" cy="46" r="6" fill="${p.c}"/><circle cx="210" cy="46" r="6" fill="${p.c}"/><circle cx="190" cy="46" r="2.4" fill="${p.glow}"/><circle cx="210" cy="46" r="2.4" fill="${p.glow}"/><path d="M198 58 L200 52 L202 58 Z" fill="${p.c}"/>` }),
    hearts: (p, t) => ({ front: [[170, 54], [200, 42], [230, 54]].map(([x, y], i) => `<path transform="translate(${x} ${f(y + 3 * Math.sin(TAU * (t + i / 3)))}) scale(${i === 1 ? 1.5 : 1.1})" d="M0 10 C-18 -4 -10 -18 0 -8 C10 -18 18 -4 0 10 Z" fill="${p.b}" stroke="${p.a}" stroke-width="1.5"/>`).join("") }),
    waves: (p, t) => { let s = ""; for (let k = 0; k < 3; k++) { let d = `M70 ${86 - k * 8}`; for (let x = 70; x <= 330; x += 10) d += ` L${x} ${f(86 - k * 8 - 7 * Math.sin(x / 22 + TAU * t + k))}`; s += `<path d="${d}" fill="none" stroke="${[p.a, p.b, p.glow][k]}" stroke-width="${4 - k}" stroke-linecap="round" opacity="${0.95 - k * 0.2}"/>`; } return { front: s }; },
    none: () => ({})
};

// ---------- الزخارف الجانبية ----------
const SIDE = {
    tendril: (p, t) => { const pl = 0.6 + 0.4 * Math.sin(TAU * t); return mirror(`<path d="M44 138 C26 170 62 190 40 232 C24 266 40 296 66 322" fill="none" stroke="${p.glow}" stroke-width="9" filter="url(#g)" opacity="${f(0.55 + 0.4 * pl)}"/><path d="M44 138 C26 170 62 190 40 232 C24 266 40 296 66 322" fill="none" stroke="${p.a}" stroke-width="3.5" stroke-linecap="round"/><circle cx="40" cy="232" r="${f(9 + 3 * pl)}" fill="${p.glow}" filter="url(#g2)"/><circle cx="40" cy="232" r="5.5" fill="${p.gem}"/>`); },
    vines: (p, t) => { let s = `<path d="M40 130 C24 180 56 230 38 330" fill="none" stroke="${p.b}" stroke-width="4" stroke-linecap="round"/>`; for (let i = 0; i < 6; i++) { const y = 150 + i * 30, sw = 3 * Math.sin(TAU * (t + i / 6)); s += `<path d="M${f(42 + (i % 2) * -8)} ${y} q${f(18 + sw)} -10 ${f(24 + sw)} -24 q-22 4 -${f(24 + sw)} 24 Z" fill="${p.a}" stroke="${p.c}" stroke-width="1.2"/>`; } return mirror(s); },
    chains: (p) => { let s = ""; for (let i = 0; i < 7; i++) s += `<ellipse cx="44" cy="${148 + i * 27}" rx="9" ry="${i % 2 ? 6 : 11}" fill="none" stroke="${p.a}" stroke-width="3.4"/>`; return mirror(s); },
    bolts: (p, t) => { const on = (Math.floor(t * 8) % 3) !== 0 ? 1 : 0.35; return mirror(`<path d="M52 130 L30 190 L50 196 L28 262 L62 210 L42 204 L66 150 Z" fill="${p.gem}" stroke="${p.glow}" stroke-width="2.5" opacity="${on}"/><path d="M52 130 L30 190 L50 196 L28 262 L62 210 L42 204 L66 150 Z" fill="none" stroke="${p.glow}" stroke-width="8" filter="url(#g)" opacity="${f(on * 0.6)}"/>`); },
    runes: (p, t) => { let s = ""; for (let i = 0; i < 6; i++) { const y = 150 + i * 32, o = 0.4 + 0.6 * Math.max(0, Math.sin(TAU * (t + i / 6))); s += `<path d="M36 ${y} l8 -8 l8 8 l-8 8 Z M44 ${y - 8} v16" fill="none" stroke="${p.glow}" stroke-width="2.4" opacity="${f(o)}"/>`; } return mirror(s); },
    drops: (p, t) => { let s = ""; for (let i = 0; i < 5; i++) { const k = (t + i / 5) % 1, y = 130 + k * 200; s += `<path d="M44 ${f(y - 9)} q8 10 0 16 q-8 -6 0 -16 Z" fill="${p.a}" stroke="${p.b}" stroke-width="1.5" opacity="${f(Math.sin(k * Math.PI))}"/>`; } return mirror(s); },
    none: () => ""
};

// ---------- الزخارف السفلية ----------
const BOTTOM = {
    gem: (p, t) => `<path d="M200 346 L226 366 L200 394 L174 366 Z" fill="url(#gemg)" stroke="url(#silver)" stroke-width="3" stroke-linejoin="round"/><circle cx="200" cy="366" r="${f(4 + 2 * Math.sin(TAU * t))}" fill="#fff"/>` +
        mirror(`<path d="M192 352 L150 354 L112 368 L84 384 L136 378 L172 384 L192 380 Z" fill="url(#silver)"/>`),
    ribbon: (p) => `<path d="M120 352 L280 352 L292 372 L280 392 L120 392 L108 372 Z" fill="${p.b}" stroke="url(#silver)" stroke-width="2.5"/><path d="M120 352 L108 372 L96 360 L96 384 L108 372" fill="${p.c}"/><circle cx="200" cy="372" r="9" fill="${p.gem}" stroke="url(#silver)" stroke-width="2"/>`,
    fangs: (p) => mirror(`<path d="M190 350 L170 352 L180 392 L196 360 Z" fill="${p.a}" stroke="${p.c}" stroke-width="2"/><path d="M160 352 L124 352 L150 380 L166 360 Z" fill="${p.a}" stroke="${p.c}" stroke-width="2"/>`),
    none: () => ""
};

// ---------- المؤثرات المتحركة فوق كل شيء ----------
const FX = {
    sparkle: (p, t) => { let s = ""; for (let i = 0; i < 8; i++) { const a = rnd(i + 5) * TAU, r = 172 + rnd(i + 20) * 24; s += star(200 + r * Math.cos(a) * 0.95, 200 + r * Math.sin(a) * 0.95, Math.max(0, Math.sin(TAU * (t + rnd(i + 9)))) * 1.1, p.gem); } return s; },
    embers: (p, t) => { let s = ""; for (let i = 0; i < 12; i++) { const k = (t + rnd(i)) % 1; s += `<circle cx="${f(60 + rnd(i + 3) * 280)}" cy="${f(392 - 340 * k)}" r="${f(2.8 * (1 - k) + 0.6)}" fill="${i % 2 ? "#fde047" : "#fb923c"}" opacity="${f(1 - k)}"/>`; } return s; },
    bubbles: (p, t) => { let s = ""; for (let i = 0; i < 10; i++) { const k = (t + rnd(i)) % 1; s += `<circle cx="${f(50 + rnd(i + 3) * 300 + 6 * Math.sin(TAU * (t + i)))}" cy="${f(390 - 340 * k)}" r="${f(3 + 4 * rnd(i + 9))}" fill="none" stroke="${p.a}" stroke-width="1.5" opacity="${f(1 - k)}"/>`; } return s; },
    leaves: (p, t) => { let s = ""; for (let i = 0; i < 8; i++) { const k = (t + rnd(i)) % 1; s += `<path transform="translate(${f(40 + rnd(i + 3) * 320 + 14 * Math.sin(TAU * (t + i)))} ${f(30 + 340 * k)}) rotate(${f(360 * k)})" d="M0 -6 Q6 0 0 6 Q-6 0 0 -6 Z" fill="${p.b}" opacity="${f(Math.sin(k * Math.PI))}"/>`; } return s; },
    pebbles: (p, t) => { let s = ""; for (let i = 0; i < 8; i++) { const k = (t + rnd(i)) % 1; s += `<circle cx="${f(50 + rnd(i + 3) * 300)}" cy="${f(390 - 60 * Math.sin(k * Math.PI) * (1 + rnd(i)))}" r="${f(2 + 3 * rnd(i + 5))}" fill="${p.b}" opacity=".8"/>`; } return s; },
    bolts: (p, t) => { const on = (Math.floor(t * 10) % 5) === 0; return on ? `<path d="M${f(70 + rnd(Math.floor(t * 10)) * 260)} 8 L${f(90 + rnd(Math.floor(t * 10) + 1) * 220)} 70 l-12 6 l14 50" fill="none" stroke="#fff" stroke-width="2.4" opacity=".9"/>` : ""; },
    rays: (p, t) => { let s = ""; for (let i = 0; i < 12; i++) { const a = i / 12 * TAU + t * 0.6; s += `<path d="M200 214 L${f(200 + 260 * Math.cos(a - 0.04))} ${f(214 + 260 * Math.sin(a - 0.04))} L${f(200 + 260 * Math.cos(a + 0.04))} ${f(214 + 260 * Math.sin(a + 0.04))} Z" fill="${p.glow}" opacity=".07"/>`; } return `<g clip-path="url(#outw)">${s}</g>`; },
    mist: (p, t) => { let s = ""; for (let i = 0; i < 6; i++) { const k = (t + i / 6) % 1; s += `<ellipse cx="${f(60 + rnd(i) * 280)}" cy="${f(380 - 60 * k)}" rx="${f(40 + 20 * k)}" ry="10" fill="${p.glow}" opacity="${f(0.22 * Math.sin(k * Math.PI))}" filter="url(#g)"/>`; } return s; },
    snow: (p, t) => { let s = ""; for (let i = 0; i < 14; i++) { const k = (t + rnd(i)) % 1; s += `<circle cx="${f(30 + rnd(i + 3) * 340 + 8 * Math.sin(TAU * (t + i)))}" cy="${f(10 + 380 * k)}" r="${f(1.6 + 2 * rnd(i + 9))}" fill="#fff" opacity=".85"/>`; } return s; },
    petals: (p, t) => { let s = ""; for (let i = 0; i < 9; i++) { const k = (t + rnd(i)) % 1; s += `<ellipse transform="translate(${f(40 + rnd(i + 3) * 320 + 16 * Math.sin(TAU * (t + i)))} ${f(20 + 360 * k)}) rotate(${f(300 * k)})" rx="5" ry="2.6" fill="${p.a}" opacity="${f(Math.sin(k * Math.PI))}"/>`; } return s; },
    stars: (p, t) => { let s = ""; for (let i = 0; i < 16; i++) { s += star(20 + rnd(i) * 360, 20 + rnd(i + 30) * 360, Math.max(0, Math.sin(TAU * (t * 1 + rnd(i + 9)))) * 1.0, i % 3 ? p.gem : p.a); } return s; },
    glitch: (p, t) => { const k = Math.floor(t * 12); if (k % 4) return ""; const y = 100 + rnd(k) * 240; return `<rect x="70" y="${f(y)}" width="260" height="4" fill="${p.glow}" opacity=".5"/><rect x="${f(76 + rnd(k + 2) * 40)}" y="${f(y + 10)}" width="90" height="3" fill="${p.a}" opacity=".55"/>`; },
    none: () => ""
};

function compose(spec) {
    const p = PAL[spec.pal], m = METAL[spec.metal || "steel"], hue = !!spec.hue;
    return function draw(t) {
        const pulse = 0.6 + 0.4 * Math.sin(TAU * t);
        const top = TOP[spec.top](p, t, spec.n || 3), side = SIDE[spec.side || "tendril"](p, t), bot = BOTTOM[spec.bottom || "gem"](p, t);
        const col = hue ? `hsl(${Math.round(t * 360) % 360},95%,66%)` : p.glow;
        const x0 = WIN.x - 14, y0 = WIN.y - 14, w = WIN.w + 28, h = WIN.h + 28;
        const defs = `<defs>
          <filter id="g" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="5"/></filter>
          <filter id="g2" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="2.2"/></filter>
          <clipPath id="outw"><path clip-rule="evenodd" d="M0 0H400V400H0Z M${WIN.x - 4} ${WIN.y - 4} h${WIN.w + 8} v${WIN.h + 8} h-${WIN.w + 8} Z"/></clipPath>
          <linearGradient id="metal" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${m[0]}"/><stop offset=".45" stop-color="${m[1]}"/><stop offset="1" stop-color="${m[2]}"/></linearGradient>
          <linearGradient id="silver" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f4f4f8"/><stop offset=".5" stop-color="#9c9aac"/><stop offset="1" stop-color="#55536a"/></linearGradient>
          <linearGradient id="gold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fef3c7"/><stop offset=".5" stop-color="#f59e0b"/><stop offset="1" stop-color="#92400e"/></linearGradient>
          <linearGradient id="gemg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${p.gem}"/><stop offset=".5" stop-color="${p.a}"/><stop offset="1" stop-color="${p.b}"/></linearGradient></defs>`;
        let s = defs;
        if (top.back) s += `<g clip-path="url(#outw)">${top.back}</g>`;
        s += `<rect x="${x0}" y="${y0}" width="${w}" height="${h}" rx="${WIN.r + 10}" fill="none" stroke="url(#metal)" stroke-width="24"/>`;
        s += `<rect x="${x0 - 12}" y="${y0 - 12}" width="${w + 24}" height="${h + 24}" rx="${WIN.r + 20}" fill="none" stroke="#0f0e15" stroke-width="3" opacity=".8"/>`;
        s += `<rect x="${WIN.x - 2}" y="${WIN.y - 2}" width="${WIN.w + 4}" height="${WIN.h + 4}" rx="${WIN.r + 2}" fill="none" stroke="${col}" stroke-width="7" filter="url(#g)" opacity="${f(0.5 + 0.4 * pulse)}"/>`;
        s += `<rect x="${WIN.x - 2}" y="${WIN.y - 2}" width="${WIN.w + 4}" height="${WIN.h + 4}" rx="${WIN.r + 2}" fill="none" stroke="${hue ? col : p.a}" stroke-width="2.5"/>`;
        s += side + bot + (top.front || "");
        // لمعة تدور
        const per = 2 * (w + h), d = (t * per) % per;
        const posAt = k => { k = ((k % per) + per) % per; if (k < w) return [x0 + k, y0]; if (k < w + h) return [x0 + w, y0 + (k - w)]; if (k < 2 * w + h) return [x0 + w - (k - w - h), y0 + h]; return [x0, y0 + h - (k - 2 * w - h)]; };
        for (let i = 0; i < 8; i++) { const [x, y] = posAt(d - i * 7); s += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(Math.max(0.6, 5 - i * 0.6))}" fill="#fff" opacity="${f(0.95 - i * 0.11)}"/>`; }
        s += (FX[spec.fx || "sparkle"] || FX.sparkle)(p, t);
        return `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}">${s}</svg>`;
    };
}

const has = (P, fn) => !!(P && P.pets && P.pets.some(fn));
const D = require("./data");
const el = id => ({ fire: "نار", water: "ماء", plant: "نبات", earth: "أرض", thunder: "برق", light: "نور", dark: "ظلام" }[id]);

// ======== الفئات ========
const ELEMENT = [
    ["fire",   "🔥", { pal: "fire",    metal: "obsidian", top: "flames",   side: "tendril", fx: "embers" }],
    ["water",  "💧", { pal: "water",   metal: "steel",    top: "waves",    side: "drops",   fx: "bubbles" }],
    ["plant",  "🌿", { pal: "plant",   metal: "wood",     top: "leaves",   side: "vines",   fx: "leaves" }],
    ["earth",  "🪨", { pal: "earth",   metal: "bone",     top: "crystals", side: "runes",   fx: "pebbles" }],
    ["thunder","⚡", { pal: "thunder", metal: "steel",    top: "spikes",   side: "bolts",   fx: "bolts" }],
    ["light",  "✨", { pal: "light",   metal: "gold",     top: "halo",     side: "tendril", fx: "rays" }],
    ["dark",   "🌑", { pal: "dark",    metal: "obsidian", top: "horns",    side: "runes",   fx: "mist" }]
].map(([id, e, spec]) => ({
    id: "el_" + id, name: "إطار " + el(id), e, cat: "element", price: 5e12, ach: null,
    text: "رقِّ حيوانًا من عنصر " + el(id) + " إلى نجمتين",
    unlock: P => has(P, p => p.el === id && p.st >= 2), draw: compose(spec)
}));

const RARITY = [
    ["gray", "steel", 0], ["green", "steel", 0], ["blue", "silver", 0], ["purple", "silver", 0], ["orange", "gold", 0], ["red", "gold", 0], ["gold", "gold", 1]
].map(([pal, metal, hue], r) => ({
    id: "ra_" + r, name: "إطار " + D.RARITIES[r].n, e: D.RARITIES[r].e, cat: "rarity", price: null, ach: null,
    text: "امتلك حيوانًا " + D.RARITIES[r].n + " بمستوى 25 فأكثر",
    unlock: P => has(P, p => D.SPECIES[p.sp].r === r && (p.lv >= 25 || p.st >= 1)),
    draw: compose({ pal, metal, top: "gemrow", n: r + 1, side: "tendril", fx: "sparkle", hue: r === 6 })
}));

const SPECIAL = [
    ["s_ramadan", "هلال رمضان", "🌙", 2e13, { pal: "gold",   metal: "gold",     top: "crescent", side: "tendril", fx: "stars" }],
    ["s_fanous",  "الفانوس",    "🏮", 2e13, { pal: "orange", metal: "gold",     top: "lantern",  side: "tendril", fx: "sparkle" }],
    ["s_eid",     "ألعاب العيد", "🎆", 3e13, { pal: "rose",   metal: "silver",   top: "fireworks",side: "tendril", fx: "stars" }],
    ["s_king",    "الملك",      "👑", 1e14, { pal: "gold",   metal: "gold",     top: "crown",    side: "chains",  fx: "sparkle" }],
    ["s_crystal", "الكريستال",  "💎", 5e13, { pal: "ice",    metal: "ice",      top: "crystals", side: "tendril", fx: "sparkle" }],
    ["s_skull",   "الجمجمة",    "💀", 5e13, { pal: "bone",   metal: "bone",     top: "skull",    side: "chains",  bottom: "fangs", fx: "mist" }],
    ["s_sakura",  "الكرز",      "🌸", 3e13, { pal: "rose",   metal: "rose",     top: "leaves",   side: "vines",   fx: "petals" }],
    ["s_galaxy",  "المجرة",     "🌌", 2e14, { pal: "galaxy", metal: "obsidian", top: "halo",     side: "runes",   fx: "stars" }],
    ["s_rainbow", "قوس قزح",    "🌈", 1e14, { pal: "gold",   metal: "silver",   top: "gemrow", n: 5, side: "tendril", fx: "sparkle", hue: 1 }],
    ["s_snow",    "الثلج",      "❄️", 4e13, { pal: "ice",    metal: "ice",      top: "spikes",   side: "drops",   fx: "snow" }],
    ["s_cyber",   "سايبر",      "🤖", 6e13, { pal: "cyber",  metal: "steel",    top: "spikes",   side: "bolts",   fx: "glitch" }],
    ["s_love",    "القلب",      "💖", 2e13, { pal: "rose",   metal: "rose",     top: "hearts",   side: "tendril", bottom: "ribbon", fx: "petals" }]
].map(([id, name, e, price, spec]) => ({ id, name: "إطار " + name, e, cat: "special", price, ach: null, text: "", draw: compose(spec) }));

// إطارات الزعماء: ذهبي لصاحب أكبر ضرر، وفضي لمن شارك بـ 3% من حياته
const BOSSN = { fire: "التنين القرمزي", water: "ليفياثان العميق", plant: "عملاق الغابة", earth: "جبل الحجر الحي", thunder: "سيّد العواصف", light: "حارس الفجر", dark: "ملك الظلام" };
const BOSS = [];
const ELSPEC = {};
[["fire", "flames", "tendril", "embers", "obsidian"], ["water", "waves", "drops", "bubbles", "steel"], ["plant", "leaves", "vines", "leaves", "wood"], ["earth", "crystals", "runes", "pebbles", "bone"], ["thunder", "spikes", "bolts", "bolts", "steel"], ["light", "halo", "tendril", "rays", "gold"], ["dark", "horns", "runes", "mist", "obsidian"]]
    .forEach(([id, top, side, fx, metal]) => { ELSPEC[id] = { top, side, fx, metal }; });
const BOSSE = { fire: "🐲", water: "🌊", plant: "🌳", earth: "⛰️", thunder: "⛈️", light: "🌟", dark: "👁️" };
Object.keys(BOSSN).forEach(id => {
    const s = ELSPEC[id];
    BOSS.push({ id: "b_" + id + "_top", name: "تاج " + BOSSN[id], e: BOSSE[id], cat: "boss", only: true, price: null, ach: null, text: "تصدّر الضرر على " + BOSSN[id] + " وأنهِه", draw: compose({ pal: id, metal: "gold", top: "crown", side: s.side, fx: s.fx }) });
    BOSS.push({ id: "b_" + id + "_part", name: "صيّاد " + BOSSN[id], e: BOSSE[id], cat: "boss", only: true, price: null, ach: null, text: "شارك بـ 3% من الضرر في هزيمة " + BOSSN[id], draw: compose({ pal: id, metal: s.metal, top: s.top, side: s.side, bottom: "ribbon", fx: s.fx }) });
});

const LEGEND = [
    ["l_collector", "جامع الأنواع", "📚", "collect:3", "اجمع 40 نوعًا مختلفًا",        { pal: "gold",   metal: "gold",     top: "wings",  side: "tendril", fx: "sparkle" }],
    ["l_star5",     "الخماسي",      "⭐", "star5:2",   "10 حيوانات بـ 5 نجوم",          { pal: "gold",   metal: "gold",     top: "crown",  side: "tendril", fx: "stars" }],
    ["l_perfect",   "الكمال",       "💯", "sss:2",     "10 حيوانات SSS",               { pal: "purple", metal: "silver",   top: "wings",  side: "tendril", fx: "sparkle", hue: 1 }],
    ["l_slayer",    "قاتل الزعماء", "⚔️", "bkills:3",  "اهزم 50 زعيمًا",               { pal: "red",    metal: "obsidian", top: "horns",  side: "chains",  bottom: "fangs", fx: "embers" }],
    ["l_mvp",       "نجم المعركة",  "🏅", "bmvp:2",    "تصدّر الضرر 10 مرات",           { pal: "light",  metal: "gold",     top: "halo",   side: "tendril", fx: "rays" }],
    ["l_frames",    "هاوي الإطارات","🖼️", "frames:2",  "امتلك 30 إطارًا",              { pal: "galaxy", metal: "silver",   top: "gemrow", n: 7, side: "runes", fx: "stars", hue: 1 }],
    ["l_taxes",     "دافع الضرائب", "🏦", "taxes:2",   "ادفع ضرائب بقيمة 1Qa",          { pal: "bone",   metal: "gold",     top: "skull",  side: "chains",  fx: "mist" }],
    ["l_master",    "سيّد العناصر", "🌀", "elems:3",   "عناصر السبعة بنجمتين+",         { pal: "galaxy", metal: "gold",     top: "wings",  side: "runes",   bottom: "ribbon", fx: "stars", hue: 1 }]
].map(([id, name, e, ach, text, spec]) => ({ id, name: "إطار " + name, e, cat: "legend", price: null, ach, text, draw: compose(spec) }));

const MORE = [...ELEMENT, ...RARITY, ...SPECIAL, ...BOSS, ...LEGEND].map(x => Object.assign({ frames: 16, square: true, win: WIN }, x));

module.exports = { MORE, compose, PAL };