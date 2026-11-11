// أزرار الإطارات: فئات، اختيار، شراء، إزالة
const store = require("../core/store");
const F = require("../game/frames");
const Q = require("../game/quests");
const E = require("../game/engine");
const { screenFrames } = require("../game/frameMenu");
const { sendCard } = require("../lib/avatar");

module.exports = function (bot) {
    bot.callbackQuery(/^f:(\d+):(set|off|buy|cat|main)(?::(\w+))?$/, async ctx => {
        try {
            if (String(ctx.from.id) !== ctx.match[1]) {
                return await ctx.answerCallbackQuery({ text: "هذه القائمة ليست لك." });
            }
            const P = store.get(ctx.match[1]);
            if (!P) return await ctx.answerCallbackQuery({ text: "اكتب: حيواني لتبدأ" });
            Q.settle(P, Date.now());

            const act = ctx.match[2], arg = ctx.match[3];
            let note = "", preview = null, cat = null;

            if (act === "main") {
                // الصفحة الرئيسية
            } else if (act === "cat") {
                cat = arg;
            } else if (act === "off") {
                P.frame = null;
                note = "🚫 أُزيل الإطار.";
            } else if (act === "buy") {
                const fr = F.byId(arg);
                if (!fr || !fr.price) return await ctx.answerCallbackQuery({ text: "هذا الإطار لا يُشترى." });
                if (F.isUnlocked(P, fr)) return await ctx.answerCallbackQuery({ text: "تملكه بالفعل." });
                if (P.coins < fr.price) return await ctx.answerCallbackQuery({ text: "تحتاج " + E.fmt(fr.price) + " 🪙", show_alert: true });
                P.coins -= fr.price;
                P.fown = P.fown || {};
                P.fown[fr.id] = true;
                P.frame = fr.id;
                note = `🛒 اشتريت إطار ${fr.name} وفُعّل.`;
                preview = fr; cat = fr.cat;
            } else {
                const fr = F.byId(arg);
                if (!fr) return await ctx.answerCallbackQuery({ text: "إطار غير معروف" });
                if (!F.isUnlocked(P, fr)) return await ctx.answerCallbackQuery({ text: "🔒 " + (fr.text || "مغلق") });
                P.frame = fr.id;
                note = `✅ فُعّل إطار ${fr.name}.`;
                preview = fr; cat = fr.cat;
            }
            store.touch(P.id);
            await ctx.answerCallbackQuery(note ? { text: note.replace(/<[^>]+>/g, "") } : undefined);

            const scr = screenFrames(P, note, cat);
            await ctx.editMessageText(scr.text, { parse_mode: "HTML", reply_markup: scr.kb }).catch(e => {
                if (!/not modified/i.test(String(e && (e.description || e.message)))) throw e;
            });
            // معاينة فورية بصورة حسابه
            if (preview) await sendCard(ctx, ctx.from, preview, "🖼️ معاينة الإطار").catch(() => {});
        } catch (e) {
            console.error("[FRAMES CALLBACK ERROR]", e && (e.stack || e.message));
            await ctx.answerCallbackQuery({ text: "حدث خطأ مؤقت" }).catch(() => {});
        }
    });
};