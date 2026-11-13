// دفعة 1: إطارات الحيوانات (10) — كل حيوان بهيكل مميز (آذان، أعراف، أذيال، قرون...)
const K = require("./framesKit");
const { f, rnd, TAU, win, cx, cy, L, R, T, Bt, mirror, at, pt, star, twinkle, glowDefs, grad, rgrad, GOLD, wrap, rr, ring, thin, heart, paw } = K;

function cat(t) {
    let s = `<defs>${glowDefs}${grad("c1", [[0, "#ffe0ef"], [1, "#e8749e"]])}${grad("c2", [[0, "#ffd0e4"], [1, "#b83a72"]])}</defs>`;
    s += `<ellipse cx="200" cy="215" rx="185" ry="170" fill="#ff8fc0" opacity=".14" filter="url(#g8)"/>`;
    // طرف الذيل المتموّج يلتف حول الجانب الأيمن
    const wag = 6 * Math.sin(TAU * t);
    s += `<path d="M${R + 6} ${Bt - 20} C${R + 52} ${Bt - 10} ${R + 58} ${Bt - 90 + wag} ${R + 28} ${Bt - 130 + wag} C${R + 14} ${Bt - 150 + wag} ${R + 30} ${Bt - 176} ${R + 44} ${Bt - 170 + wag}" fill="none" stroke="#f7e2ec" stroke-width="15" stroke-linecap="round"/><path d="M${R + 6} ${Bt - 20} C${R + 52} ${Bt - 10} ${R + 58} ${Bt - 90 + wag} ${R + 28} ${Bt - 130 + wag} C${R + 14} ${Bt - 150 + wag} ${R + 30} ${Bt - 176} ${R + 44} ${Bt - 170 + wag}" fill="none" stroke="#e8749e" stroke-width="6" stroke-linecap="round" stroke-dasharray="2 12"/>`;
    s += ring("c1", "round", 8, 15) + thin("#fff", "round", 1, 2);
    // أذنا القطة
    const ear = `<path d="M${L - 4} ${T + 36} L${L - 8} ${T - 46} L${L + 58} ${T - 6}Z" fill="url(#c2)" stroke="#fff" stroke-width="2.4" stroke-linejoin="round"/><path d="M${L + 4} ${T + 18} L${L + 2} ${T - 26} L${L + 36} ${T - 4}Z" fill="#ffc6dd"/>`;
    s += mirror(ear);
    // شوارب
    [[-16, 0], [0, 12], [16, 24]].forEach(([dy, ang], i) => { s += `<path d="M${L - 8} ${cy + 20 + dy} q-34 ${-6 + ang / 4} -54 ${ang / 2}" stroke="#fff" stroke-width="2.4" fill="none" stroke-linecap="round"/><path d="M${R + 8} ${cy + 20 + dy} q34 ${-6 + ang / 4} 54 ${ang / 2}" stroke="#fff" stroke-width="2.4" fill="none" stroke-linecap="round"/>`; });
    // جرس وشريط
    s += `<path d="M${cx - 44} ${Bt + 10} Q${cx} ${Bt + 28} ${cx + 44} ${Bt + 10}" fill="none" stroke="#e03a74" stroke-width="7" stroke-linecap="round"/><circle cx="${cx}" cy="${Bt + 28}" r="11" fill="url(#c2)" stroke="#ffe27a" stroke-width="3"/><path d="M${cx - 6} ${Bt + 28} h12" stroke="#ffe27a" stroke-width="2"/>`;
    // آثار مخالب
    s += paw(L + 20, Bt + 34, 0.9, "#fff", 0.7 + 0.3 * Math.sin(TAU * t)) + paw(R - 34, T - 30, 0.8, "#fff", 0.7 + 0.3 * Math.cos(TAU * t));
    s += twinkle(t, 5, "#fff", 3);
    return wrap(s);
}

