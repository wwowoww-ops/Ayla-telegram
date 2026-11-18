// الموسم الأسبوعي: يثبّت لقطة بداية الأسبوع لكل لاعب عند أول نشاط، وينهي الموسم ويوزّع الجوائز تلقائيًا
const store = require("../core/store");
const S = require("../game/season");
const M = require("../game/seasonMenu");

module.exports = function (bot) {
    bot.use(async (ctx, next) => {
        const user = ctx.from, P = user && !user.is_bot ? store.get(user.id) : null;
        if (P) { try { if (S.ensure(P, Date.now())) store.touch(P.id); } catch (e) { console.error("[SEASON]", e && e.message); } }
        return next();
    });
    const tick = async () => {
        let won = [];
        try { won = S.settle(Date.now()); } catch (e) { console.error("[SEASON SETTLE]", e && (e.stack || e.message)); return; }
        for (const w of won) {
            if (w.rank > 10) continue;   // الإشعار الخاص للعشرة الأوائل فقط
            const txt = "🏆 <b>انتهى الموسم الأسبوعي!</b>\nمركزك: <b>" + w.rank + "</b> (" + w.pts + " نقطة)\n🎁 وصلتك جائزتك في المحفظة والموارد.";
            await bot.api.sendMessage(w.uid, txt, { parse_mode: "HTML" }).catch(() => {});
            await new Promise(r => setTimeout(r, 400));
        }
    };
    setTimeout(tick, 15000); setInterval(tick, 60000);
};
