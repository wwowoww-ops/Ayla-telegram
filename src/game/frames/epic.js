// إطارات ملحمية بتصاميم مختلفة جذريًا (أجنحة، تنين، عنقاء، صواعق، جليد، شيطان، تاج، كون...).
// كل إطار يملك هيكله الخاص (ليس تغيير ألوان): أجنحة ريشية كبيرة، رؤوس تنانين، ألسنة لهب، عواصف، بلورات، قرون، أكاليل، حلقات سماوية.
// تُرسم بالكود (SVG) فوق صورة مربعة بزوايا مدوّرة (WIN)، وتتحرك عبر الزمن t من 0 إلى 1.
const { WIN } = require("./ornate");
const SIZE = 400, TAU = Math.PI * 2;
const f = n => Number(n.toFixed(2));
const rnd = n => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const mirror = s => `<g>${s}</g><g transform="translate(${SIZE} 0) scale(-1 1)">${s}</g>`;
const rot = (a, x, y, s) => `<g transform="rotate(${f(a)} ${f(x)} ${f(y)})">${s}</g>`;
const star = (x, y, s, c, op = 1) => {
    if (s <= 0.05) return "";
    const a = s * 9, b = s * 2;
    return `<path d="M${f(x)} ${f(y - a)} L${f(x + b)} ${f(y - b)} L${f(x + a)} ${f(y)} L${f(x + b)} ${f(y + b)} L${f(x)} ${f(y + a)} L${f(x - b)} ${f(y + b)} L${f(x - a)} ${f(y)} L${f(x - b)} ${f(y - b)} Z" fill="${c}" opacity="${op}"/>`;
};
const pt = (cx, cy, r, deg) => [cx + r * Math.cos(deg * Math.PI / 180), cy + r * Math.sin(deg * Math.PI / 180)];

// ريشة متجهة لأعلى من (0,0) بطول len وعرض w (تُدوَّر وتُنقل)
const featherD = (len, w) => `M0 0 C${f(w)} ${f(-len * 0.25)} ${f(w * 0.85)} ${f(-len * 0.8)} 0 ${f(-len)} C${f(-w * 0.85)} ${f(-len * 0.8)} ${f(-w)} ${f(-len * 0.25)} 0 0 Z`;
function feather(x, y, ang, len, w, fill, stroke, op = 1) {
    return `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(ang + 90)})"><path d="${featherD(len, w)}" fill="${fill}" stroke="${stroke || "none"}" stroke-width="1.2" opacity="${op}"/><path d="M0 -2 L0 ${f(-len * 0.92)}" stroke="#fff" stroke-opacity=".45" stroke-width="1.2"/></g>`;
}
// مروحة ريش: طبقات من الريش تخرج من نقطة محور
function fan(px, py, a0, a1, layers, n, len0, w0, fills, stroke, flap = 0) {
    let s = "";
    for (let L = layers - 1; L >= 0; L--) {
        const len = len0 * (1 - L * 0.2), w = w0 * (1 - L * 0.1);
        for (let i = 0; i < n; i++) {
            const k = n > 1 ? i / (n - 1) : 0.5;
            const ang = a0 + (a1 - a0) * k + flap * (0.4 + k);
            s += feather(px, py, ang, len * (0.78 + 0.22 * Math.sin(Math.PI * (0.15 + 0.7 * k))), w, fills[L % fills.length], stroke);
        }
    }
    return s;
}
// حدود الإطار الداخلية: مستطيل مدوّر
const rr = (x, y, w, h, r, extra) => `<rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(h)}" rx="${f(r)}" ${extra}/>`;
const glowDefs = `<filter id="g" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="5"/></filter><filter id="g2" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2"/></filter><filter id="g8" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="9"/></filter>`;
const grad = (id, stops, x2 = 0, y2 = 1) => `<linearGradient id="${id}" x1="0" y1="0" x2="${x2}" y2="${y2}">${stops.map(([o, c]) => `<stop offset="${o}" stop-color="${c}"/>`).join("")}</linearGradient>`;
const GOLD = [[0, "#fff6c8"], [0.35, "#f6c744"], [0.7, "#b8741a"], [1, "#5a3208"]];
const STEEL = [[0, "#e8ecf5"], [0.4, "#8b93a8"], [1, "#2c3140"]];
const wrap = body => `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}">${body}</svg>`;
const win = { x: WIN.x, y: WIN.y, w: WIN.w, h: WIN.h, r: WIN.r };
// إطار نافذة بتدرج معدني
const metalBorder = (gid, width = 18, rad = 12, extra = "") => rr(win.x - width / 2 + 1, win.y - width / 2 + 1, win.w + width - 2, win.h + width - 2, win.r + rad, `fill="none" stroke="url(#${gid})" stroke-width="${width}" ${extra}`);
const thinLine = (c, op = 0.9, w = 2, inset = 3) => rr(win.x - inset, win.y - inset, win.w + inset * 2, win.h + inset * 2, win.r + inset, `fill="none" stroke="${c}" stroke-width="${w}" opacity="${op}"`);

