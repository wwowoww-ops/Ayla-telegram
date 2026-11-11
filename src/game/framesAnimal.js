// إطارات الحيوانات: كل إطار يرمز لحيوان من اللعبة (آذان، أجنحة، قرون، لبدة...).
// تُفتح مجانًا إن كنت تملك هذا الحيوان، أو تُشترى بالعملة. تُرسم بالكود بتصميم أصلي.
const { WIN } = require("./framesOrnate");
const SIZE = 400, TAU = Math.PI * 2;
const f = n => Number(n.toFixed(2));
const rnd = n => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const mirror = s => `<g>${s}</g><g transform="translate(${SIZE} 0) scale(-1 1)">${s}</g>`;
function star(x, y, s, color) {
    if (s <= 0.05) return "";
    const a = s * 9, b = s * 2;
    return `<path d="M${f(x)} ${f(y - a)} L${f(x + b)} ${f(y - b)} L${f(x + a)} ${f(y)} L${f(x + b)} ${f(y + b)} L${f(x)} ${f(y + a)} L${f(x - b)} ${f(y + b)} L${f(x - a)} ${f(y)} L${f(x - b)} ${f(y - b)} Z" fill="${color}"/>`;
}
const paw = (x, y, k, color) => `<g transform="translate(${x} ${y}) scale(${k})" fill="${color}"><ellipse cx="0" cy="6" rx="11" ry="9"/><ellipse cx="-13" cy="-7" rx="5" ry="7" transform="rotate(-20 -13 -7)"/><ellipse cx="-4" cy="-13" rx="5" ry="7"/><ellipse cx="6" cy="-13" rx="5" ry="7"/><ellipse cx="15" cy="-6" rx="5" ry="7" transform="rotate(20 15 -6)"/></g>`;

// a فاتح، b متوسط، c داكن، glow توهج، in لون داخل الأذن/التفاصيل
const PAL = {
    cat:     { a: "#fbcfe8", b: "#ec4899", c: "#500724", glow: "#f472b6", in: "#fda4af" },
    bunny:   { a: "#fff1f2", b: "#fb7185", c: "#4c0519", glow: "#fda4af", in: "#fecdd3" },
    fox:     { a: "#fed7aa", b: "#f97316", c: "#431407", glow: "#fb923c", in: "#fff7ed" },
    wolf:    { a: "#e0f2fe", b: "#64748b", c: "#0f172a", glow: "#7dd3fc", in: "#94a3b8" },
    lion:    { a: "#fde68a", b: "#d97706", c: "#451a03", glow: "#fbbf24", in: "#fef3c7" },
    bear:    { a: "#e7c9a5", b: "#a16207", c: "#291404", glow: "#d6a15c", in: "#f5deb3" },
    owl:     { a: "#fde68a", b: "#92400e", c: "#1c1007", glow: "#fcd34d", in: "#d6b98a" },
    dragon:  { a: "#bbf7d0", b: "#16a34a", c: "#052e16", glow: "#4ade80", in: "#fca5a5" },
    phoenix: { a: "#fef08a", b: "#f97316", c: "#450a0a", glow: "#fb923c", in: "#fde047" },
    unicorn: { a: "#fae8ff", b: "#c084fc", c: "#3b0764", glow: "#f0abfc", in: "#ffffff" }
};

// ---- الهيكل المشترك: إطار معدني + خط متوهج + لمعة تدور ----
function shell(p, t, hueShift) {
    const pulse = 0.6 + 0.4 * Math.sin(TAU * t);
    const x0 = WIN.x - 14, y0 = WIN.y - 14, w = WIN.w + 28, h = WIN.h + 28;
    let s = `<rect x="${x0}" y="${y0}" width="${w}" height="${h}" rx="${WIN.r + 10}" fill="none" stroke="url(#metal)" stroke-width="24"/>`;
    s += `<rect x="${x0 - 12}" y="${y0 - 12}" width="${w + 24}" height="${h + 24}" rx="${WIN.r + 20}" fill="none" stroke="#0f0e15" stroke-width="3" opacity=".8"/>`;
    const col = hueShift ? `hsl(${Math.round(t * 360) % 360},95%,68%)` : p.glow;
    s += `<rect x="${WIN.x - 2}" y="${WIN.y - 2}" width="${WIN.w + 4}" height="${WIN.h + 4}" rx="${WIN.r + 2}" fill="none" stroke="${col}" stroke-width="7" filter="url(#g)" opacity="${f(0.5 + 0.4 * pulse)}"/>`;
    s += `<rect x="${WIN.x - 2}" y="${WIN.y - 2}" width="${WIN.w + 4}" height="${WIN.h + 4}" rx="${WIN.r + 2}" fill="none" stroke="${hueShift ? col : p.a}" stroke-width="2.5"/>`;
    const per = 2 * (w + h), d = (t * per) % per;
    const posAt = k => {
        k = ((k % per) + per) % per;
        if (k < w) return [x0 + k, y0];
        if (k < w + h) return [x0 + w, y0 + (k - w)];
        if (k < 2 * w + h) return [x0 + w - (k - w - h), y0 + h];
        return [x0, y0 + h - (k - 2 * w - h)];
    };
    for (let i = 0; i < 8; i++) { const [x, y] = posAt(d - i * 7); s += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(Math.max(0.6, 5 - i * 0.6))}" fill="#fff" opacity="${f(0.95 - i * 0.11)}"/>`; }
    return s;
}

