// يمنح مكافآت المهام والإنجازات تلقائيًا بعد أي نشاط للاعب (أمر أو ضغطة زر)
const store = require("../core/store");
const Q = require("../game/quests");
const M = require("../game/menus");

module.exports = function (bot) {
    bot.use(async (ctx, next) => {
        const user = ctx.from;
        const P = user && !user.is_bot ? store.get(user.id) : null;
        if (!P) return next();

        // نقطة البداية تُسجَّل قبل تنفيذ الأمر حتى تُحسب أول عملية في اليوم
        try { Q.ensureMissions(P, Date.now()); } catch (e) { console.error("[QUESTS]", e.message); }

        await next();

        try {
            const res = Q.settle(P, Date.now());
            if (!res.any) return;
            store.touch(P.id);
            const note = M.settledNote(res).trim();
            if (note && ctx.chat) await ctx.reply("🎊 <b>" + P.name.replace(/[<>&]/g, "") + "</b>\n" + note, { parse_mode: "HTML" });
        } catch (e) {
            console.error("[QUESTS]", e && e.message);
        }
    });
};