// ========== 1) جناح الملاك ==========
function angel(t) {
    const flap = Math.sin(TAU * t) * 3;
    let s = `<defs>${glowDefs}${grad("gd", GOLD)}${grad("wf", [[0, "#ffffff"], [0.6, "#fdf3c4"], [1, "#e8c36a"]])}${grad("wf2", [[0, "#fffaf0"], [1, "#d9d3ff"]])}</defs>`;
    // هالة خلفية
    s += `<ellipse cx="200" cy="170" rx="190" ry="150" fill="#fff4b8" opacity=".12" filter="url(#g8)"/>`;
    // الجناحان: ثلاث طبقات تخرج من أعلى جانبي الإطار
    const wing = fan(326, 150, -20 - flap, -150 - flap, 3, 9, 128, 15, ["url(#wf)", "url(#wf2)", "url(#wf)"], "#c79a3a", flap * 0.3)
        + fan(330, 190, 25 - flap, -20 - flap, 2, 6, 80, 12, ["url(#wf2)", "url(#wf)"], "#c79a3a", flap * 0.2);
    s += `<g>${wing}</g><g transform="translate(${SIZE} 0) scale(-1 1)">${wing}</g>`;
    // الإطار الذهبي
    s += metalBorder("gd", 18, 12);
    s += thinLine("#fff8d0", 0.95, 2, 6);
    // أركان مزخرفة
    const corner = `<path d="M${win.x - 12} ${win.y + 28} Q${win.x - 22} ${win.y - 14} ${win.x + 26} ${win.y - 12}" fill="none" stroke="url(#gd)" stroke-width="7" stroke-linecap="round"/><circle cx="${win.x - 11}" cy="${win.y - 11}" r="8" fill="url(#gd)" stroke="#fff3b0" stroke-width="1.5"/><circle cx="${win.x - 11}" cy="${win.y - 11}" r="3.4" fill="#ff6b8a"/>`;
    s += mirror(corner);
    s += `<g transform="translate(0 ${win.y + win.h + 8 - (win.y - 11)}) scale(1 -1) translate(0 ${-(win.y - 11) * 2 + 0})"></g>`;
    // هالة فوق الرأس
    const hp = 0.55 + 0.45 * Math.sin(TAU * t);
    s += `<ellipse cx="200" cy="52" rx="64" ry="15" fill="none" stroke="#ffe27a" stroke-width="12" filter="url(#g)" opacity="${f(0.45 + 0.4 * hp)}"/>`;
    s += `<ellipse cx="200" cy="52" rx="64" ry="15" fill="none" stroke="url(#gd)" stroke-width="5"/>`;
    s += `<ellipse cx="200" cy="52" rx="64" ry="15" fill="none" stroke="#fff" stroke-width="1.4" opacity=".8"/>`;
    // جوهرة سفلية وإكليل
    s += `<path d="M200 346 L218 362 L200 388 L182 362 Z" fill="#ff7a96" stroke="url(#gd)" stroke-width="3"/><path d="M200 346 L218 362 L200 362 Z" fill="#fff" opacity=".4"/>`;
    const lau = `<path d="M186 360 Q150 372 118 350" fill="none" stroke="url(#gd)" stroke-width="3.5" stroke-linecap="round"/>` + [0, 1, 2, 3, 4].map(i => `<ellipse cx="${176 - i * 14}" cy="${f(362 - i * 3.5)}" rx="9" ry="4" fill="url(#gd)" transform="rotate(${-20 - i * 6} ${176 - i * 14} ${f(362 - i * 3.5)})"/>`).join("");
    s += mirror(lau);
    // ريش تتساقط
    for (let i = 0; i < 6; i++) {
        const k = (t + rnd(i)) % 1, x = 30 + rnd(i + 4) * 340 + 12 * Math.sin(TAU * (t + i));
        s += `<g transform="translate(${f(x)} ${f(10 + k * 380)}) rotate(${f(120 * k + i * 40)})" opacity="${f(Math.sin(k * Math.PI) * 0.9)}"><path d="${featherD(16, 4)}" fill="#fff" stroke="#e8c36a" stroke-width=".8"/></g>`;
    }
    s += [0, 1, 2, 3, 4, 5].map(i => { const a = rnd(i + 11) * TAU; return star(200 + 175 * Math.cos(a), 200 + 175 * Math.sin(a) * 0.95, Math.max(0, Math.sin(TAU * (t + rnd(i) ))) * 1.1, "#fff7c2"); }).join("");
    return wrap(s);
}


// ========== 2) العنقاء (أجنحة لهب) ==========
function flame(x, y, ang, len, w, c1, c2, op = 1) {
    return `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(ang + 90)})" opacity="${op}"><path d="M0 0 C${f(w)} ${f(-len * 0.3)} ${f(w * 0.5)} ${f(-len * 0.7)} 0 ${f(-len)} C${f(-w * 0.5)} ${f(-len * 0.7)} ${f(-w)} ${f(-len * 0.3)} 0 0 Z" fill="${c1}"/><path d="M0 0 C${f(w * 0.5)} ${f(-len * 0.25)} ${f(w * 0.25)} ${f(-len * 0.55)} 0 ${f(-len * 0.7)} C${f(-w * 0.25)} ${f(-len * 0.55)} ${f(-w * 0.5)} ${f(-len * 0.25)} 0 0 Z" fill="${c2}"/></g>`;
}
function phoenix(t) {
    let s = `<defs>${glowDefs}${grad("fg", [[0, "#ffe066"], [0.5, "#ff7a1a"], [1, "#a1180c"]])}${grad("fb", [[0, "#ffd27a"], [0.5, "#e2531a"], [1, "#5a0d06"]])}</defs>`;
    s += `<ellipse cx="200" cy="210" rx="195" ry="170" fill="#ff5a14" opacity=".16" filter="url(#g8)"/>`;
    const wing = () => {
        let w = "";
        for (let L = 0; L < 3; L++) for (let i = 0; i < 9; i++) {
            const k = i / 8, ang = -170 + k * 150 + 5 * Math.sin(TAU * (t * 2 + k + L * 0.2));
            const len = (150 - L * 30) * (0.7 + 0.3 * Math.sin(Math.PI * (0.1 + 0.8 * k))) + 6 * Math.sin(TAU * (t + k));
            w += flame(318, 300 - L * 24, ang + 200 - 20, len, 17 - L * 3, L % 2 ? "#ffb02e" : "url(#fg)", L % 2 ? "#fff3a0" : "#ffd66b");
        }
        return w;
    };
    const w = wing();
    s += `<g>${w}</g><g transform="translate(${SIZE} 0) scale(-1 1)">${w}</g>`;
    s += metalBorder("fb", 16, 10) + thinLine("#ffd66b", .9, 2, 5);
    // ريش ذيل في الأسفل
    for (let i = 0; i < 7; i++) {
        const a = 60 + i * 10 + 4 * Math.sin(TAU * (t + i / 7));
        s += flame(200, 350, a + 0, 70 - Math.abs(i - 3) * 8, 14, i % 2 ? "url(#fg)" : "#ff9a22", "#fff1a0");
    }
    // رأس العنقاء في الأعلى
    s += `<g transform="translate(200 62)"><path d="M-34 14 C-30 -10 -10 -22 0 -26 C10 -22 30 -10 34 14 C20 2 10 6 0 22 C-10 6 -20 2 -34 14Z" fill="url(#fg)" stroke="#fff1a0" stroke-width="2"/><path d="M0 -26 L0 -52 M-12 -22 L-24 -48 M12 -22 L24 -48" stroke="#ffcf4a" stroke-width="5" stroke-linecap="round"/><circle cx="-9" cy="2" r="3.5" fill="#fff"/><circle cx="9" cy="2" r="3.5" fill="#fff"/></g>`;
    // شرر صاعد
    for (let i = 0; i < 16; i++) {
        const k = (t + rnd(i)) % 1, x = 40 + rnd(i + 3) * 320, y = 390 - k * 380;
        s += `<circle cx="${f(x + 8 * Math.sin(TAU * k * 2 + i))}" cy="${f(y)}" r="${f(1.5 + 2.2 * (1 - k))}" fill="${i % 3 ? "#ffcf4a" : "#ff6a1a"}" opacity="${f(Math.sin(k * Math.PI))}"/>`;
    }
    return wrap(s);
}