function bunny(t) {
    let s = `<defs>${glowDefs}${grad("b1", [[0, "#ffffff"], [1, "#f3d2ea"]])}${grad("b2", [[0, "#ffd9ec"], [1, "#ff9ac8"]])}</defs>`;
    s += `<ellipse cx="200" cy="210" rx="185" ry="170" fill="#ffc6e6" opacity=".18" filter="url(#g8)"/>`;
    const sw = 4 * Math.sin(TAU * t);
    // أذنان طويلتان جدًا
    const ear = (sg) => { const x = cx + sg * 52; return `<g transform="rotate(${f(sg * (10 + sw / 2))} ${x} ${T - 4})"><path d="M${x - 24} ${T + 2} C${x - 44} ${T - 60} ${x - 30} ${T - 120} ${x} ${T - 118} C${x + 30} ${T - 120} ${x + 44} ${T - 60} ${x + 24} ${T + 2}Z" fill="url(#b1)" stroke="#e8a6cf" stroke-width="2.6"/><path d="M${x - 11} ${T - 4} C${x - 22} ${T - 50} ${x - 14} ${T - 92} ${x} ${T - 92} C${x + 14} ${T - 92} ${x + 22} ${T - 50} ${x + 11} ${T - 4}Z" fill="url(#b2)"/></g>`; };
    s += ear(-1) + ear(1);
    // جسم سحابة منتفخ
    s += `<path d="M${L - 12} ${T + 20} ${Array.from({ length: 6 }, (_, i) => `a18 18 0 0 1 ${i === 5 ? 0 : 0} 0`).join("")}" fill="none"/>`;
    for (let i = 0; i < 9; i++) { const x = L - 10 + i * (win.w + 20) / 8; s += `<circle cx="${f(x)}" cy="${T - 6}" r="15" fill="#fff"/><circle cx="${f(x)}" cy="${Bt + 6}" r="15" fill="#fff"/>`; }
    for (let i = 0; i < 9; i++) { const y = T - 6 + i * (win.h + 12) / 8; s += `<circle cx="${L - 6}" cy="${f(y)}" r="15" fill="#fff"/><circle cx="${R + 6}" cy="${f(y)}" r="15" fill="#fff"/>`; }
    s += ring("b2", "round", 6, 10) + thin("#fff", "round", 1, 2);
    // جزرة سفلية
    s += `<g transform="translate(${cx} ${Bt + 26}) rotate(${f(8 * Math.sin(TAU * t))})"><path d="M-12 -6 L12 -6 L0 26Z" fill="#ff9a3c" stroke="#d2661a" stroke-width="2"/><path d="M-4 -6 L-8 -22 M0 -6 L0 -26 M4 -6 L8 -22" stroke="#4cc766" stroke-width="4" stroke-linecap="round"/></g>`;
    s += heart(L - 10, T + 70, 1.2, "#ff6fa8") + heart(R + 10, T + 130, 1.1, "#ff8fbc") + heart(L - 6, Bt - 50, 0.9, "#ffb3d4");
    s += twinkle(t, 6, "#fff", 5);
    return wrap(s);
}

