// دفعة 3 (ب) + 4: الأساطير (8) + الكلاسيكية (8) + المزخرفة (6)
const K = require("../kit");
const { f, rnd, TAU, win, cx, cy, L, R, T, Bt, mirror, at, pt, star, twinkle, glowDefs, grad, rgrad, GOLD, SILVER, wrap, rr, body, ring, thin } = K;
const D = (extra = "") => `<defs>${glowDefs}${grad("gd", GOLD)}${grad("sv", SILVER)}${extra}</defs>`;
const corners = (fn) => [[L, T, 1, 1], [R, T, -1, 1], [L, Bt, 1, -1], [R, Bt, -1, -1]].map(([x, y, sx, sy]) => `<g transform="translate(${x} ${y}) scale(${sx} ${sy})">${fn()}</g>`).join("");
const gem = (x, y, r, c, c2 = "#fff") => `<g transform="translate(${x} ${y})"><path d="M0 ${-r} L${r * .8} 0 L0 ${r} L${-r * .8} 0Z" fill="${c}" stroke="${c2}" stroke-width="1.6"/><path d="M0 ${-r} L0 ${r} M${-r * .8} 0 L${r * .8} 0" stroke="${c2}" stroke-width=".8" opacity=".7"/></g>`;
// ===== الأساطير =====
function collector(t) { // جامع: رفوف وكنوز
    let s = D(); s += `<ellipse cx="200" cy="205" rx="190" ry="180" fill="#ffd04a" opacity=".14" filter="url(#g8)"/>` + ring("gd", "bevel", 6, 14);
    s += `<path d="M${L - 12} ${Bt + 10} h${win.w + 24}" stroke="url(#gd)" stroke-width="8"/>`;
    [["#ff5a8a", 0], ["#4acbff", 1], ["#7aff9a", 2], ["#ffd04a", 3], ["#c08aff", 4]].forEach(([c, i]) => s += gem(L + 18 + i * 52, Bt - 6 + 3 * Math.sin(TAU * (t + i / 5)), 12, c));
    s += `<g transform="translate(${cx} ${T - 14})"><rect x="-26" y="-4" width="52" height="30" rx="5" fill="#7a4a1a" stroke="url(#gd)" stroke-width="3"/><path d="M-26 6 h52 M0 -4 v30" stroke="url(#gd)" stroke-width="2.4"/><circle cy="12" r="4" fill="#ffd04a"/></g>`;
    return wrap(s + twinkle(t, 6, "#fff6a8", 101));
}
function star5(t) { // خمس نجوم
    let s = D(); s += `<ellipse cx="200" cy="205" rx="190" ry="180" fill="#ffd04a" opacity=".16" filter="url(#g8)"/>` + ring("gd", "round", 6, 11);
    for (let i = 0; i < 5; i++) { const a = -180 + i * 45 + 8 * Math.sin(TAU * t), [x, y] = pt(cx, cy, win.w / 2 + 34, a); s += star(x, y, 1.3 + (i === 2 ? 0.7 : 0), "#ffd04a") ; }
    return wrap(s + twinkle(t, 8, "#fff", 103));
}
function perfect(t) { // مثالي: ماسة
    let s = D(grad("dm", [[0, "#ffffff"], [0.5, "#9af0ff"], [1, "#3a7ad0"]])); s += `<ellipse cx="200" cy="205" rx="190" ry="180" fill="#9af0ff" opacity=".18" filter="url(#g8)"/>` + ring("dm", "oct", 6, 13) + thin("#fff", "oct", 0, 2);
    s += `<g transform="translate(${cx} ${T - 26})"><path d="M-36 0 L-22 -22 L22 -22 L36 0 L0 36Z" fill="url(#dm)" stroke="#fff" stroke-width="2.4"/><path d="M-36 0 H36 M-12 0 L-22 -22 M12 0 L22 -22 M-12 0 L0 36 M12 0 L0 36" stroke="#fff" stroke-width="1.2" opacity=".8"/></g>`;
    s += corners(() => `<path d="M-6 6 L26 6 M6 -6 L6 26" stroke="url(#dm)" stroke-width="5" stroke-linecap="round"/>`);
    return wrap(s + twinkle(t, 9, "#fff", 105));
}
function slayer(t) { // قاتل زعماء: سيوف متقاطعة وجمجمة
    let s = D(grad("sw", [[0, "#fff"], [1, "#8a98b8"]])) ; s += `<ellipse cx="200" cy="205" rx="190" ry="180" fill="#ff3a3a" opacity=".14" filter="url(#g8)"/>` + ring("sv", "bevel", 6, 14);
    s += `<g transform="translate(${cx} ${T - 18})"><path d="M-62 -26 L62 30 M62 -26 L-62 30" stroke="url(#sw)" stroke-width="9" stroke-linecap="round"/><path d="M-62 -26 L62 30 M62 -26 L-62 30" stroke="#2a3048" stroke-width="2" stroke-linecap="round"/><circle cy="0" r="18" fill="#f4efe6" stroke="#2a2a2a" stroke-width="2.4"/><circle cx="-6" cy="-2" r="4" fill="#222"/><circle cx="6" cy="-2" r="4" fill="#222"/><path d="M-5 9 h10" stroke="#222" stroke-width="2"/></g>`;
    s += mirror(`<path d="M${L - 6} ${T + 20} l-14 40 l10 6 l8 -30 M${L - 6} ${T + 90} l-14 40 l10 6 l8 -30" fill="#c8281a" opacity="${f(.6 + .3 * Math.sin(TAU * t))}"/>`);
    return wrap(s);
}
function mvp(t) { // MVP: تاج ولوريل
    let s = D(); s += `<ellipse cx="200" cy="205" rx="190" ry="180" fill="#ffd04a" opacity=".2" filter="url(#g8)"/>` + ring("gd", "round", 6, 13);
    const lau = (sg) => Array.from({ length: 9 }, (_, i) => { const a = 110 + i * 17; const [x, y] = pt(cx, cy, win.w / 2 + 22, sg > 0 ? a : 180 - a); return `<ellipse cx="${f(x)}" cy="${f(y)}" rx="6" ry="13" fill="#3acb5a" stroke="#0a3a1a" stroke-width="1.2" transform="rotate(${f((sg > 0 ? a : 180 - a) + 90)} ${f(x)} ${f(y)})"/>`; }).join("");
    s += lau(1) + lau(-1);
    s += `<g transform="translate(${cx} ${T - 30})"><path d="M-34 14 L-40 -20 L-18 -4 L0 -32 L18 -4 L40 -20 L34 14Z" fill="url(#gd)" stroke="#5a3208" stroke-width="2.4" stroke-linejoin="round"/>${gem(0, -2, 7, "#ff4a6a")}</g>`;
    s += `<text x="${cx}" y="${Bt + 30}" text-anchor="middle" font-size="26" font-weight="900" fill="url(#gd)" stroke="#5a3208" stroke-width="1.2" font-family="sans-serif">MVP</text>`;
    return wrap(s + twinkle(t, 7, "#fff6a8", 107));
}
function frames(t) { // جامع الإطارات: إطارات متداخلة
    let s = D(); s += `<ellipse cx="200" cy="205" rx="190" ry="180" fill="#c08aff" opacity=".14" filter="url(#g8)"/>`;
    [["#ffd04a", 22], ["#ff6a9a", 14], ["#4acbff", 6]].forEach(([c, p], i) => s += body("round", p, `fill="none" stroke="${c}" stroke-width="5" opacity="${f(.7 + .3 * Math.sin(TAU * (t + i / 3)))}"`));
    s += corners(() => `<rect x="-14" y="-14" width="22" height="22" rx="4" fill="none" stroke="url(#gd)" stroke-width="3" transform="rotate(${f(360 * t)} -3 -3)"/>`);
    return wrap(s + twinkle(t, 6, "#fff", 109));
}
function taxes(t) { // ضرائب: عملات
    let s = D(); s += `<ellipse cx="200" cy="205" rx="190" ry="180" fill="#ffd04a" opacity=".12" filter="url(#g8)"/>` + ring("gd", "scallop", 6, 12);
    for (let i = 0; i < 9; i++) { const k = (t + i / 9) % 1, x = L - 10 + (i % 2 ? win.w + 20 : 0), y = T + k * win.h; const sc = Math.abs(Math.cos(TAU * (t * 2 + i / 9))); s += `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(11 * sc + 2)}" ry="11" fill="url(#gd)" stroke="#5a3208" stroke-width="1.6"/>`; }
    s += `<g transform="translate(${cx} ${T - 14})"><circle r="16" fill="url(#gd)" stroke="#5a3208" stroke-width="2.4"/><text y="7" text-anchor="middle" font-size="20" font-weight="900" fill="#5a3208" font-family="sans-serif">$</text></g>`;
    return wrap(s);
}
function master(t) { // الأستاذ: هالة ملكية بنجمة
    let s = D(grad("mr", [[0, "#fff0a0"], [0.5, "#ff9a3a"], [1, "#a0224a"]])); s += `<ellipse cx="200" cy="205" rx="195" ry="185" fill="#ff9a3a" opacity=".22" filter="url(#g8)"/>`;
    for (let i = 0; i < 16; i++) { const a = i * 22.5 + 360 * t * .2, [x1, y1] = pt(cx, cy, 148, a), [x2, y2] = pt(cx, cy, i % 2 ? 168 : 186, a); s += `<path d="M${f(x1)} ${f(y1)}L${f(x2)} ${f(y2)}" stroke="url(#mr)" stroke-width="6" stroke-linecap="round"/>`; }
    s += ring("mr", "round", 6, 15) + thin("#fff", "round", 0, 2);
    s += star(cx, T - 28, 2.2, "#ffd04a");
    s += mirror(`<path d="M${L - 6} ${cy} C${L - 50} ${cy - 40} ${L - 40} ${cy - 90} ${L - 10} ${cy - 120} C${L - 20} ${cy - 70} ${L - 6} ${cy - 40} ${L - 6} ${cy}Z" fill="url(#mr)" stroke="#fff" stroke-width="1.4"/>`);
    return wrap(s + twinkle(t, 10, "#fff", 111, 185));
}
// ===== الكلاسيكية =====
function classic(t) { // ورق بولارويد قديم
    let s = D(); s += body("bevel", 8, `fill="none" stroke="#f4efe2" stroke-width="22"`) + body("bevel", 8, `fill="none" stroke="#b8aa8a" stroke-width="2"`);
    s += corners(() => `<path d="M-2 -2 L22 -2 L-2 22Z" fill="#8a7a58"/>`);
    s += `<rect x="${cx - 40}" y="${Bt + 4}" width="80" height="14" rx="3" fill="#d8ccb0" opacity="${f(.8)}"/>`;
    return wrap(s);
}
function ice(t) { // جليد: قوارض متدلية
    let s = D(grad("ic", [[0, "#ffffff"], [1, "#6ac0ff"]])); s += `<ellipse cx="200" cy="205" rx="188" ry="178" fill="#aef" opacity=".16" filter="url(#g8)"/>` + ring("ic", "round", 6, 11);
    for (let i = 0; i < 11; i++) { const x = L + 6 + i * (win.w - 12) / 10, h = 26 + 40 * rnd(i + 20); s += `<path d="M${f(x - 9)} ${T - 2} L${f(x)} ${f(T - 2 + h)} L${f(x + 9)} ${T - 2}Z" fill="url(#ic)" stroke="#fff" stroke-width="1.4" opacity=".95"/>`; }
    s += twinkle(t, 7, "#fff", 113);
    return wrap(s);
}
function sakura(t) { // فرع ساكورا بأوراق متساقطة وشريطة
    let s = D(); s += `<ellipse cx="200" cy="205" rx="188" ry="178" fill="#ff9ac8" opacity=".14" filter="url(#g8)"/>` + body("round", 8, `fill="none" stroke="#ffc0d8" stroke-width="10"`);
    s += `<path d="M${L - 30} ${T + 10} C${L + 40} ${T - 30} ${cx} ${T - 16} ${R + 20} ${T - 44}" stroke="#5a3a2a" stroke-width="7" fill="none" stroke-linecap="round"/>`;
    [[L + 10, T - 8], [cx - 40, T - 20], [cx + 30, T - 22], [R - 10, T - 38]].forEach(([x, y], i) => { for (let k = 0; k < 5; k++) s += `<ellipse cx="${x}" cy="${y - 9}" rx="5" ry="9" fill="#ffb0d0" stroke="#e8709a" stroke-width="1" transform="rotate(${k * 72} ${x} ${y})"/>`; s += `<circle cx="${x}" cy="${y}" r="2.6" fill="#ffe14a"/>`; });
    for (let i = 0; i < 8; i++) { const k = (t + i / 8) % 1; s += `<ellipse cx="${f(30 + rnd(i) * 340 + 14 * Math.sin(TAU * k))}" cy="${f(60 + k * 340)}" rx="4" ry="7" fill="#ffb0d0" opacity="${f(Math.sin(k * Math.PI))}" transform="rotate(${f(k * 360)} 200 200)"/>`; }
    return wrap(s);
}
function fire(t) { // نار: ماجما متشققة
    let s = D(grad("mg", [[0, "#ffe27a"], [1, "#ff2a0a"]])); s += `<ellipse cx="200" cy="205" rx="190" ry="180" fill="#ff4a1a" opacity=".18" filter="url(#g8)"/>` + body("bevel", 8, `fill="none" stroke="#2a0a06" stroke-width="22"`);
    const ph = 0.6 + 0.4 * Math.sin(TAU * t);
    s += body("bevel", 8, `fill="none" stroke="url(#mg)" stroke-width="3" stroke-dasharray="26 10 6 10" opacity="${f(ph)}"`);
    s += corners(() => `<path d="M0 0 l16 8 l-4 12 l14 10" stroke="url(#mg)" stroke-width="3" fill="none" opacity="${f(ph)}"/>`);
    for (let i = 0; i < 10; i++) { const k = (t + rnd(i)) % 1; s += `<circle cx="${f(24 + rnd(i + 5) * 352)}" cy="${f(380 - k * 360)}" r="${f(1.5 + 2 * (1 - k))}" fill="#ffb04a" opacity="${f(Math.sin(k * Math.PI))}"/>`; }
    return wrap(s);
}
function neon(t) { // نيون: أنبوب مع زوايا دارة
    let s = D(); const c = `hsl(${f(300 + 40 * Math.sin(TAU * t))},100%,65%)`; s += body("round", 8, `fill="none" stroke="${c}" stroke-width="9" filter="url(#g2)"`) + body("round", 8, `fill="none" stroke="#fff" stroke-width="2.4"`);
    s += corners(() => `<path d="M10 30 V10 H30 M10 10 L-6 -6" stroke="#4aeaff" stroke-width="3" fill="none" filter="url(#g)"/><circle cx="-8" cy="-8" r="4" fill="#4aeaff"/>`);
    return wrap(s);
}
function thunder(t) { // صاعقة: حد متعرج كهربائي
    let s = D(); const ph = Math.floor(t * 8); let p = `M${L - 8} ${T - 8}`; const seg = (x0, y0, x1, y1, n, sd) => { let q = ""; for (let i = 1; i <= n; i++) { const x = x0 + (x1 - x0) * i / n, y = y0 + (y1 - y0) * i / n; q += ` L${f(x + (i < n ? (rnd(sd + i + ph) - .5) * 14 : 0))} ${f(y + (i < n ? (rnd(sd + i + ph + 9) - .5) * 14 : 0))}`; } return q; };
    p += seg(L - 8, T - 8, R + 8, T - 8, 14, 1) + seg(R + 8, T - 8, R + 8, Bt + 8, 14, 20) + seg(R + 8, Bt + 8, L - 8, Bt + 8, 14, 40) + seg(L - 8, Bt + 8, L - 8, T - 8, 14, 60) + "Z";
    s += `<path d="${p}" fill="none" stroke="#7a8aff" stroke-width="8" filter="url(#g2)" opacity=".8"/><path d="${p}" fill="none" stroke="#fff" stroke-width="2.4"/>`;
    return wrap(s + twinkle(t, 5, "#ffe14a", 115));
}
function gold(t) { // ذهب: زخرفة باروك
    let s = D(); s += ring("gd", "round", 6, 16) + thin("#5a3208", "round", 12, 1.6);
    s += corners(() => `<path d="M-4 -4 C30 -6 40 10 24 22 C16 14 22 4 8 8 C10 24 -4 36 -4 36Z" fill="url(#gd)" stroke="#5a3208" stroke-width="1.6"/><circle cx="26" cy="-2" r="5" fill="url(#gd)" stroke="#5a3208" stroke-width="1.4"/>`);
    s += `<g transform="translate(${cx} ${T - 8})"><path d="M-30 6 C-24 -14 -8 -10 0 -22 C8 -10 24 -14 30 6 C16 0 8 8 0 14 C-8 8 -16 0 -30 6Z" fill="url(#gd)" stroke="#5a3208" stroke-width="1.8"/></g>`;
    return wrap(s + twinkle(t, 6, "#fff6a8", 117));
}
function galaxy(t) { // مجرة: كوكب بحلقة مائلة
    let s = D(grad("pl", [[0, "#c8a0ff"], [1, "#2a1a6a"]])); s += `<rect width="400" height="400" fill="#0a0820" opacity=".3"/>` + body("round", 8, `fill="none" stroke="#2a1a6a" stroke-width="14"`) + body("round", 8, `fill="none" stroke="#8a6aff" stroke-width="2" stroke-dasharray="2 8"`);
    s += `<g transform="translate(${R + 6} ${T - 4})"><circle r="26" fill="url(#pl)"/><ellipse rx="44" ry="10" fill="none" stroke="#ffd04a" stroke-width="4" transform="rotate(-20)" opacity=".9"/></g>`;
    const [mx, my] = pt(cx, cy, win.w / 2 + 40, 360 * t); s += `<circle cx="${f(mx)}" cy="${f(my)}" r="6" fill="#fff" filter="url(#g)"/>`;
    return wrap(s + twinkle(t, 14, "#fff", 119, 190));
}
// ===== المزخرفة (6 ألوان بأشكال مختلفة) =====
function ornBase(c1, c2, c3, shape) { return (t) => { let s = D(grad("or", [[0, c1], [0.5, c2], [1, c3]])); s += `<ellipse cx="200" cy="205" rx="190" ry="180" fill="${c2}" opacity=".16" filter="url(#g8)"/>` + ring("or", shape, 6, 14) + thin("#fff", shape, 0, 1.6); return { s, t }; }; }
const mk = (c1, c2, c3, shape, deco) => (t) => { const b = ornBase(c1, c2, c3, shape)(t); return wrap(b.s + deco(t, c1, c2) + twinkle(t, 5, c1, 121)); };
const violet = mk("#e8c8ff", "#8a3ad8", "#2a0a5a", "oct", (t, a, b) => gem(cx, T - 16, 20, b) + corners(() => `<path d="M0 0 L16 0 L0 16Z" fill="${b}" stroke="#fff" stroke-width="1.4"/>`));
const azure = mk("#c8f0ff", "#2a8ad8", "#0a2a6a", "scallop", (t, a, b) => { let s = ""; for (let i = 0; i < 5; i++) s += `<path d="M${L + 10 + i * 56} ${T - 8} q14 -22 28 0" stroke="${a}" stroke-width="4" fill="none"/>`; return s + gem(cx, Bt + 14, 14, b); });
const emerald = mk("#c8ffd8", "#2aa860", "#0a3a1a", "round", (t, a, b) => corners(() => `<path d="M0 0 C20 -2 30 16 14 26 C16 14 8 8 0 12Z" fill="${b}" stroke="#fff" stroke-width="1.2"/><path d="M4 4 C14 8 22 14 18 22" stroke="#fff" stroke-width="1" fill="none"/>`) + gem(cx, T - 16, 16, a));
const crimson = mk("#ffd0d0", "#d82a3a", "#4a0610", "bevel", (t, a, b) => { let s = ""; for (let i = 0; i < 7; i++) s += `<path d="M${L + 4 + i * 40} ${T - 4} l8 -${22 + 8 * (i % 2)} l8 ${22 + 8 * (i % 2)}Z" fill="${b}" stroke="#fff" stroke-width="1.2"/>`; return s; });
const solar = mk("#fff6c0", "#ffb02a", "#8a4a08", "round", (t, a, b) => { let s = ""; for (let i = 0; i < 12; i++) { const an = i * 30 + 360 * t * .3, [x1, y1] = pt(cx, cy, 146, an), [x2, y2] = pt(cx, cy, 172, an); s += `<path d="M${f(x1)} ${f(y1)}L${f(x2)} ${f(y2)}" stroke="${b}" stroke-width="5" stroke-linecap="round"/>`; } return s; });
const voidF = mk("#d0d0ff", "#4a3a9a", "#06041a", "arch", (t, a, b) => { let s = ""; for (let i = 0; i < 3; i++) { const r = 20 + i * 12 + 3 * Math.sin(TAU * (t + i / 3)); s += `<ellipse cx="${cx}" cy="${T - 8}" rx="${r}" ry="${r * .4}" fill="none" stroke="${a}" stroke-width="2" opacity="${f(.9 - i * .25)}"/>`; } return s; });
module.exports = { collector, star5, perfect, slayer, mvp, frames, taxes, master, classic, ice, sakura, fire, neon, thunder, gold, galaxy, violet, azure, emerald, crimson, solar, voidF };
