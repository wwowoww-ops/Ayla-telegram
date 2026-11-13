// دفعة 1 (تتمة): إطارات العناصر (7) — كل عنصر بشكل مختلف جذريًا
const K = require("../kit");
const { f, rnd, TAU, win, cx, cy, L, R, T, Bt, mirror, at, pt, star, twinkle, glowDefs, grad, rgrad, GOLD, wrap, rr, body, ring, thin } = K;

function fireEl(t) {
    let s = `<defs>${glowDefs}${grad("a", [[0, "#ffee70"], [0.5, "#ff7a1a"], [1, "#b01808"]])}${grad("m", [[0, "#ff9a3a"], [1, "#5a0a02"]])}</defs>`;
    s += `<ellipse cx="200" cy="205" rx="195" ry="185" fill="#ff4a0a" opacity=".2" filter="url(#g8)"/>`;
    s += ring("m", "bevel", 6, 16);
    // شقوق الحمم على الحافة
    s += `<path d="M${L - 10} ${T + 40} l14 10 l-6 14 l12 8 M${R + 10} ${Bt - 60} l-14 -10 l6 -14 l-12 -8 M${L + 50} ${Bt + 10} l8 -10 l10 8" stroke="#ffd04a" stroke-width="3" fill="none" stroke-linecap="round" opacity="${f(0.7 + 0.3 * Math.sin(TAU * t))}"/>`;
    // ألسنة لهب كبيرة تنبعث حول كامل الإطار (أحجام مختلفة)
    const fl = (x, y, ang, len, w, ph) => { const l = len * (1 + 0.18 * Math.sin(TAU * (t * 2 + ph))); const sw = 6 * Math.sin(TAU * (t + ph)); return `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(ang + 90 + sw)})"><path d="M0 0 C${w} ${-l * .3} ${w * .3} ${-l * .6} 0 ${-l} C${-w * .3} ${-l * .6} ${-w} ${-l * .3} 0 0Z" fill="url(#a)"/><path d="M0 0 C${w * .5} ${-l * .25} ${w * .15} ${-l * .5} 0 ${-l * .62} C${-w * .15} ${-l * .5} ${-w * .5} ${-l * .25} 0 0Z" fill="#fff2a0" opacity=".85"/></g>`; };
    for (let i = 0; i < 9; i++) { const x = L + i * win.w / 8; s += fl(x, T - 6, -90 + (i - 4) * 6, 48 + 34 * Math.sin(Math.PI * i / 8) + 14 * rnd(i), 15, i * 0.13); }
    for (let i = 0; i < 6; i++) { const y = T + 20 + i * 46; s += fl(L - 6, y, 180 + (i % 2 ? 14 : -14), 36 + 16 * rnd(i + 3), 12, i * 0.17) + fl(R + 6, y + 14, 0 + (i % 2 ? -14 : 14), 36 + 16 * rnd(i + 8), 12, i * 0.21 + 0.5); }
    for (let i = 0; i < 6; i++) s += fl(L + 20 + i * 44, Bt + 6, 90 + (i - 2.5) * 10, 26 + 12 * rnd(i + 12), 11, i * 0.2);
    for (let i = 0; i < 14; i++) { const k = (t + rnd(i)) % 1; s += `<circle cx="${f(30 + rnd(i + 3) * 340)}" cy="${f(380 - k * 370)}" r="${f(1.4 + 2 * (1 - k))}" fill="#ffd04a" opacity="${f(Math.sin(k * Math.PI))}"/>`; }
    return wrap(s);
}