function fox(t) {
    let s = `<defs>${glowDefs}${grad("f1", [[0, "#ffb866"], [1, "#e0561a"]])}${grad("f2", [[0, "#fff4e2"], [1, "#ffd6a0"]])}</defs>`;
    s += `<ellipse cx="200" cy="215" rx="190" ry="170" fill="#ff7a2a" opacity=".16" filter="url(#g8)"/>`;
    // ذيل ثعلب ضخم يلف أسفل الإطار
    const sw = 5 * Math.sin(TAU * t);
    s += `<path d="M${L - 4} ${Bt - 10} C${L - 70} ${Bt + 14} ${L - 40} ${Bt + 64} ${L + 40} ${Bt + 50 + sw} C${cx - 10} ${Bt + 44} ${cx + 70} ${Bt + 70} ${R - 10} ${Bt + 30} C${R + 20} ${Bt + 8} ${R + 34} ${Bt - 20} ${R + 14} ${Bt - 28} C${R + 10} ${Bt + 4} ${R - 20} ${Bt + 10} ${R - 40} ${Bt + 12}Z" fill="url(#f1)" stroke="#8a2a08" stroke-width="2.4"/>`;
    s += `<path d="M${R - 6} ${Bt + 22} C${R + 14} ${Bt + 10} ${R + 22} ${Bt - 6} ${R + 14} ${Bt - 28} C${R + 40} ${Bt - 6} ${R + 30} ${Bt + 30} ${R - 10} ${Bt + 36}Z" fill="url(#f2)"/>`;
    s += ring("f1", "bevel", 7, 14) + thin("#fff2d8", "bevel", 1, 2);
    // أذنان مثلثتان كبيرتان بأطراف داكنة
    const ear = `<path d="M${L - 2} ${T + 30} L${L + 6} ${T - 64} L${L + 70} ${T - 4}Z" fill="url(#f1)" stroke="#8a2a08" stroke-width="2.4" stroke-linejoin="round"/><path d="M${L + 6} ${T - 64} L${L + 14} ${T - 34} L${L + 32} ${T - 44}Z" fill="#2a1208"/><path d="M${L + 10} ${T + 8} L${L + 12} ${T - 30} L${L + 44} ${T - 2}Z" fill="#fff0dc"/>`;
    s += mirror(ear);
    // علامات الخدين
    s += `<path d="M${L - 8} ${cy - 10} l-26 8 l26 8 M${L - 8} ${cy + 22} l-26 8 l26 8" fill="#fff2d8" stroke="#fff2d8" stroke-width="2"/><path d="M${R + 8} ${cy - 10} l26 8 l-26 8 M${R + 8} ${cy + 22} l26 8 l-26 8" fill="#fff2d8" stroke="#fff2d8" stroke-width="2"/>`;
    // ورقة خريف تسقط
    for (let i = 0; i < 4; i++) { const k = (t + i / 4) % 1; s += `<path transform="translate(${f(30 + i * 100 + 20 * Math.sin(TAU * k))} ${f(k * 380)}) rotate(${f(k * 400)})" d="M0 -8 C8 -6 8 4 0 9 C-8 4 -8 -6 0 -8Z" fill="#ff8a2a" opacity="${f(Math.sin(k * Math.PI))}"/>`; }
    return wrap(s);
}

