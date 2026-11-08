// يراقب الرسائل العادية أثناء وجود تخمين أو حزورة في الدردشة، وإلا يمرر الرسالة للأوامر
const { esc, nameOf, link, HTML, digits, norm } = require("../lib/util");
const { guess, riddle, alive } = require("../lib/rounds");

module.exports = function (bot) {
    bot.on("message:text", async (ctx, next) => {
        const chat = ctx.chat.id;
        const text = ctx.message.text.trim();
        if (ctx.from && ctx.from.is_bot) return next();

        const g = alive(guess, chat);
        if (g && /^\d{1,3}$/.test(digits(text))) {
            const n = Number(digits(text));
            g.tries++;
            if (n === g.n) {
                guess.delete(chat);
                return ctx.reply(`🎉 ${link(ctx.from.id, nameOf(ctx.from))} خمّن الرقم <b>${n}</b> بعد ${g.tries} محاولة!`, HTML);
            }
            return ctx.reply(n < g.n ? "⬆️ أكبر" : "⬇️ أصغر");
        }

        const r = alive(riddle, chat);
        if (r) {
            if (/^[./!]?(حل|تخطي|تخطى)$/.test(text)) {
                riddle.delete(chat);
                return ctx.reply("💡 الجواب: <b>" + esc(r.answers[0]) + "</b>", HTML);
            }
            if (r.answers.some(a => norm(a) === norm(text))) {
                riddle.delete(chat);
                return ctx.reply(`✅ ${link(ctx.from.id, nameOf(ctx.from))} أجاب صحيحًا: <b>${esc(r.answers[0])}</b> 🎉`, HTML);
            }
        }
        return next();
    });
};