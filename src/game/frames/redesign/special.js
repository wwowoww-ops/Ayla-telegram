// دفعة 2 (ب): الإطارات الخاصة (12) — مناسبات وأفكار مختلفة
const K = require("../kit");
const { f, rnd, TAU, win, cx, cy, L, R, T, Bt, mirror, at, pt, star, twinkle, glowDefs, grad, rgrad, GOLD, SILVER, wrap, rr, body, ring, thin, heart, paw } = K;

// هلال رمضان: قوس مسجد، هلال ونجمة، فوانيس صغيرة
function ramadan(t) {
    let s = `<defs>${glowDefs}${grad("gd", GOLD)}${grad("gr", [[0, "#3aa86a"], [1, "#0a4a2a"]])}</defs>`;
    s += `<ellipse cx="200" cy="205" rx="190" ry="180" fill="#ffd04a" opacity=".14" filter="url(#g8)"/>`;
    s += ring("gr", "arch", 8, 16) + thin("#ffe27a", "arch", 0, 2.4) + thin("#ffe27a", "arch", 15, 1.4, 0.6);
    // هلال كبير مع نجمة تتأرجح
    const sw = 4 * Math.sin(TAU * t);
    s += `<g transform="translate(${cx} ${T - 30}) rotate(${f(sw)})"><circle r="30" fill="url(#gd)"/><circle cx="12" cy="-4" r="26" fill="#0a1a14"/></g>` + star(cx + 22, T - 38, 1.8, "#ffe27a");
    // فوانيس معلقة على الجانبين بسلاسل
    const lamp = (x, ph) => { const sw2 = 4 * Math.sin(TAU * (t + ph)); return `<g transform="translate(${x} ${T + 4}) rotate(${f(sw2)})"><path d="M0 0 L0 34" stroke="#e8c04a" stroke-width="2"/><path d="M-12 34 L12 34 L16 50 L-16 50Z" fill="url(#gd)" stroke="#5a3208" stroke-width="1.6"/><path d="M-14 50 Q0 78 14 50Z" fill="#ff9a2a" opacity="${f(0.7 + 0.3 * Math.sin(TAU * (t * 2 + ph)))}" stroke="#5a3208" stroke-width="1.6"/><circle cy="56" r="6" fill="#fff3a0"/><path d="M-8 34 L0 26 L8 34Z" fill="url(#gd)"/></g>`; };
    s += lamp(L - 4, 0) + lamp(R + 4, 0.5);
    // نجوم صغيرة ومسبحة أسفل
    s += twinkle(t, 7, "#ffe27a", 61);
    for (let i = 0; i < 9; i++) { const a = Math.PI * (0.15 + 0.7 * i / 8); s += `<circle cx="${f(cx + 70 * Math.cos(a))}" cy="${f(Bt + 14 + 22 * Math.sin(a))}" r="4" fill="#ffe27a" stroke="#8a5a10" stroke-width="1"/>`; }
    return wrap(s);
}
// الفانوس: فانوس ضخم بشكل الإطار نفسه (زخارف إسلامية)
function fanous(t) {
    let s = `<defs>${glowDefs}${grad("br", [[0, "#ffd27a"], [0.5, "#c8741a"], [1, "#5a2a08"]])}${grad("gl", [[0, "#ffe9a0"], [1, "#ff8a1a"]])}</defs>`;
    s += `<ellipse cx="200" cy="215" rx="190" ry="180" fill="#ff9a2a" opacity="${f(0.16 + 0.08 * Math.sin(TAU * t))}" filter="url(#g8)"/>`;
    s += ring("br", "oct", 8, 16) + thin("#ffe9a0", "oct", 0, 2);
    // قبة الفانوس أعلى + مقبض
    s += `<path d="M${L - 14} ${T - 8} Q${cx} ${T - 78} ${R + 14} ${T - 8}Z" fill="url(#br)" stroke="#3a1a04" stroke-width="2.4"/><path d="M${cx - 12} ${T - 52} L${cx - 6} ${T - 82} L${cx + 6} ${T - 82} L${cx + 12} ${T - 52}Z" fill="url(#br)" stroke="#3a1a04" stroke-width="2"/><circle cx="${cx}" cy="${T - 88}" r="7" fill="none" stroke="#e8c04a" stroke-width="3"/>`;
    for (let i = 0; i < 5; i++) s += `<circle cx="${f(L + 20 + i * (win.w - 40) / 4)}" cy="${T - 14}" r="4" fill="#ffe9a0"/>`;
    // قاعدة مخروطية وزخارف
    s += `<path d="M${L - 14} ${Bt + 8} L${R + 14} ${Bt + 8} L${R - 18} ${Bt + 34} L${L + 18} ${Bt + 34}Z" fill="url(#br)" stroke="#3a1a04" stroke-width="2.4"/><path d="M${cx - 8} ${Bt + 34} L${cx} ${Bt + 58} L${cx + 8} ${Bt + 34}Z" fill="url(#br)" stroke="#3a1a04" stroke-width="2"/>`;
    // نجوم إسلامية ثمانية على الجانبين
    const st8 = (x, y, r) => { let d = ""; for (let i = 0; i < 16; i++) { const [px, py] = pt(x, y, i % 2 ? r * 0.55 : r, i * 22.5); d += (i ? " L" : "M") + f(px) + " " + f(py); } return `<path d="${d}Z" fill="url(#gl)" stroke="#5a2a08" stroke-width="1.4"/>`; };
    for (let i = 0; i < 3; i++) s += st8(L - 4, T + 50 + i * 70, 14) + st8(R + 4, T + 50 + i * 70, 14);
    s += twinkle(t, 6, "#fff3c0", 63);
    return wrap(s);
}
// ألعاب العيد: ألعاب نارية وبالونات وأعلام وكونفيتي
function eid(t) {
    let s = `<defs>${glowDefs}${grad("p", [[0, "#ffe0f0"], [1, "#ff4a9a"]])}</defs>`;
    s += ring("p", "round", 7, 11) + thin("#fff", "round", 1, 2);
    // أعلام مثلثة معلقة (راية احتفال) في الأعلى
    const cols = ["#ff4a6a", "#ffd04a", "#4acbff", "#6aff9a", "#b78aff"];
    s += `<path d="M${L - 30} ${T - 22} Q${cx} ${T + 6} ${R + 30} ${T - 22}" fill="none" stroke="#fff" stroke-width="2"/>`;
    for (let i = 0; i < 9; i++) { const k = i / 8, x = L - 24 + k * (win.w + 48), y = T - 22 + 26 * Math.sin(Math.PI * k) - 2 + 3 * Math.sin(TAU * (t + k)); s += `<path d="M${f(x - 9)} ${f(y)} L${f(x + 9)} ${f(y)} L${f(x)} ${f(y + 20)}Z" fill="${cols[i % 5]}" stroke="#fff" stroke-width="1"/>`; }
    // بالونات بخيوط في الأسفل
    const bal = (x, y, c, ph) => { const b = 4 * Math.sin(TAU * (t + ph)); return `<g transform="translate(${f(x + b)} ${f(y)})"><path d="M0 22 q-4 20 4 36" stroke="#fff" stroke-width="1.4" fill="none"/><ellipse rx="14" ry="18" fill="${c}" stroke="#fff" stroke-width="1.4"/><ellipse cx="-5" cy="-6" rx="3" ry="5" fill="#fff" opacity=".6"/><path d="M0 18 l-3 5 h6z" fill="${c}"/></g>`; };
    s += bal(L - 14, Bt - 10, "#ff4a6a", 0) + bal(L + 18, Bt + 4, "#ffd04a", 0.2) + bal(R + 14, Bt - 10, "#4acbff", 0.4) + bal(R - 18, Bt + 4, "#6aff9a", 0.6);
    // ألعاب نارية تنفجر
    const fw = (x, y, c, ph) => { const k = (t + ph) % 1, r = 10 + 34 * k; let o = ""; for (let i = 0; i < 12; i++) { const [px, py] = pt(x, y, r, i * 30); o += `<circle cx="${f(px)}" cy="${f(py)}" r="${f(3 * (1 - k))}" fill="${c}" opacity="${f(1 - k)}"/>`; } return o; };
    s += fw(52, 70, "#ffd04a", 0) + fw(348, 80, "#ff6a9a", 0.4) + fw(46, 330, "#6ad8ff", 0.7);
    for (let i = 0; i < 14; i++) { const k = (t + rnd(i)) % 1; s += `<rect x="${f(20 + rnd(i + 2) * 360)}" y="${f(k * 400)}" width="5" height="8" fill="${cols[i % 5]}" opacity="${f(0.9 * Math.sin(k * Math.PI))}" transform="rotate(${f(k * 540 + i * 30)} 200 ${f(k * 400)})"/>`; }
    return wrap(s);
}
// الملك: جلد فرو أبيض بنقاط سوداء، ستائر مخملية، صولجان
function king(t) {
    let s = `<defs>${glowDefs}${grad("gd", GOLD)}${grad("v", [[0, "#d8302a"], [1, "#5a0608"]])}</defs>`;
    s += `<ellipse cx="200" cy="208" rx="190" ry="180" fill="#ffd04a" opacity=".16" filter="url(#g8)"/>`;
    // ستائر مخملية حمراء على الجانبين مع شراريب
    const curtain = `<path d="M${L - 54} ${T - 20} C${L - 20} ${T + 20} ${L - 60} ${T + 100} ${L - 40} ${cy + 30} C${L - 30} ${Bt - 30} ${L - 60} ${Bt} ${L - 30} ${Bt + 20} L${L - 6} ${Bt + 20} L${L - 6} ${T - 20}Z" fill="url(#v)" stroke="url(#gd)" stroke-width="2.4"/><path d="M${L - 36} ${T + 10} C${L - 28} ${T + 80} ${L - 44} ${cy} ${L - 30} ${Bt - 20}" stroke="#ff7a6a" stroke-width="2" fill="none" opacity=".6"/>`;
    s += mirror(curtain);
    s += ring("gd", "bevel", 6, 12);
    // حافة فرو بيضاء بنقاط
    s += body("bevel", 17, `fill="none" stroke="#fff" stroke-width="9" stroke-linejoin="round"`) + body("bevel", 17, `fill="none" stroke="#222" stroke-width="6" stroke-dasharray="2 14" stroke-linecap="round"`);
    // تاج ذهبي كبير مع حجر أحمر
    s += `<g transform="translate(${cx} ${T - 8})"><path d="M-54 6 L-62 -34 L-32 -12 L-14 -50 L0 -18 L14 -50 L32 -12 L62 -34 L54 6Z" fill="url(#gd)" stroke="#5a3208" stroke-width="2.4" stroke-linejoin="round"/><circle cy="-4" r="8" fill="#ff3a4a" stroke="#fff6c0" stroke-width="2"/></g>`;
    // صولجان
    s += `<g transform="translate(${R + 40} ${cy + 30}) rotate(14)"><rect x="-3" y="-60" width="6" height="130" rx="3" fill="url(#gd)"/><circle cy="-66" r="10" fill="#4a8aff" stroke="url(#gd)" stroke-width="3"/><path d="M-12 -80 l12 -16 l12 16" fill="url(#gd)"/></g>`;
    s += twinkle(t, 6, "#fff6c0", 67);
    return wrap(s);
}
// الكريستال: جيود بنفسجي بوجوه متعددة
function crystal(t) {
    let s = `<defs>${glowDefs}${grad("a", [[0, "#ffffff"], [0.4, "#d9a8ff"], [1, "#6a1aff"]], 1, 1)}${grad("b", [[0, "#e8fff8"], [0.5, "#6affd8"], [1, "#0a8a8a"]], 1, 1)}</defs>`;
    s += `<ellipse cx="200" cy="208" rx="190" ry="180" fill="#b07aff" opacity=".2" filter="url(#g8)"/>`;
    s += ring("a", "bevel", 8, 12) + thin("#fff", "bevel", 1, 1.6);
    const cr = (x, y, a, h, w, g) => `<g transform="translate(${f(x)} ${f(y)}) rotate(${a})"><path d="M${-w} 0 L${-w} ${-h * .7} L0 ${-h} L${w} ${-h * .7} L${w} 0Z" fill="url(#${g})" stroke="#fff" stroke-width="1.8" stroke-linejoin="round"/><path d="M0 0 L0 ${-h} L${w} ${-h * .7} L${w} 0Z" fill="#fff" opacity=".28"/><path d="M${-w} ${-h * .7} L0 ${-h * .35} L${w} ${-h * .7}" fill="none" stroke="#fff" stroke-width="1.2" opacity=".7"/></g>`;
    // عنقود بلورات ضخم في الأسفل وبلورات أصغر في الزوايا العليا
    s += cr(cx - 70, Bt + 52, -18, 50, 12, "a") + cr(cx - 30, Bt + 52, -6, 66, 14, "b") + cr(cx + 8, Bt + 52, 8, 80, 16, "a") + cr(cx + 52, Bt + 52, 18, 58, 13, "b") + cr(cx + 86, Bt + 52, 30, 40, 10, "a");
    s += cr(L - 6, T + 4, -30, 62, 11, "b") + cr(L + 18, T - 2, -8, 80, 13, "a") + cr(R + 6, T + 4, 30, 62, 11, "a") + cr(R - 18, T - 2, 8, 80, 13, "b");
    const g = Math.sin(TAU * t);
    s += star(L + 18, T - 70, 1.6 + 0.6 * g, "#fff") + star(R - 18, T - 70, 1.6 - 0.6 * g, "#fff") + star(cx + 8, Bt - 100 + 0, 0, "#fff");
    s += twinkle(t, 6, "#fff", 69);
    return wrap(s);
}
// الجمجمة: عظام وجمجمة بنيران خضراء
function skull(t) {
    let s = `<defs>${glowDefs}${grad("bn", [[0, "#fffbe8"], [0.6, "#d8cfae"], [1, "#6a5e3a"]])}</defs>`;
    s += `<rect width="400" height="400" fill="#08120a" opacity=".4"/><ellipse cx="200" cy="208" rx="190" ry="180" fill="#3aff6a" opacity=".12" filter="url(#g8)"/>`;
    // عظام فخذ كحافة (قطع عظمية بنهايات كروية)
    const bone = (x1, y1, x2, y2) => { const a = Math.atan2(y2 - y1, x2 - x1), n = [-Math.sin(a) * 5, Math.cos(a) * 5]; return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="url(#bn)" stroke-width="9" stroke-linecap="round"/><circle cx="${x1 - n[0] * .9}" cy="${y1 - n[1] * .9}" r="6" fill="url(#bn)"/><circle cx="${x1 + n[0] * .9}" cy="${y1 + n[1] * .9}" r="6" fill="url(#bn)"/><circle cx="${x2 - n[0] * .9}" cy="${y2 - n[1] * .9}" r="6" fill="url(#bn)"/><circle cx="${x2 + n[0] * .9}" cy="${y2 + n[1] * .9}" r="6" fill="url(#bn)"/>`; };
    s += bone(L - 4, T - 4, R + 4, T - 4) + bone(L - 4, Bt + 4, R + 4, Bt + 4) + bone(L - 4, T - 4, L - 4, Bt + 4) + bone(R + 4, T - 4, R + 4, Bt + 4);
    s += thin("#3aff6a", "round", 12, 1.6, 0.6);
    // جمجمة كبيرة في الأعلى بعيون متوهجة
    const gl = 0.6 + 0.4 * Math.sin(TAU * t);
    s += `<g transform="translate(${cx} ${T - 28})"><path d="M-34 14 C-42 -22 -22 -40 0 -40 C22 -40 42 -22 34 14 L26 20 L26 30 L-26 30 L-26 20Z" fill="url(#bn)" stroke="#3a2e10" stroke-width="2.4"/><ellipse cx="-14" cy="-6" rx="9" ry="11" fill="#06140a"/><ellipse cx="14" cy="-6" rx="9" ry="11" fill="#06140a"/><circle cx="-14" cy="-6" r="4" fill="#3aff6a" opacity="${f(0.6 + 0.4 * gl)}"/><circle cx="14" cy="-6" r="4" fill="#3aff6a" opacity="${f(0.6 + 0.4 * gl)}"/><path d="M0 6 l-4 9 h8z" fill="#06140a"/><path d="M-16 20 v10 M-8 20 v10 M0 20 v10 M8 20 v10 M16 20 v10" stroke="#3a2e10" stroke-width="2"/></g>`;
    // لهب أخضر من العينين وشموع على الأركان
    for (let i = 0; i < 2; i++) { const x = cx + (i ? 14 : -14); s += `<path d="M${x} ${T - 40} q${i ? 8 : -8} -${f(26 + 8 * gl)} 0 -${f(40 + 10 * gl)}" stroke="#3aff6a" stroke-width="5" fill="none" stroke-linecap="round" opacity=".6" filter="url(#g2)"/>`; }
    [[L - 20, Bt + 10], [R + 20, Bt + 10]].forEach(([x, y], i) => { s += `<rect x="${x - 5}" y="${y - 22}" width="10" height="24" fill="#e8e0c8" stroke="#3a2e10" stroke-width="1.4"/><path d="M${x} ${y - 22} q6 -12 0 -22 q-6 10 0 22Z" fill="#3aff6a" opacity="${f(0.7 + 0.3 * Math.sin(TAU * (t * 2 + i)))}"/>`; });
    return wrap(s);
}
// الكرز: غصن شجرة مزهر يعبر الإطار وبتلات تتساقط
function sakura(t) {
    let s = `<defs>${glowDefs}${grad("br", [[0, "#8a5a3a"], [1, "#3a2012"]])}</defs>`;
    s += `<ellipse cx="200" cy="205" rx="190" ry="180" fill="#ffb0d0" opacity=".2" filter="url(#g8)"/>`;
    s += body("round", 7, `fill="none" stroke="#ffd0e4" stroke-width="10" stroke-linejoin="round"`) + thin("#fff", "round", 1, 2);
    // غصن سميك ينحني من الزاوية العليا اليسرى فوق الإطار وينزل يمينًا
    s += `<path d="M${L - 70} ${T - 40} C${L - 20} ${T - 30} ${L + 40} ${T - 56} ${cx} ${T - 22} C${cx + 60} ${T + 6} ${R - 10} ${T - 40} ${R + 40} ${T + 10}" fill="none" stroke="url(#br)" stroke-width="13" stroke-linecap="round"/><path d="M${cx} ${T - 22} C${cx - 10} ${T - 60} ${cx + 10} ${T - 84} ${cx + 50} ${T - 86}" fill="none" stroke="url(#br)" stroke-width="7" stroke-linecap="round"/>`;
    const bl = (x, y, r, rot) => { let b = `<g transform="translate(${f(x)} ${f(y)}) rotate(${rot})">`; for (let i = 0; i < 5; i++) b += `<path d="M0 0 C${-r * .7} ${-r * .3} ${-r * .6} ${-r} 0 ${-r * .85} C${r * .6} ${-r} ${r * .7} ${-r * .3} 0 0Z" fill="#ffc0d8" stroke="#e8749e" stroke-width="1" transform="rotate(${i * 72})"/>`; return b + `<circle r="${r * .18}" fill="#ffe27a"/></g>`; };
    [[L - 14, T - 34, 14, 0], [L + 40, T - 52, 17, 20], [cx - 30, T - 34, 13, 10], [cx, T - 22, 18, 5], [cx + 40, T - 40, 15, 30], [cx + 50, T - 86, 16, 0], [R - 20, T - 30, 15, 12], [R + 30, T + 4, 15, 40], [R + 10, T + 90, 11, 0], [L - 8, Bt - 40, 11, 20]].forEach(([x, y, r, rot]) => { s += bl(x, y, r, rot + 6 * Math.sin(TAU * t + x)); });
    for (let i = 0; i < 14; i++) { const k = (t + rnd(i)) % 1; s += `<ellipse cx="${f(20 + rnd(i + 2) * 360 + 18 * Math.sin(TAU * k + i))}" cy="${f(k * 400)}" rx="5" ry="3" fill="#ffb0d0" opacity="${f(0.9 * Math.sin(k * Math.PI))}" transform="rotate(${f(k * 360 + i * 40)} 200 ${f(k * 400)})"/>`; }
    return wrap(s);
}
// المجرة: ذراع حلزونية تدور حول الإطار
function galaxy(t) {
    let s = `<defs>${glowDefs}${rgrad("core", [[0, "#ffffff"], [0.4, "#ffd0f0"], [1, "#6a2aff"]])}</defs>`;
    s += `<rect width="400" height="400" fill="#07041a" opacity=".6"/>`;
    // نجوم حلزونية: 3 أذرع تدور
    for (let arm = 0; arm < 3; arm++) for (let i = 0; i < 46; i++) {
        const k = i / 46, ang = arm * TAU / 3 + k * 5.2 + TAU * t * 0.6, rad = 150 + k * 70;
        const x = cx + rad * Math.cos(ang) * 1.05, y = cy + rad * Math.sin(ang) * 0.95;
        const c = ["#ff9ad8", "#9ad8ff", "#ffe27a"][arm];
        s += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(1 + 2.6 * (1 - k) + rnd(i + arm * 50))}" fill="${c}" opacity="${f(0.85 - 0.55 * k)}"/>`;
    }
    s += `<ellipse cx="${cx}" cy="${cy}" rx="${win.w / 2 + 24}" ry="${win.h / 2 + 24}" fill="url(#core)" opacity=".35" filter="url(#g8)"/>`;
    s += body("round", 7, `fill="none" stroke="#c8b0ff" stroke-width="9" stroke-linejoin="round"`) + thin("#fff", "round", 2, 1.6);
    // كوكب بحلقة
    s += `<g transform="translate(${R + 6} ${T - 6}) rotate(-20)"><circle r="18" fill="#ff9a5a"/><circle r="18" fill="#7a2a0a" opacity=".3" cx="6"/><ellipse rx="32" ry="8" fill="none" stroke="#ffe0a0" stroke-width="3"/></g>`;
    s += twinkle(t, 14, "#fff", 71, 185);
    return wrap(s);
}
// قوس قزح: قوس كبير فوق الإطار وغيمتان وقطرات
function rainbow(t) {
    let s = `<defs>${glowDefs}</defs>`;
    s += `<ellipse cx="200" cy="208" rx="188" ry="176" fill="#9ad8ff" opacity=".16" filter="url(#g8)"/>`;
    s += body("round", 7, `fill="none" stroke="#fff" stroke-width="11" stroke-linejoin="round"`);
    const cols = ["#ff4a4a", "#ff9a3a", "#ffe14a", "#5ad86a", "#4aa8ff", "#9a6aff"];
    // قوس قزح نصف دائري كبير يعلو الإطار
    cols.forEach((c, i) => { const r = 150 - i * 9; s += `<path d="M${cx - r} ${T + 14} A${r} ${r} 0 0 1 ${cx + r} ${T + 14}" fill="none" stroke="${c}" stroke-width="9"/>`; });
    // غيمتان عند طرفي القوس
    const cl = (x, y, sc) => `<g transform="translate(${x} ${y}) scale(${sc})" fill="#fff" stroke="#bfe4ff" stroke-width="1.4"><ellipse rx="36" ry="13"/><circle cx="-16" cy="-9" r="14"/><circle cx="6" cy="-15" r="18"/><circle cx="26" cy="-6" r="12"/></g>`;
    s += cl(cx - 146 + 3 * Math.sin(TAU * t), T + 20, 1) + cl(cx + 146 - 3 * Math.sin(TAU * t), T + 20, 1);
    // قطرات مطر ملونة وشمس صغيرة
    for (let i = 0; i < 10; i++) { const k = (t + rnd(i)) % 1, x = L + 20 + (i % 5) * 52 + 10 * rnd(i); s += `<path d="M${f(x)} ${f(Bt - 10 + k * 40)} q-4 8 0 12 q4 -4 0 -12Z" fill="${cols[i % 6]}" opacity="${f(Math.sin(k * Math.PI))}"/>`; }
    s += `<g transform="translate(${L - 6} ${Bt + 12})"><circle r="14" fill="#ffe14a"/>${Array.from({ length: 8 }, (_, i) => `<path d="M0 -18 L0 -26" stroke="#ffe14a" stroke-width="3" stroke-linecap="round" transform="rotate(${i * 45 + 360 * t})"/>`).join("")}</g>`;
    return wrap(s);
}
// الثلج: ندفة ثلج كبيرة، قطع ثلج متدلية، أغصان صنوبر
function snow(t) {
    let s = `<defs>${glowDefs}${grad("i", [[0, "#ffffff"], [1, "#9ad0ff"]])}</defs>`;
    s += `<ellipse cx="200" cy="208" rx="188" ry="176" fill="#cfe8ff" opacity=".2" filter="url(#g8)"/>`;
    s += ring("i", "round", 7, 12) + thin("#6a9ad8", "round", 13, 1.4, 0.6);
    // ندفة ثلج كبيرة أعلى الإطار (6 أذرع)
    const flake = (x, y, r, rot) => { let o = `<g transform="translate(${x} ${y}) rotate(${f(rot)})" stroke="#fff" stroke-width="2.6" stroke-linecap="round" fill="none">`; for (let i = 0; i < 6; i++) o += `<g transform="rotate(${i * 60})"><path d="M0 0 L0 ${-r}"/><path d="M0 ${-r * .45} l${-r * .22} ${-r * .2} M0 ${-r * .45} l${r * .22} ${-r * .2} M0 ${-r * .75} l${-r * .16} ${-r * .14} M0 ${-r * .75} l${r * .16} ${-r * .14}"/></g>`; return o + `</g>`; };
    s += flake(cx, T - 38, 40, 360 * t * 0.15) + flake(L - 14, Bt + 8, 22, -360 * t * 0.2) + flake(R + 14, Bt + 8, 22, 360 * t * 0.2);
    // صقيع متدلٍّ (ثلج مدبب) أسفل حافة الإطار العليا
    for (let i = 0; i < 11; i++) { const x = L + 6 + i * (win.w - 12) / 10, h = 12 + 16 * rnd(i + 5); s += `<path d="M${f(x - 5)} ${T - 4} L${f(x)} ${f(T - 4 + h)} L${f(x + 5)} ${T - 4}Z" fill="#e8f6ff" stroke="#9ad0ff" stroke-width="1"/>`; }
    // أغصان صنوبر مثلجة في الزوايا السفلية
    const pine = (sg) => { let p = ""; for (let i = 0; i < 4; i++) p += `<path d="M${L - 10} ${Bt - 4} l${-30 + i * 6} ${-14 - i * 14} l${34 - i * 6} ${10}Z" fill="#2a7a4a" stroke="#0a3a1a" stroke-width="1.2" transform="translate(${i * 0} 0)"/><path d="M${L - 36 + i * 6} ${Bt - 18 - i * 14} q8 -4 14 0" stroke="#fff" stroke-width="3" fill="none"/>`; return p; };
    s += mirror(pine());
    for (let i = 0; i < 22; i++) { const k = (t + rnd(i)) % 1; s += `<circle cx="${f(10 + rnd(i + 4) * 380 + 10 * Math.sin(TAU * k + i))}" cy="${f(k * 400)}" r="${f(1.4 + rnd(i + 8) * 2.2)}" fill="#fff" opacity="${f(0.9 * Math.sin(k * Math.PI))}"/>`; }
    return wrap(s);
}
// سايبر (خاص): بكسلات وتشويش وأقواس HUD
function cyberS(t) {
    let s = `<defs>${glowDefs}</defs>`;
    s += `<rect width="400" height="400" fill="#06101a" opacity=".5"/>`;
    // كتل بكسل متوهجة على الحدود
    const px = (x, y, c, op) => `<rect x="${f(x)}" y="${f(y)}" width="10" height="10" fill="${c}" opacity="${op}"/>`;
    for (let i = 0; i < 30; i++) { const side = i % 4, k = Math.floor(i / 4), ph = Math.sin(TAU * (t + rnd(i))), c = ["#2af0ff", "#ff3ad8", "#ffe14a", "#6aff9a"][i % 4]; if (side === 0) s += px(L - 22 + k * 36, T - 24 - 6 * rnd(i), c, f(0.4 + 0.5 * Math.max(0, ph))); else if (side === 1) s += px(L - 22 + k * 36, Bt + 14 + 6 * rnd(i), c, f(0.4 + 0.5 * Math.max(0, ph))); else if (side === 2) s += px(L - 24 - 6 * rnd(i), T + k * 34, c, f(0.4 + 0.5 * Math.max(0, ph))); else s += px(R + 14 + 6 * rnd(i), T + k * 34, c, f(0.4 + 0.5 * Math.max(0, ph))); }
    // أقواس HUD في الأركان
    const br = (x, y, sx, sy) => `<path d="M${x} ${y + sy * 40} L${x} ${y} L${x + sx * 40} ${y}" fill="none" stroke="#2af0ff" stroke-width="5" filter="url(#g2)"/><path d="M${x} ${y + sy * 40} L${x} ${y} L${x + sx * 40} ${y}" fill="none" stroke="#e6ffff" stroke-width="2"/>`;
    s += br(L - 8, T - 8, 1, 1) + br(R + 8, T - 8, -1, 1) + br(L - 8, Bt + 8, 1, -1) + br(R + 8, Bt + 8, -1, -1);
    s += thin("#2af0ff", "round", 1, 1.4, 0.7);
    // تشويش (glitch): شريطان مزاحان ملونان
    const gy = T + (win.h * ((t * 1.5) % 1)), gl = Math.sin(TAU * t * 3) > 0.6 ? 1 : 0;
    s += `<rect x="${L - 6}" y="${f(gy)}" width="${win.w + 12}" height="5" fill="#ff3ad8" opacity="${0.35 * gl}"/><rect x="${L + 6}" y="${f(gy + 7)}" width="${win.w}" height="3" fill="#2af0ff" opacity="${0.4 * gl}"/>`;
    s += `<path d="M${cx - 60} ${T - 14} h40 l8 -8 h24 l8 8 h40" fill="none" stroke="#ffe14a" stroke-width="2.4"/><path d="M${cx - 50} ${Bt + 14} h100" stroke="#ff3ad8" stroke-width="2.4" stroke-dasharray="8 6"/>`;
    return wrap(s);
}
// القلب: قوس قلبين، سهم كيوبيد، شرائط
function love(t) {
    let s = `<defs>${glowDefs}${grad("h", [[0, "#ffd0e0"], [0.5, "#ff4a7a"], [1, "#8a0a3a"]])}</defs>`;
    s += `<ellipse cx="200" cy="208" rx="190" ry="178" fill="#ff5a8a" opacity=".18" filter="url(#g8)"/>`;
    s += ring("h", "round", 7, 12) + thin("#fff", "round", 1, 2);
    // قلب كبير مقسوم أعلى الإطار + قلبان جانبيان
    const bigHeart = (x, y, sc, ph) => `<g transform="translate(${x} ${y}) scale(${f(sc * (1 + 0.06 * Math.sin(TAU * (t * 2 + ph))))})"><path d="M0 30 C-46 -4 -34 -40 -14 -40 C-6 -40 0 -32 0 -28 C0 -32 6 -40 14 -40 C34 -40 46 -4 0 30Z" fill="url(#h)" stroke="#fff" stroke-width="2.6" stroke-linejoin="round"/><ellipse cx="-14" cy="-24" rx="6" ry="9" fill="#fff" opacity=".5" transform="rotate(-30 -14 -24)"/></g>`;
    s += bigHeart(cx, T - 26, 1.2, 0) + bigHeart(L - 6, cy + 10, 0.6, 0.3) + bigHeart(R + 6, cy - 10, 0.6, 0.6) + bigHeart(cx, Bt + 22, 0.5, 0.9);
    // سهم كيوبيد يخترق
    s += `<g transform="translate(${cx} ${Bt + 22}) rotate(-24)"><path d="M-60 0 L58 0" stroke="#c8a070" stroke-width="3.4"/><path d="M58 0 l-12 -7 l0 14Z" fill="#8a8aa0"/><path d="M-60 0 l-8 -7 M-60 0 l-8 7 M-52 0 l-8 -7 M-52 0 l-8 7" stroke="#ff6a8a" stroke-width="3" stroke-linecap="round"/></g>`;
    for (let i = 0; i < 10; i++) { const k = (t + rnd(i)) % 1; s += heart(20 + rnd(i + 3) * 360 + 8 * Math.sin(TAU * k + i), 390 - k * 380, 0.6 + 0.5 * rnd(i + 6), ["#ff6a9a", "#ff9ac0", "#ffb3d0"][i % 3], 0.9 * Math.sin(k * Math.PI)); }
    return wrap(s);
}
module.exports = { ramadan, fanous, eid, king, crystal, skull, sakura, galaxy, rainbow, snow, cyberS, love };
