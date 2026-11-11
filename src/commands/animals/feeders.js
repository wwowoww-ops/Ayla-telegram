// أمر فتح أماكن الأكل
const { cmd } = require("../../lib/util");
const store = require("../../core/store");
const ui = require("../../game/ui");
const F = require("../../game/feeders");
const FM = require("../../game/feederMenu");

module.exports = function (bot) {
    cmd(bot, ["اماكن الاكل", "أماكن الأكل", "مغذيات", "اوعية", "أوعية", "وعاء"], async ctx => {
        const P = ui.ensure(ctx.from);
        F.tick(P, Date.now());
        store.touch(P.id);
        const scr = FM.screenMain(P);
        await ctx.reply(scr.text, { parse_mode: "HTML", reply_markup: scr.kb });
    }, { menu: "أماكن الأكل", category: "animals" });
};