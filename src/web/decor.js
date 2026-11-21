"use strict";
// زينة المزرعة: تشتريها بالعملات (سعرها بساعات من دخلك) وتحرّكها بحرية أو تبيعها بنصف السعر.
const E = require("../game/engine");
const World = require("./world");
const ITEMS = { tree: ["🌳", "شجرة", 2], flowers: ["🌷", "أزهار", 1], lamp: ["🏮", "فانوس", 3], bench: ["🪑", "مقعد", 3], tent: ["⛺", "خيمة", 6], fountain: ["⛲", "نافورة", 12], statue: ["🗿", "تمثال", 24], windmill: ["🌬️", "طاحونة", 48] };
const MAX = 40, LIM = 160;
const price = (P, t) => Math.max(1e5, Math.floor(E.incomeAll(P) * ITEMS[t][2]));
function shop(P) { return { ok: true, items: Object.keys(ITEMS).map(t => ({ t, e: ITEMS[t][0], n: ITEMS[t][1], price: price(P, t) })), count: ((World.get(P).deco) || []).length, max: MAX }; }
function buy(P, a) {
    const t = a && a.t;
    if (!ITEMS[t]) return { ok: false, msg: "عنصر غير معروف." };
    const w = World.get(P), deco = Array.isArray(w.deco) ? w.deco.slice() : [];
    if (deco.length >= MAX) return { ok: false, msg: "وصلت حد الزينة (" + MAX + ")." };
    const pr = price(P, t);
    if (P.coins < pr) return { ok: false, msg: "رصيدك لا يكفي. تحتاج " + E.fmt(pr) + "." };
    P.coins -= pr;
    const av = w.av || {}, x = Number.isFinite(av.x) ? av.x : 0, z = Number.isFinite(av.z) ? av.z + 2 : 12;
    deco.push({ t, x: Math.round(x * 100) / 100, z: Math.round(z * 100) / 100 });
    P.world = Object.assign({}, w, { deco });
    return { ok: true, msg: ITEMS[t][0] + " اشتريت " + ITEMS[t][1] + " ووُضعت قرب شخصيتك.", world: P.world };
}
// تحريك أو حذف: القائمة الجديدة يجب أن تكون مجموعة جزئية من الحالية (من حيث النوع والعدد). المحذوف يُسترد نصف سعره.
function save(P, a) {
    const w = World.get(P), old = Array.isArray(w.deco) ? w.deco : [], list = Array.isArray(a && a.list) ? a.list.slice(0, MAX) : null;
    if (!list) return { ok: false, msg: "بيانات غير صالحة." };
    const left = {}; old.forEach(d => { left[d.t] = (left[d.t] || 0) + 1; });
    const next = [];
    for (const d of list) {
        if (!d || !ITEMS[d.t] || !(left[d.t] > 0) || !Number.isFinite(d.x) || !Number.isFinite(d.z) || Math.abs(d.x) > LIM || Math.abs(d.z) > LIM) continue;
        left[d.t]--; next.push({ t: d.t, x: Math.round(d.x * 100) / 100, z: Math.round(d.z * 100) / 100 });
    }
    let refund = 0; Object.keys(left).forEach(t => { refund += left[t] * Math.floor(price(P, t) / 2); });
    if (refund) P.coins = E.clampCoins(P.coins + refund);
    P.world = Object.assign({}, w, { deco: next });
    return { ok: true, world: P.world, msg: refund ? "💰 استرددت " + E.fmt(refund) + " 🪙" : undefined };
}
module.exports = { ITEMS, shop, buy, save };
