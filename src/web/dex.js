"use strict";
// كتاب المجموعة: الأنواع التي اكتشفتها. إكمال كل ندرة يمنح جائزة مرة واحدة.
const D = require("../game/data");
const E = require("../game/engine");
const Res = require("../game/resources");
const all = () => Object.values(D.SPECIES).filter(x => !x.boss);
function sync(P) {
    P.dex = P.dex && typeof P.dex === "object" ? P.dex : {};
    (P.pets || []).forEach(p => { P.dex[p.sp] = 1; });
    return P.dex;
}
function reward(r) { return { crystals: 20 * (r + 1) * (r + 1), tier: Math.min(r, D.EGGS.length - 1) }; }
function view(P) {
    const dex = sync(P), cl = P.dexClaimed = P.dexClaimed || {};
    const sp = all().map(s => ({ id: s.id, e: s.e, n: s.n, r: s.r, have: !!dex[s.id] }));
    const groups = D.RARITIES.map((r, i) => { const l = sp.filter(s => s.r === i); return { r: i, name: r.n, emoji: r.e, total: l.length, have: l.filter(s => s.have).length, claimed: !!cl[i], rw: reward(i) }; }).filter(g => g.total);
    return { ok: true, list: sp, groups, have: sp.filter(s => s.have).length, total: sp.length };
}
function claim(P, a) {
    const r = Number(a && a.r), dex = sync(P), cl = P.dexClaimed = P.dexClaimed || {};
    const l = all().filter(s => s.r === r);
    if (!l.length) return { ok: false, msg: "ندرة غير معروفة." };
    if (cl[r]) return { ok: false, msg: "استلمت جائزة هذه الندرة." };
    if (l.some(s => !dex[s.id])) return { ok: false, msg: "لم تكتشف كل أنواع هذه الندرة بعد." };
    const w = reward(r); cl[r] = 1;
    Res.add(P, "crystal", w.crystals); E.addEggToBag(P, w.tier);
    return { ok: true, msg: "📖 أكملت " + D.RARITIES[r].n + "! جائزتك: 🔷×" + w.crystals + " و " + D.EGGS[w.tier].e + " بيضة" };
}
module.exports = { sync, view, claim };
