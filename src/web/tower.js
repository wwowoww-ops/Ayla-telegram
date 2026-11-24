"use strict";
// برج الأزل: طوابق لا نهائية، كل طابق أقوى من السابق. فريقك (أقوى 3 حيوانات) يواجه وحش الطابق.
// تتجدد المحاولات مع الوقت، وكل 10 طوابق زعيم بجائزة بيضة. ترتيب أسبوعي حسب الطوابق المتسلَّقة.
const D = require("../game/data");
const E = require("../game/engine");
const Res = require("../game/resources");
const EN_MAX = 8, EN_EVERY = 60 * 60 * 1000, WEEK = 7 * 24 * 3600000, TEAM = 3;
const weekKey = now => Math.floor((now + 3 * 86400000) / WEEK);             // الأسبوع يبدأ الاثنين تقريبًا
const isBoss = f => f % 10 === 0;
const monPower = f => Math.floor(8 * Math.pow(1.13, f - 1) * (isBoss(f) ? 1.6 : 1));
const monEl = f => D.EL_KEYS[(f - 1) % D.EL_KEYS.length];

function T(P, now) {
    const t = (P.tower = P.tower || { f: 1, en: EN_MAX, enAt: now, wk: weekKey(now), wkStart: 1, pend: 0 });
    // تجدد المحاولات
    if (t.en < EN_MAX) {
        const n = Math.floor((now - t.enAt) / EN_EVERY);
        if (n > 0) { t.en = Math.min(EN_MAX, t.en + n); t.enAt = t.en >= EN_MAX ? now : t.enAt + n * EN_EVERY; }
    } else t.enAt = now;
    // أسبوع جديد: جائزة الأسبوع الماضي تنتظر الاستلام
    const wk = weekKey(now);
    if (t.wk !== wk) { t.pend = (t.pend || 0) + Math.max(0, t.f - t.wkStart) * 2; t.wk = wk; t.wkStart = t.f; }
    return t;
}
function team(P) {
    const busy = new Set(); try { require("./expedition").busyIds(P).forEach(i => busy.add(i)); } catch (e) { /* لا شيء */ }
    return P.pets.filter(p => !busy.has(p.id)).sort((a, b) => E.power(b) - E.power(a)).slice(0, TEAM);
}
const teamPower = (tm, el) => tm.reduce((s, p) => s + E.power(p) * E.elMult(p, el), 0);

function view(P, now) {
    const t = T(P, now), f = t.f, el = monEl(f), tm = team(P), E_ = D.ELEMENTS[el];
    return {
        f, best: Math.max(0, f - 1), en: t.en, enMax: EN_MAX, enLeft: t.en >= EN_MAX ? 0 : Math.max(0, t.enAt + EN_EVERY - now),
        boss: isBoss(f), mon: { el, e: E_.e, n: E_.n, power: monPower(f) },
        mine: Math.floor(teamPower(tm, el)),
        team: tm.map(p => ({ id: p.id, name: p.nick || D.SPECIES[p.sp].n, emoji: D.SPECIES[p.sp].e, sp: p.sp, power: E.power(p) })),
        wkGain: Math.max(0, f - t.wkStart), pend: t.pend || 0,
        nextBoss: f + (10 - (f % 10)) % 10 || f + 10
    };
}
function climb(P, now, rng = Math.random) {
    const t = T(P, now), tm = team(P);
    if (!tm.length) return { ok: false, msg: "لا يوجد حيوان متاح للفريق." };
    if (t.en < 1) return { ok: false, msg: "انتهت محاولاتك. تتجدد محاولة كل ساعة." };
    const f = t.f, el = monEl(f), mp = monPower(f), boss = isBoss(f);
    if (t.en >= EN_MAX) t.enAt = now;
    t.en--;
    const mine = teamPower(tm, el) * (0.85 + 0.3 * rng()), win = mine >= mp;
    const res = { ok: true, win, floor: f, boss, mon: { el, e: D.ELEMENTS[el].e, n: D.ELEMENTS[el].n, power: mp }, mine: Math.floor(mine), loot: [], msg: "" };
    if (win) {
        t.f++;
        P.cnt = P.cnt || {}; P.cnt.tower = Math.max(P.cnt.tower || 0, f);
        const coins = E.clampCoins((40 * Math.pow(1.13, f) + E.incomeAll(P) * 0.25) * (boss ? 3 : 1)); P.coins = E.clampCoins(P.coins + coins); res.loot.push("🪙 " + E.fmt(coins));
        const cr = 1 + Math.floor(f / 8) + (boss ? 3 : 0); Res.add(P, "crystal", cr); res.loot.push("🔷×" + cr);
        if (f % 5 === 0) { const id = "ess_" + el, n = 1 + Math.floor(f / 20); if (D.RES[id]) { Res.add(P, id, n); res.loot.push(Res.lineOf(id, n)); } }
        if (boss) { const tier = Math.max(0, Math.min(D.EGGS.length - 1, Math.floor(f / 10))); E.addEggToBag(P, tier); res.loot.push(D.EGGS[tier].e + " " + D.EGGS[tier].n); }
        res.msg = (boss ? "👑 سقط زعيم الطابق " : "✅ اجتزت الطابق ") + f + "!";
    } else {
        if (rng() < 0.5) { Res.add(P, "crystal", 1); res.loot.push("🔷×1"); }
        res.msg = "❌ هزمك وحش الطابق " + f + ". قوّ فريقك أو اختر عنصرًا أقوى وحاول ثانية.";
    }
    return res;
}
function claimWeek(P, now) {
    const t = T(P, now), n = t.pend || 0;
    if (n <= 0) return { ok: false, msg: "لا جائزة أسبوعية للاستلام." };
    t.pend = 0; Res.add(P, "crystal", n);
    return { ok: true, msg: "🎁 جائزة تسلّق الأسبوع الماضي: 🔷×" + n };
}
module.exports = { view, climb, claimWeek, T, monPower, monEl };
