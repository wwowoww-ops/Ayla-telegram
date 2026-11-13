// أزرار قوائم أماكن الأكل
const store = require("../core/store");
const FM = require("../game/feeders/menu");
const F = require("../game/feeders");

module.exports = function (bot) {
    bot.callbackQuery(/^fd:(\d+):(.+)$/, async ctx => {
        try {
            if (String(ctx.from.id) !== ctx.match[1]) {
                return await ctx.answerCallbackQuery({ text: "هذه القائمة ليست لك." });
            }
            const P = store.get(ctx.match[1]);
            if (!P) return await ctx.answerCallbackQuery({ text: "اكتب: حيواني لتبدأ" });

            F.tick(P, Date.now());
            const scr = FM.route(P, ctx.match[2].split(":"));
            store.touch(P.id);
            await ctx.answerCallbackQuery();
            await ctx.editMessageText(scr.text, { parse_mode: "HTML", reply_markup: scr.kb }).catch(e => {
                if (!/not modified/i.test(String(e && (e.description || e.message)))) throw e;
            });
        } catch (e) {
            console.error("[FEEDERS CALLBACK ERROR]", e && (e.stack || e.message));
            await ctx.answerCallbackQuery({ text: "حدث خطأ مؤقت" }).catch(() => {});
        }
    });
};