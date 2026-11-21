"use strict";
// الغارات: اسرق بيضة أو مورد نادر من لاعب آخر، بحمايات صارمة:
//   • لا غارات على حليف، ولا على من يملك أقل من 3 حيوانات، ولا على نفسك.
//   • درع 6 ساعات للضحية بعد كل غارة ناجحة، وسقف 3 غارات ناجحة عليه يوميًا، و5 محاولات يوميًا للمغيّر، وتبريد 10 دقائق.
//   • أقصى غنيمة: بيضة واحدة + نوع واحد من الموارد النادرة (حتى 2)، ولا تُسرق الحيوانات ولا العملات أبدًا.
//   • النجاح احتمالي حسب نسبة القوة الإجمالية (من 10% إلى 90%).
const D = require("../game/data");
const E = require("../game/engine");
const Res = require("../game/resources");
const store = require("../core/store");
const Map_ = require("./map");
const Notify = require("./notify");

const CD = 10 * 60 * 1000, SHIELD = 6 * 3600 * 1000, DAY_ATK = 5, DAY_DEF = 3, MIN_PETS = 3, LOG_N = 10;
const day = now => Math.floor(now / 864e5);
const RARE = Object.keys(D.RES).filter(id => /^ess_/.test(id) || id === "dust");

function status(P, now) {
    const r = P.raidOut && P.raidOut.d === day(now) ? P.raidOut : { n: 0 };
    return { left: Math.max(0, DAY_ATK - r.n), wait: Math.max(0, ((P.raidOut && P.raidOut.cd) || 0) - now), shield: Math.max(0, (P.shield || 0) - now) };
}
function raid(P, a, now, rng = Math.random) {
    const T = store.get(String((a && a.uid) || ""));
    if (!T || String(T.id) === String(P.id)) return { ok: false, msg: "لاعب غير موجود." };
    if (P.pets.length < MIN_PETS) return { ok: false, msg: "تحتاج " + MIN_PETS + " حيوانات على الأقل لتغير." };
    if (!T.pets || T.pets.length < MIN_PETS) return { ok: false, msg: "حظيرته صغيرة جدًا، هي محمية." };
    if (Map_.sameAlly(P, T)) return { ok: false, msg: "🤝 لا غارات بين الحلفاء." };
    const st = status(P, now);
    if (st.wait > 0) return { ok: false, msg: "⏳ استرح " + Math.ceil(st.wait / 60000) + " دقيقة قبل غارة جديدة." };
    if (st.left <= 0) return { ok: false, msg: "بلغت سقف الغارات اليومي (" + DAY_ATK + ")." };
    if ((T.shield || 0) > now) return { ok: false, msg: "🛡️ لاعبه محمي لـ " + Math.ceil((T.shield - now) / 3600000) + " ساعة." };
    const inn = T.raidIn && T.raidIn.d === day(now) ? T.raidIn : { d: day(now), n: 0 };
    if (inn.n >= DAY_DEF) return { ok: false, msg: "🛡️ تعرّض لغارات كثيرة اليوم، هو محمي حتى الغد." };
    const A = E.totalPower(P), Dp = E.totalPower(T), chance = Math.max(0.05, Math.min(0.9, A / (A + Dp)) * (1 - Map_.perk(T).defense));
    P.raidOut = { d: day(now), n: (P.raidOut && P.raidOut.d === day(now) ? P.raidOut.n : 0) + 1, cd: now + CD };
    const win = rng() < chance, loot = [];
    if (win) {
        if (T.eggs && T.eggs.length) {                                       // بيضة واحدة من حضانته
            const i = Math.floor(rng() * T.eggs.length), e = T.eggs.splice(i, 1)[0];
            const extra = {}; if (e.pre) extra.pre = e.pre; if (e.bred) extra.bred = true;
            E.addEggToBag(P, e.tier, extra);
            loot.push((D.EGGS[e.tier] ? D.EGGS[e.tier].e : "🥚") + " بيضة");
        }
        const have = RARE.filter(id => Res.have(T, id) >= 3);
        if (have.length) {
            const id = have[Math.floor(rng() * have.length)], n = Math.min(2, Res.have(T, id) - 1);
            if (Res.take(T, id, n)) { Res.add(P, id, n); loot.push(Res.lineOf(id, n)); }
        }
        T.shield = now + SHIELD; T.raidIn = { d: day(now), n: inn.n + 1 };
    }
    T.raidLog = [{ n: String(P.name || "لاعب").slice(0, 24), t: now, ok: win, loot: loot.join("، ") }].concat(T.raidLog || []).slice(0, LOG_N);
    store.touch(T.id);
    Notify.send(T, win ? "🏴‍☠️ " + String(P.name || "لاعب") + " أغار على حظيرتك" + (loot.length ? " وسرق: " + loot.join("، ") : "") + "!\n🛡️ حظيرتك محمية 6 ساعات." : "🛡️ حاول " + String(P.name || "لاعب") + " الإغارة على حظيرتك لكن حيواناتك صدّته!");
    const pc = Math.round(chance * 100);
    if (!win) return { ok: true, win: false, chance: pc, msg: "🛡️ فشلت الغارة (فرصتك " + pc + "%). دافعت حيواناته عن الحظيرة." };
    return { ok: true, win: true, chance: pc, loot, msg: loot.length ? "🏴‍☠️ نجحت الغارة على " + T.name + "! غنمت: " + loot.join("، ") : "🏴‍☠️ نجحت الغارة لكن لم تجد ما يُسرق." };
}
module.exports = { raid, status };