function wolf(t) {
    let s = `<defs>${glowDefs}${grad("w1", [[0, "#e9eef8"], [0.5, "#8b97b5"], [1, "#2c3550"]])}${grad("w2", [[0, "#cfe4ff"], [1, "#4a6aa8"]])}</defs>`;
    s += `<rect width="400" height="400" fill="#0a1024" opacity=".5"/>`;
    s += `<circle cx="${cx}" cy="64" r="38" fill="#f4f1d8" opacity=".95"/><circle cx="${cx + 12}" cy="58" r="8" fill="#d8d5b4"/><circle cx="${cx - 12}" cy="72" r="5" fill="#d8d5b4"/><circle cx="${cx}" cy="64" r="52" fill="#f4f1d8" opacity="${f(0.16 + 0.08 * Math.sin(TAU * t))}" filter="url(#g)"/>`;
    // حواف فرو مسننة
    let fur = "";
    for (let i = 0; i < 13; i++) { const x = L - 6 + i * (win.w + 12) / 12, h = 14 + 10 * rnd(i); fur += `<path d="M${f(x - 9)} ${T - 6} L${f(x)} ${f(T - 6 - h)} L${f(x + 9)} ${T - 6}Z" fill="url(#w1)"/>`; fur += `<path d="M${f(x - 9)} ${Bt + 6} L${f(x)} ${f(Bt + 6 + h)} L${f(x + 9)} ${Bt + 6}Z" fill="url(#w1)"/>`; }
    for (let i = 0; i < 12; i++) { const y = T + i * win.h / 11, h = 14 + 10 * rnd(i + 20); fur += `<path d="M${L - 6} ${f(y - 9)} L${f(L - 6 - h)} ${f(y)} L${L - 6} ${f(y + 9)}Z" fill="url(#w1)"/><path d="M${R + 6} ${f(y - 9)} L${f(R + 6 + h)} ${f(y)} L${R + 6} ${f(y + 9)}Z" fill="url(#w1)"/>`; }
    s += fur + ring("w1", "round", 7, 13) + thin("#cfe4ff", "round", 1, 2);
    // أذنا الذئب الطويلتان
    const ear = `<path d="M${L + 4} ${T} L${L - 6} ${T - 74} L${L + 56} ${T - 14}Z" fill="url(#w1)" stroke="#e9eef8" stroke-width="2.2" stroke-linejoin="round"/><path d="M${L + 8} ${T - 8} L${L + 2} ${T - 48} L${L + 36} ${T - 14}Z" fill="#6a7aa5"/>`;
    s += mirror(ear);
    // عينان متوهجتان صفراء أسفل
    const gl = 0.6 + 0.4 * Math.sin(TAU * t);
    s += `<path d="M${cx - 62} ${Bt + 20} l30 -8 l-6 14Z M${cx + 62} ${Bt + 20} l-30 -8 l6 14Z" fill="#ffe14a" opacity="${f(0.7 + 0.3 * gl)}"/><circle cx="${cx - 44}" cy="${Bt + 20}" r="14" fill="#ffe14a" opacity="${f(0.2 * gl)}" filter="url(#g)"/><circle cx="${cx + 44}" cy="${Bt + 20}" r="14" fill="#ffe14a" opacity="${f(0.2 * gl)}" filter="url(#g)"/>`;
    // آثار مخالب
    s += `<g stroke="#ff4a5a" stroke-width="4" stroke-linecap="round" opacity=".85"><path d="M${R - 40} ${T + 30} l22 60"/><path d="M${R - 26} ${T + 26} l22 60"/><path d="M${R - 12} ${T + 22} l22 60"/></g>`;
    s += twinkle(t, 8, "#cfe4ff", 11, 180);
    return wrap(s);
}

function lion(t) {
    let s = `<defs>${glowDefs}${grad("l1", [[0, "#ffe08a"], [0.5, "#e8982a"], [1, "#7a3a08"]])}${grad("l2", [[0, "#ffd04a"], [1, "#b8601a"]])}</defs>`;
    s += `<ellipse cx="200" cy="210" rx="195" ry="185" fill="#ffb02a" opacity=".2" filter="url(#g8)"/>`;
    // عُرف الأسد: مثلثات إشعاعية في ثلاث طبقات حول كل الإطار
    const mane = (rx, ry, n, len, w, fill, ph) => { let m = ""; for (let i = 0; i < n; i++) { const a = (i / n) * TAU + ph, c = Math.cos(a), sn = Math.sin(a); const sq = v => Math.sign(v) * Math.pow(Math.abs(v), 0.6); const bx = cx + rx * sq(c), by = cy + ry * sq(sn); const tx = bx + len * c * (1 + 0.3 * Math.sin(TAU * t + i)) , ty = by + len * sn * (1 + 0.3 * Math.sin(TAU * t + i)); const nx = -sn * w, ny = c * w; m += `<path d="M${f(bx + nx)} ${f(by + ny)} L${f(tx)} ${f(ty)} L${f(bx - nx)} ${f(by - ny)}Z" fill="${fill}"/>`; } return m; };
    s += mane(win.w / 2 + 16, win.h / 2 + 16, 36, 44, 13, "#a8541a", 0.05) + mane(win.w / 2 + 14, win.h / 2 + 14, 36, 36, 12, "url(#l2)", 0.1);
    s += ring("l1", "round", 8, 13) + thin("#fff0b0", "round", 1, 2);
    // تاج صغير
    s += `<g transform="translate(${cx} ${T - 14})"><path d="M-30 6 L-34 -18 L-16 -6 L0 -24 L16 -6 L34 -18 L30 6Z" fill="url(#l1)" stroke="#5a2a08" stroke-width="2"/><circle cx="0" cy="-24" r="4" fill="#ff4a4a"/></g>`;
    s += twinkle(t, 6, "#fff2b0", 7);
    return wrap(s);
}

