// أزرار القوائم الإضافية (مهام، إنجازات، ملفي، مخزن، دليل)
const store = require("../core/store");
const Q = require("../game/quests");
const M = require("../game/menus");

module.exports = function (bot) {
    bot.callbackQuery(/^q:(\d+):(\w+)$/, async ctx => {
        try {
            if (String(ctx.from.id) !== ctx.match[1]) {
                return await ctx.answerCallbackQuery({ text: "هذه القائمة ليست لك." });
            }
            const P = store.get(ctx.match[1]);
            if (!P) return await ctx.answerCallbackQuery({ text: "اكتب: حيواني لتبدأ" });

            const now = Date.now();
            const res = Q.settle(P, now);
            store.touch(P.id);

            const screens = {
                quests: () => M.screenQuests(P, res, now),
                ach: () => M.screenAchievements(P, res),
                profile: () => M.screenProfile(P, now),
                bag: () => M.screenBag(P),
                guide: () => M.screenGuide(P)
            };
            const build = screens[ctx.match[2]];
            if (!build) return await ctx.answerCallbackQuery();

            const scr = build();
            await ctx.answerCallbackQuery();
            await ctx.editMessageText(scr.text, { parse_mode: "HTML", reply_markup: scr.kb }).catch(e => {
                if (!/not modified/i.test(String(e && (e.description || e.message)))) throw e;
            });
        } catch (e) {
            console.error("[MENUS CALLBACK ERROR]", e && (e.stack || e.message));
            await ctx.answerCallbackQuery({ text: "حدث خطأ مؤقت" }).catch(() => {});
        }
    });
};