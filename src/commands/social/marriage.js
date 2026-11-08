
/**
 * ╔══════════════════════════════════════╗
 * ║          AYLA SOCIAL MARRIAGE         ║
 * ║                 v1.0                 ║
 * ╚══════════════════════════════════════╝
 */

const { InlineKeyboard } = require("grammy");
const { cmd, esc, nameOf } = require("../../lib/util");
const store = require("../../core/store");
const ui = require("../../game/ui");
const M = require("../../core/marriage");
const makeCard = require("../../game/marriageCard");

const FOOTER = "\n\n❀ ━━━━━━━━━━━━━ ❀";

function menuKeyboard() {
    return new InlineKeyboard()
        .text("💌 طلب الزواج", "marriage:proposal")
        .text("💗 نسبة الحب", "marriage:love")
        .row()
        .text("💑 معلومات زواجي", "marriage:info")
        .text("📨 طلباتي", "marriage:requests")
        .row()
        .text("👑 سجل المجموعة", "marriage:records")
        .row()
        .text("⚧ تسجيل الجنس", "marriage:gender")
        .row()
        .text("✖ إغلاق", "marriage:close");
}

function backKeyboard() {
    return new InlineKeyboard()
        .text("↩ العودة للقائمة", "marriage:home");
}

function menuText() {
    return (
        "❀ ━━ 𝗔𝗬𝗟𝗔 〢 𝗠𝗔𝗥𝗥𝗜𝗔𝗚𝗘 ━━ ❀\n\n" +
        "💍 أهلاً بك في نظام الزواج\n\n" +
        "اختر الخدمة التي تريدها:\n\n" +
        "💌 طلب الزواج\n" +
        "إرسال طلب ارتباط مع تحديد المهر وانتظار الموافقة.\n\n" +
        "💗 نسبة الحب\n" +
        "حساب توافق ترفيهي بين اسمين، لا يقيس المشاعر الحقيقية.\n\n" +
        "💑 معلومات زواجي\n" +
        "معرفة الشريك والمهر وتاريخ الارتباط.\n\n" +
        "📨 طلباتي\n" +
        "متابعة الطلبات الواردة والصادرة وقبولها أو رفضها.\n\n" +
        "👑 سجل المجموعة\n" +
        "عرض الزيجات المسجلة في هذه المجموعة.\n\n" +
        "⚧ تسجيل الجنس\n" +
        "تحديد الجنس المطلوب للمشاركة في نظام الزواج.\n\n" +
        "⚖️ أوامر إنهاء الزواج:\n" +
        "• طلاق: للزوج.\n" +
        "• خلع: للزوجة.\n\n" +
        "😂 محكمة AYLA مفتوحة، لكن القرار لك!"
    );
}

async function showMenu(ctx) {
    return ctx.reply(menuText() + FOOTER, {
        reply_markup: menuKeyboard()
    });
}

async function answer(ctx, text, keyboard = backKeyboard()) {
    return ctx.editMessageText(text + FOOTER, {
        reply_markup: keyboard
    });
}