function bear(t) {
    let s = `<defs>${glowDefs}${grad("r1", [[0, "#d9a066"], [1, "#7a4a22"]])}${grad("r2", [[0, "#ffe27a"], [1, "#e0951a"]])}</defs>`;
    s += `<ellipse cx="200" cy="212" rx="185" ry="170" fill="#c88a4a" opacity=".16" filter="url(#g8)"/>`;
    // خلية نحل سداسية على الإطار
    const hex = (x, y, r, fill, st) => { let d = ""; for (let i = 0; i < 6; i++) { const [px, py] = pt(x, y, r, 60 * i + 30); d += (i ? " L" : "M") + f(px) + " " + f(py); } return `<path d="${d}Z" fill="${fill}" stroke="${st}" stroke-width="2"/>`; };
    for (let i = 0; i < 7; i++) { s += hex(L - 4 + i * (win.w + 8) / 6, T - 10, 15, i % 2 ? "url(#r2)" : "#f6b834", "#8a4a0a") + hex(L - 4 + i * (win.w + 8) / 6, Bt + 10, 15, i % 2 ? "#f6b834" : "url(#r2)", "#8a4a0a"); }
    for (let i = 0; i < 6; i++) { const y = T + 8 + i * (win.h - 16) / 5; s += hex(L - 10, y, 14, i % 2 ? "#f6b834" : "url(#r2)", "#8a4a0a") + hex(R + 10, y, 14, i % 2 ? "url(#r2)" : "#f6b834", "#8a4a0a"); }
    s += ring("r1", "round", 5, 8);
    // أذنان مستديرتان
    const ear = `<circle cx="${L + 6}" cy="${T - 6}" r="34" fill="url(#r1)" stroke="#4a2808" stroke-width="2.6"/><circle cx="${L + 6}" cy="${T - 6}" r="18" fill="#f0c89a"/>`;
    s += mirror(ear);
    // نحلة تطير
    const bx = 60 + 280 * ((t * 1) % 1), by = 372 + 8 * Math.sin(TAU * t * 3);
    s += `<g transform="translate(${f(bx)} ${f(by)})"><ellipse rx="9" ry="6.5" fill="#ffd04a" stroke="#222" stroke-width="1.4"/><path d="M-3 -6 v12 M2 -6 v12" stroke="#222" stroke-width="2.4"/><ellipse cx="-3" cy="-9" rx="6" ry="3.4" fill="#cfeaff" opacity=".9" transform="rotate(${f(30 * Math.sin(TAU * t * 8))})"/></g>`;
    // قطرات عسل
    [[L + 30, Bt + 24], [cx, Bt + 28], [R - 30, Bt + 24]].forEach(([x, y], i) => { s += `<path d="M${x} ${y} q-7 12 0 18 q7 -6 0 -18Z" fill="#ffc21a" opacity="${f(0.7 + 0.3 * Math.sin(TAU * (t + i / 3)))}"/>`; });
    s += paw(R - 28, T - 36, 0.9, "#7a4a22");
    return wrap(s);
}