// ========== 3) التنين (قرون ورؤوس على الجانبين) ==========
function dragon(t) {
    let s = `<defs>${glowDefs}${grad("dg", [[0, "#7dffa8"], [0.5, "#1a9a58"], [1, "#05331f"]])}${grad("dh", [[0, "#ffe9a0"], [1, "#a8741a"]])}</defs>`;
    s += `<ellipse cx="200" cy="200" rx="190" ry="180" fill="#2cff90" opacity=".08" filter="url(#g8)"/>`;
    // جسم التنين يلتف حول الإطار على شكل حلقة سميكة بحراشف
    const bx = win.x - 12, by = win.y - 12, bw = win.w + 24, bh = win.h + 24;
    s += rr(bx, by, bw, bh, win.r + 14, `fill="none" stroke="url(#dg)" stroke-width="22"`);
    s += rr(bx, by, bw, bh, win.r + 14, `fill="none" stroke="#c9ffe0" stroke-opacity=".5" stroke-width="22" stroke-dasharray="3 9"`);
    s += rr(bx, by, bw, bh, win.r + 14, `fill="none" stroke="#06402a" stroke-opacity=".55" stroke-width="3"`);
    // أشواك على الحافة العلوية والجانبية
    let sp = "";
    for (let i = 0; i < 9; i++) { const x = bx + 16 + i * (bw - 32) / 8, h = 18 - Math.abs(i - 4) * -2.5 + 6; sp += `<path d="M${f(x - 7)} ${by - 8} L${f(x)} ${f(by - 8 - h)} L${f(x + 7)} ${by - 8} Z" fill="url(#dh)" stroke="#5a3208" stroke-width="1"/>`; }
    s += sp;
    // رأس تنين على كل جانب (جانبي) يخرج من الركن العلوي
    const head = `<g transform="translate(${bx - 6} ${by + 6})"><path d="M0 0 C-20 -30 -10 -62 18 -76 C10 -60 14 -46 30 -40 C44 -46 58 -46 70 -36 C56 -34 50 -22 56 -10 C40 -14 22 -6 0 0Z" fill="url(#dg)" stroke="#c9ffe0" stroke-width="1.8"/><path d="M18 -76 C28 -96 44 -104 56 -100 C44 -94 38 -84 36 -70Z" fill="url(#dh)" stroke="#5a3208" stroke-width="1.2"/><path d="M30 -40 C22 -52 20 -64 24 -74" fill="none" stroke="url(#dh)" stroke-width="5" stroke-linecap="round"/><path d="M52 -42 L66 -32 L50 -34Z" fill="#fff"/><ellipse cx="38" cy="-52" rx="5.5" ry="3.2" fill="#ffe14a" transform="rotate(-18 38 -52)"/><ellipse cx="39" cy="-52" rx="1.6" ry="3" fill="#111"/></g>`;
    s += mirror(head);
    // نار من الفم
    for (let i = 0; i < 5; i++) { const k = (t + i / 5) % 1; s += `<circle cx="${f(bx + 64 + k * 40)}" cy="${f(by - 28 - k * 14)}" r="${f(5 * (1 - k))}" fill="#9dffc8" opacity="${f(1 - k)}"/><circle cx="${f(SIZE - bx - 64 - k * 40)}" cy="${f(by - 28 - k * 14)}" r="${f(5 * (1 - k))}" fill="#9dffc8" opacity="${f(1 - k)}"/>`; }
    // ذيل ينتهي في الأسفل
    s += `<path d="M${bx + 20} ${by + bh + 6} C${bx + 60} ${by + bh + 30} ${bx + 120} ${by + bh + 8} 200 ${by + bh + 22} C280 ${by + bh + 8} ${SIZE - bx - 60} ${by + bh + 30} ${SIZE - bx - 20} ${by + bh + 6}" fill="none" stroke="url(#dg)" stroke-width="9" stroke-linecap="round"/><path d="M200 ${by + bh + 14} L214 ${by + bh + 34} L200 ${by + bh + 44} L186 ${by + bh + 34}Z" fill="url(#dh)" stroke="#5a3208" stroke-width="1.5"/>`;
    s += thinLine("#d8ffe9", .85, 1.6, 4);
    s += [0, 1, 2, 3].map(i => star(60 + i * 95, 388 - 4 * Math.sin(TAU * (t + i / 4)), Math.max(0, Math.sin(TAU * (t + i / 4))) * 1.1, "#c9ffe0")).join("");
    return wrap(s);
}

