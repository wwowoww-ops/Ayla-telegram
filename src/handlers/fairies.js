// أزرار الجنيات: متجر، تجهيز، إطلاق، توسيع، دليل
const store = require("../core/store");
const F = require("../game/fairies");
const M = require("../game/fairies/menu");

module.exports = function (bot) {
    bot.callbackQuery(/^fy:(\d+):(main|eq|shop|rl|gd|slot|tg|buy|ra|rc)(?::(\d+))?$/, async ctx => {
        try {
            if (String(ctx.from.id) !== ctx.match[1]) return await ctx.answerCallbackQuery({ text: "هذه القائمة ليست لك.", show_alert: true });
            const P = store.get(ctx.match[1]);
            if (!P) return await ctx.answerCallbackQuery({ text: "اكتب: حيواني لتبدأ" });
            const act = ctx.match[2], arg = ctx.match[3];
            let scr, r = null;
            if (act === "slot") { r = F.buySlot(P); scr = M.screenMain(P, r.msg); }
            else if (act === "tg") { r = F.toggle(P, arg); scr = M.screenEquip(P, r.msg); }
            else if (act === "buy") { r = F.buy(P, arg); scr = M.screenShop(P, r.msg); }
            else if (act === "rc") { r = F.release(P, arg); scr = M.screenRelease(P, r.msg); }
            else if (act === "ra") scr = M.screenRelease(P, "", arg);
            else if (act === "rl") scr = M.screenRelease(P);
            else if (act === "eq") scr = M.screenEquip(P);
            else if (act === "shop") scr = M.screenShop(P);
            else if (act === "gd") scr = M.screenGuide(P);
            else scr = M.screenMain(P);
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