function waterEl(t) {
    let s = `<defs>${glowDefs}${grad("w", [[0, "#c8f4ff"], [0.5, "#2aa6e8"], [1, "#0a3a8a"]])}${grad("k", [[0, "#ffd9a0"], [1, "#ff6a3a"]])}</defs>`;
    s += `<ellipse cx="200" cy="210" rx="190" ry="175" fill="#3ab0ff" opacity=".16" filter="url(#g8)"/>`;
    // موجتان متحركتان أسفل الإطار وعلى الجانبين
    const wave = (y0, amp, col, ph, op) => { let d = `M${L - 40} ${y0}`; for (let x = L - 40; x <= R + 40; x += 10) d += ` L${x} ${f(y0 + amp * Math.sin((x / 28) + TAU * (t + ph)))}`; return `<path d="${d} L${R + 40} 400 L${L - 40} 400Z" fill="${col}" opacity="${op}"/>`; };
    s += wave(Bt - 6, 8, "#1a7ad0", 0, 0.9) + wave(Bt + 8, 7, "#3ab0ff", 0.4, 0.95) + wave(Bt + 20, 6, "#bff0ff", 0.7, 0.95);
    s += ring("w", "round", 6, 12) + thin("#e0faff", "round", 1, 2);
    // قطرة ماء كبيرة كتاج
    s += `<g transform="translate(${cx} ${T - 8})"><path d="M0 -62 C-12 -34 -30 -22 -30 -4 C-30 14 -16 20 0 20 C16 20 30 14 30 -4 C30 -22 12 -34 0 -62Z" fill="url(#w)" stroke="#e0faff" stroke-width="2.4"/><ellipse cx="-9" cy="-8" rx="5" ry="10" fill="#fff" opacity=".6" transform="rotate(20 -9 -8)"/></g>`;
    // سمكة كوي تسبح حول الإطار
    const a = TAU * t, kx = cx + (win.w / 2 + 28) * Math.cos(a), ky = cy + (win.h / 2 + 28) * Math.sin(a), ka = a * 180 / Math.PI + 90;
    s += `<g transform="translate(${f(kx)} ${f(ky)}) rotate(${f(ka)})"><path d="M0 -14 C10 -8 10 8 0 14 C-10 8 -10 -8 0 -14Z" fill="url(#k)" stroke="#fff" stroke-width="1.2"/><path d="M0 14 L-8 26 L0 22 L8 26Z" fill="#ff8a4a"/><circle cx="-3" cy="-6" r="1.6" fill="#111"/><circle cx="3" cy="-6" r="1.6" fill="#111"/></g>`;
    // فقاعات صاعدة
    for (let i = 0; i < 10; i++) { const k = (t + rnd(i)) % 1; s += `<circle cx="${f(24 + rnd(i + 2) * 352 + 6 * Math.sin(TAU * k * 2 + i))}" cy="${f(390 - k * 380)}" r="${f(2 + 4 * rnd(i + 9))}" fill="none" stroke="#e0faff" stroke-width="1.6" opacity="${f(0.8 * Math.sin(k * Math.PI))}"/>`; }
    return wrap(s);
}

function plantEl(t) {
    let s = `<defs>${glowDefs}${grad("p", [[0, "#9aff8a"], [0.5, "#2a9a3a"], [1, "#0a3a1a"]])}${rgrad("f", [[0, "#fff6a0"], [0.5, "#ff9ac8"], [1, "#d63a8a"]])}</defs>`;
    s += `<ellipse cx="200" cy="210" rx="190" ry="175" fill="#4aff6a" opacity=".12" filter="url(#g8)"/>`;
    s += ring("p", "arch", 6, 12);
    // جذوع ملتفة وأوراق كبيرة بالتناوب على الجانبين
    const leaf = (x, y, ang, sc, c) => `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(ang + 4 * Math.sin(TAU * t + x))}) scale(${sc})"><path d="M0 0 C16 -10 22 -34 0 -52 C-22 -34 -16 -10 0 0Z" fill="${c}" stroke="#0a3a1a" stroke-width="1.6"/><path d="M0 -4 L0 -44" stroke="#bfffb0" stroke-width="1.6"/></g>`;
    for (let i = 0; i < 6; i++) { const y = T + 12 + i * 48; s += leaf(L - 8, y, -60 - (i % 2) * 40, 0.75 + 0.2 * (i % 3) / 2, i % 2 ? "#2aa84a" : "#4acb5a") + leaf(R + 8, y + 22, 60 + (i % 2) * 40, 0.75 + 0.2 * ((i + 1) % 3) / 2, i % 2 ? "#4acb5a" : "#2aa84a"); }
    // زهور مختلفة الأحجام
    const flower = (x, y, r, n) => { let b = `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(10 * Math.sin(TAU * t + x))})">`; for (let i = 0; i < n; i++) b += `<ellipse cy="${-r * 0.62}" rx="${r * 0.34}" ry="${r * 0.55}" fill="url(#f)" stroke="#8a1a58" stroke-width="1" transform="rotate(${i * 360 / n})"/>`; return b + `<circle r="${r * 0.22}" fill="#ffe14a" stroke="#b8861a" stroke-width="1"/></g>`; };
    s += flower(cx, T - 14, 24, 7) + flower(L - 8, T - 4, 17, 6) + flower(R + 8, T - 4, 17, 6) + flower(L + 6, Bt + 6, 15, 5) + flower(R - 6, Bt + 8, 15, 5) + flower(cx, Bt + 10, 19, 6);
    // فراشة
    const bx = 60 + 280 * (0.5 + 0.5 * Math.sin(TAU * t)), by = 40 + 20 * Math.sin(TAU * t * 2), fl = 0.4 + 0.6 * Math.abs(Math.sin(TAU * t * 6));
    s += `<g transform="translate(${f(bx)} ${f(by)})"><ellipse cx="-7" rx="${f(8 * fl)}" ry="7" fill="#ffb347"/><ellipse cx="7" rx="${f(8 * fl)}" ry="7" fill="#ff7aa8"/><rect x="-1" y="-6" width="2" height="12" fill="#3a2a1a"/></g>`;
    return wrap(s);
}

