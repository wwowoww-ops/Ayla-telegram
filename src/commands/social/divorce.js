
/**
 * ╔══════════════════════════════════════╗
 * ║            AYLA DIVORCE              ║
 * ║                 v1.0                 ║
 * ╚══════════════════════════════════════╝
 */

const { InlineKeyboard } = require("grammy");
const { cmd, esc } = require("../../lib/util");
const M = require("../../core/marriage");

module.exports = function (bot) {

    cmd(bot, ["طلاق"], async ctx => {
        if (!ctx.from || ctx.from.is_bot) return;

        const marriage = M.marriageOf(ctx.from.id);

        if (!marriage) {
            return ctx.reply("💔 لا يوجد زواج قائم لإنهائه.");
        }

        if (marriage.husband !== String(ctx.from.id)) {
            return ctx.reply(
                "⚖️ أمر الطلاق متاح للزوج فقط.\n" +
                "إذا كنت الزوجة وتريدين إنهاء الزواج، استخدمي أمر خلع."
            );
        }

        const keyboard = new InlineKeyboard()
            .text("⚖️ تأكيد الطلاق", `divorce:confirm:${ctx.from.id}`)
            .text("↩ إلغاء", "divorce:cancel");

        return ctx.reply(
            "❀ ━━ 𝗔𝗬𝗟𝗔 〢 𝗗𝗜𝗩𝗢𝗥𝗖𝗘 ━━ ❀\n\n" +
            "⚖️ طلب إنهاء الزواج\n\n" +
            `الشريكة: ${esc(marriage.wifeName)}\n` +
            `المهر المسجل: ${marriage.dowry.toLocaleString("en-US")} VLT\n\n` +
            "هل أنت متأكد من إنهاء الزواج؟\n" +
            "لن يتم استرداد المهر تلقائيًا.\n\n" +
            "خذ وقتك في التفكير، فالقرار نهائي.",
            { reply_markup: keyboard }
        );
    }, {
        menu: "طلاق",
        category: "services"
    });

    bot.callbackQuery(/^divorce:/, async ctx => {
        const action = ctx.callbackQuery.data;

        if (action === "divorce:cancel") {
            await ctx.answerCallbackQuery("تم إلغاء العملية.");
            return ctx.editMessageText("↩ تم إلغاء طلب الطلاق.");
        }

        const match = /^divorce:confirm:(\d+)$/.exec(action);

        if (!match) return ctx.answerCallbackQuery();

        if (String(ctx.from.id) !== match[1]) {
            return ctx.answerCallbackQuery({
                text: "هذا التأكيد ليس مخصصًا لك.",
                show_alert: true
            });
        }

        try {
            await M.endMarriage(ctx.from.id, "divorce", 0);

            await ctx.answerCallbackQuery("تم تسجيل الطلاق.");

            return ctx.editMessageText(
                "❀ ━━ 𝗔𝗬𝗟𝗔 〢 𝗗𝗜𝗩𝗢𝗥𝗖𝗘 ━━ ❀\n\n" +
                "⚖️ تم إنهاء الزواج وتسجيل الطلاق.\n\n" +
                "انتهت هذه المرحلة، ونتمنى للطرفين التوفيق والاحترام.\n\n" +
                "❀ ━━━━━━━━━━━━━ ❀"
            );
        } catch (error) {
            return ctx.answerCallbackQuery({
                text: error.message,
                show_alert: true
            });
        }
    });
};
