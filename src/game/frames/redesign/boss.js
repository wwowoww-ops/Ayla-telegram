// دفعة 3 (أ): إطارات الزعماء (14): "تاج" = للأول (فخم)، و"صيّاد" = للمشارك (أبسط) — لكل زعيم موضوعه
const K = require("../kit");
const { f, rnd, TAU, win, cx, cy, L, R, T, Bt, mirror, at, pt, star, twinkle, glowDefs, grad, rgrad, GOLD, SILVER, wrap, rr, body, ring, thin } = K;
const gdefs = (extra = "") => `<defs>${glowDefs}${grad("gd", GOLD)}${extra}</defs>`;
const flameP = (x, y, a, len, w, c1, c2, t, ph) => { const l = len * (1 + 0.15 * Math.sin(TAU * (t * 2 + ph))); return `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(a + 90 + 5 * Math.sin(TAU * (t + ph)))})"><path d="M0 0 C${w} ${-l * .3} ${w * .3} ${-l * .6} 0 ${-l} C${-w * .3} ${-l * .6} ${-w} ${-l * .3} 0 0Z" fill="${c1}"/><path d="M0 0 C${w * .5} ${-l * .25} ${w * .15} ${-l * .5} 0 ${-l * .62} C${-w * .15} ${-l * .5} ${-w * .5} ${-l * .25} 0 0Z" fill="${c2}"/></g>`; };