function owl(t) {
    let s = `<defs>${glowDefs}${grad("o1", [[0, "#c8a678"], [1, "#5a3a1a"]])}${grad("o2", [[0, "#fff4c8"], [1, "#e8b22a"]])}</defs>`;
    s += `<rect width="400" height="400" fill="#120a24" opacity=".35"/>`;
    s += `<circle cx="338" cy="58" r="26" fill="#fff6d0"/><circle cx="348" cy="52" r="22" fill="#120a24"/>`;
    // صفوف ريش على الجانبين
    const wing = () => { let w = ""; for (let r = 0; r < 4; r++) for (let i = 0; i < 6; i++) { const y = T + 10 + i * 40 + r * 4, x = L - 10 - r * 11; w += `<path d="M${x} ${y} Q${x - 22} ${y + 6} ${x - 10} ${y + 30} Q${x + 2} ${y + 20} ${x} ${y}Z" fill="${r % 2 ? "#8a6a3a" : "url(#o1)"}" stroke="#3a2208" stroke-width="1"/>`; } return w; };
    s += mirror(wing());
    s += ring("o1", "arch", 6, 14) + thin("#ffe9a8", "arch", 0, 2);
    // العينان الكبيرتان فوق الإطار
    const blink = Math.sin(TAU * t) > 0.97 ? 0.15 : 1;
    const eye = x => `<circle cx="${x}" cy="${T - 26}" r="30" fill="url(#o1)" stroke="#3a2208" stroke-width="3"/><circle cx="${x}" cy="${T - 26}" r="22" fill="url(#o2)"/><ellipse cx="${x + 2 * Math.sin(TAU * t)}" cy="${T - 26}" rx="9" ry="${f(14 * blink)}" fill="#1a0a00"/><circle cx="${x - 3}" cy="${T - 32}" r="3" fill="#fff"/>`;
    s += eye(cx - 40) + eye(cx + 40) + `<path d="M${cx - 10} ${T - 14} L${cx} ${T + 6} L${cx + 10} ${T - 14}Z" fill="#e8982a" stroke="#6a3a08" stroke-width="2"/>`;
    // أذنان ريشيتان
    s += `<path d="M${cx - 66} ${T - 40} L${cx - 78} ${T - 78} L${cx - 46} ${T - 56}Z M${cx + 66} ${T - 40} L${cx + 78} ${T - 78} L${cx + 46} ${T - 56}Z" fill="url(#o1)" stroke="#3a2208" stroke-width="2"/>`;
    // غصن شجرة أسفل مع أوراق
    s += `<path d="M${L - 30} ${Bt + 20} Q${cx} ${Bt + 34} ${R + 30} ${Bt + 16}" stroke="#5a3a1a" stroke-width="9" fill="none" stroke-linecap="round"/>`;
    [[L + 10, Bt + 18], [cx - 30, Bt + 28], [cx + 40, Bt + 28], [R - 8, Bt + 20]].forEach(([x, y], i) => { s += `<path transform="translate(${x} ${y}) rotate(${-40 + i * 25})" d="M0 0 C8 -6 10 -16 0 -22 C-10 -16 -8 -6 0 0Z" fill="#4aa65a"/>`; });
    s += twinkle(t, 6, "#ffe9a8", 13);
    return wrap(s);
}

function unicorn(t) {
    let s = `<defs>${glowDefs}${grad("u1", [[0, "#ffffff"], [0.5, "#ffd6f2"], [1, "#b8a0ff"]])}${grad("u2", [[0, "#fff6a0"], [1, "#ff9ad8"]])}</defs>`;
    s += `<ellipse cx="200" cy="205" rx="190" ry="175" fill="#e8b0ff" opacity=".18" filter="url(#g8)"/>`;
    // عرف ملون متدفق على الجانب الأيسر (أشرطة قوس قزح)
    const cols = ["#ff6fa8", "#ffb347", "#ffe14a", "#6aff9a", "#6ad8ff", "#a78bff"];
    cols.forEach((c, i) => { const sh = 6 * Math.sin(TAU * (t + i / 6)); s += `<path d="M${L - 4 - i * 5} ${T + 10 + i * 6} C${L - 60 - i * 6} ${T + 70 + sh} ${L - 10 - i * 6} ${T + 150 + sh} ${L - 56 - i * 6} ${Bt - 4 + i * 4}" fill="none" stroke="${c}" stroke-width="7" stroke-linecap="round" opacity=".92"/>`; });
    s += ring("u1", "round", 8, 14) + thin("#fff", "round", 1, 2);
    // قرن حلزوني ذهبي في الأعلى
    s += `<g transform="translate(${cx} ${T - 6})"><path d="M-16 4 L0 -92 L16 4Z" fill="url(#u2)" stroke="#fff" stroke-width="2.4" stroke-linejoin="round"/>${[0, 1, 2, 3, 4].map(i => `<path d="M${-14 + i * 2.4} ${-6 - i * 17} q${14 - i * 2.2} -7 ${28 - i * 4.6} 0" stroke="#ff7ac0" stroke-width="3" fill="none"/>`).join("")}<circle cy="-96" r="6" fill="#fff" opacity="${f(0.7 + 0.3 * Math.sin(TAU * t))}"/></g>`;
    // أذنان
    s += mirror(`<path d="M${cx - 60} ${T - 2} L${cx - 76} ${T - 54} L${cx - 38} ${T - 14}Z" fill="url(#u1)" stroke="#d8b0ff" stroke-width="2.2"/>`);
    // غيوم أسفل ونجوم
    const cl = (x, y, sc) => `<g transform="translate(${x} ${y}) scale(${sc})" fill="#fff"><ellipse rx="30" ry="11"/><circle cx="-12" cy="-8" r="12"/><circle cx="8" cy="-12" r="15"/><circle cx="22" cy="-4" r="10"/></g>`;
    s += cl(L + 20, Bt + 20, 1) + cl(R - 20, Bt + 22, 1) + cl(cx, Bt + 30, 1.3);
    s += twinkle(t, 9, "#fff6a0", 17, 180);
    return wrap(s);
}

