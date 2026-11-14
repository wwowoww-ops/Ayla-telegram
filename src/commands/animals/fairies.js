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

    // تسمية جنية: .سمي_جنية <رقم> <الاسم>
    cmd(bot, ["سمي_جنية", "تسمية_جنية"], (ctx, args) => {
        const P = ui.ensure(ctx.from);
        const m = /^\s*(\d+)\s*([\s\S]*)$/.exec(String(args || ""));
        if (!m) return ctx.reply("اكتب: .سمي_جنية رقم_الجنية الاسم\n(الرقم يظهر في بطاقتها داخل 🧚 جنياتي)");
        const r = require("../../game/fairies").rename(P, m[1], ui.clean(m[2]));
        if (r.ok) store.touch(P.id);
        return ctx.reply(r.msg);
    }, { menu: "تسمية الجنية", category: "animals" });
};