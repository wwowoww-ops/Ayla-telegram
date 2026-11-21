"use strict";
// الاستكشاف: أرسل 1–3 حيوانات لمدة محددة، وتعود بعملات وبلورات ومورد نادر وقد تجلب بيضة. حتى رحلتين في آنٍ واحد.
const D = require("../game/data");
const E = require("../game/engine");
const Res = require("../game/resources");
const MAX_OUT = 2, MAX_PETS = 3;
const ZONES = [
    { h: 1, n: "الغابة", e: "🌲", m: 1 },
    { h: 4, n: "الجبال", e: "⛰️", m: 1.3 },
    { h: 8, n: "البركان", e: "🌋", m: 1.7 }
];
const list = P => (P.exp = Array.isArray(P.exp) ? P.exp : []);
const busyIds = P => new Set([].concat(...list(P).map(x => x.pets)));

function view(P, now) {
    return list(P).map(x => ({ id: x.id, zone: x.z, name: ZONES[x.z].n, emoji: ZONES[x.z].e, pets: x.pets, left: Math.max(0, x.end - now), ready: x.end <= now }));
}
function start(P, a, now) {
    const z = ZONES[Number(a && a.zone)];
    if (!z) return { ok: false, msg: "وجهة غير معروفة." };
    if (list(P).length >= MAX_OUT) return { ok: false, msg: "لديك رحلتان جارتان بالفعل." };
    const ids = [...new Set((Array.isArray(a && a.ids) ? a.ids : []).map(Number))].slice(0, MAX_PETS);
    if (!ids.length) return { ok: false, msg: "اختر حيوانًا واحدًا على الأقل." };
    const busy = busyIds(P);
    for (const id of ids) {
        if (!P.pets.some(p => p.id === id)) return { ok: false, msg: "حيوان غير موجود." };
        if (busy.has(id)) return { ok: false, msg: "أحد الحيوانات في رحلة أخرى." };
    }
    const seq = (P.expSeq = (P.expSeq || 0) + 1);
    list(P).push({ id: seq, z: Number(a.zone), pets: ids, end: now + z.h * 3600000 });
    return { ok: true, msg: z.e + " انطلقت الرحلة إلى " + z.n + "، تعود بعد " + z.h + " ساعة." };
}
function claim(P, a, now, rng = Math.random) {
    const i = list(P).findIndex(x => x.id === Number(a && a.id));
    if (i < 0) return { ok: false, msg: "الرحلة غير موجودة." };
    const x = list(P)[i];
    if (x.end > now) return { ok: false, msg: "الرحلة لم تنتهِ بعد." };
    list(P).splice(i, 1);
    const pets = x.pets.map(id => P.pets.find(p => p.id === id)).filter(Boolean), z = ZONES[x.z];
    if (!pets.length) return { ok: true, msg: "عادت الرحلة فارغة (بيعت الحيوانات).", loot: [] };
    const inc = pets.reduce((s, p) => s + E.incomePerHour(p), 0), loot = [];
    const coins = E.clampCoins(inc * z.h * 2 * z.m);
    P.coins = E.clampCoins(P.coins + coins); loot.push("🪙 " + E.fmt(coins));
    const crystals = Math.floor(z.h * z.m * (2 + pets.length)); Res.add(P, "crystal", crystals); loot.push("🔷×" + crystals);
    const lead = pets.slice().sort((a, b) => E.power(b) - E.power(a))[0], essId = "ess_" + lead.el;
    const rid = D.RES[essId] ? essId : "dust", rn = Math.max(1, Math.floor(z.h / 2));
    Res.add(P, rid, rn); loot.push(Res.lineOf(rid, rn));
    if (rng() < Math.min(0.9, 0.12 * z.h * z.m)) {
        const maxR = Math.max(...pets.map(p => E.spOf(p).r)), tier = Math.max(0, Math.min(D.EGGS.length - 1, maxR - 1, 4));
        E.addEggToBag(P, tier); loot.push((D.EGGS[tier].e) + " بيضة");
    }
    return { ok: true, msg: z.e + " عادت الرحلة من " + z.n + " بـ: " + loot.join("، "), loot };
}
module.exports = { ZONES, view, start, claim, busyIds };
