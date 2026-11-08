// أزرار قبول المبارزة أو رفضها
const { esc } = require("../lib/util");
const E = require("../game/engine");
const store = require("../core/store");
const ui = require("../game/ui");
const pending = require("../game/pending");

const TIMEOUT = 2 * 60 * 1000;

module.exports = function (bot) {
    bot.callbackQuery(/^d:(\d+):(\d+):([yn])$/, async ctx => {
        try {
            const [, aId, bId, answer] = ctx.match;
            if (String(ctx.from.id) !== bId) return await ctx.answerCallbackQuery({ text: "هذا التحدي ليس موجهًا لك." });

            const key = aId + ":" + bId;
            const challenge = pending.get(key);
            if (!challenge || ui.now() - challenge.at > TIMEOUT) {
                pending.delete(key);
                await ctx.answerCallbackQuery({ text: "انتهى التحدي" });
                return await ctx.editMessageText("⌛ انتهت مهلة التحدي.").catch(() => {});
            }
            pending.delete(key);
            await ctx.answerCallbackQuery();
            if (answer === "n") return await ctx.editMessageText("❌ رفض التحدي.").catch(() => {});

            const A = store.get(aId), B = store.get(bId);
            const r = E.duel(A, B, challenge.bet, ui.now(), ui.rng);
            if (!r.ok) return await ctx.editMessageText("❌ " + r.msg).catch(() => {});
            store.touch(A.id);
            store.touch(B.id);
            await ctx.editMessageText(
                `🏆 <b>${esc(r.winner.name)}</b> فاز!\n${ui.nameP(r.wp)} هزم ${ui.nameP(r.lp)}\n🎯 كانت نسبة فوزه ${r.chance}%` +
                (r.bet ? `\n💰 ${ui.fmt(r.bet)} 🪙 انتقلت للفائز` : ""),
                { parse_mode: "HTML" }).catch(() => {});
        } catch (e) {
            console.error("[DUEL ERROR]", e && e.message);
            await ctx.answerCallbackQuery({ text: "حدث خطأ مؤقت" }).catch(() => {});
        }
    });
};