// أزرار الموسم الأسبوعي
const store = require("../core/store");
const S = require("../game/season");
const M = require("../game/seasonMenu");

module.exports = function (bot) {
    bot.callbackQuery(/^ss:(\d+):(\w+)$/, async ctx => {
        try {
            if (String(ctx.from.id) !== ctx.match[1]) return await ctx.answerCallbackQuery({ text: "هذه القائمة ليست لك.", show_alert: true });
            const P = store.get(ctx.match[1]);
            if (!P) return await ctx.answerCallbackQuery({ text: "اكتب: حيواني لتبدأ" });
            const now = Date.now();
            if (S.ensure(P, now)) store.touch(P.id);
            const scr = ctx.match[2] === "old" ? M.oldScreen(P) : M.screen(P, now);
            await ctx.answerCallbackQuery();
            await ctx.editMessageText(scr.text, { parse_mode: "HTML", reply_markup: scr.kb }).catch(e => {
                if (!/not modified/i.test(String(e && (e.description || e.message)))) throw e;
            });
        } catch (e) {
            console.error("[SEASON CALLBACK ERROR]", e && (e.stack || e.message));
            await ctx.answerCallbackQuery({ text: "حدث خطأ مؤقت" }).catch(() => {});
        }
    });
};
