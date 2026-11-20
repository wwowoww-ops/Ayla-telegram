"use strict";
// حفظ تخطيط العالم (مواضع المباني، أشكال الحظائر وأبوابها، شخصية اللاعب، وخصوصية قوة الحيوانات).
// كل ما يصل من العميل يُنقّى هنا: أرقام محدودة، عدد رؤوس محدود، معرّفات معروفة فقط.
const LIM = 160;              // أقصى بُعد لأي إحداثية
const PT_LIM = 45;            // أقصى بُعد لرأس سياج عن مركز حظيرته
const MIN_PTS = 3, MAX_PTS = 14;
const BUILDINGS = ["hatch", "boss", "hunt", "lab", "farm", "vault", "gym", "market", "shop", "nov", "breed", "season", "fairies", "recycle", "quests", "top", "visit", "bag", "more"];
const LOOKS = ["🧑‍🌾", "👨‍🌾", "👩‍🌾", "🧙", "🥷", "🧑‍🚀", "🦸", "🧝", "🤠", "🧑‍🎤"];

const num = (v, lim) => (typeof v === "number" && Number.isFinite(v) && Math.abs(v) <= lim ? Math.round(v * 100) / 100 : null);
const pair = (a, lim) => { if (!Array.isArray(a) || a.length !== 2) return null; const x = num(a[0], lim), z = num(a[1], lim); return x === null || z === null ? null : [x, z]; };

function get(P) { return P.world && typeof P.world === "object" ? P.world : {}; }

function penIds(P) { return ["0"].concat((P.pens || []).map(p => String(p.id))); }

// يدمج patch في العالم المحفوظ ويُرجع العالم الجديد
function save(P, patch) {
    const cur = get(P), w = { b: Object.assign({}, cur.b), pens: Object.assign({}, cur.pens), av: Object.assign({}, cur.av), pos: Object.assign({}, cur.pos), hidePow: !!cur.hidePow };
    if (!patch || typeof patch !== "object") return { ok: false, msg: "بيانات غير صالحة." };
    if (patch.reset === true) { P.world = { b: {}, pens: {}, av: w.av, pos: w.pos, hidePow: w.hidePow }; return { ok: true, world: P.world }; }
    if (patch.b && typeof patch.b === "object") {
        for (const id of Object.keys(patch.b)) { if (!BUILDINGS.includes(id)) continue; if (patch.b[id] === null) { delete w.b[id]; continue; } const p = pair(patch.b[id], LIM); if (p) w.b[id] = p; }
    }
    if (patch.pens && typeof patch.pens === "object") {
        const ok = penIds(P);
        for (const id of Object.keys(patch.pens)) {
            if (!ok.includes(id)) continue;
            if (patch.pens[id] === null) { delete w.pens[id]; continue; }     // حذف شكل الحظيرة المخصّص
            const s = patch.pens[id], c = pair(s && s.c, LIM);
            if (!c || !Array.isArray(s.pts) || s.pts.length < MIN_PTS || s.pts.length > MAX_PTS) continue;
            const pts = s.pts.map(p => pair(p, PT_LIM));
            if (pts.some(p => !p)) continue;
            const gate = Number.isInteger(s.gate) && s.gate >= 0 && s.gate < pts.length ? s.gate : 0;
            w.pens[id] = { c, pts, gate };
        }
    }
    if (patch.av && typeof patch.av === "object") {
        const p = pair([patch.av.x, patch.av.z], LIM);
        if (p) { w.av.x = p[0]; w.av.z = p[1]; }
        if (LOOKS.includes(patch.av.look)) w.av.look = patch.av.look;
    }
    if (patch.pos && typeof patch.pos === "object") {           // مواضع الحيوانات التي سحبها اللاعب (null = إلغاء التثبيت)
        for (const id of Object.keys(patch.pos).slice(0, 300)) {
            if (!(P.pets || []).some(p => String(p.id) === id)) continue;
            const v = patch.pos[id];
            if (v === null) { delete w.pos[id]; continue; }
            const p = pair(v, LIM); if (p) w.pos[id] = p;
        }
    }
    if (typeof patch.hidePow === "boolean") w.hidePow = patch.hidePow;
    // تنظيف: حظائر محذوفة
    const ok = penIds(P);
    for (const id of Object.keys(w.pens)) if (!ok.includes(id)) delete w.pens[id];
    const live = new Set((P.pets || []).map(p => String(p.id)));     // نسيان حيوانات لم تعد موجودة، مع سقف للحجم
    Object.keys(w.pos).forEach(id => { if (!live.has(id)) delete w.pos[id]; });
    Object.keys(w.pos).slice(250).forEach(id => delete w.pos[id]);
    P.world = w;
    return { ok: true, world: w };
}

module.exports = { save, get, LOOKS, BUILDINGS };