// ========== 4) قفص الصواعق ==========
function bolt(x1, y1, x2, y2, seed, c, w) {
    let d = `M${f(x1)} ${f(y1)}`; const n = 6;
    for (let i = 1; i < n; i++) { const k = i / n; d += ` L${f(x1 + (x2 - x1) * k + (rnd(seed + i) - 0.5) * 26)} ${f(y1 + (y2 - y1) * k + (rnd(seed + i * 3) - 0.5) * 26)}`; }
    d += ` L${f(x2)} ${f(y2)}`;
    return `<path d="${d}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"/>`;
}
function thunder(t) {
    let s = `<defs>${glowDefs}${grad("tg", [[0, "#f0f4ff"], [0.5, "#7a86c8"], [1, "#1c2150"]])}</defs>`;
    // سحابة عاصفة أعلى
    const cloud = (x, y, sc, c) => `<g transform="translate(${x} ${y}) scale(${sc})" fill="${c}"><ellipse cx="0" cy="0" rx="46" ry="18"/><circle cx="-28" cy="-10" r="20"/><circle cx="6" cy="-20" r="26"/><circle cx="34" cy="-8" r="19"/></g>`;
    s += `<ellipse cx="200" cy="200" rx="195" ry="170" fill="#6a7cff" opacity=".12" filter="url(#g8)"/>`;
    s += cloud(100, 70, 1.3, "#2c3470") + cloud(300, 66, 1.3, "#2c3470") + cloud(200, 50, 1.6, "#3a4488") + cloud(200, 56, 1.4, "#515eb0");
    // أعمدة معدنية بأربعة أركان
    const post = (x, y) => `<g transform="translate(${x} ${y})"><path d="M-9 -26 L9 -26 L12 26 L-12 26Z" fill="url(#tg)" stroke="#dfe6ff" stroke-width="1.6"/><path d="M0 -50 L9 -26 L-9 -26Z" fill="#ffe14a" stroke="#fff6a8" stroke-width="1.4"/><circle cx="0" cy="-2" r="5.5" fill="#7cf3ff" filter="url(#g2)"/><circle cx="0" cy="-2" r="2.5" fill="#fff"/></g>`;
    s += metalBorder("tg", 12, 6);
    s += post(win.x - 8, win.y - 8) + post(win.x + win.w + 8, win.y - 8) + post(win.x - 8, win.y + win.h + 8) + post(win.x + win.w + 8, win.y + win.h + 8);
    // صواعق بين الأعمدة (تومض)
    const ph = Math.floor(t * 8);
    const pairs = [[win.x - 8, win.y - 8, win.x + win.w + 8, win.y - 8], [win.x - 8, win.y + win.h + 8, win.x + win.w + 8, win.y + win.h + 8], [win.x - 8, win.y - 8, win.x - 8, win.y + win.h + 8], [win.x + win.w + 8, win.y - 8, win.x + win.w + 8, win.y + win.h + 8]];
    pairs.forEach((q, i) => { const sd = ph * 7 + i * 13; s += bolt(...q, sd, "#9cf3ff", 7).replace('stroke-width="7"', 'stroke-width="7" opacity=".35" filter="url(#g2)"') + bolt(...q, sd, "#ffffff", 2); });
    // صاعقة كبيرة من السحابة
    const fl = Math.sin(TAU * t * 2) > 0.2 ? 1 : 0.25;
    s += `<g opacity="${fl}">` + bolt(200, 72, 200 + 10 * Math.sin(ph), 100, 5 + ph, "#ffe97a", 6) + bolt(200, 72, 200 + 10 * Math.sin(ph), 100, 5 + ph, "#fff", 2) + `</g>`;
    // مطر
    for (let i = 0; i < 14; i++) { const k = (t * 1.5 + rnd(i)) % 1, x = 20 + rnd(i + 9) * 360; s += `<path d="M${f(x)} ${f(110 + k * 280)} l-4 14" stroke="#b6c4ff" stroke-width="1.6" opacity="${f(0.5 * Math.sin(k * Math.PI))}"/>`; }
    return wrap(s);
}

