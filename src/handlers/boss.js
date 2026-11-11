// أزرار البوس الجماعي: استدعاء، هجوم، تحديث، ترتيب
const store = require("../core/store");
const B = require("../game/boss");
const BM = require("../game/bossMenu");
const E = require("../game/engine");
const D = require("../game/data");

const edit = (ctx, scr) => ctx.editMessageText(scr.text, { parse_mode: "HTML", reply_markup: scr.kb }).catch(e => {
    if (!/not modified/i.test(String(e && (e.description || e.message)))) throw e;
});

module.exports = function (bot) {
    bot.callbackQuery(/^bs:(spawn|atk|ref|rank)$/, async ctx => {
        try {
            const chat = ctx.chat;
            if (!chat || chat.type === "private") return await ctx.answerCallbackQuery({ text: "داخل المجموعات فقط." });
            const act = ctx.match[1], now = Date.now();
            if (act === "ref") { await ctx.answerCallbackQuery(); return await edit(ctx, BM.screenBoss(chat.id, now)); }
            if (act === "rank") { await ctx.answerCallbackQuery(); return await edit(ctx, BM.screenRank(chat.id)); }

            const P = store.get(ctx.from.id);
            if (!P) return await ctx.answerCallbackQuery({ text: "اكتب: حيواني لتبدأ اللعبة", show_alert: true });

            if (act === "spawn") {
                const r = B.spawn(chat.id, now);
                if (!r.ok) { await ctx.answerCallbackQuery({ text: r.msg, show_alert: true }); return await edit(ctx, BM.screenBoss(chat.id, now)); }
                await ctx.answerCallbackQuery({ text: "🔥 ظهر الزعيم!" });
                return await edit(ctx, BM.screenBoss(chat.id, now, "🔥 <b>ظهر زعيم جديد! اتحدوا لهزيمته.</b>"));
            }

            // هجوم
            const name = [ctx.from.first_name, ctx.from.last_name].filter(Boolean).join(" ") || ctx.from.username || "لاعب";
            const r = B.attack(chat.id, P, name, now);
            if (!r.ok) {
                await ctx.answerCallbackQuery({ text: r.msg, show_alert: true });
                // قد يكون الوقت انتهى: ننهيه الآن
                const b = B.get(chat.id);
                if (b && !b.done && now >= b.endAt) {
                    const res = B.finish(chat.id, now, false);
                    if (res) await ctx.reply(BM.resultText(res), { parse_mode: "HTML" });
                }
                return;
            }
            store.touch(P.id);
            const hits = r.lines.map(l => `${l.e}${l.eff > 1 ? "🔥" : l.eff < 1 ? "🧊" : ""}`).join(" ");
            await ctx.answerCallbackQuery({ text: `${r.crit ? "💥 ضربة قاضية! " : "⚔️ "}${E.fmt(r.dmg)} ضرر  ${hits}`, show_alert: true });
            if (r.killed) {
                const res = B.finish(chat.id, now, true);
                if (res) return await ctx.reply(BM.resultText(res), { parse_mode: "HTML" });
            }
            await edit(ctx, BM.screenBoss(chat.id, now, `⚔️ <b>${BM.esc(name)}</b> ضرب بـ ${E.fmt(r.dmg)}${r.crit ? " 💥" : ""}`));
        } catch (e) {
            console.error("[BOSS CALLBACK ERROR]", e && (e.stack || e.message));
            await ctx.answerCallbackQuery({ text: "حدث خطأ مؤقت" }).catch(() => {});
        }
    });
};