function requestKeyboard(request) {
    return new InlineKeyboard()
        .text("💍 قبول", `marriage:accept:${request.id}`)
        .text("❌ رفض", `marriage:reject:${request.id}`);
}

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
    cmd(bot, ["زواج"], async (ctx, args) => {
        const from = ctx.from;

        if (!from || from.is_bot) return;

        // حساب نسبة الحب:
        // زواج حب الاسم الأول | الاسم الثاني
        if (args.startsWith("حب ")) {
            const names = args.slice(3).split("|");

            if (names.length !== 2 || !names[0].trim() || !names[1].trim()) {
                return ctx.reply(
                    "💗 طريقة الاستخدام:\n" +
                    "زواج حب الاسم الأول | الاسم الثاني"
                );
            }

            const percent = M.compatibility(
                names[0].trim(),
                names[1].trim()
            );

            const comment =
                percent >= 90 ? "توافق أسطوري! 😂" :
                percent >= 75 ? "هناك انسجام جميل!" :
                percent >= 55 ? "قد تنجح الحكاية!" :
                "يبدو أنكما تحتاجان إلى قهوة وحديث طويل ☕";

            return ctx.reply(
                "❀ ━━ 𝗔𝗬𝗟𝗔 〢 𝗟𝗢𝗩𝗘 ━━ ❀\n\n" +
                `💗 ${esc(names[0].trim())} × ${esc(names[1].trim())}\n\n` +
                `نسبة التوافق: ${percent}%\n` +
                `${comment}\n\n` +
                "هذه نتيجة ترفيهية عشوائية ثابتة للاسمين، وليست قياسًا حقيقيًا للمشاعر." +
                FOOTER
            );
        }

        // طلب زواج بالرد على رسالة
        if (args) {
            const target = ctx.message.reply_to_message?.from;

            if (!target || target.is_bot) {
                return ctx.reply(
                    "💌 للطلب: رد على رسالة الشخص واكتب:\n" +
                    "زواج 500\n\n" +
                    "يمكنك كتابة 5K أو 1M أيضًا."
                );
            }

            if (target.id === from.id) {
                return ctx.reply("😂 لا يمكنك إرسال طلب زواج لنفسك.");
            }

            const amount = parseAmount(args);

            if (!Number.isSafeInteger(amount) || amount < 0) {
                return ctx.reply("❌ اكتب مهرًا صحيحًا. مثال: زواج 500");
            }

            if (!M.getGender(from.id) || !M.getGender(target.id)) {
                return ctx.reply(
                    "⚧ يجب على الطرفين تسجيل الجنس أولًا.\n" +
                    "اكتب زواج وافتح زر تسجيل الجنس."
                );
            }

            const husband = ui.ensure(from);
            const wife = ui.ensure(target);

            if ((husband.coins || 0) < amount) {
                return ctx.reply("❌ رصيدك لا يكفي للمهر.");
            }

            try {
                const request = M.createRequest(
                    from,
                    target,
                    amount,
                    ctx.chat.id
                );

                return ctx.reply(
                    "❀ ━━ 𝗔𝗬𝗟𝗔 〢 𝗣𝗥𝗢𝗣𝗢𝗦𝗔𝗟 ━━ ❀\n\n" +
                    `💌 ${esc(nameOf(from))} يطلب الزواج من ${esc(nameOf(target))}\n\n` +
                    `💰 المهر: ${amount.toLocaleString("en-US")} VLT\n\n` +
                    "هل توافق على هذا الارتباط؟\n" +
                    "القرار للطرف الآخر وحده 😂",
                    {
                        reply_markup: requestKeyboard(request)
                    }
                );
            } catch (error) {
                return ctx.reply("❌ " + esc(error.message));
            }
        }

        return showMenu(ctx);
    }, {
        menu: "زواج",
        category: "services"
    });

    // أزرار القائمة
    bot.callbackQuery(/^marriage:/, async ctx => {
        const action = ctx.callbackQuery.data;
        const user = ctx.from;

        try {
            if (action === "marriage:close") {
                await ctx.answerCallbackQuery();
                return ctx.deleteMessage().catch(() => {});
            }

            if (action === "marriage:home") {
                await ctx.answerCallbackQuery();
                return ctx.editMessageText(menuText() + FOOTER, {
                    reply_markup: menuKeyboard()
                });
            }

            if (action === "marriage:gender") {
                await ctx.answerCallbackQuery();

                const keyboard = new InlineKeyboard()
                    .text("♂ ذكر", "marriage:gender:male")
                    .text("♀ أنثى", "marriage:gender:female")
                    .row()
                    .text("↩ العودة", "marriage:home");

                return ctx.editMessageText(
                    "⚧ **تسجيل الجنس**\n\n" +
                    "اختر الجنس الذي تريد تسجيله في نظام الزواج.\n" +
                    "لا يمكن تغييره بعد التسجيل.",
                    {
                        parse_mode: "Markdown",
                        reply_markup: keyboard
                    }
                );
            }

            if (action === "marriage:gender:male" ||
                action === "marriage:gender:female") {

                M.setGender(
                    user.id,
                    action.endsWith("male") ? "male" : "female"
                );

                await ctx.answerCallbackQuery({
                    text: "تم تسجيل بياناتك."
                });

                return ctx.editMessageText(
                    "✅ تم تسجيل الجنس بنجاح." + FOOTER,
                    { reply_markup: backKeyboard() }
                );
            }

            if (action === "marriage:proposal") {
                await ctx.answerCallbackQuery();

                return answer(
                    ctx,
                    "💌 **طريقة طلب الزواج**\n\n" +
                    "1. تأكد من تسجيل الجنس للطرفين.\n" +
                    "2. رد على رسالة الشخص المطلوب.\n" +
                    "3. اكتب المهر بعد كلمة زواج.\n\n" +
                    "مثال: زواج 500\n\n" +
                    "يمكن استخدام K و M للمبالغ الكبيرة.\n" +
                    "لن يُخصم المهر إلا بعد الموافقة."
                );
            }

            if (action === "marriage:love") {
                await ctx.answerCallbackQuery();

                return answer(
                    ctx,
                    "💗 **حاسبة توافق الأسماء**\n\n" +
                    "اكتب داخل نفس الأمر:\n" +
                    "زواج حب الاسم الأول | الاسم الثاني\n\n" +
                    "مثال:\n" +
                    "زواج حب أحمد | سارة\n\n" +
                    "النتيجة للترفيه فقط، ولا تعبر عن المشاعر الحقيقية."
                );
            }

            if (action === "marriage:info") {
                await ctx.answerCallbackQuery();

                const marriage = M.marriageOf(user.id);

                if (!marriage) {
                    return answer(
                        ctx,
                        "💔 لا يوجد زواج مسجل لك حاليًا.\n" +
                        "يبدو أن ملفك ما زال أعزب 😂"
                    );
                }

                const isHusband = String(user.id) === marriage.husband;
                const partner = isHusband
                    ? marriage.wifeName
                    : marriage.husbandName;

                return answer(
                    ctx,
                    "💑 **معلومات الزواج**\n\n" +
                    `الشريك: ${esc(partner)}\n` +
                    `المهر: ${marriage.dowry.toLocaleString("en-US")} VLT\n` +
                    `التاريخ: ${new Date(marriage.createdAt).toLocaleDateString("en-GB")}\n\n` +
                    "نتمنى لكما حياة مليئة بالاحترام والتفاهم ❤️"
                );
            }

            if (action === "marriage:requests") {
                await ctx.answerCallbackQuery();

                const requests = M.requestsFor(user.id);

                if (!requests.length) {
                    return answer(ctx, "📭 لا توجد طلبات زواج معلّقة.");
                }

                let text = "📨 **طلبات الزواج**\n\n";

                for (const r of requests.slice(0, 10)) {
                    const incoming = r.wife === String(user.id);

                    text +=
                        `• ${incoming ? "وارد من" : "مرسل إلى"}: ` +
                        `${esc(incoming ? r.husbandName : r.wifeName)}\n` +
                        `المهر: ${r.dowry.toLocaleString("en-US")} VLT\n\n`;
                }

                return answer(ctx, text);
            }

            if (action === "marriage:records") {
                await ctx.answerCallbackQuery();

                const records = M.groupMarriages(ctx.chat.id);

                if (!records.length) {
                    return answer(ctx, "📜 لا توجد زيجات مسجلة في هذه المجموعة.");
                }

                let text = "👑 **سجل المجموعة**\n\n";

                for (const r of records.slice(-15).reverse()) {
                    text +=
                        `💍 ${esc(r.husbandName)} × ${esc(r.wifeName)}\n` +
                        `المهر: ${r.dowry.toLocaleString("en-US")} VLT\n\n`;
                }

                return answer(ctx, text);
            }

            const accept = /^marriage:accept:(.+)$/.exec(action);
            const reject = /^marriage:reject:(.+)$/.exec(action);

            if (accept) {
                const result = await M.acceptRequest(accept[1], user);

                await ctx.answerCallbackQuery({
                    text: "تم قبول الزواج!"
                });

                const card = await makeCard(result);

                await ctx.replyWithPhoto(new Blob([card], {
                    type: "image/png"
                }), {
                    caption:
                        "❀ ━━ 𝗔𝗬𝗟𝗔 〢 𝗪𝗘𝗗𝗗𝗜𝗡𝗚 ━━ ❀\n\n" +
                        `💍 ${esc(result.husbandName)} × ${esc(result.wifeName)}\n` +
                        `💰 المهر: ${result.dowry.toLocaleString("en-US")} VLT\n` +
                        "ألف مبروك! تم تسجيل الزواج رسميًا ❤️" +
                        FOOTER
                });

                return ctx.editMessageReplyMarkup({
                    reply_markup: new InlineKeyboard()
                });
            }

            if (reject) {
                await M.rejectRequest(reject[1], user);

                await ctx.answerCallbackQuery({
                    text: "تم رفض الطلب."
                });

                return ctx.editMessageText(
                    "❌ تم رفض طلب الزواج.\n" +
                    "لا بأس، لكل شخص اختياره ❤️"
                );
            }

            return ctx.answerCallbackQuery();
        } catch (error) {
            return ctx.answerCallbackQuery({
                text: error.message || "حدث خطأ.",
                show_alert: true
            });
        }
    });
};