// ========== 5) تاج الجليد ==========
function ice(t) {
    let s = `<defs>${glowDefs}${grad("ig", [[0, "#ffffff"], [0.4, "#a9e4ff"], [1, "#3a86d8"]], 1, 1)}${grad("ib", [[0, "#e9fbff"], [1, "#5aa8e8"]])}</defs>`;
    s += `<ellipse cx="200" cy="210" rx="190" ry="175" fill="#7fd6ff" opacity=".16" filter="url(#g8)"/>`;
    s += metalBorder("ib", 14, 8) + thinLine("#ffffff", .9, 2, 4);
    const cr = (x, y, a, len, w) => `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(a + 90)})"><path d="M0 0 L${w} ${-len * 0.35} L${w * 0.45} ${-len} L${-w * 0.45} ${-len * 0.9} L${-w} ${-len * 0.35}Z" fill="url(#ig)" stroke="#fff" stroke-width="1.6" opacity=".96"/><path d="M0 0 L${w * 0.45} ${-len} L0 ${-len * 0.45}Z" fill="#fff" opacity=".35"/></g>`;
    // تاج بلورات في الأعلى
    for (let i = 0; i < 7; i++) { const k = i / 6, x = 82 + k * 236, h = 62 + 30 * Math.sin(Math.PI * k), a = -90 + (k - 0.5) * 56; s += cr(x, win.y - 6, a, h, 14 + 4 * Math.sin(Math.PI * k)); }
    // بلورات على الأجناب ذات اتجاهات مائلة
    for (let i = 0; i < 4; i++) { const y = win.y + 40 + i * 62; s += cr(win.x - 8, y, 180 + (i % 2 ? 22 : -22), 40 + (i % 2) * 14, 10) + cr(win.x + win.w + 8, y + 12, 0 + (i % 2 ? -22 : 22), 40 + (i % 2) * 14, 10); }
    // بلورات سفلية
    for (let i = 0; i < 5; i++) s += cr(110 + i * 45, win.y + win.h + 8, 90 + (i - 2) * 16, 34 + (i === 2 ? 26 : 0), 11);
    // ندفات ثلج
    for (let i = 0; i < 18; i++) { const k = (t + rnd(i)) % 1; s += `<circle cx="${f(15 + rnd(i + 5) * 370 + 10 * Math.sin(TAU * k + i))}" cy="${f(k * 400)}" r="${f(1.6 + rnd(i + 8) * 2)}" fill="#fff" opacity="${f(0.85 * Math.sin(k * Math.PI))}"/>`; }
    s += star(86, 94 + 3 * Math.sin(TAU * t), 1.2 + Math.sin(TAU * t) * 0.6, "#fff") + star(316, 330, 1.2 + Math.cos(TAU * t) * 0.6, "#fff");
    return wrap(s);
}

// ========== 6) الشيطان (قرون وأجنحة خفاش وسلاسل) ==========
function demon(t) {
    let s = `<defs>${glowDefs}${grad("mg", [[0, "#ff4a5e"], [0.5, "#8c0c24"], [1, "#2a0410"]])}${grad("mh", [[0, "#f2e6e0"], [0.5, "#8a6a64"], [1, "#2a1a18"]])}${grad("mw", [[0, "#6a1230"], [1, "#1a0410"]])}</defs>`;
    s += `<ellipse cx="200" cy="200" rx="190" ry="170" fill="#ff1a3c" opacity=".14" filter="url(#g8)"/>`;
    // جناح الخفاش: عظام وأغشية
    const bat = () => {
        const px = 322, py = 170, tips = [[388, 70], [394, 128], [388, 196], [362, 262], [330, 296]];
        let d = `M${px} ${py}`; tips.forEach((p, i) => { const nx = tips[i + 1] || [330, 296]; d += ` L${p[0]} ${p[1] + 3 * Math.sin(TAU * (t + i / 5))} Q${(p[0] + nx[0]) / 2 - 12} ${(p[1] + nx[1]) / 2 + 4} ${nx[0]} ${nx[1]}`; });
        d += ` L${px} ${py + 70}Z`;
        let w = `<path d="${d}" fill="url(#mw)" stroke="#ff5a78" stroke-width="2" stroke-linejoin="round"/>`;
        tips.forEach(p => { w += `<path d="M${px} ${py} L${p[0]} ${p[1]}" stroke="#d8a0a0" stroke-width="3.4" stroke-linecap="round"/>`; });
        return w;
    };
    const b = bat(); s += `<g>${b}</g><g transform="translate(${SIZE} 0) scale(-1 1)">${b}</g>`;
    s += metalBorder("mg", 15, 9) + thinLine("#ff9aa8", .8, 1.6, 5);
    // قرون كبيرة ملتوية
    const horn = `<path d="M${win.x + 18} ${win.y - 6} C${win.x - 8} ${win.y - 36} ${win.x - 6} ${win.y - 74} ${win.x + 24} ${win.y - 92} C${win.x + 12} ${win.y - 64} ${win.x + 26} ${win.y - 44} ${win.x + 50} ${win.y - 12}Z" fill="url(#mh)" stroke="#2a0a0a" stroke-width="2"/><path d="M${win.x + 22} ${win.y - 70} L${win.x + 30} ${win.y - 54}" stroke="#fff" stroke-opacity=".5" stroke-width="2"/>`;
    s += mirror(horn);
    // جوهرة العين في الأعلى
    const gl = 0.6 + 0.4 * Math.sin(TAU * t);
    s += `<path d="M200 ${win.y - 22} L222 ${win.y - 4} L200 ${win.y + 14} L178 ${win.y - 4}Z" fill="#ff2a48" stroke="#ffd0d6" stroke-width="2.4"/><ellipse cx="200" cy="${win.y - 4}" rx="3" ry="9" fill="#1a0004"/><circle cx="200" cy="${win.y - 4}" r="26" fill="#ff1a3c" opacity="${f(0.25 * gl)}" filter="url(#g)"/>`;
    // سلاسل تتدلى من الأركان السفلية
    const chain = (x, y) => { let c = ""; for (let i = 0; i < 6; i++) c += `<ellipse cx="${x + 3 * Math.sin(TAU * t + i)}" cy="${y + i * 11}" rx="${i % 2 ? 3 : 6}" ry="${i % 2 ? 6 : 4}" fill="none" stroke="#b9b2b8" stroke-width="2.6"/>`; return c; };
    s += chain(win.x + 6, win.y + win.h + 4) + chain(win.x + win.w - 6, win.y + win.h + 4);
    // جمر
    for (let i = 0; i < 12; i++) { const k = (t + rnd(i)) % 1; s += `<circle cx="${f(30 + rnd(i + 2) * 340)}" cy="${f(390 - k * 380)}" r="${f(1.4 + 1.6 * (1 - k))}" fill="#ff6a2a" opacity="${f(Math.sin(k * Math.PI))}"/>`; }
    return wrap(s);
}

