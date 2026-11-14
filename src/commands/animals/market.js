// أمر سوق اللاعبين: .سوق
const { cmd } = require("../../lib/util");
const store = require("../../core/store");
const ui = require("../../game/ui");
const MM = require("../../game/market-menu");

module.exports = function (bot) {
    cmd(bot, ["سوق", "السوق", "سوق اللاعبين"], ctx => {
        const P = ui.ensure(ctx.from);
        store.touch(P.id);
        const scr = MM.screenMain(P);
        return ctx.reply(scr.text, { parse_mode: "HTML", reply_markup: scr.kb });
    }, { menu: "سوق اللاعبين", category: "animals" });
};
