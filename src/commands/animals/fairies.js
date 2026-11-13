// أمر الجنيات: .جنيات
const { cmd } = require("../../lib/util");
const store = require("../../core/store");
const ui = require("../../game/ui");
const M = require("../../game/fairies/menu");

module.exports = function (bot) {
    cmd(bot, ["جنيات", "الجنيات", "جنية", "جنياتي"], ctx => {
        const P = ui.ensure(ctx.from);
        store.touch(P.id);
        const scr = M.screenMain(P);
        return ctx.reply(scr.text, { parse_mode: "HTML", reply_markup: scr.kb });
    }, { menu: "الجنيات", category: "animals" });
};