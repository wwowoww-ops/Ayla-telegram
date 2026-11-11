// إطارات مزخرفة (أجنحة وتاج وجوهرة وتوهّج). تُرسم بالكود بتصميم أصلي ولا تحتاج صورًا.
// كل إطار يحيط بصورة مربعة بزوايا مدوّرة (WIN). للتجربة أضف لونًا جديدًا في PALETTES فقط.
const SIZE = 400;
const WIN = { x: 76, y: 94, w: 248, h: 248, r: 20 };   // نافذة الصورة
const TAU = Math.PI * 2;
const f = n => Number(n.toFixed(2));
const rnd = n => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const mirror = s => `<g>${s}</g><g transform="translate(${SIZE} 0) scale(-1 1)">${s}</g>`;
function star(x, y, s, color) {
    if (s <= 0.05) return "";
    const a = s * 9, b = s * 2;
    return `<path d="M${f(x)} ${f(y - a)} L${f(x + b)} ${f(y - b)} L${f(x + a)} ${f(y)} L${f(x + b)} ${f(y + b)} L${f(x)} ${f(y + a)} L${f(x - b)} ${f(y + b)} L${f(x - a)} ${f(y)} L${f(x - b)} ${f(y - b)} Z" fill="${color}"/>`;
}

// a = لون فاتح، b = متوسط، c = داكن، glow = لون التوهج، gem = لون الجوهرة
const PALETTES = {
    violet:  { a: "#d8b4fe", b: "#9333ea", c: "#3b0764", glow: "#c026d3", gem: "#f3e8ff" },
    azure:   { a: "#bae6fd", b: "#0ea5e9", c: "#0c3a5e", glow: "#38bdf8", gem: "#e0f7ff" },
    emerald: { a: "#a7f3d0", b: "#10b981", c: "#064e3b", glow: "#34d399", gem: "#d1fae5" },
    crimson: { a: "#fecaca", b: "#ef4444", c: "#450a0a", glow: "#f43f5e", gem: "#ffe4e6" },
    solar:   { a: "#fef08a", b: "#f59e0b", c: "#5c3a00", glow: "#fbbf24", gem: "#fffbeb" },
    void:    { a: "#e5e7eb", b: "#6366f1", c: "#0b0b1f", glow: "#818cf8", gem: "#ffffff" }
};

