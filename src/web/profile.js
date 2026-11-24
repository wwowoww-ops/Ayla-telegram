"use strict";
// بروفايل لاعب (لنفسك أو لغيرك): معلومات عامة وإحصاءات اللعب. لا يُكشف أي شيء يغيّر اللعب.
const D = require("../game/data");
const E = require("../game/engine");
const store = require("../core/store");
const Cos = require("./cosmetics");
const Dex = require("./dex");

function build(T, now) {
    const pets = T.pets.slice().sort((a, b) => E.power(b) - E.power(a)), top = pets[0], s = T.stats || {}, c = T.cnt || {};
    let dex = { have: 0, total: 0 }; try { const v = Dex.view(T); dex = { have: v.have, total: v.total }; } catch (e) { /* لا شيء */ }
    const days = Math.max(1, Math.floor((now - (T.created || now)) / 86400000) + 1);
    const rar = {}; T.pets.forEach(p => { const r = E.spOf(p).r; rar[r] = (rar[r] || 0) + 1; });
    const best = Object.keys(rar).map(Number).sort((a, b) => b - a)[0];
    return {
        name: T.name, tg: Cos.tag(T), days, streak: T.streak || 0, power: E.totalPower(T), pets: T.pets.length, slots: T.slots,
        top: top ? { sp: top.sp, name: top.nick || E.spOf(top).n, emoji: E.spOf(top).e, lv: top.lv, st: top.st || 0, rar: E.spOf(top).r, rarEmoji: D.RARITIES[E.spOf(top).r].e, power: E.power(top), el: top.el, elEmoji: D.ELEMENTS[top.el].e, elb: top.elb ? D.ELEMENTS[top.elb].e : "" } : null,
        bestRar: best === undefined ? null : { n: D.RARITIES[best].n, e: D.RARITIES[best].e, count: rar[best] },
        hatched: s.hatched || 0, bred: s.bred || 0, hunts: s.hunts || 0, wins: s.wins || 0, duels: s.duels || 0, duelWins: s.duelWins || 0,
        exp: c.exp || 0, raid: c.raid || 0, tower: Math.max(0, ((T.tower && T.tower.f) || 1) - 1), dex
    };
}
function of(P, a, now) {
    const uid = a && a.uid != null ? String(a.uid).slice(0, 20) : String(P.id);
    const T = uid === String(P.id) ? P : store.get(uid);
    if (!T || !Array.isArray(T.pets)) return { ok: false, msg: "لا يوجد ملف لهذا اللاعب." };
    return { ok: true, self: T === P, uid, p: build(T, now) };
}
module.exports = { of, build };
