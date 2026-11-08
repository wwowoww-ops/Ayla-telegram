
/**
 * ╔══════════════════════════════════════╗
 * ║             AYLA DIVORCE             ║
 * ║                 v1.1                 ║
 * ╚══════════════════════════════════════╝
 */

const { InlineKeyboard } = require("grammy");
const { cmd, esc } = require("../../lib/util");
const M = require("../../core/marriage");

const FOOTER = "\n\n❀ ━━━━━━━━━━━━━ ❀";

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
            .text("↩ إلغاء", `divorce:cancel:${ctx.from.id}`);

        return ctx.reply(
            "❀ ━━ 𝗔𝗬𝗟𝗔 〢 𝗗𝗜𝗩𝗢𝗥𝗖𝗘 ━━ ❀\n\n" +
            "⚖️ تأكيد إنهاء الزواج\n\n" +
            `الشريكة: ${esc(marriage.wifeName)}\n` +
            `المهر المسجل: ${Number(marriage.dowry).toLocaleString("en-US")} VLT\n\n` +
            "سيؤدي التأكيد إلى إنهاء الزواج نهائيًا.\n" +
            "لن يتم استرداد المهر تلقائيًا.\n\n" +
            "هل تريد المتابعة؟" +
            FOOTER,
            { reply_markup: keyboard }
        );
    }, {
        menu: "طلاق",
        category: "services"
    });

    bot.callbackQuery(/^divorce:/, async ctx => {
        const action = ctx.callbackQuery.data;
        const userId = String(ctx.from.id);

        const cancel = /^divorce:cancel:(\d+)$/.exec(action);

        if (cancel) {
            if (userId !== cancel[1]) {
                return ctx.answerCallbackQuery({
                    text: "هذا التأكيد ليس مخصصًا لك.",
                    show_alert: true
                });
            }

            await ctx.answerCallbackQuery({
                text: "تم إلغاء العملية."
            });

            return ctx.editMessageText(
                "↩ تم إلغاء طلب الطلاق." + FOOTER
            );
        }

        const confirm = /^divorce:confirm:(\d+)$/.exec(action);

        if (!confirm) {
            return ctx.answerCallbackQuery();
        }

        if (userId !== confirm[1]) {
            return ctx.answerCallbackQuery({
                text: "هذا التأكيد ليس مخصصًا لك.",
                show_alert: true
            });
        }

        try {
            await M.endMarriage(userId, "divorce", 0);

            await ctx.answerCallbackQuery({
                text: "تم تسجيل الطلاق."
            });

            return ctx.editMessageText(
                "❀ ━━ 𝗔𝗬𝗟𝗔 〢 𝗗𝗜𝗩𝗢𝗥𝗖𝗘 ━━ ❀\n\n" +
                "⚖️ تم إنهاء الزواج وتسجيل الطلاق.\n\n" +
                "انتهت هذه المرحلة، ونتمنى للطرفين التوفيق والاحترام.\n\n" +
                "❀ ━━━━━━━━━━━━━ ❀"
            );

        } catch (error) {
            return ctx.answerCallbackQuery({
                text: error.message || "تعذر تنفيذ العملية.",
                show_alert: true
            });
        }
    });
};