function ornate(name) {
    const p = PALETTES[name];
    return function draw(t) {
        const pulse = 0.6 + 0.4 * Math.sin(TAU * t);
        let s = `<defs>
          <filter id="g" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="5"/></filter>
          <filter id="g2" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="2.2"/></filter>
          <linearGradient id="metal" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8d8a9c"/><stop offset=".45" stop-color="#3b3946"/><stop offset="1" stop-color="#1b1a22"/></linearGradient>
          <linearGradient id="silver" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f4f4f8"/><stop offset=".5" stop-color="#9c9aac"/><stop offset="1" stop-color="#55536a"/></linearGradient>
          <linearGradient id="blade" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${p.b}"/><stop offset=".6" stop-color="${p.a}"/><stop offset="1" stop-color="${p.b}"/></linearGradient>
          <linearGradient id="gemg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${p.gem}"/><stop offset=".5" stop-color="${p.a}"/><stop offset="1" stop-color="${p.b}"/></linearGradient>
        </defs>`;

        // 1) إطار معدني داكن حول النافذة
        const x0 = WIN.x - 14, y0 = WIN.y - 14, w = WIN.w + 28, h = WIN.h + 28;
        s += `<rect x="${x0}" y="${y0}" width="${w}" height="${h}" rx="${WIN.r + 10}" fill="none" stroke="url(#metal)" stroke-width="24"/>`;
        s += `<rect x="${x0 - 12}" y="${y0 - 12}" width="${w + 24}" height="${h + 24}" rx="${WIN.r + 20}" fill="none" stroke="#0f0e15" stroke-width="3" opacity=".8"/>`;
        // خط لوني متوهج داخلي
        s += `<rect x="${WIN.x - 2}" y="${WIN.y - 2}" width="${WIN.w + 4}" height="${WIN.h + 4}" rx="${WIN.r + 2}" fill="none" stroke="${p.glow}" stroke-width="7" filter="url(#g)" opacity="${f(0.5 + 0.4 * pulse)}"/>`;
        s += `<rect x="${WIN.x - 2}" y="${WIN.y - 2}" width="${WIN.w + 4}" height="${WIN.h + 4}" rx="${WIN.r + 2}" fill="none" stroke="${p.a}" stroke-width="2.5"/>`;

        // 2) أشواك الزوايا
        const spikes = `<path d="M44 108 L70 92 L84 120 Z" fill="url(#metal)"/><path d="M44 332 L70 350 L84 322 Z" fill="url(#metal)"/>
          <path d="M30 150 Q22 180 30 214 L52 190 Z" fill="#23222c"/><path d="M30 316 Q22 290 30 262 L52 286 Z" fill="#23222c"/>`;
        s += mirror(spikes);

        // 3) أجنحة التاج في الأعلى (نصف يُعكس)
        const wing = `
          <path d="M188 74 Q110 8 22 40 Q92 44 150 84 Z" fill="${p.c}"/>
          <path d="M188 76 Q112 22 36 46 Q100 56 154 88 Z" fill="url(#blade)"/>
          <path d="M188 82 Q120 40 66 62 Q112 70 156 96 Z" fill="${p.b}" opacity=".95"/>
          <path d="M188 74 Q110 8 22 40" fill="none" stroke="url(#silver)" stroke-width="3.5" stroke-linecap="round"/>
          <path d="M150 88 Q100 78 54 70" fill="none" stroke="#ffffff" stroke-opacity=".65" stroke-width="2.5" stroke-linecap="round"/>
          <ellipse cx="116" cy="56" rx="22" ry="9" fill="#14131b" opacity=".85" transform="rotate(-8 116 56)"/>`;
        s += mirror(wing);

        // 4) النجمة المركزية (جوهرة التاج)
        s += `<path d="M200 6 L228 54 L200 100 L172 54 Z" fill="url(#gemg)" stroke="url(#silver)" stroke-width="3" stroke-linejoin="round"/>
          <path d="M200 6 L200 100 M172 54 L228 54" stroke="#fff" stroke-opacity=".55" stroke-width="1.5"/>
          <path d="M200 6 L228 54 L200 54 Z" fill="#fff" opacity=".3"/>`;
        s += `<circle cx="200" cy="54" r="13" fill="${p.glow}" filter="url(#g)" opacity="${f(0.35 + 0.5 * pulse)}"/>`;

        // 5) الخطوط المتوهجة على الجانبين مع الكرة
        const side = `
          <path d="M44 138 C26 170 62 190 40 232 C24 266 40 296 66 322" fill="none" stroke="${p.glow}" stroke-width="9" filter="url(#g)" opacity="${f(0.55 + 0.4 * pulse)}"/>
          <path d="M44 138 C26 170 62 190 40 232 C24 266 40 296 66 322" fill="none" stroke="${p.a}" stroke-width="3.5" stroke-linecap="round"/>
          <circle cx="40" cy="232" r="${f(10 + 3 * pulse)}" fill="${p.glow}" filter="url(#g2)"/>
          <circle cx="40" cy="232" r="6" fill="${p.gem}"/>`;
        s += mirror(side);

        // 6) تاج فضي في الأسفل مع جوهرة
        const foot = `<path d="M192 350 L150 352 L112 366 L78 384 L132 378 L170 384 L192 380 Z" fill="url(#silver)"/>
          <path d="M192 352 L150 354 L116 368" fill="none" stroke="#fff" stroke-opacity=".6" stroke-width="2"/>
          <path d="M112 366 L96 352 L124 354 Z" fill="#6f6d82"/>`;
        s += mirror(foot);
        s += `<path d="M200 346 L226 366 L200 394 L174 366 Z" fill="url(#gemg)" stroke="url(#silver)" stroke-width="3" stroke-linejoin="round"/>
          <path d="M200 346 L200 394 M174 366 L226 366" stroke="#fff" stroke-opacity=".5" stroke-width="1.3"/>
          <circle cx="200" cy="366" r="${f(4 + 2 * pulse)}" fill="#fff"/>`;

        // 7) لمعة تدور حول الإطار + شرارات
        const per = 2 * (w + h), d = (t * per) % per;
        const posAt = k => {
            k = ((k % per) + per) % per;
            if (k < w) return [x0 + k, y0];
            if (k < w + h) return [x0 + w, y0 + (k - w)];
            if (k < 2 * w + h) return [x0 + w - (k - w - h), y0 + h];
            return [x0, y0 + h - (k - 2 * w - h)];
        };
        for (let i = 0; i < 9; i++) {
            const [x, y] = posAt(d - i * 7);
            s += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(Math.max(0.6, 5.5 - i * 0.6))}" fill="#fff" opacity="${f(0.95 - i * 0.1)}"/>`;
        }
        for (let i = 0; i < 8; i++) {
            const ang = rnd(i + 5) * TAU, r = 175 + rnd(i + 20) * 25;
            s += star(SIZE / 2 + r * Math.cos(ang) * 0.95, SIZE / 2 + r * Math.sin(ang) * 0.95, Math.max(0, Math.sin(TAU * (t + rnd(i + 9)))) * 1.1, p.gem);
        }
        return `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}">${s}</svg>`;
    };
}

// price: السعر بالعملة، ach: مفتاح إنجاز يفتحه مجانًا (أحدهما أو كلاهما). frames: عدد لقطات الحركة
const ORNATE = [
    { id: "o_violet",  name: "بنفسجي ملكي", e: "💜", price: 5e9,   ach: null,       text: "", draw: ornate("violet") },
    { id: "o_azure",   name: "أزرق جليدي",  e: "💙", price: 5e10,  ach: null,       text: "", draw: ornate("azure") },
    { id: "o_emerald", name: "زمردي",       e: "💚", price: 5e10,  ach: null,       text: "", draw: ornate("emerald") },
    { id: "o_crimson", name: "قرمزي",       e: "❤️", price: 5e11,  ach: null,       text: "", draw: ornate("crimson") },
    { id: "o_solar",   name: "شمسي ذهبي",   e: "🌞", price: null,  ach: "streak:3", text: "حافظ على 30 يومًا متتاليًا", draw: ornate("solar") },
    { id: "o_void",    name: "الفراغ",      e: "🌑", price: null,  ach: "power:3",  text: "اجمع قوة كلية مليار", draw: ornate("void") }
].map(x => Object.assign({ frames: 16, square: true, win: WIN }, x));

module.exports = { ORNATE, WIN, PALETTES, ornate };