// ---- زخرفة كل حيوان: back تُرسم خلف الإطار المعدني، front فوقه ----
const ear = (p, d, inner) => `<path d="${d}" fill="${p.c}" stroke="url(#silver)" stroke-width="2.5" stroke-linejoin="round"/><path d="${inner}" fill="${p.in}" opacity=".9"/>`;

const ANIMALS = {
    cat(p, t) {
        const back = mirror(ear(p, "M80 112 L92 36 L150 86 Z", "M92 96 L98 56 L126 84 Z"));
        let front = mirror(`<path d="M58 210 L16 200 M58 226 L12 232 M58 242 L18 262" stroke="${p.a}" stroke-width="2.4" stroke-linecap="round" opacity=".85"/>`);
        front += paw(200, 366, 1.1, p.a) + `<circle cx="200" cy="366" r="26" fill="${p.glow}" filter="url(#g)" opacity="${f(0.25 + 0.2 * Math.sin(TAU * t))}"/>`;
        return { back, front };
    },
    bunny(p, t) {
        const sw = 4 * Math.sin(TAU * t);
        const e = `<g transform="rotate(${f(-10 + sw)} 128 96)"><ellipse cx="128" cy="60" rx="19" ry="46" fill="${p.c}" stroke="url(#silver)" stroke-width="2.5"/><ellipse cx="128" cy="64" rx="9" ry="32" fill="${p.in}"/></g>`;
        let front = "";
        for (let i = 0; i < 5; i++) {
            const k = (t + i / 5) % 1, x = 40 + rnd(i) * 320, y = 380 - 330 * k, z = 0.5 + rnd(i + 7) * 0.4;
            front += `<path transform="translate(${f(x)} ${f(y)}) scale(${f(z)})" d="M0 8 C-14 -4 -8 -14 0 -6 C8 -14 14 -4 0 8 Z" fill="${p.b}" opacity="${f(1 - k)}"/>`;
        }
        front += `<ellipse cx="200" cy="366" rx="18" ry="14" fill="${p.a}"/><circle cx="200" cy="360" r="4" fill="${p.b}"/>`;
        return { back: mirror(e), front };
    },
    fox(p, t) {
        const e = `<path d="M78 112 L84 24 L156 88 Z" fill="${p.c}" stroke="url(#silver)" stroke-width="2.5" stroke-linejoin="round"/><path d="M92 92 L90 52 L128 84 Z" fill="${p.in}"/><path d="M84 24 L97 44 L78 50 Z" fill="#fff"/>`;
        const sw = 6 * Math.sin(TAU * t);
        const tail = `<path d="M262 352 Q${f(300 + sw)} 330 ${f(350 + sw)} 322 Q${f(392 + sw)} 330 ${f(384 + sw)} 366 Q${f(350 + sw)} 392 ${f(300 + sw)} 376 Q272 368 262 352 Z" fill="${p.b}" stroke="${p.c}" stroke-width="2"/><path d="M${f(384 + sw)} 366 Q${f(392 + sw)} 330 ${f(350 + sw)} 322 Q${f(352 + sw)} 350 ${f(340 + sw)} 380 Q${f(366 + sw)} 380 ${f(384 + sw)} 366 Z" fill="#fff"/>`;
        return { back: mirror(e), front: tail + paw(150, 372, 0.8, p.a) };
    },
    wolf(p, t) {
        const e = `<path d="M82 112 L80 24 L158 90 Z" fill="${p.c}" stroke="url(#silver)" stroke-width="2.5" stroke-linejoin="round"/><path d="M94 92 L92 52 L130 86 Z" fill="${p.in}"/>`;
        const glow = 0.7 + 0.3 * Math.sin(TAU * t);
        const moon = `<circle cx="200" cy="44" r="30" fill="${p.glow}" filter="url(#g)" opacity="${f(0.35 * glow)}"/><mask id="cm"><rect width="400" height="110" fill="#fff"/><circle cx="214" cy="38" r="24" fill="#000"/></mask><circle cx="200" cy="46" r="28" fill="${p.a}" mask="url(#cm)"/>`;
        const claws = mirror(`<path d="M52 330 L78 372 M40 338 L64 380 M64 322 L92 362" stroke="${p.glow}" stroke-width="4" stroke-linecap="round" opacity="${f(0.6 + 0.4 * glow)}"/>`);
        return { back: mirror(e), front: moon + claws };
    },
    lion(p, t) {
        let back = "";
        for (let i = 0; i < 28; i++) {
            const a = i / 28 * TAU, r0 = 150, r1 = 176 + 12 * Math.sin(TAU * (t * 2 + i * 0.13));
            const cx = 200, cy = 218, ax = Math.cos(a), ay = Math.sin(a) * 0.92, nx = -ay, ny = ax;
            back += `<path d="M${f(cx + ax * r0 + nx * 11)} ${f(cy + ay * r0 + ny * 11)} L${f(cx + ax * r1)} ${f(cy + ay * r1)} L${f(cx + ax * r0 - nx * 11)} ${f(cy + ay * r0 - ny * 11)} Z" fill="${i % 2 ? p.b : p.a}" opacity=".95"/>`;
        }
        const crown = `<path d="M170 58 L178 30 L190 50 L200 24 L210 50 L222 30 L230 58 Z" fill="${p.a}" stroke="${p.b}" stroke-width="2"/>`;
        return { back, front: crown };
    },
    bear(p, t) {
        const e = `<circle cx="106" cy="68" r="30" fill="${p.c}" stroke="url(#silver)" stroke-width="2.5"/><circle cx="106" cy="70" r="15" fill="${p.in}"/>`;
        let front = paw(200, 366, 1.2, p.a);
        const k = (Math.sin(TAU * t) + 1) / 2;
        front += `<path d="M82 358 Q86 ${f(372 + 8 * k)} 90 358" fill="${p.glow}" opacity=".9"/>`;
        return { back: mirror(e), front };
    },
    owl(p, t) {
        const tuft = `<path d="M84 116 L70 36 L132 84 Z" fill="${p.c}" stroke="url(#silver)" stroke-width="2.5" stroke-linejoin="round"/><path d="M82 100 L78 62 L110 86 Z" fill="${p.in}"/>`;
        const blink = ((t * 2) % 1) > 0.9 ? 0.1 : 1;
        const eyes = [172, 228].map(x => `<circle cx="${x}" cy="54" r="19" fill="#0e0a05" stroke="url(#silver)" stroke-width="2.5"/><ellipse cx="${x}" cy="54" rx="13" ry="${f(13 * blink)}" fill="${p.glow}"/><ellipse cx="${x}" cy="54" rx="5" ry="${f(8 * blink)}" fill="#1c1007"/>`).join("");
        const beak = `<path d="M192 78 L208 78 L200 94 Z" fill="${p.a}" stroke="${p.b}" stroke-width="1.5"/>`;
        return { back: mirror(tuft), front: eyes + beak };
    },
    dragon(p, t) {
        const horn = `<path d="M96 104 C56 84 62 30 112 6 C98 42 108 74 134 94 Z" fill="${p.c}" stroke="url(#silver)" stroke-width="2.5" stroke-linejoin="round"/><path d="M100 92 C76 70 84 40 108 22" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="2"/>`;
        let scale = "";
        for (let i = 0; i < 9; i++) scale += `<path d="M${f(36 + (i % 2) * 6)} ${f(130 + i * 22)} q9 10 0 20" fill="none" stroke="${p.glow}" stroke-width="2.4" opacity=".7"/>`;
        let spines = "";
        for (let i = 0; i < 5; i++) { const x = 174 + i * 13; spines += `<path d="M${x} 74 L${x + 7} ${f(46 + (i % 2) * 8)} L${x + 13} 74 Z" fill="${p.b}"/>`; }
        let flame = "";
        for (let i = 0; i < 9; i++) {
            const x = 120 + i * 20, hh = 18 + 12 * Math.sin(TAU * (t * 2 + i * 0.3));
            flame += `<path d="M${x - 9} 376 Q${x} ${f(376 - hh)} ${x + 9} 376 Z" fill="${i % 2 ? "#fb923c" : "#fde047"}" opacity=".9"/>`;
        }
        return { back: mirror(horn), front: mirror(scale) + spines + flame };
    },
    phoenix(p, t) {
        const fl = Math.sin(TAU * t) * 8;
        let wing = "";
        for (let i = 0; i < 5; i++) {
            const ty = 70 + i * 36 + fl * (1 - i * 0.15), tx = 8 + i * 4;
            wing += `<path d="M62 ${130 + i * 34} Q${f(tx + 10)} ${f(ty - 24)} ${f(tx)} ${f(ty)} Q${f(tx + 28)} ${f(ty + 12)} 80 ${150 + i * 34} Z" fill="${["#ef4444", "#f97316", "#fb923c", "#fbbf24", "#fde047"][i]}" stroke="${p.c}" stroke-width="1.5"/>`;
        }
        let embers = "";
        for (let i = 0; i < 10; i++) { const k = (t + rnd(i)) % 1; embers += `<circle cx="${f(70 + rnd(i + 3) * 260)}" cy="${f(380 - 330 * k)}" r="${f(2.6 * (1 - k) + 0.6)}" fill="#fde047" opacity="${f(1 - k)}"/>`; }
        const crest = `<path d="M200 6 Q224 36 208 66 Q200 44 192 66 Q176 36 200 6 Z" fill="#f97316" stroke="#fde047" stroke-width="2"/>`;
        return { back: mirror(wing), front: crest + embers };
    },
    unicorn(p, t) {
        let horn = `<path d="M200 4 L216 84 L184 84 Z" fill="#fff" stroke="url(#silver)" stroke-width="2.5" stroke-linejoin="round"/>`;
        for (let i = 0; i < 5; i++) horn += `<path d="M${f(193 - i * 0.2)} ${24 + i * 12} L${f(210 + i * 0.5)} ${32 + i * 12}" stroke="${["#f0abfc", "#a5b4fc", "#7dd3fc", "#86efac", "#fde047"][i]}" stroke-width="3" stroke-linecap="round"/>`;
        const e = `<path d="M92 108 L88 40 L146 88 Z" fill="${p.c}" stroke="url(#silver)" stroke-width="2.5" stroke-linejoin="round"/><path d="M98 92 L96 62 L126 86 Z" fill="${p.in}"/>`;
        let sp = "";
        for (let i = 0; i < 9; i++) sp += star(SIZE / 2 + (170 + rnd(i + 3) * 28) * Math.cos(rnd(i + 5) * TAU), SIZE / 2 + (170 + rnd(i + 3) * 28) * Math.sin(rnd(i + 5) * TAU), Math.max(0, Math.sin(TAU * (t + rnd(i + 9)))) * 1.2, "#fff");
        return { back: mirror(e), front: horn + sp };
    }
};

