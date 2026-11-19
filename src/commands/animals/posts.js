// أمر: .وظائف  (وظائف الحيوانات: حضانة، حرس الزعيم، صيد، مختبر، راعٍ، خزينة، مدرّب)
const { cmd } = require("../../lib/util");
const ui = require("../../game/ui");
const M = require("../../game/postsMenu");

module.exports = function (bot) {
    cmd(bot, ["وظائف", "وظائف_الحيوانات", "الوظائف"], ctx => {
        const scr = M.main(ui.ensure(ctx.from));
        return ctx.reply(scr.text, { parse_mode: "HTML", reply_markup: scr.kb });
    }, { menu: "وظائف الحيوانات", category: "animals" });
};