function earthEl(t) {
    let s = `<defs>${glowDefs}${grad("s", [[0, "#cdb89a"], [0.5, "#8a7254"], [1, "#3a2c1c"]])}${grad("c", [[0, "#d8ffe6"], [1, "#2ac08a"]], 1, 1)}</defs>`;
    s += `<ellipse cx="200" cy="212" rx="188" ry="172" fill="#a08a5a" opacity=".16" filter="url(#g8)"/>`;
    // كتل صخرية غير منتظمة (كل كتلة بزوايا مختلفة)
    const rock = (x, y, w, h, sk, fill) => `<path d="M${x} ${y + h * .2} L${x + w * .2} ${y} L${x + w * .8 + sk} ${y + h * .08} L${x + w} ${y + h * .55} L${x + w * .75} ${y + h} L${x + w * .15} ${y + h * .92}Z" fill="${fill}" stroke="#2a1e10" stroke-width="2.2" stroke-linejoin="round"/><path d="M${x + w * .2} ${y} L${x + w * .5} ${y + h * .4} L${x + w * .8 + sk} ${y + h * .08}" fill="none" stroke="#fff" stroke-opacity=".25" stroke-width="2"/>`;
    for (let i = 0; i < 5; i++) { s += rock(L - 18 + i * 62, T - 28 - 6 * rnd(i), 58, 34 + 8 * rnd(i + 4), rnd(i + 9) * 8, i % 2 ? "url(#s)" : "#a08a68"); s += rock(L - 18 + i * 62, Bt - 4 + 6 * rnd(i + 14), 58, 32 + 8 * rnd(i + 17), rnd(i + 19) * 8, i % 2 ? "#a08a68" : "url(#s)"); }
    for (let i = 0; i < 4; i++) { s += rock(L - 36, T + 4 + i * 62, 34, 62, 4, i % 2 ? "#a08a68" : "url(#s)") + rock(R + 2, T + 4 + i * 62, 34, 62, 4, i % 2 ? "url(#s)" : "#a08a68"); }
    s += thin("#e6d8bc", "round", 2, 1.6);
    // بلورات خضراء تنمو بين الصخور
    const cr = (x, y, a, h, w) => `<g transform="translate(${x} ${y}) rotate(${a})"><path d="M0 0 L${w} ${-h * .4} L${w * .4} ${-h} L${-w * .4} ${-h * .9} L${-w} ${-h * .4}Z" fill="url(#c)" stroke="#e8fff4" stroke-width="1.4"/></g>`;
    s += cr(L + 8, T - 22, -20, 44, 9) + cr(R - 8, T - 22, 20, 44, 9) + cr(cx, T - 26, 0, 58, 12) + cr(L - 18, Bt - 10, -60, 30, 8) + cr(R + 18, Bt - 10, 60, 30, 8);
    // غبار يتساقط
    for (let i = 0; i < 10; i++) { const k = (t + rnd(i)) % 1; s += `<rect x="${f(30 + rnd(i + 5) * 340)}" y="${f(k * 400)}" width="3" height="3" fill="#d8c4a0" opacity="${f(0.7 * Math.sin(k * Math.PI))}" transform="rotate(${f(k * 200)} 200 ${f(k * 400)})"/>`; }
    return wrap(s);
}

