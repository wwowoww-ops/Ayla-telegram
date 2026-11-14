// تزاوج مشترك: رد على رسالة لاعب بـ ".تزاوج_مشترك"
const { cmd, nameOf } = require("../../lib/util");
const ui = require("../../game/ui");
const store = require("../../core/store");
const J = require("../../game/joint");
const JM = require("../../game/joint-menu");

module.exports = function (bot) {
    cmd(bot, ["تزاوج_مشترك", "استعارة", "تزاوج مشترك"], async ctx => {
        const rep = ctx.message.reply_to_message;
        if (!rep || !rep.from || rep.from.is_bot || rep.from.id === ctx.from.id) {
            return ctx.reply("🤝 <b>تزاوج مشترك</b>\nرد على رسالة لاعب آخر بالأمر <code>.تزاوج_مشترك</code>، فتختار حيوانك وتتفقان على من يأخذ البيضة ومن يدفع، ثم يختار هو حيوانه.", { parse_mode: "HTML" });
        }
        const A = ui.ensure(ctx.from);
        const B = store.get(rep.from.id);
        if (!B) return ctx.reply("هذا اللاعب لم يبدأ اللعبة بعد.");
        const o = J.create({ id: A.id, name: nameOf(ctx.from) }, { id: B.id, name: nameOf(rep.from) });
        const s = JM.screen(o);
        return ctx.reply(s.text, { parse_mode: "HTML", reply_markup: s.kb, reply_to_message_id: rep.message_id });
    }, { menu: "تزاوج مشترك", category: "animals" });
};
