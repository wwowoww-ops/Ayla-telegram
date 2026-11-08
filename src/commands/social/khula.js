
/**
 * ╔══════════════════════════════════════╗
 * ║              AYLA KHULA              ║
 * ║                 v1.0                 ║
 * ╚══════════════════════════════════════╝
 */

const { InlineKeyboard } = require("grammy");
const { cmd } = require("../../lib/util");
const M = require("../../core/marriage");

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

    const amount = Number(match[1]) * (multipliers[match[2]] || 1);

    if (!Number.isSafeInteger(Math.floor(amount))) return NaN;

    return Math.floor(amount);
}

module.exports = function (bot) {

    cmd(bot, ["خلع"], async (ctx, args) => {
        if (!ctx.from || ctx.from.is_bot) return;

        const marriage = M.marriageOf(ctx.from.id);

        if (!marriage) {
            return ctx.reply("💔 لا يوجد زواج قائم لديك.");
        }

        if (marriage.wife !== String(ctx.from.id)) {
            return ctx.reply("⚖️ أمر الخلع متاح للزوجة فقط.");
        }

        if (!args) {
            return ctx.reply(
                "🕊 طريقة استخدام الخلع:\n\n" +
                "اكتبي:\n" +
                "خلع 100\n\n" +
                "الرقم هو مبلغ التعويض المتفق عليه.\n" +
                "اكتبي خلع 0 إذا لم يوجد تعويض.\n\n" +
                `المهر المسجل: ${marriage.dowry.toLocaleString("en-US")} VLT`
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
                `khula:confirm:${ctx.from.id}:${amount}`
            )
            .text("↩ إلغاء", "khula:cancel");

        return ctx.reply(
            "❀ ━━ 𝗔𝗬𝗟𝗔 〢 𝗞𝗛𝗨𝗟𝗔 ━━ ❀\n\n" +
            "🕊 طلب إنهاء الزواج بالخلع\n\n" +
            `التعويض: ${amount.toLocaleString("en-US")} VLT\n` +
            `المهر الأصلي: ${marriage.dowry.toLocaleString("en-US")} VLT\n\n` +
            "سيتم خصم التعويض من رصيدك وتحويله إلى الزوج.\n" +
            "هل تريدين متابعة العملية؟",
            { reply_markup: keyboard }
        );
    }, {
        menu: "خلع",
        category: "services"
    });

    bot.callbackQuery(/^khula:/, async ctx => {
        const action = ctx.callbackQuery.data;

        if (action === "khula:cancel") {
            await ctx.answerCallbackQuery("تم إلغاء العملية.");
            return ctx.editMessageText("↩ تم إلغاء طلب الخلع.");
        }

        const match = /^khula:confirm:(\d+):(\d+)$/.exec(action);

        if (!match) return ctx.answerCallbackQuery();

        const [, ownerId, amountText] = match;
        const amount = Number(amountText);

        if (String(ctx.from.id) !== ownerId) {
            return ctx.answerCallbackQuery({
                text: "هذا التأكيد ليس مخصصًا لك.",
                show_alert: true
            });
        }

        try {
            await M.endMarriage(ctx.from.id, "khula", amount);

            await ctx.answerCallbackQuery("تم تسجيل الخلع.");

            return ctx.editMessageText(
                "❀ ━━ 𝗔𝗬𝗟𝗔 〢 𝗞𝗛𝗨𝗟𝗔 ━━ ❀\n\n" +
                "🕊 تم إنهاء الزواج بالخلع.\n" +
                `💰 التعويض المسجل: ${amount.toLocaleString("en-US")} VLT\n\n` +
                "تم تسجيل العملية في سجل AYLA.\n\n" +
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
