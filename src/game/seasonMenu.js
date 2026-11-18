// شاشات الموسم الأسبوعي
const { InlineKeyboard } = require("grammy");
const S = require("./season");
const D = require("./data");
const E = require("./engine");
const { esc } = require("../lib/util");
const fmt = E.fmt;
const MEDAL = ["🥇", "🥈", "🥉"];

function prizeTxt(pr) {
    const bits = [];
    Object.entries(pr.res).forEach(([k, v]) => bits.push(v + " " + D.RES[k].e));
    if (pr.essN) bits.push(pr.essN + " جوهر عنصر عشوائي");
    if (pr.egg != null) bits.push(D.EGGS[pr.egg].e + " " + D.EGGS[pr.egg].n);
    if (pr.fairy != null) bits.push("🧚 جنية");
    return bits.join(" + ");
}
const left = ms => { const m = Math.max(0, Math.floor(ms / 60000)), d = Math.floor(m / 1440), h = Math.floor((m % 1440) / 60); return (d ? d + " يوم " : "") + h + " ساعة " + (m % 60) + " دقيقة"; };

function screen(P, now, msg) {
    const id = S.idAt(now), rows = S.ranking(id), mine = S.pointsOf(P, id);
    const pos = rows.findIndex(r => r.id === String(P.id)) + 1;
    let t = "🏆 <b>الموسم الأسبوعي</b>\n━━━━━━━━━━━━━━━━━━\n⏳ ينتهي بعد <b>" + left(S.endOf(id) - now) + "</b>\n";
    t += "⭐ نقاطك: <b>" + fmt(mine) + "</b>" + (pos ? " — المركز <b>" + pos + "</b> من " + rows.length : " — لم تسجّل نقاطًا بعد") + "\n";
    if (mine > 0 && pos > 0) { const pr = S.prizeFor(pos, mine); if (pr) t += "🎁 جائزتك الحالية: " + prizeTxt(pr) + "\n"; }
    t += "\n<b>🔝 المتصدرون</b>\n";
    t += rows.length ? rows.slice(0, 10).map((r, i) => (MEDAL[i] || (i + 1) + ".") + " " + esc(r.name) + " — " + fmt(r.pts)).join("\n") : "لا أحد بعد، كن الأول!";
    t += "\n\n<b>🎁 الجوائز</b>\n" + S.PRIZES.map((p, i) => MEDAL[i] + " " + prizeTxt(p)).join("\n") + "\n4–10: " + prizeTxt(S.TOP10) + "\nكل من جمع " + S.MIN_PTS + "+ نقطة: " + prizeTxt(S.PART);
    t += "\n\n<b>📊 كيف تُجمع النقاط؟</b>\n" + S.POINTS.map(([, w, n]) => "• " + n + ": " + w).join("\n");
    if (msg) t += "\n\n" + msg;
    const kb = new InlineKeyboard().text("🔄 تحديث", "ss:" + P.id + ":cur").text("📜 المواسم السابقة", "ss:" + P.id + ":old");
    return { text: t, kb };
}
function oldScreen(P) {
    const h = S.hist().slice().reverse();
    let t = "📜 <b>المواسم السابقة</b>\n━━━━━━━━━━━━━━━━━━\n";
    t += h.length ? h.map(s => "<b>الموسم " + (s.id + 1) + "</b> (" + s.total + " لاعب)\n" + s.rows.slice(0, 3).map((r, i) => MEDAL[i] + " " + esc(r.name) + " — " + fmt(r.pts)).join("\n")).join("\n\n") : "لم ينتهِ أي موسم بعد.";
    const won = (P.seasonWon || []).slice(-5).reverse();
    if (won.length) t += "\n\n<b>🏅 سجلّك</b>\n" + won.map(w => "الموسم " + (w.id + 1) + ": المركز " + w.rank + " (" + fmt(w.pts) + " نقطة)").join("\n");
    return { text: t, kb: new InlineKeyboard().text("⬅️ الموسم الحالي", "ss:" + P.id + ":cur") };
}
module.exports = { screen, oldScreen, prizeTxt };
