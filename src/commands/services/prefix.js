
/**
 * ╔══════════════════════════════════════╗
 * ║             AYLA PREFIX              ║
 * ║                 v1.0                 ║
 * ╚══════════════════════════════════════╝
 *
 * عرض وتغيير بادئة المجموعة
 */

const { cmd, HTML, esc, getPrefix, setPrefix } = require("../../lib/util");

const OWNER_ID = "7401027785";

// ==================================================
// PREFIX COMMAND
// ==================================================

module.exports = function(bot) {

    cmd(bot, ["بادئة"], async (ctx, args) => {

        const chatType = ctx.chat.type;

        // الأمر يعمل في المجموعات فقط
        if (
            chatType !== "group" &&
            chatType !== "supergroup"
        ) {
            return ctx.reply(
                "✿ هذا الأمر مخصص للمجموعات."
            );
        }

        const chatId = ctx.chat.id;

        // عرض البادئة الحالية
        if (!args) {
            const prefix = getPrefix(chatId);

            return ctx.reply(
                "✿ <b>AYLA — PREFIX</b>\n" +
                "━━━━━━━━━━━━━━━━━━\n\n" +
                "◈ البادئة الحالية:\n" +
                "「 <code>" +
                (prefix === "" ? "بدون بادئة" : esc(prefix)) +
                "</code> 」\n\n" +
                "◈ طريقة الاستخدام:\n" +
                "• <code>بادئة ~</code> تغيير البادئة.\n" +
                "• <code>بادئة بدون</code> تعطيل البادئة.\n\n" +
                "━━━━━━━━━━━━━━━━━━",
                HTML
            );
        }

        // التحقق من صلاحية التغيير
        const isOwner = String(ctx.from.id) === OWNER_ID;

        if (!isOwner) {
            let member;

            try {
                member = await ctx.api.getChatMember(
                    chatId,
                    ctx.from.id
                );
            } catch (e) {
                console.error(
                    "[AYLA PREFIX] Permission error:",
                    e.message
                );

                return ctx.reply(
                    "تعذّر التحقق من صلاحياتك."
                );
            }

            const allowed =
                member.status === "administrator" ||
                member.status === "creator";

            if (!allowed) {
                return ctx.reply(
                    "✿ عذرًا، تغيير البادئة متاح لمشرفي المجموعة فقط."
                );
            }
        }

        // تعطيل البادئة
        if (args === "بدون") {
            try {
                setPrefix(chatId, "");

                return ctx.reply(
                    "✿ <b>AYLA — PREFIX</b>\n" +
                    "━━━━━━━━━━━━━━━━━━\n\n" +
                    "✓ تم تعطيل البادئة.\n" +
                    "الأوامر تعمل الآن دون بادئة في هذه المجموعة.\n\n" +
                    "━━━━━━━━━━━━━━━━━━",
                    HTML
                );

            } catch (e) {
                return ctx.reply(
                    "⚠️ " + esc(e.message)
                );
            }
        }

        // تغيير البادئة
        try {
            const prefix = setPrefix(chatId, args);

            return ctx.reply(
                "✿ <b>AYLA — PREFIX</b>\n" +
                "━━━━━━━━━━━━━━━━━━\n\n" +
                "✓ تم تغيير البادئة بنجاح.\n\n" +
                "◈ البادئة الجديدة:\n" +
                "「 <code>" + esc(prefix) + "</code> 」\n\n" +
                "مثال:\n" +
                "<code>" + esc(prefix) + "رصيدي</code>\n\n" +
                "━━━━━━━━━━━━━━━━━━",
                HTML
            );

        } catch (e) {
            return ctx.reply(
                "⚠️ " + esc(e.message)
            );
        }

    }, {
        noPrefix: true,
        menu: "بادئة",
        category: "services"
    });

};