function dragonA(t) {
    let s = `<defs>${glowDefs}${grad("d1", [[0, "#ff6a5a"], [0.5, "#c8281a"], [1, "#5a0a06"]])}${grad("d2", [[0, "#ffe27a"], [1, "#d88a1a"]])}</defs>`;
    s += `<ellipse cx="200" cy="205" rx="190" ry="175" fill="#ff3a2a" opacity=".12" filter="url(#g8)"/>`;
    // غيوم صينية ولآلئ
    const cloud = (x, y, sc) => `<g transform="translate(${x} ${y}) scale(${sc})" fill="none" stroke="#ffd04a" stroke-width="3" stroke-linecap="round"><path d="M-22 6 a8 8 0 0 1 8 -9 a10 10 0 0 1 18 -3 a8 8 0 0 1 10 12 Z"/><path d="M-12 -2 a4 4 0 0 1 4 -3"/></g>`;
    s += cloud(L - 22, T + 90, 1) + cloud(R + 22, T + 150, 1) + cloud(L - 24, Bt - 40, 0.9);
    // حراشف على حافة الإطار
    const sc = (x, y, c) => `<path d="M${x - 9} ${y} a9 9 0 0 0 18 0 Z" fill="${c}" stroke="#2a0404" stroke-width="1"/>`;
    let scales = "";
    for (let r = 0; r < 2; r++) for (let i = 0; i < 12; i++) { const x = L - 6 + i * (win.w + 12) / 11 + (r ? 10 : 0), y = T - 14 + r * 8; scales += sc(x, y, (i + r) % 2 ? "url(#d1)" : "#e0402a"); scales += sc(x, Bt + 8 + r * 8, (i + r) % 2 ? "#e0402a" : "url(#d1)"); }
    s += scales + ring("d1", "bevel", 5, 11);
    // رأس تنين صيني كبير في الأعلى: قرنان وشوارب ولؤلؤة
    s += `<g transform="translate(${cx} ${T - 18})"><path d="M-46 14 C-50 -18 -26 -34 0 -34 C26 -34 50 -18 46 14 C30 4 14 10 0 20 C-14 10 -30 4 -46 14Z" fill="url(#d1)" stroke="#ffd04a" stroke-width="2.4"/><path d="M-22 -32 C-34 -62 -54 -64 -62 -80 M22 -32 C34 -62 54 -64 62 -80" stroke="url(#d2)" stroke-width="6" fill="none" stroke-linecap="round"/><path d="M-30 4 q-26 14 -50 4 M30 4 q26 14 50 4" stroke="#ffd04a" stroke-width="3" fill="none" stroke-linecap="round"/><ellipse cx="-17" cy="-8" rx="6" ry="4" fill="#ffe14a"/><ellipse cx="17" cy="-8" rx="6" ry="4" fill="#ffe14a"/><circle cx="-17" cy="-8" r="1.8" fill="#111"/><circle cx="17" cy="-8" r="1.8" fill="#111"/><path d="M-6 6 l-3 8 M6 6 l3 8" stroke="#fff" stroke-width="2.4"/></g>`;
    // لؤلؤة تدور
    s += `<circle cx="${cx}" cy="${Bt + 26}" r="14" fill="#7ae0ff" opacity=".35" filter="url(#g)"/><circle cx="${cx}" cy="${Bt + 26}" r="10" fill="#bff3ff" stroke="#ffd04a" stroke-width="2.4"/><circle cx="${cx - 3}" cy="${Bt + 23}" r="3" fill="#fff"/>`;
    s += twinkle(t, 5, "#ffe9a0", 19);
    return wrap(s);
}

