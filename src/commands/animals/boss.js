// أمر البوس الجماعي: .بوس
const { cmd } = require("../../lib/util");
const BM = require("../../game/bossMenu");

module.exports = function (bot) {
    cmd(bot, ["بوس", "زعيم", "البوس", "الزعيم"], async ctx => {
        if (ctx.chat.type === "private") {
            return ctx.reply("👑 البوس الجماعي يعمل داخل المجموعات. اكتب .بوس في مجموعتك.");
        }
        const scr = BM.screenBoss(ctx.chat.id, Date.now());
        await ctx.reply(scr.text, { parse_mode: "HTML", reply_markup: scr.kb });
    }, { menu: "البوس الجماعي", category: "animals" });
};