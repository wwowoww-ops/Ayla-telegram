
/**
 * ╔══════════════════════════════════════╗
 * ║              AYLA KHULA              ║
 * ║                 v1.1                 ║
 * ╚══════════════════════════════════════╝
 */

const { InlineKeyboard } = require("grammy");
const { cmd } = require("../../lib/util");
const M = require("../../core/marriage");

const FOOTER = "\n\n❀ ━━━━━━━━━━━━━ ❀";

function parseAmount(value) {
    const text = String(value || "").trim().toUpperCase();
    const match = /^(\d+(?:\.\d+)?)(K|M|B|T)?$/.exec(text);

    if (!match) return NaN;

    const multipliers = {
        K: 1e3,
        M: 1e6,
        B: 1e9,
        T: 1e12
    };

    const amount = Number(match[1]) *
        (multipliers[match[2]] || 1);

    if (!Number.isSafeInteger(Math.floor(amount))) {
        return NaN;
    }

    return Math.floor(amount);
}

module.exports = function (bot) {

    cmd(bot, ["خلع"], async (ctx, args) => {
        if (!ctx.from || ctx.from.is_bot) return;

        const userId = String(ctx.from.id);
        const marriage = M.marriageOf(userId);

        if (!marriage) {
            return ctx.reply("💔 لا يوجد زواج قائم لديك.");
        }

        if (marriage.wife !== userId) {
            return ctx.reply("⚖️ أمر الخلع متاح للزوجة فقط.");
        }

        if (!args) {
            return ctx.reply(
                "❀ ━━ 𝗔𝗬𝗟𝗔 〢 𝗞𝗛𝗨𝗟𝗔 ━━ ❀\n\n" +
                "🕊 طريقة استخدام الخلع:\n\n" +
                "اكتبي:\n" +
                "خلع 100\n\n" +
                "الرقم هو مبلغ التعويض المتفق عليه.\n" +
                "يمكن كتابة 5K أو 1M أيضًا.\n" +
                "اكتبي خلع 0 إذا لم يوجد تعويض.\n\n" +
                `المهر المسجل: ${Number(marriage.dowry).toLocaleString("en-US")} VLT` +
                FOOTER
            );
        }

        const amount = parseAmount(args);

        if (!Number.isSafeInteger(amount) || amount < 0) {
            return ctx.reply("❌ اكتبي مبلغًا صحيحًا، مثل: خلع 100");
        }

        if (amount > marriage.dowry) {
            return ctx.reply("❌ التعويض لا يمكن أن يتجاوز المهر المسجل.");
        }

        const keyboard = new InlineKeyboard()
            .text(
                "🕊 تأكيد الخلع",
                `khula:confirm:${userId}:${amount}`
            )
            .text(
                "↩ إلغاء",
                `khula:cancel:${userId}`
            );

        return ctx.reply(
            "❀ ━━ 𝗔𝗬𝗟𝗔 〢 𝗞𝗛𝗨𝗟𝗔 ━━ ❀\n\n" +
            "🕊 تأكيد إنهاء الزواج بالخلع\n\n" +
            `💰 التعويض: ${amount.toLocaleString("en-US")} VLT\n` +
            `💍 المهر الأصلي: ${Number(marriage.dowry).toLocaleString("en-US")} VLT\n\n` +
            "سيتم خصم التعويض من رصيدك وتحويله إلى الزوج.\n" +
            "لا يمكن التراجع عن العملية بعد تأكيدها.\n\n" +
            "هل تريدين المتابعة؟" +
            FOOTER,
            { reply_markup: keyboard }
        );

    }, {
        menu: "خلع",
        category: "fun"
    });

    bot.callbackQuery(/^khula:/, async ctx => {
        const action = ctx.callbackQuery.data;
        const userId = String(ctx.from.id);

        const cancel = /^khula:cancel:(\d+)$/.exec(action);

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
                "↩ تم إلغاء طلب الخلع." + FOOTER
            );
        }

        const match = /^khula:confirm:(\d+):(\d+)$/.exec(action);

        if (!match) {
            return ctx.answerCallbackQuery();
        }

        const [, ownerId, amountText] = match;
        const amount = Number(amountText);

        if (userId !== ownerId) {
            return ctx.answerCallbackQuery({
                text: "هذا التأكيد ليس مخصصًا لك.",
                show_alert: true
            });
        }

        if (!Number.isSafeInteger(amount) || amount < 0) {
            return ctx.answerCallbackQuery({
                text: "قيمة التعويض غير صالحة.",
                show_alert: true
            });
        }

        try {
            const marriage = M.marriageOf(userId);

            if (!marriage || marriage.wife !== userId) {
                throw new Error("لا يوجد زواج قائم يمكنك إنهاؤه.");
            }

            if (amount > marriage.dowry) {
                throw new Error("التعويض يتجاوز المهر المسجل.");
            }

            await M.endMarriage(userId, "khula", amount);

            await ctx.answerCallbackQuery({
                text: "تم تسجيل الخلع."
            });

            return ctx.editMessageText(
                "❀ ━━ 𝗔𝗬𝗟𝗔 〢 𝗞𝗛𝗨𝗟𝗔 ━━ ❀\n\n" +
                "🕊 تم إنهاء الزواج بالخلع.\n\n" +
                `💰 التعويض المسجل: ${amount.toLocaleString("en-US")} VLT\n\n` +
                "تم تسجيل العملية في سجل AYLA.\n" +
                "نتمنى للطرفين التوفيق والاحترام.\n" +
                FOOTER
            );

        } catch (error) {
            return ctx.answerCallbackQuery({
                text: error.message || "تعذر تنفيذ العملية.",
                show_alert: true
            });
        }
    });
};
