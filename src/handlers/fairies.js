// أزرار الجنيات: رئيسية (المجهزة)، جنياتي، بطاقة، بيئة، متجر، نسب، دليل
const store = require("../core/store");
const F = require("../game/fairies");
const M = require("../game/fairies/menu");

module.exports = function (bot) {
    bot.callbackQuery(/^fy:(\d+):(\w+)(?::(\d+))?(?::(\w+))?$/, async ctx => {
        try {
            if (String(ctx.from.id) !== ctx.match[1]) return await ctx.answerCallbackQuery({ text: "هذه القائمة ليست لك.", show_alert: true });
            const P = store.get(ctx.match[1]);
            if (!P) return await ctx.answerCallbackQuery({ text: "اكتب: حيواني لتبدأ" });
            const act = ctx.match[2], arg = ctx.match[3], arg2 = ctx.match[4], now = Date.now();
            let scr, r = null;
            switch (act) {
                case "slot": r = F.buySlot(P); scr = M.screenMain(P, r.msg); break;
                case "tg": r = F.toggle(P, arg); scr = M.screenCard(P, arg, r.msg); break;
                case "buy": r = F.buy(P, arg); scr = M.screenShop(P, r.msg); break;
                case "rc": r = F.release(P, arg); scr = M.screenMine(P, 0, r.msg); break;
                case "ra": scr = M.screenRelease(P, "", arg); break;
                case "hp": r = F.setHabitat(P, arg, arg2, now); scr = M.screenCard(P, arg, r.msg); break;
                case "hr": r = F.removeHabitat(P, arg, now); scr = M.screenCard(P, arg, r.msg); break;
                case "du": r = F.useDust(P, arg, arg2, now); scr = M.screenCard(P, arg, r.msg); break;
                case "hb": scr = M.screenPickHab(P, arg); break;
                case "hv": scr = M.screenHabitat(P); break;
                case "rn": scr = M.screenRename(P, arg); break;
                case "cd": scr = M.screenCard(P, arg); break;
                case "my": scr = M.screenMine(P, Number(arg) || 0); break;
                case "shop": scr = M.screenShop(P); break;
                case "rt": scr = M.screenRates(P); break;
                case "gd": scr = M.screenGuide(P); break;
                default: scr = M.screenMain(P);
            }
            if (r && r.ok) store.touch(P.id);
            await ctx.answerCallbackQuery(r && !r.ok ? { text: r.msg, show_alert: true } : undefined);
            await ctx.editMessageText(scr.text, { parse_mode: "HTML", reply_markup: scr.kb }).catch(e => {
                if (!/not modified/i.test(String(e && (e.description || e.message)))) throw e;
            });
        } catch (e) {
            console.error("[FAIRIES CALLBACK ERROR]", e && (e.stack || e.message));
            await ctx.answerCallbackQuery({ text: "حدث خطأ مؤقت" }).catch(() => {});
        }
    });
};