function phoenixA(t) {
    let s = `<defs>${glowDefs}${grad("p1", [[0, "#ffe08a"], [0.5, "#ff6a2a"], [1, "#b8142a"]])}${grad("p2", [[0, "#7affd8"], [1, "#2a6aff"]])}</defs>`;
    s += `<ellipse cx="200" cy="215" rx="190" ry="180" fill="#ff7a3a" opacity=".16" filter="url(#g8)"/>`;
    // ذيل ريشي طويل متدلٍّ بألوان نارية وزرقاء (مثل الطاووس)
    for (let i = 0; i < 9; i++) {
        const k = i / 8, x = L - 10 + k * (win.w + 20), len = 34 + 16 * Math.sin(Math.PI * k) + 4 * Math.sin(TAU * (t + k));
        s += `<path d="M${f(x)} ${Bt + 4} C${f(x - 14)} ${f(Bt + len * 0.4)} ${f(x - 8)} ${f(Bt + len * 0.8)} ${f(x + (k - 0.5) * 20)} ${f(Bt + len)} C${f(x + 10)} ${f(Bt + len * 0.8)} ${f(x + 14)} ${f(Bt + len * 0.4)} ${f(x)} ${Bt + 4}Z" fill="url(#p1)" opacity=".95"/><ellipse cx="${f(x + (k - 0.5) * 18)}" cy="${f(Bt + len * 0.78)}" rx="5" ry="8" fill="url(#p2)" stroke="#fff3a0" stroke-width="1.4"/>`;
    }
    s += ring("p1", "round", 6, 12) + thin("#fff3a0", "round", 1, 2);
    // عُرف ريشي على الرأس
    for (let i = 0; i < 5; i++) { const a = -90 + (i - 2) * 22, [x, y] = pt(cx, T - 4, 6, a), len = 56 - Math.abs(i - 2) * 9 + 4 * Math.sin(TAU * (t + i / 5)); s += `<g transform="translate(${f(x)} ${f(y)}) rotate(${a + 90})"><path d="M0 0 C8 -${len * 0.4} 6 -${len * 0.8} 0 -${len} C-6 -${len * 0.8} -8 -${len * 0.4} 0 0Z" fill="url(#p1)" stroke="#fff3a0" stroke-width="1.2"/><circle cy="${-len + 8}" r="4" fill="url(#p2)"/></g>`; }
    // أجنحة صغيرة منحنية على الجانبين
    s += mirror(`<path d="M${L - 4} ${cy - 20} C${L - 60} ${cy - 70} ${L - 70} ${cy - 20} ${L - 40} ${cy + 20} C${L - 54} ${cy + 20} ${L - 40} ${cy + 60} ${L - 4} ${cy + 70}Z" fill="url(#p1)" stroke="#fff3a0" stroke-width="2"/>`);
    for (let i = 0; i < 12; i++) { const k = (t + i / 12) % 1; s += `<circle cx="${f(40 + rnd(i) * 320)}" cy="${f(390 - k * 380)}" r="${f(1.2 + 2 * (1 - k))}" fill="#ffcf4a" opacity="${f(Math.sin(k * Math.PI))}"/>`; }
    return wrap(s);
}

module.exports = { cat, bunny, fox, wolf, lion, bear, owl, unicorn, dragonA, phoenixA };