// ========== 7) التاج الملكي (أكاليل وراية) ==========
function royal(t) {
    let s = `<defs>${glowDefs}${grad("rg", GOLD)}${grad("rb", [[0, "#8a1ad8"], [1, "#2a0a5a"]])}</defs>`;
    s += `<ellipse cx="200" cy="200" rx="190" ry="175" fill="#ffd24a" opacity=".12" filter="url(#g8)"/>`;
    // رايات قماشية على الجانبين
    const ban = `<path d="M${win.x - 34} ${win.y + 30} L${win.x - 6} ${win.y + 30} L${win.x - 6} ${win.y + 230} L${win.x - 20} ${win.y + 210 + 3 * Math.sin(TAU * t)} L${win.x - 34} ${win.y + 230}Z" fill="url(#rb)" stroke="url(#rg)" stroke-width="2.6"/><path d="M${win.x - 20} ${win.y + 70} l5 10 l-5 10 l-5 -10Z" fill="#ffd24a"/><path d="M${win.x - 20} ${win.y + 130} l5 10 l-5 10 l-5 -10Z" fill="#ffd24a"/>`;
    s += mirror(ban);
    s += metalBorder("rg", 16, 10) + thinLine("#fff3b0", .9, 1.8, 5);
    // أكاليل الغار على الجانبين
    const laurel = (side) => { let l = ""; for (let i = 0; i < 9; i++) { const y = win.y + win.h - 10 - i * 25, x = win.x - 14 - 3 * Math.sin(i / 8 * Math.PI); l += `<ellipse cx="${x - 6}" cy="${y}" rx="11" ry="4.6" fill="url(#rg)" stroke="#6a4208" stroke-width=".8" transform="rotate(${-40 + i * 3} ${x - 6} ${y})"/><ellipse cx="${x + 6}" cy="${y - 8}" rx="9" ry="3.8" fill="url(#rg)" stroke="#6a4208" stroke-width=".8" transform="rotate(${-130 - i * 2} ${x + 6} ${y - 8})"/>`; } return l; };
    s += mirror(laurel());
    // تاج كبير
    const cx = 200, cy = win.y - 4;
    s += `<g transform="translate(${cx} ${cy})"><path d="M-70 4 L-76 -44 L-46 -20 L-22 -60 L0 -26 L22 -60 L46 -20 L76 -44 L70 4Z" fill="url(#rg)" stroke="#5a3208" stroke-width="2.4" stroke-linejoin="round"/><rect x="-70" y="-4" width="140" height="14" rx="5" fill="url(#rg)" stroke="#5a3208" stroke-width="2"/>`;
    [[-76, -44, "#4aa8ff"], [-22, -60, "#ff4a6a"], [22, -60, "#ff4a6a"], [76, -44, "#4aa8ff"], [0, -26, "#5aff9a"]].forEach(([x, y, c]) => { s += `<circle cx="${x}" cy="${y}" r="7" fill="${c}" stroke="#fff6c0" stroke-width="1.6"/><circle cx="${x - 2}" cy="${y - 2}" r="2" fill="#fff"/>`; });
    [-42, -14, 14, 42].forEach(x => s += `<circle cx="${x}" cy="3" r="4.2" fill="${x % 2 ? "#6affd8" : "#ff7ad8"}" stroke="#fff6c0" stroke-width="1.2"/>`);
    s += `</g>`;
    // ماسة سفلية وشرائط
    s += `<path d="M200 ${win.y + win.h + 4} L222 ${win.y + win.h + 22} L200 ${win.y + win.h + 46} L178 ${win.y + win.h + 22}Z" fill="#7ae0ff" stroke="url(#rg)" stroke-width="3"/>`;
    s += star(200 + 40 * Math.cos(TAU * t), 36 + 8 * Math.sin(TAU * t), 1.3, "#fff6c0") + star(200 - 70 * Math.cos(TAU * t), 40, 1, "#fff6c0");
    return wrap(s);
}

// ========== 8) الحلقة السماوية (كواكب ومدارات) ==========
function cosmic(t) {
    let s = `<defs>${glowDefs}${grad("cg", [[0, "#c9b8ff"], [0.5, "#6a4cff"], [1, "#1a0e5a"]])}<radialGradient id="pl" cx=".35" cy=".35"><stop offset="0" stop-color="#fff"/><stop offset=".4" stop-color="#7ad8ff"/><stop offset="1" stop-color="#1a3a8a"/></radialGradient><radialGradient id="pl2" cx=".35" cy=".35"><stop offset="0" stop-color="#ffe7a8"/><stop offset=".5" stop-color="#ff9a4a"/><stop offset="1" stop-color="#7a2a0a"/></radialGradient></defs>`;
    s += `<rect width="400" height="400" fill="#0b0626" opacity=".55"/>`;
    for (let i = 0; i < 40; i++) s += `<circle cx="${f(rnd(i) * 400)}" cy="${f(rnd(i + 50) * 400)}" r="${f(0.6 + rnd(i + 9) * 1.2)}" fill="#fff" opacity="${f(0.4 + 0.5 * Math.sin(TAU * (t + rnd(i))))}"/>`;
    s += metalBorder("cg", 12, 7) + thinLine("#d8ccff", .9, 1.6, 4);
    // ثلاث حلقات مدارية مائلة
    const cx = 200, cy = 218;
    [[198, 150, -16, "#9a86ff"], [186, 120, 14, "#5ad8ff"], [214, 92, 0, "#ff9ad8"]].forEach(([rx, ry, a, c], i) => { s += `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="none" stroke="${c}" stroke-width="2.4" opacity=".75" transform="rotate(${a} ${cx} ${cy})" stroke-dasharray="${i ? "2 7" : "none"}"/>`; });
    // كواكب تدور
    const planet = (rx, ry, a, ph, r, g) => { const th = TAU * (t + ph), x = rx * Math.cos(th), y = ry * Math.sin(th), ar = a * Math.PI / 180; const X = cx + x * Math.cos(ar) - y * Math.sin(ar), Y = cy + x * Math.sin(ar) + y * Math.cos(ar); const front = Math.sin(th) > 0; return { z: front, svg: `<circle cx="${f(X)}" cy="${f(Y)}" r="${r}" fill="url(#${g})"/>` }; };
    const pls = [planet(198, 150, -16, 0, 14, "pl"), planet(186, 120, 14, 0.4, 10, "pl2"), planet(214, 92, 0, 0.7, 7, "pl")];
    s += pls.filter(p => !p.z).map(p => p.svg).join("");
    // هلال قمر وشمس
    s += `<g transform="translate(66 62)"><circle r="20" fill="#ffd66b"/><circle r="26" fill="none" stroke="#ffd66b" stroke-width="2" opacity=".6" stroke-dasharray="4 5" transform="rotate(${f(360 * t)})"/></g>`;
    s += `<g transform="translate(334 62)"><circle r="19" fill="#e0e8ff"/><circle cx="8" cy="-3" r="17" fill="#0b0626"/></g>`;
    s += pls.filter(p => p.z).map(p => p.svg).join("");
    for (let i = 0; i < 6; i++) s += star(20 + rnd(i + 20) * 360, 20 + rnd(i + 30) * 360, Math.max(0, Math.sin(TAU * (t + rnd(i)))) * 1.3, "#e8e0ff");
    return wrap(s);
}

