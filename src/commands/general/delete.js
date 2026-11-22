// «احذفي» بالرد على رسالة: تحذفها (وتحذف أمر الحذف نفسه).
// رسائل البوت: يحذفها أي عضو. رسائل غيره: للمشرفين فقط، ويلزم أن يملك البوت صلاحية حذف الرسائل.
const { cmd } = require("../../lib/util");

module.exports = function (bot) {
    cmd(bot, ["احذفي", "إحذفي", "امسحي", "احذف", "امسح"], async ctx => {
        const target = ctx.message.reply_to_message;
        if (!target) return ctx.reply("↩️ رُدّ على الرسالة التي تريد حذفها بكلمة «احذفي».").catch(() => {});

        const mine = target.from && target.from.id === ctx.me.id;
        if (!mine && ctx.chat.type !== "private") {
            let ok = false;
            try {
                const m = await ctx.api.getChatMember(ctx.chat.id, ctx.from.id);
                ok = m.status === "creator" || m.status === "administrator";
            } catch (e) { /* لا شيء */ }
            if (!ok) return ctx.reply("🚫 حذف رسائل الآخرين للمشرفين فقط.").catch(() => {});
        }
        if (!mine && ctx.chat.type === "private") return ctx.reply("لا أستطيع حذف رسائلك في الخاص، أستطيع حذف رسائلي فقط.").catch(() => {});

        try {
            await ctx.api.deleteMessage(ctx.chat.id, target.message_id);
        } catch (e) {
            return ctx.reply("⚠️ تعذّر الحذف. إن كانت الرسالة لغيري فأعطني صلاحية «حذف الرسائل»، وربما مرّ عليها أكثر من 48 ساعة.").catch(() => {});
        }
        await ctx.api.deleteMessage(ctx.chat.id, ctx.message.message_id).catch(() => {});
    }, { menu: "احذفي", category: "services" });
};
