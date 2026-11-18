// أمر الموسم الأسبوعي: .موسم
const { cmd } = require("../../lib/util");
const store = require("../../core/store");
const ui = require("../../game/ui");
const S = require("../../game/season");
const M = require("../../game/seasonMenu");

module.exports = function (bot) {
    cmd(bot, ["موسم", "الموسم", "الموسم_الاسبوعي"], ctx => {
        const P = ui.ensure(ctx.from), now = Date.now();
        if (S.ensure(P, now)) store.touch(P.id);
        const scr = M.screen(P, now);
        return ctx.reply(scr.text, { parse_mode: "HTML", reply_markup: scr.kb });
    }, { menu: "الموسم الأسبوعي", category: "animals" });
};