function thunderEl(t) {
    let s = `<defs>${glowDefs}${grad("y", [[0, "#fffbd0"], [0.5, "#ffd22a"], [1, "#a8741a"]])}</defs>`;
    s += `<ellipse cx="200" cy="205" rx="190" ry="180" fill="#ffe14a" opacity=".15" filter="url(#g8)"/>`;
    // حلقة كهربائية مزدوجة متعرجة (طاقة)
    const arc = (pad, amp, ph, w, c, op) => { let d = ""; const n = 70; for (let i = 0; i <= n; i++) { const a = (i / n) * TAU; const sq = v => Math.sign(v) * Math.pow(Math.abs(v), 0.5); const jag = amp * (rnd(i + ph * 13) - 0.5) * 2; const x = cx + (win.w / 2 + pad + jag) * sq(Math.cos(a)), y = cy + (win.h / 2 + pad + jag) * sq(Math.sin(a)); d += (i ? " L" : "M") + f(x) + " " + f(y); } return `<path d="${d} Z" fill="none" stroke="${c}" stroke-width="${w}" opacity="${op}" stroke-linejoin="round"/>`; };
    const ph = Math.floor(t * 10);
    s += arc(14, 6, ph, 8, "#ffd22a", 0.35) + arc(14, 6, ph, 3, "#fff7a8", 1) + arc(24, 9, ph + 3, 2, "#ffe14a", 0.8);
    s += ring("y", "bevel", 5, 9);
    // صواعق ضخمة على الأركان الأربعة بزوايا مختلفة
    const bolt = (x, y, a, sc) => `<g transform="translate(${x} ${y}) rotate(${a}) scale(${sc})"><path d="M0 -50 L-16 4 L-2 4 L-12 50 L22 -10 L6 -10 L18 -50Z" fill="url(#y)" stroke="#fff" stroke-width="2.4" stroke-linejoin="round"/></g>`;
    s += bolt(L - 8, T - 6, -25, 0.8) + bolt(R + 8, T - 6, 25, 0.8) + bolt(L - 4, Bt + 6, 200, 0.7) + bolt(R + 4, Bt + 6, 160, 0.7);
    // وميض شاشة
    s += `<rect width="400" height="400" fill="#fffbd0" opacity="${f(Math.max(0, Math.sin(TAU * t * 2) - 0.9) * 1.2)}"/>`;
    // كرات طاقة تدور
    for (let i = 0; i < 4; i++) { const a = TAU * (t + i / 4), x = cx + (win.w / 2 + 34) * Math.cos(a), y = cy + (win.h / 2 + 34) * Math.sin(a); s += `<circle cx="${f(x)}" cy="${f(y)}" r="9" fill="#ffe14a" opacity=".3" filter="url(#g)"/><circle cx="${f(x)}" cy="${f(y)}" r="4" fill="#fff"/>`; }
    return wrap(s);
}

function lightEl(t) {
    let s = `<defs>${glowDefs}${grad("gl", GOLD)}${rgrad("sun", [[0, "#ffffff"], [0.5, "#fff0a0"], [1, "#ffcf3a"]])}</defs>`;
    s += `<ellipse cx="200" cy="205" rx="195" ry="185" fill="#fff6b0" opacity=".22" filter="url(#g8)"/>`;
    // أشعة شمس طويلة تدور ببطء خلف الإطار
    let rays = "";
    for (let i = 0; i < 24; i++) { const a = (i / 24) * TAU + TAU * t * 0.2, len = i % 2 ? 150 : 190; const [x1, y1] = pt(cx, cy, 120, a * 180 / Math.PI), [x2, y2] = pt(cx, cy, len + 80, a * 180 / Math.PI), [nx, ny] = [-Math.sin(a) * 7, Math.cos(a) * 7]; rays += `<path d="M${f(x1 + nx)} ${f(y1 + ny)} L${f(x2)} ${f(y2)} L${f(x1 - nx)} ${f(y1 - ny)}Z" fill="#fff3a0" opacity="${i % 2 ? 0.45 : 0.75}"/>`; }
    s += rays + ring("gl", "round", 7, 14) + thin("#fff", "round", 1, 2);
    // نجمة رباعية كبيرة في الأعلى مع هالة
    s += `<ellipse cx="${cx}" cy="${T - 26}" rx="54" ry="12" fill="none" stroke="#fff3a0" stroke-width="7" filter="url(#g)"/><ellipse cx="${cx}" cy="${T - 26}" rx="54" ry="12" fill="none" stroke="url(#gl)" stroke-width="4"/>`;
    s += star(cx, T - 58, 3.2 + 0.4 * Math.sin(TAU * t), "#fff");
    // جناحان صغيران ذهبيان
    s += mirror(`<path d="M${L - 4} ${cy - 30} C${L - 50} ${cy - 62} ${L - 66} ${cy - 20} ${L - 34} ${cy + 2} C${L - 56} ${cy + 6} ${L - 40} ${cy + 40} ${L - 4} ${cy + 30}Z" fill="#fff8d0" stroke="url(#gl)" stroke-width="2.4"/>`);
    s += twinkle(t, 10, "#fff", 31, 175);
    return wrap(s);
}

