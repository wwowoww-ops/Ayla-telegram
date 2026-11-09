// أمر فتح لعبة الحيوان المصغّرة
const { InlineKeyboard } = require("grammy");
const { cmd } = require("../../lib/util");
const config = require("../../web/config");

module.exports = function (bot) {
    cmd(bot, ["العب", "لعبة", "تطبيق", "العاب_الحيوان"], ctx => {
        if (!config.url) return ctx.reply("اللعبة المصغّرة غير مفعّلة بعد: يجب إضافة رابط عام للبوت في Railway.");
        // أزرار فتح التطبيق تعمل في المحادثة الخاصة فقط
        if (ctx.chat.type === "private") {
            const kb = new InlineKeyboard().webApp("🎮 افتح اللعبة", config.url);
            return ctx.reply("🐾 عالم الحيوانات بانتظارك!", { reply_markup: kb });
        }
        const kb = new InlineKeyboard().url("🎮 افتح في الخاص", "https://t.me/" + ctx.me.username);
        return ctx.reply("اللعبة المصغّرة تُفتح في المحادثة الخاصة مع البوت. اضغط الزر ثم اكتب: العب", { reply_markup: kb });
    }, { menu: "اللعبة المصغّرة", category: "animals" });
};