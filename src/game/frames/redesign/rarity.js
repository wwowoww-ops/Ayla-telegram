// دفعة 2 (أ): إطارات الندرة (7) من الشائع إلى السماوي — كل مستوى أفخم وبهيكل مختلف
const K = require("../kit");
const { f, rnd, TAU, win, cx, cy, L, R, T, Bt, mirror, at, pt, star, twinkle, glowDefs, grad, rgrad, GOLD, SILVER, wrap, rr, body, ring, thin, heart } = K;

// 0) شائع: جلد/خشب مخيّط بمسامير وغصن صغير
function common(t) {
    let s = `<defs>${glowDefs}${grad("w", [[0, "#c9a67a"], [1, "#6a4a2a"]])}</defs>`;
    s += ring("w", "round", 6, 14) + thin("#e9d3ae", "round", 6, 2) + body("round", 6, `fill="none" stroke="#3a2412" stroke-width="2" stroke-dasharray="6 6" opacity=".8"`);
    [[L - 4, T - 4], [R + 4, T - 4], [L - 4, Bt + 4], [R + 4, Bt + 4], [cx, T - 8], [cx, Bt + 8], [L - 8, cy], [R + 8, cy]].forEach(([x, y]) => { s += `<circle cx="${x}" cy="${y}" r="6" fill="#b9b2a0" stroke="#3a2412" stroke-width="1.6"/><circle cx="${x - 1.5}" cy="${y - 1.5}" r="2" fill="#fff" opacity=".7"/>`; });
    s += `<g transform="translate(${R + 6} ${Bt + 10}) rotate(${f(4 * Math.sin(TAU * t))})"><path d="M0 0 C10 -6 14 -18 4 -26 C-2 -14 -8 -8 0 0Z" fill="#6ab05a"/><path d="M-8 4 C-18 -2 -22 -14 -12 -20 C-8 -10 -4 -4 -8 4Z" fill="#4a9a4a"/></g>`;
    return wrap(s);
}
// 1) غير شائع: حبل أخضر ملتف مع عقدة وفيونكة وأوراق برسيم
function uncommon(t) {
    let s = `<defs>${glowDefs}${grad("gu", [[0, "#b8f0a0"], [1, "#2a8a3a"]])}</defs>`;
    s += ring("gu", "round", 8, 11) + body("round", 8, `fill="none" stroke="#e8ffd8" stroke-width="3" stroke-dasharray="10 9" opacity=".75"`);
    s += ring("gu", "round", 2, 4);
    // فيونكة في الأعلى
    s += `<g transform="translate(${cx} ${T - 10})"><path d="M0 0 C-30 -22 -44 -6 -34 10 C-22 14 -8 8 0 0Z M0 0 C30 -22 44 -6 34 10 C22 14 8 8 0 0Z" fill="#3aa84a" stroke="#0a4a1a" stroke-width="2"/><circle r="7" fill="#7ad86a" stroke="#0a4a1a" stroke-width="2"/><path d="M-4 6 L-14 30 M4 6 L14 30" stroke="#3aa84a" stroke-width="7" stroke-linecap="round"/></g>`;
    const clover = (x, y, sc, a) => `<g transform="translate(${x} ${y}) rotate(${a}) scale(${sc})">${[0, 90, 180, 270].map(r => `<ellipse cy="-8" rx="6.5" ry="8" fill="#4acb5a" stroke="#0a4a1a" stroke-width="1.2" transform="rotate(${r})"/>`).join("")}<path d="M0 0 q4 12 -2 20" stroke="#2a8a3a" stroke-width="2" fill="none"/></g>`;
    s += clover(L - 10, Bt + 8, 1.2, -20 + 6 * Math.sin(TAU * t)) + clover(R + 10, Bt + 8, 1.2, 20 - 6 * Math.sin(TAU * t)) + clover(L - 8, T + 90, 0.9, -40) + clover(R + 8, T + 150, 0.9, 40);
    s += twinkle(t, 4, "#e8ffd8", 41);
    return wrap(s);
}
// 2) نادر: درع فضي-أزرق بجواهر الأركان ونقوش
function rare(t) {
    let s = `<defs>${glowDefs}${grad("s", SILVER)}${rgrad("j", [[0, "#e0f4ff"], [0.5, "#2a8aff"], [1, "#0a2a8a"]])}</defs>`;
    s += `<ellipse cx="200" cy="208" rx="185" ry="172" fill="#3a8aff" opacity=".16" filter="url(#g8)"/>`;
    s += ring("s", "oct", 8, 16) + thin("#9ad0ff", "oct", 0, 2.4) + thin("#fff", "oct", 15, 1.6, 0.7);
    // جوهرات في الأركان الأربعة وفي منتصف الأضلاع
    [[L - 4, T - 4], [R + 4, T - 4], [L - 4, Bt + 4], [R + 4, Bt + 4]].forEach(([x, y]) => { s += `<path d="M${x} ${y - 20} L${x + 16} ${y} L${x} ${y + 20} L${x - 16} ${y}Z" fill="url(#j)" stroke="url(#s)" stroke-width="3"/><path d="M${x} ${y - 20} L${x + 16} ${y} L${x} ${y}Z" fill="#fff" opacity=".35"/>`; });
    s += `<path d="M${cx - 40} ${T - 12} L${cx} ${T - 40} L${cx + 40} ${T - 12} L${cx} ${T - 8}Z" fill="url(#s)" stroke="#2a4a8a" stroke-width="2"/><circle cx="${cx}" cy="${T - 22}" r="7" fill="url(#j)" stroke="#fff" stroke-width="1.6"/>`;
    // نقوش رونية على الجانبين
    [-1, 1].forEach(sg => { for (let i = 0; i < 3; i++) s += `<path d="M${sg < 0 ? L - 14 : R + 14} ${cy - 40 + i * 40} l${sg * 8} -10 l${sg * 8} 10 l${-sg * 8} 10Z" fill="none" stroke="#bfe4ff" stroke-width="2" opacity="${f(0.55 + 0.4 * Math.sin(TAU * (t + i / 3)))}"/>`; });
    s += twinkle(t, 4, "#bfe4ff", 43);
    return wrap(s);
}
// 3) ملحمي: قوس بنفسجي ببرجين بلوريين وجواهر طافية
function epicR(t) {
    let s = `<defs>${glowDefs}${grad("p", [[0, "#e6c8ff"], [0.5, "#8a3aff"], [1, "#2a0a6a"]])}${grad("c", [[0, "#ffffff"], [0.5, "#d28aff"], [1, "#6a1aff"]], 1, 1)}</defs>`;
    s += `<ellipse cx="200" cy="205" rx="190" ry="180" fill="#a04aff" opacity=".2" filter="url(#g8)"/>`;
    s += ring("p", "arch", 7, 15) + thin("#f0dcff", "arch", 0, 2);
    const spire = (x, y, h, w) => `<path d="M${x} ${y} L${x + w} ${y - h * .3} L${x + w * .5} ${y - h} L${x - w * .5} ${y - h * .9} L${x - w} ${y - h * .3}Z" fill="url(#c)" stroke="#fff" stroke-width="2"/><path d="M${x} ${y} L${x + w * .5} ${y - h} L${x} ${y - h * .4}Z" fill="#fff" opacity=".3"/>`;
    s += spire(L - 6, Bt + 4, 150, 18) + spire(R + 6, Bt + 4, 150, 18) + spire(L - 30, Bt + 4, 80, 12) + spire(R + 30, Bt + 4, 80, 12);
    // جواهر طافية تدور
    for (let i = 0; i < 5; i++) { const a = TAU * (t + i / 5), x = cx + 126 * Math.cos(a), y = T - 28 + 22 * Math.sin(a); s += `<path d="M${f(x)} ${f(y - 9)} L${f(x + 7)} ${f(y)} L${f(x)} ${f(y + 9)} L${f(x - 7)} ${f(y)}Z" fill="url(#c)" stroke="#fff" stroke-width="1.4"/>`; }
    s += `<circle cx="${cx}" cy="${T - 18}" r="13" fill="url(#c)" stroke="#fff" stroke-width="2.4"/><circle cx="${cx}" cy="${T - 18}" r="22" fill="#d28aff" opacity="${f(0.2 + 0.15 * Math.sin(TAU * t))}" filter="url(#g)"/>`;
    s += twinkle(t, 7, "#f0dcff", 47);
    return wrap(s);
}
// 4) أسطوري: حلقة ذهبية متموجة وتاج مشع وراية شرائط
function legendary(t) {
    let s = `<defs>${glowDefs}${grad("gd", GOLD)}${grad("r", [[0, "#ff6a5a"], [1, "#8a0a1a"]])}</defs>`;
    s += `<ellipse cx="200" cy="205" rx="195" ry="185" fill="#ffc83a" opacity=".24" filter="url(#g8)"/>`;
    // أشعة قصيرة حول الحلقة
    for (let i = 0; i < 28; i++) { const a = (i / 28) * 360 + 360 * t * 0.1; const [x1, y1] = pt(cx, cy, 160, a), [x2, y2] = pt(cx, cy, 182 + 8 * (i % 2), a); s += `<path d="M${f(x1)} ${f(y1)} L${f(x2)} ${f(y2)}" stroke="#ffe27a" stroke-width="3" stroke-linecap="round" opacity=".7"/>`; }
    s += ring("gd", "scallop", 6, 14) + thin("#fff6c8", "round", 4, 2);
    // تاج مرصّع كبير
    s += `<g transform="translate(${cx} ${T - 4})"><path d="M-62 4 L-70 -46 L-38 -22 L-18 -62 L0 -28 L18 -62 L38 -22 L70 -46 L62 4Z" fill="url(#gd)" stroke="#5a3208" stroke-width="2.4" stroke-linejoin="round"/><rect x="-62" y="-4" width="124" height="14" rx="5" fill="url(#gd)" stroke="#5a3208" stroke-width="2"/>${[[-70, -46, "#4aa8ff"], [-18, -62, "#ff4a6a"], [18, -62, "#ff4a6a"], [70, -46, "#4aa8ff"], [0, -28, "#6aff9a"]].map(([x, y, c]) => `<circle cx="${x}" cy="${y}" r="6.5" fill="${c}" stroke="#fff6c0" stroke-width="1.6"/>`).join("")}</g>`;
    // شريط أحمر ملتف أسفل
    s += `<path d="M${L - 20} ${Bt + 12} L${cx - 30} ${Bt + 28} L${cx + 30} ${Bt + 28} L${R + 20} ${Bt + 12} L${R + 8} ${Bt + 34} L${cx + 30} ${Bt + 42} L${cx - 30} ${Bt + 42} L${L - 8} ${Bt + 34}Z" fill="url(#r)" stroke="url(#gd)" stroke-width="2.4"/>`;
    s += star(cx, Bt + 35, 1.4, "#ffe27a") + twinkle(t, 8, "#fff6c0", 51);
    return wrap(s);
}
// 5) خرافي: سيفان متقاطعان، حلقة رونية تدور، مشاعل
function mythic(t) {
    let s = `<defs>${glowDefs}${grad("m", [[0, "#ff9a8a"], [0.5, "#c8281a"], [1, "#3a0408"]])}${grad("b", SILVER)}</defs>`;
    s += `<ellipse cx="200" cy="205" rx="192" ry="182" fill="#ff2a1a" opacity=".2" filter="url(#g8)"/>`;
    // حلقتان رونيتان تدوران
    const runes = (rx, ry, n, dir, c, sz) => Array.from({ length: n }, (_, i) => { const a = (i / n) * TAU + dir * TAU * t; const x = cx + rx * Math.cos(a), y = cy + ry * Math.sin(a); return `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(a * 180 / Math.PI + 90)})"><path d="M0 -${sz} L${sz * .6} 0 L0 ${sz} L-${sz * .6} 0Z M0 -${sz * .4} L0 ${sz * .4}" fill="none" stroke="${c}" stroke-width="2"/></g>`; }).join("");
    s += runes(win.w / 2 + 40, win.h / 2 + 40, 20, 1, "#ff8a5a", 7) + runes(win.w / 2 + 62, win.h / 2 + 62, 26, -1, "#ffcf6a", 5);
    s += ring("m", "oct", 7, 15) + thin("#ffb0a0", "oct", 0, 2);
    // سيفان متقاطعان أسفل الإطار
    const sword = a => `<g transform="translate(${cx} ${Bt + 16}) rotate(${a})"><path d="M-5 -58 L5 -58 L7 14 L-7 14Z" fill="url(#b)" stroke="#2a3050" stroke-width="1.6"/><path d="M0 -62 L5 -58 L-5 -58Z" fill="#fff"/><rect x="-18" y="14" width="36" height="6" rx="3" fill="url(#m)" stroke="#ffd04a" stroke-width="1.6"/><rect x="-3" y="20" width="6" height="16" fill="#5a3208"/><circle cy="38" r="4" fill="#ffd04a"/></g>`;
    s += sword(58) + sword(-58);
    // مشاعل على الأركان العلوية
    [[L - 8, T - 6], [R + 8, T - 6]].forEach(([x, y], i) => { const fl = 1 + 0.2 * Math.sin(TAU * (t * 2 + i)); s += `<rect x="${x - 3}" y="${y}" width="6" height="30" fill="#5a3208"/><path d="M${x} ${y} C${x + 14} ${y - 12} ${x + 6} ${f(y - 30 * fl)} ${x} ${f(y - 40 * fl)} C${x - 6} ${f(y - 30 * fl)} ${x - 14} ${y - 12} ${x} ${y}Z" fill="#ff7a1a"/><path d="M${x} ${y} C${x + 6} ${y - 8} ${x + 3} ${f(y - 20 * fl)} ${x} ${f(y - 26 * fl)} C${x - 3} ${f(y - 20 * fl)} ${x - 6} ${y - 8} ${x} ${y}Z" fill="#ffe27a"/>`; });
    return wrap(s);
}
// 6) سماوي: هالة سديم قزحية وكويكبات ومذنّب وهلال
function celestial(t) {
    let s = `<defs>${glowDefs}${grad("h", [[0, "#ff9ad8"], [0.33, "#ffe27a"], [0.66, "#6aff9a"], [1, "#6ad8ff"]], 1, 1)}${grad("c", [[0, "#ffffff"], [1, "#a78bff"]])}</defs>`;
    s += `<rect width="400" height="400" fill="#0a0626" opacity=".5"/>`;
    // سديم ملوّن
    [["#ff4aa8", 120, 90, 0], ["#4a8aff", 280, 120, 1], ["#6aff9a", 200, 330, 2], ["#ffd04a", 330, 300, 3]].forEach(([c, x, y, i]) => { s += `<circle cx="${x}" cy="${y}" r="${f(70 + 8 * Math.sin(TAU * (t + i / 4)))}" fill="${c}" opacity=".16" filter="url(#g8)"/>`; });
    // حلقة قوس قزح تتغير ألوانها
    s += `<g style="mix-blend-mode:screen">${body("round", 8, `fill="none" stroke="url(#h)" stroke-width="15" stroke-linejoin="round"`)}</g>` + thin("#fff", "round", 1, 2);
    // مدار بيضاوي وكويكبات
    s += `<ellipse cx="${cx}" cy="${cy}" rx="${win.w / 2 + 62}" ry="${win.h / 2 + 24}" fill="none" stroke="#d8ccff" stroke-width="1.6" opacity=".7" transform="rotate(-18 ${cx} ${cy})"/>`;
    for (let i = 0; i < 3; i++) { const a = TAU * (t + i / 3), x0 = (win.w / 2 + 62) * Math.cos(a), y0 = (win.h / 2 + 24) * Math.sin(a), r = -18 * Math.PI / 180; const X = cx + x0 * Math.cos(r) - y0 * Math.sin(r), Y = cy + x0 * Math.sin(r) + y0 * Math.cos(r); s += `<circle cx="${f(X)}" cy="${f(Y)}" r="${6 + i * 2}" fill="url(#c)" stroke="#fff" stroke-width="1"/>`; }
    // هلال كبير أعلى اليسار ومذنّب
    s += `<g transform="translate(${L - 6} ${T - 26})"><circle r="26" fill="#fff6d0"/><circle cx="11" cy="-5" r="23" fill="#0a0626"/></g>`;
    const k = (t * 1) % 1;
    s += `<g opacity="${f(Math.sin(k * Math.PI))}"><path d="M${f(340 - k * 120)} ${f(30 + k * 90)} l50 -26" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".7"/><circle cx="${f(340 - k * 120)}" cy="${f(30 + k * 90)}" r="5" fill="#fff"/></g>`;
    s += twinkle(t, 14, "#fff", 53, 180);
    return wrap(s);
}
module.exports = { common, uncommon, rare, epicR, legendary, mythic, celestial };