function darkEl(t) {
    let s = `<defs>${glowDefs}${grad("d", [[0, "#b07aff"], [0.5, "#4a1a8a"], [1, "#0e0420"]])}</defs>`;
    s += `<rect width="400" height="400" fill="#07020f" opacity=".5"/>`;
    s += `<ellipse cx="200" cy="205" rx="190" ry="180" fill="#8a2aff" opacity=".18" filter="url(#g8)"/>`;
    // مجسّات ظلام تلتف من الأركان
    const tent = (x, y, dirx, diry, ph) => { let d = `M${x} ${y}`, px = x, py = y; const n = 8; for (let i = 1; i <= n; i++) { const k = i / n, w = 10 * Math.sin(TAU * (t + ph) + i * .8); px += dirx * 11 + w * -diry * 0.5; py += diry * 11 + w * dirx * 0.5; d += ` L${f(px)} ${f(py)}`; } return `<path d="${d}" fill="none" stroke="url(#d)" stroke-width="9" stroke-linecap="round"/><path d="${d}" fill="none" stroke="#c9a0ff" stroke-width="1.6" stroke-linecap="round" opacity=".7" stroke-dasharray="1 8"/>`; };
    s += tent(L - 6, T - 6, -0.7, -0.7, 0) + tent(R + 6, T - 6, 0.7, -0.7, 0.3) + tent(L - 6, Bt + 6, -0.7, 0.7, 0.6) + tent(R + 6, Bt + 6, 0.7, 0.7, 0.9) + tent(L - 8, cy, -1, 0.15, 0.2) + tent(R + 8, cy, 1, 0.15, 0.5);
    s += ring("d", "oct", 6, 12) + thin("#d8b8ff", "oct", 0, 1.8);
    // عين كبيرة في الأعلى تتحرك
    const lk = 4 * Math.sin(TAU * t);
    s += `<g transform="translate(${cx} ${T - 14})"><path d="M-44 0 Q0 -40 44 0 Q0 40 -44 0Z" fill="#14041f" stroke="url(#d)" stroke-width="5"/><circle cx="${f(lk)}" cy="0" r="14" fill="#b04aff"/><ellipse cx="${f(lk)}" cy="0" rx="4" ry="12" fill="#07020f"/><circle cx="${f(lk - 4)}" cy="-5" r="3" fill="#fff"/></g>`;
    // هلال بنفسجي ونجوم ملعونة
    s += `<g transform="translate(${R + 4} ${T - 40})"><circle r="16" fill="#cfa6ff"/><circle cx="7" cy="-3" r="14" fill="#07020f"/></g>`;
    for (let i = 0; i < 12; i++) { const k = (t + rnd(i)) % 1; s += `<circle cx="${f(24 + rnd(i + 3) * 352)}" cy="${f(k * 400)}" r="${f(1 + 1.8 * rnd(i + 1))}" fill="#c9a0ff" opacity="${f(0.8 * Math.sin(k * Math.PI))}"/>`; }
    return wrap(s);
}

module.exports = { fire: fireEl, water: waterEl, plant: plantEl, earth: earthEl, thunder: thunderEl, light: lightEl, dark: darkEl };