function make(kind) {
    const p = PAL[kind];
    return function draw(t) {
        const parts = ANIMALS[kind](p, t);
        const defs = `<defs>
          <filter id="g" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="5"/></filter>
          <clipPath id="outw"><path clip-rule="evenodd" d="M0 0H400V400H0Z M${WIN.x - 4} ${WIN.y - 4} h${WIN.w + 8} v${WIN.h + 8} h-${WIN.w + 8} Z"/></clipPath>
          <linearGradient id="metal" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8d8a9c"/><stop offset=".45" stop-color="#3b3946"/><stop offset="1" stop-color="#1b1a22"/></linearGradient>
          <linearGradient id="silver" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f4f4f8"/><stop offset=".5" stop-color="#9c9aac"/><stop offset="1" stop-color="#55536a"/></linearGradient></defs>`;
        return `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}">${defs}<g clip-path="url(#outw)">${parts.back}</g>${shell(p, t, kind === "unicorn")}${parts.front}</svg>`;
    };
}

// sp: رقم الحيوان في اللعبة (من data.js). من يملكه يفتح إطاره مجانًا، ومن لا يملكه يشتريه.
const ANIMAL = [
    { id: "a_cat",     name: "إطار القطة",      e: "🐱", sp: 1,  price: 2e10, kind: "cat" },
    { id: "a_bunny",   name: "إطار الأرنب",     e: "🐰", sp: 3,  price: 2e10, kind: "bunny" },
    { id: "a_fox",     name: "إطار الثعلب",     e: "🦊", sp: 9,  price: 1e11, kind: "fox" },
    { id: "a_wolf",    name: "إطار الذئب",      e: "🐺", sp: 16, price: 5e11, kind: "wolf" },
    { id: "a_lion",    name: "إطار الأسد",      e: "🦁", sp: 19, price: 5e11, kind: "lion" },
    { id: "a_bear",    name: "إطار الدب",       e: "🐻", sp: 20, price: 5e11, kind: "bear" },
    { id: "a_owl",     name: "إطار البومة",     e: "🦉", sp: 23, price: 2e12, kind: "owl" },
    { id: "a_unicorn", name: "إطار اليونيكورن", e: "🦄", sp: 36, price: 5e13, kind: "unicorn" },
    { id: "a_dragon",  name: "إطار التنين",     e: "🐉", sp: 35, price: 3e14, kind: "dragon" },
    { id: "a_phoenix", name: "إطار العنقاء",    e: "🐦‍🔥", sp: 39, price: 3e14, kind: "phoenix" }
].map(x => {
    const { sp, kind } = x;
    return Object.assign({
        frames: 16, square: true, win: WIN, ach: null,
        text: "امتلك هذا الحيوان",
        unlock: P => !!(P && P.pets && P.pets.some(p => p.sp === sp)),
        draw: make(kind)
    }, x);
});

module.exports = { ANIMAL };