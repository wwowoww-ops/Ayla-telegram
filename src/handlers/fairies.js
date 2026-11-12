// أزرار الجنيات: استدعاء، تجهيز، ترقية، توسيع، دليل
const store = require("../core/store");
const F = require("../game/fairies");
const M = require("../game/fairyMenu");

module.exports = function (bot) {
    bot.callbackQuery(/^fy:(\d+):(main|sum|eq|up|gd|slot|tg|lv)(?::(\w+))?$/, async ctx => {
        try {
            if (String(ctx.from.id) !== ctx.match[1]) return await ctx.answerCallbackQuery({ text: "هذه القائمة ليست لك.", show_alert: true });
            const P = store.get(ctx.match[1]);
            if (!P) return await ctx.answerCallbackQuery({ text: "اكتب: حيواني لتبدأ" });
            const act = ctx.match[2], arg = ctx.match[3];
            let scr, r = null;
            if (act === "sum") { r = F.summon(P); scr = M.screenMain(P, r.msg); }
            else if (act === "slot") { r = F.buySlot(P); scr = M.screenMain(P, r.msg); }
            else if (act === "tg") { r = F.toggle(P, arg); scr = M.screenEquip(P, r.msg); }
            else if (act === "lv") { r = F.levelUp(P, arg); scr = M.screenUp(P, r.msg); }
            else if (act === "eq") scr = M.screenEquip(P);
            else if (act === "up") scr = M.screenUp(P);
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