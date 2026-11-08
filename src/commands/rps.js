// حجر ورقة مقص: الأمر يعرض الأزرار، والنتيجة في handlers/rps.js
const { InlineKeyboard } = require("grammy");
const { nameOf, cmd } = require("../lib/util");

module.exports = function (bot) {
    cmd(bot, ["حجر", "حجرة", "مقص"], async ctx => {
        const kb = new InlineKeyboard()
            .text("🪨 حجر", `rps:${ctx.from.id}:r`)
            .text("📄 ورقة", `rps:${ctx.from.id}:p`)
            .text("✂️ مقص", `rps:${ctx.from.id}:s`);
        return ctx.reply("اختر يا " + nameOf(ctx.from) + ":", { reply_markup: kb });
    });
};