// ---- النار: التنين القرمزي ----
function fireTop(t) {
    let s = gdefs(grad("r", [[0, "#ff8a5a"], [0.5, "#c8281a"], [1, "#4a0608"]]));
    s += `<ellipse cx="200" cy="205" rx="195" ry="185" fill="#ff3a1a" opacity=".22" filter="url(#g8)"/>`;
    for (let i = 0; i < 7; i++) s += flameP(L + i * win.w / 6, T - 4, -90 + (i - 3) * 8, 40 + 20 * rnd(i), 14, "#ff7a1a", "#ffe27a", t, i * .14);
    s += ring("r", "bevel", 6, 15) + thin("#ffd04a", "bevel", 0, 2);
    // رأس تنين بقرنين ذهبيين وتاج
    s += `<g transform="translate(${cx} ${T - 16})"><path d="M-50 16 C-56 -18 -28 -36 0 -36 C28 -36 56 -18 50 16 C34 6 16 12 0 24 C-16 12 -34 6 -50 16Z" fill="url(#r)" stroke="#ffd04a" stroke-width="2.6"/><path d="M-28 -32 C-44 -66 -66 -64 -74 -86 M28 -32 C44 -66 66 -64 74 -86" stroke="url(#gd)" stroke-width="8" fill="none" stroke-linecap="round"/><ellipse cx="-18" cy="-8" rx="7" ry="4.6" fill="#ffe14a"/><ellipse cx="18" cy="-8" rx="7" ry="4.6" fill="#ffe14a"/><path d="M-8 8 l-4 10 M8 8 l4 10" stroke="#fff" stroke-width="3"/><path d="M-22 -34 L-14 -52 L-4 -36 L0 -58 L4 -36 L14 -52 L22 -34Z" fill="url(#gd)" stroke="#5a3208" stroke-width="1.6"/></g>`;
    s += mirror(`<path d="M${L - 4} ${cy - 10} C${L - 50} ${cy - 60} ${L - 70} ${cy - 10} ${L - 36} ${cy + 30} C${L - 50} ${cy + 34} ${L - 30} ${cy + 70} ${L - 4} ${cy + 76}Z" fill="url(#r)" stroke="#ffd04a" stroke-width="2"/>`);
    return wrap(s);
}
function firePart(t) {
    let s = gdefs(grad("r", [[0, "#ff9a6a"], [1, "#6a0a0a"]]));
    s += `<ellipse cx="200" cy="205" rx="188" ry="178" fill="#ff5a1a" opacity=".16" filter="url(#g8)"/>`;
    s += ring("r", "round", 6, 13);
    // ثلاث آثار مخالب مشتعلة قطرية عبر الركن
    [0, 1, 2].forEach(i => { const o = i * 20; s += `<path d="M${R - 70 + o} ${T - 34} Q${R - 40 + o} ${T + 40} ${R - 10 + o} ${T + 110}" stroke="#ffb04a" stroke-width="6" fill="none" stroke-linecap="round" opacity=".95"/><path d="M${R - 70 + o} ${T - 34} Q${R - 40 + o} ${T + 40} ${R - 10 + o} ${T + 110}" stroke="#ff3a1a" stroke-width="2" fill="none" stroke-linecap="round"/>`; });
    for (let i = 0; i < 5; i++) s += flameP(L + 20 + i * 52, Bt + 6, 90, 22 + 10 * rnd(i), 9, "#ff7a1a", "#ffe27a", t, i * .2);
    // سن تنين (ناب) كجائزة
    s += `<path d="M${L - 20} ${T - 10} Q${L - 6} ${T + 40} ${L + 4} ${T + 74} Q${L - 28} ${T + 40} ${L - 20} ${T - 10}Z" fill="#fff6e0" stroke="#8a5a2a" stroke-width="2.2"/>`;
    s += twinkle(t, 4, "#ffd04a", 81);
    return wrap(s);
}
// ---- الماء: ليفياثان ----
function waterTop(t) {
    let s = gdefs(grad("w", [[0, "#9af0ff"], [0.5, "#1a7ad0"], [1, "#062a6a"]]));
    s += `<ellipse cx="200" cy="208" rx="192" ry="182" fill="#2a9aff" opacity=".2" filter="url(#g8)"/>`;
    // ثعبان بحري ضخم يلتف حول الإطار بحلقتين
    const sw = 4 * Math.sin(TAU * t);
    s += `<path d="M${L - 20} ${T + 30} C${L - 50} ${T - 40} ${cx - 30} ${T - 52} ${cx} ${T - 22} C${cx + 40} ${T + 4} ${R + 50} ${T - 40} ${R + 24} ${T + 60} C${R + 10} ${cy + 20} ${R + 44} ${Bt - 40} ${R + 16} ${Bt + 10} C${cx + 60} ${Bt + 50} ${cx - 60} ${Bt + 50 + sw} ${L - 16} ${Bt + 10} C${L - 44} ${cy + 40} ${L - 4} ${T + 80} ${L - 20} ${T + 30}Z" fill="none" stroke="url(#w)" stroke-width="22" stroke-linejoin="round"/><path d="M${L - 20} ${T + 30} C${L - 50} ${T - 40} ${cx - 30} ${T - 52} ${cx} ${T - 22} C${cx + 40} ${T + 4} ${R + 50} ${T - 40} ${R + 24} ${T + 60}" fill="none" stroke="#e0faff" stroke-width="3" stroke-dasharray="3 10" opacity=".8"/>`;
    s += ring("w", "round", 6, 8);
    // رأس الثعبان البحري مع زعنفة وتاج ثلاثي
    s += `<g transform="translate(${R + 22} ${T + 54}) rotate(-20)"><path d="M-16 -20 C6 -34 30 -20 34 0 C30 18 6 28 -16 20 C-6 8 -6 -8 -16 -20Z" fill="url(#w)" stroke="#e0faff" stroke-width="2"/><circle cx="14" cy="-6" r="4.4" fill="#ffe14a"/><circle cx="15" cy="-6" r="1.8" fill="#111"/><path d="M-10 -22 L-4 -42 L2 -24 L10 -44 L14 -22" stroke="url(#gd)" stroke-width="5" fill="none" stroke-linejoin="round"/></g>`;
    // تريدنت ذهبي في الأعلى
    s += `<g transform="translate(${cx} ${T - 22})"><path d="M0 -50 L0 30" stroke="url(#gd)" stroke-width="5"/><path d="M-18 -28 Q-18 -50 -14 -52 M18 -28 Q18 -50 14 -52 M-18 -28 Q0 -14 18 -28" stroke="url(#gd)" stroke-width="5" fill="none" stroke-linecap="round"/></g>`;
    for (let i = 0; i < 8; i++) { const k = (t + rnd(i)) % 1; s += `<circle cx="${f(24 + rnd(i + 2) * 352)}" cy="${f(390 - k * 380)}" r="${f(2 + 3 * rnd(i + 6))}" fill="none" stroke="#e0faff" stroke-width="1.6" opacity="${f(0.8 * Math.sin(k * Math.PI))}"/>`; }
    return wrap(s);
}
function waterPart(t) {
    let s = gdefs(grad("w", [[0, "#aef4ff"], [1, "#0a3a8a"]]));
    s += `<ellipse cx="200" cy="208" rx="186" ry="176" fill="#2a9aff" opacity=".16" filter="url(#g8)"/>`;
    s += ring("w", "round", 6, 12);
    // حبل بحري مع مرساة ذهبية أسفل
    s += body("round", 12, `fill="none" stroke="#e8d8a8" stroke-width="5" stroke-dasharray="3 6"`);
    s += `<g transform="translate(${cx} ${Bt + 28})"><circle cy="-18" r="6" fill="none" stroke="url(#gd)" stroke-width="3"/><path d="M0 -12 L0 18 M-14 -4 L14 -4 M-20 8 Q-16 22 0 22 Q16 22 20 8" stroke="url(#gd)" stroke-width="4" fill="none" stroke-linecap="round"/></g>`;
    // أمواج متحركة على الجانبين وقوقعة
    for (let i = 0; i < 4; i++) { const y = T + 20 + i * 62, sh = 5 * Math.sin(TAU * (t + i / 4)); s += `<path d="M${L - 36 + sh} ${y} q8 -12 16 0 t16 0 t16 0" stroke="#bff0ff" stroke-width="3" fill="none"/><path d="M${R + 4 - sh} ${y + 20} q8 -12 16 0 t16 0 t16 0" stroke="#bff0ff" stroke-width="3" fill="none"/>`; }
    s += `<g transform="translate(${R + 6} ${Bt + 6})"><path d="M0 0 a16 16 0 0 1 32 0 Z" fill="#ffd0e0" stroke="#d86a98" stroke-width="2"/><path d="M16 0 L16 -14 M8 0 L6 -12 M24 0 L26 -12" stroke="#d86a98" stroke-width="1.6"/></g>`;
    return wrap(s);
}
// ---- النبات: عملاق الغابة ----
function plantTop(t) {
    let s = gdefs(grad("p", [[0, "#9aff8a"], [0.5, "#2a8a3a"], [1, "#0a2a12"]]));
    s += `<ellipse cx="200" cy="208" rx="192" ry="182" fill="#3aff5a" opacity=".14" filter="url(#g8)"/>`;
    s += ring("p", "round", 6, 14);
    // قرون أغصان كقرون الأيل مع أوراق وثمار
    const branch = (sg) => `<path d="M${cx + sg * 20} ${T - 6} C${cx + sg * 40} ${T - 40} ${cx + sg * 30} ${T - 70} ${cx + sg * 56} ${T - 100} M${cx + sg * 34} ${T - 40} C${cx + sg * 60} ${T - 42} ${cx + sg * 84} ${T - 60} ${cx + sg * 96} ${T - 90} M${cx + sg * 40} ${T - 62} C${cx + sg * 20} ${T - 80} ${cx + sg * 22} ${T - 96} ${cx + sg * 30} ${T - 112}" stroke="#5a3a1a" stroke-width="7" fill="none" stroke-linecap="round"/>`;
    s += branch(-1) + branch(1);
    const leaf = (x, y, a, c, sc = 1) => `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(a + 5 * Math.sin(TAU * t + x))}) scale(${sc})"><path d="M0 0 C14 -8 18 -28 0 -44 C-18 -28 -14 -8 0 0Z" fill="${c}" stroke="#0a3a1a" stroke-width="1.4"/></g>`;
    [[56, -100], [96, -90], [30, -112], [78, -60]].forEach(([dx, dy], i) => { s += leaf(cx + dx, T + dy, 20 + i * 15, "#4acb5a", 0.7) + leaf(cx - dx, T + dy, -20 - i * 15, "#2aa84a", 0.7); });
    // ثمار ذهبية
    [[0, -34]].forEach(() => { s += `<circle cx="${cx}" cy="${T - 30}" r="9" fill="url(#gd)" stroke="#5a3208" stroke-width="1.6"/>`; });
    // جذور وأوراق جانبية
    for (let i = 0; i < 5; i++) s += leaf(L - 6, T + 20 + i * 54, -70 - (i % 2) * 40, i % 2 ? "#2aa84a" : "#4acb5a", 0.8) + leaf(R + 6, T + 44 + i * 54, 70 + (i % 2) * 40, i % 2 ? "#4acb5a" : "#2aa84a", 0.8);
    s += twinkle(t, 5, "#d8ffd0", 83);
    return wrap(s);
}
function plantPart(t) {
    let s = gdefs(grad("lg", [[0, "#b08a5a"], [1, "#4a2e14"]]));
    s += `<ellipse cx="200" cy="208" rx="186" ry="176" fill="#4aff6a" opacity=".1" filter="url(#g8)"/>`;
    // إطار جذع خشبي بحلقات ونتوءات وطحلب
    s += body("round", 7, `fill="none" stroke="url(#lg)" stroke-width="17" stroke-linejoin="round"/>`.replace("/>", ""));
    s += body("round", 7, `fill="none" stroke="#2a1608" stroke-width="2" stroke-dasharray="14 7 3 7" opacity=".6"`);
    s += body("round", 15, `fill="none" stroke="#4acb5a" stroke-width="5" stroke-dasharray="1 9" stroke-linecap="round"`);
    // فطر ملوّن على الأركان
    const mush = (x, y, sc, c) => `<g transform="translate(${x} ${y}) scale(${sc})"><rect x="-3" y="-2" width="6" height="14" rx="2" fill="#f4e8d0"/><path d="M-14 0 C-14 -16 14 -16 14 0Z" fill="${c}" stroke="#4a1a1a" stroke-width="1.4"/><circle cx="-5" cy="-6" r="2" fill="#fff"/><circle cx="4" cy="-8" r="2.4" fill="#fff"/></g>`;
    s += mush(L - 4, T - 6, 1.1, "#ff5a5a") + mush(R + 4, Bt + 12, 1, "#ff9a3a") + mush(L + 10, Bt + 14, 0.8, "#ff5a5a");
    // ورقة بلوط كبيرة تتأرجح
    s += `<g transform="translate(${R + 8} ${T - 8}) rotate(${f(20 + 6 * Math.sin(TAU * t))})"><path d="M0 0 C16 -6 22 -22 8 -34 C14 -42 0 -54 -8 -44 C-20 -52 -28 -34 -14 -30 C-26 -20 -12 -4 0 0Z" fill="#3aa84a" stroke="#0a3a1a" stroke-width="1.6"/></g>`;
    for (let i = 0; i < 6; i++) { const k = (t + rnd(i)) % 1; s += `<circle cx="${f(30 + rnd(i + 3) * 340)}" cy="${f(k * 400)}" r="2" fill="#bfff9a" opacity="${f(0.7 * Math.sin(k * Math.PI))}"/>`; }
    return wrap(s);
}
// ---- الأرض: جبل الحجر الحي ----
function earthTop(t) {
    let s = gdefs(grad("s", [[0, "#d8c4a0"], [0.5, "#7a6444"], [1, "#2a1e10"]]) + grad("lv", [[0, "#ffe27a"], [1, "#ff4a0a"]]));
    s += `<ellipse cx="200" cy="208" rx="190" ry="180" fill="#ff8a2a" opacity=".12" filter="url(#g8)"/>`;
    // قمم جبلية ثلاث خلف الإطار العلوي، والوسطى بتاج
    const peak = (x, w, h, c) => `<path d="M${x - w} ${T + 4} L${x - w * .3} ${T + 4 - h * .7} L${x - w * .1} ${T + 4 - h * .6} L${x} ${T + 4 - h} L${x + w * .25} ${T + 4 - h * .55} L${x + w * .5} ${T + 4 - h * .7} L${x + w} ${T + 4}Z" fill="${c}" stroke="#1a1208" stroke-width="2.4" stroke-linejoin="round"/>`;
    s += peak(cx - 78, 62, 70, "#8a7454") + peak(cx + 78, 62, 78, "#8a7454") + peak(cx, 84, 112, "url(#s)");
    s += `<path d="M${cx - 20} ${T - 80} l10 14 l8 -10 l6 16" stroke="url(#lv)" stroke-width="3" fill="none"/>`;
    s += `<g transform="translate(${cx} ${T - 108})"><path d="M-20 4 L-24 -16 L-10 -4 L0 -22 L10 -4 L24 -16 L20 4Z" fill="url(#gd)" stroke="#5a3208" stroke-width="1.8"/></g>`;
    s += ring("s", "bevel", 6, 17) + thin("#e6d8bc", "bevel", 0, 2);
    // شقوق حمم على الحافة وحجارة طافية
    s += `<path d="M${L - 6} ${T + 60} l10 14 l-8 12 l12 16 M${R + 6} ${cy} l-10 14 l8 12 l-12 16" stroke="url(#lv)" stroke-width="3.4" fill="none" stroke-linecap="round" opacity="${f(0.7 + 0.3 * Math.sin(TAU * t))}"/>`;
    for (let i = 0; i < 4; i++) { const k = Math.sin(TAU * (t + i / 4)); s += `<path d="M${L - 18 + i * 120} ${Bt + 18 + 4 * k} l9 -7 l11 4 l-3 10 l-12 2Z" fill="#8a7454" stroke="#1a1208" stroke-width="1.6"/>`; }
    return wrap(s);
}
function earthPart(t) {
    let s = gdefs(grad("s", [[0, "#cdb89a"], [1, "#4a3a28"]]));
    s += `<ellipse cx="200" cy="208" rx="186" ry="176" fill="#a08a5a" opacity=".12" filter="url(#g8)"/>`;
    // لوح حجري سميك بنقوش وشقوق قطرية
    s += ring("s", "bevel", 6, 18) + thin("#2a1e10", "bevel", 14, 2);
    s += `<path d="M${L - 12} ${T + 30} l30 20 l-10 28 l24 16" stroke="#1a1208" stroke-width="3.4" fill="none" stroke-linejoin="round"/><path d="M${R + 12} ${Bt - 30} l-30 -20 l10 -28 l-24 -16" stroke="#1a1208" stroke-width="3.4" fill="none" stroke-linejoin="round"/>`;
    for (let i = 0; i < 4; i++) s += `<path d="M${cx - 66 + i * 44} ${T - 14} l8 -10 l8 10 l-8 8Z M${cx - 66 + i * 44} ${Bt + 12} l8 -8 l8 8 l-8 10Z" fill="none" stroke="#e6d8bc" stroke-width="2" opacity="${f(0.5 + 0.4 * Math.sin(TAU * (t + i / 4)))}"/>`;
    // صخرة صغيرة بجوهرة خضراء
    s += `<g transform="translate(${R + 4} ${T - 4})"><path d="M-14 8 L-18 -6 L-4 -18 L12 -12 L18 6Z" fill="url(#s)" stroke="#1a1208" stroke-width="2"/><path d="M-4 -4 L2 -16 L8 -4 L2 6Z" fill="#6affc8" stroke="#fff" stroke-width="1.2"/></g>`;
    s += twinkle(t, 3, "#e6d8bc", 85);
    return wrap(s);
}
// ---- البرق: سيّد العواصف ----
function thunderTop(t) {
    let s = gdefs(grad("tg", [[0, "#eef2ff"], [0.5, "#7a86c8"], [1, "#1c2150"]]));
    s += `<ellipse cx="200" cy="205" rx="195" ry="185" fill="#6a7cff" opacity=".16" filter="url(#g8)"/>`;
    const cloud = (x, y, sc, c) => `<g transform="translate(${x} ${y}) scale(${sc})" fill="${c}"><ellipse rx="46" ry="18"/><circle cx="-28" cy="-10" r="20"/><circle cx="6" cy="-20" r="26"/><circle cx="34" cy="-8" r="19"/></g>`;
    s += cloud(L - 6, T - 8, 1.1, "#2c3470") + cloud(R + 6, T - 8, 1.1, "#2c3470") + cloud(cx, T - 36, 1.6, "#3a4488");
    s += ring("tg", "round", 6, 12);
    // إعصار قمعي على الجانب الأيمن
    for (let i = 0; i < 6; i++) { const w = 38 - i * 5, y = T + 20 + i * 36 + 0, sh = 6 * Math.sin(TAU * (t + i / 6)); s += `<path d="M${R + 20 + sh - w / 2} ${y} q${w / 2} 10 ${w} 0" stroke="#aab4ff" stroke-width="4" fill="none" stroke-linecap="round" opacity=".9"/>`; }
    // تاج صواعق
    const bolt = (x, y, a, sc, c) => `<g transform="translate(${x} ${y}) rotate(${a}) scale(${sc})"><path d="M0 -40 L-12 4 L-1 4 L-10 40 L18 -8 L5 -8 L14 -40Z" fill="${c}" stroke="#fff" stroke-width="2" stroke-linejoin="round"/></g>`;
    s += bolt(cx - 40, T - 46, -20, 0.8, "#ffe14a") + bolt(cx, T - 58, 0, 1, "#fff08a") + bolt(cx + 40, T - 46, 20, 0.8, "#ffe14a");
    const ph = Math.floor(t * 8);
    s += `<path d="M${L - 10} ${T + 10} l${rnd(ph) * 12 - 6} 30 l${rnd(ph + 3) * 14 - 7} 30 l${rnd(ph + 6) * 14 - 7} 30" stroke="#9cf3ff" stroke-width="3" fill="none" opacity="${f(0.5 + 0.5 * (ph % 2))}"/>`;
    s += `<rect width="400" height="400" fill="#fff" opacity="${f(Math.max(0, Math.sin(TAU * t * 2) - 0.92) * 1.2)}"/>`;
    return wrap(s);
}
function thunderPart(t) {
    let s = gdefs(grad("y", [[0, "#fffbd0"], [0.5, "#ffd22a"], [1, "#a8741a"]]));
    s += `<ellipse cx="200" cy="205" rx="186" ry="176" fill="#ffe14a" opacity=".12" filter="url(#g8)"/>`;
    s += ring("y", "round", 6, 10);
    // حلقة طاقة تدور من 3 صواعق صغيرة
    for (let i = 0; i < 3; i++) { const a = 360 * (t + i / 3), [x, y] = pt(cx, cy, 0, a); s += `<g transform="translate(${cx} ${cy}) rotate(${a}) translate(${win.w / 2 + 28} 0) rotate(90)"><path d="M0 -16 L-6 2 L-1 2 L-5 16 L8 -4 L2 -4 L6 -16Z" fill="#ffe14a" stroke="#fff" stroke-width="1.4"/></g>`; }
    // كرة طاقة أسفل ونجمة
    s += `<circle cx="${cx}" cy="${Bt + 20}" r="14" fill="#ffe14a" opacity="${f(0.3 + 0.2 * Math.sin(TAU * t * 2))}" filter="url(#g)"/><circle cx="${cx}" cy="${Bt + 20}" r="8" fill="#fffbd0" stroke="#ffd22a" stroke-width="2"/>`;
    s += `<path d="M${L - 10} ${T - 4} l10 -12 l4 8 l10 -10" stroke="#ffe14a" stroke-width="3" fill="none"/><path d="M${R + 10} ${Bt + 4} l-10 12 l-4 -8 l-10 10" stroke="#ffe14a" stroke-width="3" fill="none"/>`;
    s += twinkle(t, 5, "#fff6a8", 87);
    return wrap(s);
}
// ---- النور: حارس الفجر ----
function lightTop(t) {
    let s = gdefs(grad("w", [[0, "#ffffff"], [1, "#ffe9a0"]]) + rgrad("sun", [[0, "#ffffff"], [0.5, "#fff0a0"], [1, "#ffb02a"]]));
    s += `<ellipse cx="200" cy="205" rx="195" ry="185" fill="#fff0a0" opacity=".26" filter="url(#g8)"/>`;
    // بوابة فجر: قوس مع شمس مشرقة نصف دائرية وأشعة
    for (let i = 0; i < 13; i++) { const a = -180 + i * 15 + 3 * Math.sin(TAU * t), [x1, y1] = pt(cx, T - 10, 70, a), [x2, y2] = pt(cx, T - 10, 130 + 14 * (i % 2), a); s += `<path d="M${f(x1)} ${f(y1)} L${f(x2)} ${f(y2)}" stroke="#fff3a0" stroke-width="6" stroke-linecap="round" opacity=".85"/>`; }
    s += `<path d="M${cx - 62} ${T - 6} A62 62 0 0 1 ${cx + 62} ${T - 6}Z" fill="url(#sun)" stroke="url(#gd)" stroke-width="4"/>`;
    s += ring("gd", "arch", 6, 14) + thin("#fff", "arch", 0, 2);
    // جناحا ريش ملائكي
    for (let k = 0; k < 6; k++) s += mirror(`<g transform="translate(${L - 6} ${cy + 20 - 8 * k}) rotate(${-120 + k * 14})"><path d="M0 0 C10 -10 12 -40 0 -${60 - k * 4} C-12 -40 -10 -10 0 0Z" fill="url(#w)" stroke="#e8c36a" stroke-width="1.4"/></g>`);
    s += twinkle(t, 9, "#fff", 89, 180);
    return wrap(s);
}
function lightPart(t) {
    let s = gdefs(rgrad("sun", [[0, "#ffffff"], [0.5, "#fff0a0"], [1, "#ffb02a"]]));
    s += `<ellipse cx="200" cy="205" rx="188" ry="178" fill="#fff0a0" opacity=".2" filter="url(#g8)"/>`;
    s += ring("gd", "round", 6, 12) + thin("#fff", "round", 1, 2);
    // قرص شمس صغير بأشعة قصيرة أعلى الإطار ودرع
    s += `<g transform="translate(${cx} ${T - 18})">${Array.from({ length: 12 }, (_, i) => `<path d="M0 -26 L0 -36" stroke="#ffd04a" stroke-width="4" stroke-linecap="round" transform="rotate(${i * 30 + 360 * t * 0.3})"/>`).join("")}<circle r="20" fill="url(#sun)" stroke="url(#gd)" stroke-width="3"/></g>`;
    s += `<g transform="translate(${R + 8} ${Bt - 4})"><path d="M-16 -22 L16 -22 L16 0 Q16 18 0 26 Q-16 18 -16 0Z" fill="#fff8d0" stroke="url(#gd)" stroke-width="3"/><path d="M0 -14 L0 14 M-9 -2 L9 -2" stroke="#ffb02a" stroke-width="3"/></g>`;
    s += twinkle(t, 7, "#fff", 91, 175);
    return wrap(s);
}
// ---- الظلام: ملك الظلام ----
function darkTop(t) {
    let s = gdefs(grad("d", [[0, "#c08aff"], [0.5, "#4a1a8a"], [1, "#0a0218"]]));
    s += `<rect width="400" height="400" fill="#07020f" opacity=".55"/><ellipse cx="200" cy="205" rx="195" ry="185" fill="#8a2aff" opacity=".22" filter="url(#g8)"/>`;
    // عباءة ظل تنساب على الجانبين
    s += mirror(`<path d="M${L - 4} ${T - 10} C${L - 60} ${T + 40} ${L - 40} ${cy + 40} ${L - 70} ${Bt + 30} C${L - 30} ${Bt + 10} ${L + 0} ${Bt + 20} ${L - 4} ${Bt + 14}Z" fill="#14041f" stroke="#a04aff" stroke-width="1.6"/>`);
    s += ring("d", "oct", 6, 15) + thin("#d8b8ff", "oct", 0, 2);
    // تاج أشواك أسود بعيون
    s += `<g transform="translate(${cx} ${T - 6})"><path d="M-70 6 L-64 -40 L-44 -12 L-30 -66 L-14 -16 L0 -78 L14 -16 L30 -66 L44 -12 L64 -40 L70 6Z" fill="#14041f" stroke="#b04aff" stroke-width="2.6" stroke-linejoin="round"/>${[-44, 0, 44].map((x, i) => `<ellipse cx="${x}" cy="-6" rx="9" ry="6" fill="#b04aff" opacity="${f(0.7 + 0.3 * Math.sin(TAU * (t + i / 3)))}"/><ellipse cx="${x}" cy="-6" rx="2.4" ry="5.4" fill="#07020f"/>`).join("")}</g>`;
    // سلاسل وجمرات بنفسجية
    const chain = (x) => { let c = ""; for (let i = 0; i < 6; i++) c += `<ellipse cx="${x + 3 * Math.sin(TAU * t + i)}" cy="${Bt + 4 + i * 11}" rx="${i % 2 ? 3 : 6}" ry="${i % 2 ? 6 : 4}" fill="none" stroke="#9a8ab8" stroke-width="2.6"/>`; return c; };
    s += chain(L + 14) + chain(R - 14);
    for (let i = 0; i < 12; i++) { const k = (t + rnd(i)) % 1; s += `<circle cx="${f(24 + rnd(i + 2) * 352)}" cy="${f(390 - k * 380)}" r="${f(1.2 + 2 * (1 - k))}" fill="#b04aff" opacity="${f(Math.sin(k * Math.PI))}"/>`; }
    return wrap(s);
}
function darkPart(t) {
    let s = gdefs(grad("d", [[0, "#b07aff"], [1, "#1a0630"]]));
    s += `<rect width="400" height="400" fill="#07020f" opacity=".4"/><ellipse cx="200" cy="205" rx="186" ry="176" fill="#8a2aff" opacity=".18" filter="url(#g8)"/>`;
    s += ring("d", "round", 6, 12);
    // مخالب ظل تخرج من الأسفل
    for (let i = 0; i < 6; i++) { const x = L + 10 + i * 46, h = 24 + 18 * rnd(i + 4) + 5 * Math.sin(TAU * (t + i / 6)); s += `<path d="M${x - 8} ${Bt + 8} Q${x - 2} ${Bt + 8 + h * .5} ${x + 8} ${Bt + 8 + h} Q${x + 8} ${Bt + 8 + h * .4} ${x + 8} ${Bt + 8}Z" fill="#14041f" stroke="#b04aff" stroke-width="1.6"/>`; }
    // عين واحدة في الأعلى وهلال
    s += `<g transform="translate(${cx} ${T - 12})"><path d="M-32 0 Q0 -28 32 0 Q0 28 -32 0Z" fill="#14041f" stroke="url(#d)" stroke-width="4"/><circle r="10" fill="#b04aff"/><ellipse rx="3" ry="9" fill="#07020f"/></g>`;
    s += `<g transform="translate(${R + 6} ${T + 8})"><circle r="13" fill="#cfa6ff"/><circle cx="6" cy="-2" r="11" fill="#07020f"/></g>`;
    return wrap(s);
}
module.exports = { fireTop, firePart, waterTop, waterPart, plantTop, plantPart, earthTop, earthPart, thunderTop, thunderPart, lightTop, lightPart, darkTop, darkPart };
