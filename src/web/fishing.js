"use strict";
// صيد البحر: ارمِ الصنارة من الرصيف في المزرعة. 6 رميات تتجدد رمية كل 30 دقيقة.
// حيواناتك المائية (ماء/ثلج) ترفع فرصة الغنائم النادرة.
const D = require("../game/data");
const E = require("../game/engine");
const Res = require("../game/resources");
const MAX = 6, EVERY = 30 * 60000;

function F(P, now) {
    const f = (P.fish = P.fish || { en: MAX, enAt: now });
    if (f.en < MAX) {
        const n = Math.floor((now - f.enAt) / EVERY);
        if (n > 0) { f.en = Math.min(MAX, f.en + n); f.enAt = f.en >= MAX ? now : f.enAt + n * EVERY; }
    } else f.enAt = now;
    return f;
}
const luckOf = P => Math.min(0.2, P.pets.filter(p => p.el === "water" || p.elb === "water" || p.el === "ice").length * 0.02);
function view(P, now) {
    const f = F(P, now);
    return { en: f.en, max: MAX, left: f.en >= MAX ? 0 : Math.max(0, f.enAt + EVERY - now), luck: Math.round(luckOf(P) * 100), total: (P.cnt && P.cnt.fish) || 0 };
}
function cast(P, now, rng = Math.random) {
    const f = F(P, now);
    if (f.en < 1) return { ok: false, msg: "لا رميات الآن. تتجدد رمية كل 30 دقيقة." };
    if (f.en >= MAX) f.enAt = now;
    f.en--;
    P.cnt = P.cnt || {}; P.cnt.fish = (P.cnt.fish || 0) + 1;
    const luck = luckOf(P), r = rng(), loot = [];
    let title, emoji;
    const inc = E.incomeAll(P), give = (id, n) => { const k = Res.add(P, id, n); if (k) loot.push(Res.lineOf(id, k)); };
    const coins = m => { const c = E.clampCoins(Math.max(50, inc * m)); P.coins = E.clampCoins(P.coins + c); loot.push("🪙 " + E.fmt(c)); };
    const t = r - luck;                                           // الحظ يدفع للغنائم الأندر
    if (t < 0.02) {                                               // كنز
        title = "صندوق كنز غارق!"; emoji = "🧰"; give("crystal", 8 + Math.floor(rng() * 6)); give("dust", 2); coins(1.5);
        E.addEggToBag(P, 1); loot.push(D.EGGS[1].e + " " + D.EGGS[1].n);
    } else if (t < 0.08) {                                        // لؤلؤة = بيضة
        const tier = rng() < 0.15 ? 2 : 0; title = "محارة بداخلها بيضة!"; emoji = "🦪"; E.addEggToBag(P, tier); loot.push(D.EGGS[tier].e + " " + D.EGGS[tier].n);
    } else if (t < 0.22) { title = "سمكة نادرة!"; emoji = "🐠"; give("crystal", 2 + Math.floor(rng() * 3)); coins(0.5); }
    else if (t < 0.40) { title = "صدفة عنصرية"; emoji = "🐚"; give(rng() < 0.6 ? "ess_water" : "ess_ice", 1 + Math.floor(rng() * 2)); }
    else if (t < 0.65) { title = "سمكة جيدة"; emoji = "🐟"; coins(0.25); give("crystal", 1); }
    else if (t < 0.85) { title = "سمكة صغيرة"; emoji = "🐡"; coins(0.1); }
    else { title = "حذاء قديم… حظًا أوفر"; emoji = "🥾"; coins(0.03); }
    return { ok: true, title, emoji, loot, msg: emoji + " " + title };
}
module.exports = { view, cast };