// ========== 9) وردة الأشواك ==========
function rose(t) {
    let s = `<defs>${glowDefs}${grad("vg", [[0, "#6aff9a"], [0.5, "#1a8a4a"], [1, "#083a1e"]])}<radialGradient id="rp" cx=".5" cy=".5"><stop offset="0" stop-color="#ff9ab0"/><stop offset=".6" stop-color="#e01a4a"/><stop offset="1" stop-color="#6a0420"/></radialGradient></defs>`;
    s += `<ellipse cx="200" cy="205" rx="190" ry="175" fill="#ff3a6a" opacity=".10" filter="url(#g8)"/>`;
    s += metalBorder("vg", 10, 6);
    // كرمة متعرجة حول الإطار مع أشواك
    const vine = (off, w, c) => { let d = ""; const n = 40; for (let i = 0; i <= n; i++) { const a = (i / n) * TAU, rx = win.w / 2 + 20 + 7 * Math.sin(i * 1.3 + off + TAU * t), ry = win.h / 2 + 20 + 7 * Math.sin(i * 1.3 + off + TAU * t); const sq = (v) => Math.sign(v) * Math.pow(Math.abs(v), 0.55); const x = 200 + rx * sq(Math.cos(a)), y = 218 + ry * sq(Math.sin(a)); d += (i ? " L" : "M") + f(x) + " " + f(y); } return `<path d="${d} Z" fill="none" stroke="${c}" stroke-width="${w}" stroke-linejoin="round"/>`; };
    s += vine(0, 7, "url(#vg)") + vine(2.2, 4.5, "#2ab060");
    for (let i = 0; i < 20; i++) { const a = (i / 20) * TAU, sq = (v) => Math.sign(v) * Math.pow(Math.abs(v), 0.55); const x = 200 + (win.w / 2 + 20) * sq(Math.cos(a)), y = 218 + (win.h / 2 + 20) * sq(Math.sin(a)), ao = a * 180 / Math.PI; s += `<path d="M${f(x)} ${f(y)} l${f(10 * Math.cos(a))} ${f(10 * Math.sin(a))}" stroke="#d8ffe0" stroke-width="3" stroke-linecap="round"/>`; }
    // ورود: عدة ورود بأحجام مختلفة
    const bloom = (x, y, r, ph) => { let b = `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(8 * Math.sin(TAU * (t + ph)))})">`; for (let L = 0; L < 3; L++) for (let i = 0; i < 5; i++) { const a = (i / 5) * 360 + L * 36; b += `<ellipse cx="0" cy="${f(-r * (0.55 - L * 0.12))}" rx="${f(r * (0.5 - L * 0.1))}" ry="${f(r * (0.55 - L * 0.1))}" fill="url(#rp)" stroke="#5a0418" stroke-width="1" transform="rotate(${a})"/>`; } return b + `<circle r="${f(r * 0.2)}" fill="#ffd0dc"/></g>`; };
    s += bloom(win.x - 10, win.y - 8, 26, 0) + bloom(win.x + win.w + 10, win.y - 8, 26, 0.3) + bloom(200, win.y + win.h + 14, 32, 0.5) + bloom(win.x - 14, win.y + win.h - 40, 17, 0.7) + bloom(win.x + win.w + 14, win.y + 70, 17, 0.2) + bloom(200, win.y - 14, 20, 0.9);
    // أوراق
    s += [[win.x - 30, win.y + 80, -40], [win.x + win.w + 30, win.y + win.h - 70, 140], [118, win.y + win.h + 14, 100], [282, win.y + win.h + 14, 80]].map(([x, y, a]) => `<g transform="translate(${x} ${y}) rotate(${a})"><path d="M0 0 C10 -12 10 -28 0 -38 C-10 -28 -10 -12 0 0Z" fill="#1a9a54" stroke="#0a4a26" stroke-width="1.2"/></g>`).join("");
    // بتلات تتساقط
    for (let i = 0; i < 8; i++) { const k = (t + rnd(i)) % 1; s += `<ellipse cx="${f(20 + rnd(i + 4) * 360 + 14 * Math.sin(TAU * k + i))}" cy="${f(k * 400)}" rx="4" ry="2.4" fill="#ff5a82" opacity="${f(Math.sin(k * Math.PI) * 0.9)}" transform="rotate(${f(k * 300)} 200 ${f(k * 400)})"/>`; }
    return wrap(s);
}

