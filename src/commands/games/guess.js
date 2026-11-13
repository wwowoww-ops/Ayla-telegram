// تخمين الرقم
const { cmd } = require("../../lib/util");
const { guess, alive } = require("../../lib/rounds");

module.exports = function (bot) {
    cmd(bot, ["تخمين", "خمن", "خمّن"], async (ctx, args) => {
        if (/^(انهاء|إنهاء|ايقاف|إيقاف|توقف)$/.test(args)) {
            return ctx.reply(guess.delete(ctx.chat.id) ? "🛑 أُنهيت اللعبة." : "لا توجد لعبة نشطة.");
        }
        if (alive(guess, ctx.chat.id)) return ctx.reply("اللعبة شغالة! خمّنوا رقمًا بين 1 و100. (للإنهاء: .تخمين انهاء)");
        guess.set(ctx.chat.id, { n: 1 + Math.floor(Math.random() * 100), tries: 0, at: Date.now() });
        return ctx.reply("🔢 اخترت رقمًا بين <b>1</b> و<b>100</b>. أرسلوا تخميناتكم في الدردشة!", { parse_mode: "HTML" });
    });
};