// ========== 10) سايبر (تروس وسداسيات) ==========
function cyber(t) {
    let s = `<defs>${glowDefs}${grad("yg", [[0, "#9afcff"], [0.5, "#1ab8e8"], [1, "#05304a"]])}</defs>`;
    s += `<ellipse cx="200" cy="200" rx="190" ry="170" fill="#00e5ff" opacity=".10" filter="url(#g8)"/>`;
    // سداسيات متوهجة في الخلفية
    const hex = (x, y, r, c, w, op) => { let d = ""; for (let i = 0; i < 6; i++) { const [px, py] = pt(x, y, r, 60 * i + 30); d += (i ? " L" : "M") + f(px) + " " + f(py); } return `<path d="${d} Z" fill="none" stroke="${c}" stroke-width="${w}" opacity="${op}"/>`; };
    for (let i = 0; i < 12; i++) { const x = 30 + rnd(i) * 340, y = 30 + rnd(i + 7) * 340, ph = Math.sin(TAU * (t + rnd(i + 3))); s += hex(x, y, 16 + rnd(i + 2) * 12, "#2af0ff", 1.4, f(0.15 + 0.3 * Math.max(0, ph))); }
    s += metalBorder("yg", 12, 6);
    // ضلع مستطيل بزوايا مقطوعة (نيون)
    const cut = 22, x0 = win.x - 14, y0 = win.y - 14, x1 = win.x + win.w + 14, y1 = win.y + win.h + 14;
    s += `<path d="M${x0 + cut} ${y0} L${x1 - cut} ${y0} L${x1} ${y0 + cut} L${x1} ${y1 - cut} L${x1 - cut} ${y1} L${x0 + cut} ${y1} L${x0} ${y1 - cut} L${x0} ${y0 + cut}Z" fill="none" stroke="#2af0ff" stroke-width="3" filter="url(#g2)"/><path d="M${x0 + cut} ${y0} L${x1 - cut} ${y0} L${x1} ${y0 + cut} L${x1} ${y1 - cut} L${x1 - cut} ${y1} L${x0 + cut} ${y1} L${x0} ${y1 - cut} L${x0} ${y0 + cut}Z" fill="none" stroke="#e6ffff" stroke-width="1.2"/>`;
    // ترس يدور
    const gear = (x, y, r, teeth, ang, c) => { let d = ""; for (let i = 0; i < teeth; i++) { const a0 = ang + (i / teeth) * 360, a1 = a0 + 360 / teeth * 0.5; const p = [pt(x, y, r - 5, a0 - 4), pt(x, y, r + 5, a0), pt(x, y, r + 5, a1), pt(x, y, r - 5, a1 + 4)]; d += (i ? " L" : "M") + p.map(q => f(q[0]) + " " + f(q[1])).join(" L"); } return `<path d="${d} Z" fill="#0a2a3a" stroke="${c}" stroke-width="2"/><circle cx="${x}" cy="${y}" r="${r * 0.4}" fill="none" stroke="${c}" stroke-width="2"/><circle cx="${x}" cy="${y}" r="${r * 0.14}" fill="${c}"/>`; };
    s += gear(win.x - 14, win.y - 14, 30, 10, 360 * t, "#2af0ff") + gear(win.x + win.w + 14, win.y + win.h + 14, 30, 10, -360 * t, "#ff4ad8") + gear(win.x + win.w + 12, win.y - 12, 20, 8, -540 * t, "#ffe14a") + gear(win.x - 12, win.y + win.h + 12, 20, 8, 540 * t, "#7aff9a");
    // خطوط دارة ومسح ضوئي
    s += `<path d="M${win.x + 36} ${y0 - 10} h40 l10 -10 h30 M${win.x + win.w - 36} ${y1 + 10} h-40 l-10 10 h-30" fill="none" stroke="#2af0ff" stroke-width="2"/>`;
    const sy = win.y + (win.h) * ((t * 1) % 1);
    s += `<rect x="${win.x}" y="${f(sy - 3)}" width="${win.w}" height="6" fill="#2af0ff" opacity=".18"/><rect x="${win.x}" y="${f(sy - 0.6)}" width="${win.w}" height="1.2" fill="#c9ffff" opacity=".7"/>`;
    s += [[win.x + 70, y1 + 6], [win.x + 130, y1 + 6], [win.x + 190, y1 + 6]].map(([x, y], i) => `<rect x="${x}" y="${y}" width="40" height="5" rx="2" fill="${["#2af0ff", "#ff4ad8", "#ffe14a"][i]}" opacity="${f(0.5 + 0.5 * Math.sin(TAU * (t + i / 3)))}"/>`).join("");
    return wrap(s);
}

const FRAMES_DRAW = { angel, phoenix, dragon, thunder, ice, demon, royal, cosmic, rose, cyber };
const META = [
    ["angel", "جناح الملاك", "👼", 2e12],
    ["phoenix", "العنقاء", "🔥", 3e12],
    ["dragon", "التنين الزمردي", "🐉", 5e12],
    ["thunder", "قفص الصواعق", "⚡", 8e12],
    ["ice", "تاج الجليد", "❄️", 1.2e13],
    ["demon", "الشيطان", "😈", 2e13],
    ["royal", "التاج الملكي", "👑", 5e13],
    ["cosmic", "الحلقة السماوية", "🪐", 1e14],
    ["rose", "وردة الأشواك", "🌹", 2e14],
    ["cyber", "سايبر", "🤖", 5e14]
];
const EPIC = META.map(([id, name, e, price]) => ({ id: "ep_" + id, name: "إطار " + name, e, cat: "epic", price, ach: null, frames: 16, square: true, win: WIN, draw: FRAMES_DRAW[id] }));
module.exports = { FRAMES_DRAW, EPIC };
