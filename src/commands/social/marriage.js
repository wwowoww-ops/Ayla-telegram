/**
 * ╔══════════════════════════════════════╗
 * ║          AYLA SOCIAL MARRIAGE         ║
 * ║                 v2.0                 ║
 * ╚══════════════════════════════════════╝
 *
 * الأمر الرئيسي: زواج
 *
 * الخدمات:
 * - طلب الزواج بالمهر.
 * - نسبة توافق الأسماء.
 * - معلومات الزواج.
 * - متابعة الطلبات وقبولها ورفضها.
 * - سجل زيجات المجموعة.
 * - تسجيل الجنس.
 *
 * الطلاق والخلع لهما ملفان مستقلان.
 */

const { InlineKeyboard, InputFile } = require("grammy");

const { cmd, esc, nameOf } = require("../../lib/util");
const ui = require("../../game/ui");
const M = require("../../core/marriage");
const makeCard = require("../../game/marriageCard");

const FOOTER = "\n\n❀ ━━━━━━━━━━━━━ ❀";

const html = text => ({
    parse_mode: "HTML",
    ...text
});

// ==================================================
// KEYBOARDS
// ==================================================

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

function requestKeyboard(request) {
    return new InlineKeyboard()
        .text("💍 قبول", `marriage:accept:${request.id}`)
        .text("❌ رفض", `marriage:reject:${request.id}`);
}

// ==================================================
// TEXT
// ==================================================

function menuText() {
    return (
        "❀ ━━ 𝗔𝗬𝗟𝗔 〢 𝗠𝗔𝗥𝗥𝗜𝗔𝗚𝗘 ━━ ❀\n\n" +
        "💍 أهلاً بك في نظام الزواج\n\n" +
        "اختر الخدمة التي تريدها:\n\n" +
        "💌 طلب الزواج\n" +
        "إرسال طلب ارتباط مع تحديد المهر وانتظار الموافقة.\n\n" +
        "💗 نسبة الحب\n" +
        "حساب توافق ترفيهي بين اسمين.\n\n" +
        "💑 معلومات زواجي\n" +
        "معرفة الشريك والمهر وتاريخ الارتباط.\n\n" +
        "📨 طلباتي\n" +
        "متابعة الطلبات الواردة والصادرة.\n\n" +
        "👑 سجل المجموعة\n" +
        "عرض الزيجات المسجلة في المجموعة.\n\n" +
        "⚧ تسجيل الجنس\n" +
        "تسجيل الجنس للمشاركة في نظام الزواج.\n\n" +
        "⚖️ إنهاء الزواج:\n" +
        "• طلاق: للزوج.\n" +
        "• خلع: للزوجة.\n\n" +
        "❀ القرار لك، والاحترام للجميع."
    );
}

async function showMenu(ctx) {
    return ctx.reply(menuText() + FOOTER, {
        reply_markup: menuKeyboard()
    });
}

async function answer(ctx, text, keyboard = backKeyboard()) {
    return ctx.editMessageText(text + FOOTER, {
        parse_mode: "HTML",
        reply_markup: keyboard
    });
}

// ==================================================
// AMOUNT
// ==================================================

function parseAmount(value) {
    const text = String(value || "")
        .trim()
        .toUpperCase()
        .replace(/,/g, "");

    const match = /^(\d+(?:\.\d+)?)(K|M|B|T)?$/.exec(text);

    if (!match) return NaN;

    const multipliers = {
        K: 1e3,
        M: 1e6,
        B: 1e9,
        T: 1e12
    };

    const amount =
        Number(match[1]) * (multipliers[match[2]] || 1);

    if (!Number.isSafeInteger(amount)) return NaN;

    return amount;
}

// ==================================================
// REQUESTS PANEL
// ==================================================

async function showRequests(ctx, user) {
    const requests = M.requestsFor(user.id);

    if (!requests.length) {
        return answer(ctx, "📭 لا توجد طلبات زواج معلّقة.");
    }

    let text = "❀ ━━ 𝗔𝗬𝗟𝗔 〢 𝗥𝗘𝗤𝗨𝗘𝗦𝗧𝗦 ━━ ❀\n\n";

    const keyboard = new InlineKeyboard();
    let incomingCount = 0;

    for (const request of requests.slice(0, 10)) {
        const incoming =
            String(request.wife) === String(user.id);

        const partner = incoming
            ? request.husbandName
            : request.wifeName;

        text +=
            `${incoming ? "📩 طلب وارد" : "📤 طلب صادر"}\n` +
            `الشخص: ${esc(partner || "غير معروف")}\n` +
            `المهر: ${Number(request.dowry || 0).toLocaleString("en-US")} VLT\n` +
            "الحالة: في انتظار الرد\n\n";

        if (incoming) {
            keyboard
                .text("💍 قبول", `marriage:accept:${request.id}`)
                .text("❌ رفض", `marriage:reject:${request.id}`)
                .row();

            incomingCount++;
        }
    }

    keyboard.text("↩ العودة للقائمة", "marriage:home");

    if (!incomingCount) {
        return answer(ctx, text, backKeyboard());
    }

    return answer(ctx, text, keyboard);
}

// ==================================================
// MAIN COMMAND
// ==================================================

module.exports = function (bot) {
    cmd(bot, ["زواج"], async (ctx, args) => {
        const from = ctx.from;

        if (!from || from.is_bot) return;

        args = String(args || "").trim();

        // ------------------------------------------
        // LOVE COMPATIBILITY
        // ------------------------------------------

        if (args.startsWith("حب ")) {
            const names = args.slice(3).split("|");

            if (
                names.length !== 2 ||
                !names[0].trim() ||
                !names[1].trim()
            ) {
                return ctx.reply(
                    "💗 طريقة الاستخدام:\n" +
                    "زواج حب الاسم الأول | الاسم الثاني"
                );
            }

            const first = names[0].trim();
            const second = names[1].trim();

            const percent = M.compatibility(first, second);

            const comment =
                percent >= 90 ? "توافق أسطوري! 😂" :
                percent >= 75 ? "هناك انسجام جميل!" :
                percent >= 55 ? "قد تنجح الحكاية!" :
                "يبدو أنكما تحتاجان إلى قهوة وحديث طويل ☕";

            return ctx.reply(
                "❀ ━━ 𝗔𝗬𝗟𝗔 〢 𝗟𝗢𝗩𝗘 ━━ ❀\n\n" +
                `💗 ${esc(first)} × ${esc(second)}\n\n` +
                `نسبة التوافق: ${percent}%\n` +
                `${comment}\n\n` +
                "هذه نتيجة ترفيهية فقط ولا تقيس المشاعر الحقيقية." +
                FOOTER
            );
        }

        // ------------------------------------------
        // MARRIAGE PROPOSAL
        // ------------------------------------------

        if (args) {
            const target = ctx.message.reply_to_message?.from;

            if (!target || target.is_bot) {
                return ctx.reply(
                    "💌 لطلب الزواج:\n\n" +
                    "رد على رسالة الشخص واكتب:\n" +
                    "زواج 500\n\n" +
                    "أمثلة:\n" +
                    "زواج 500\n" +
                    "زواج 5K\n" +
                    "زواج 1M"
                );
            }

            if (String(target.id) === String(from.id)) {
                return ctx.reply("😂 لا يمكنك إرسال طلب زواج لنفسك.");
            }

            const amount = parseAmount(args);

            if (!Number.isSafeInteger(amount) || amount <= 0) {
                return ctx.reply(
                    "❌ المهر غير صحيح.\n" +
                    "مثال: زواج 500"
                );
            }

            const senderGender = M.getGender(from.id);
            const targetGender = M.getGender(target.id);

            if (!senderGender || !targetGender) {
                return ctx.reply(
                    "⚧ يجب على الطرفين تسجيل الجنس أولاً.\n\n" +
                    "اكتب زواج ثم اختر تسجيل الجنس."
                );
            }

            if (
                senderGender !== "male" ||
                targetGender !== "female"
            ) {
                return ctx.reply(
                    "❌ طلب الزواج يجب أن يكون من ذكر إلى أنثى."
                );
            }

            const husband = ui.ensure(from);

            ui.ensure(target);

            if (Number(husband.coins || 0) < amount) {
                return ctx.reply(
                    "❌ رصيدك لا يكفي لدفع هذا المهر."
                );
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
                    "القرار للطرف الآخر وحده.",
                    {
                        reply_markup: requestKeyboard(request)
                    }
                );

            } catch (error) {
                return ctx.reply(
                    "❌ " + esc(error.message || "تعذر إنشاء الطلب.")
                );
            }
        }

        return showMenu(ctx);
    }, {
        menu: "زواج",
        category: "services"
    });

    // ==================================================
    // CALLBACKS
    // ==================================================

    bot.callbackQuery(/^marriage:/, async ctx => {
        const action = ctx.callbackQuery.data;
        const user = ctx.from;

        try {
            // ------------------------------------------
            // CLOSE
            // ------------------------------------------

            if (action === "marriage:close") {
                await ctx.answerCallbackQuery();

                return ctx.deleteMessage().catch(() => {});
            }

            // ------------------------------------------
            // HOME
            // ------------------------------------------

            if (action === "marriage:home") {
                await ctx.answerCallbackQuery();

                return ctx.editMessageText(menuText() + FOOTER, {
                    reply_markup: menuKeyboard()
                });
            }

            // ------------------------------------------
            // GENDER MENU
            // ------------------------------------------

            if (action === "marriage:gender") {
                await ctx.answerCallbackQuery();

                const keyboard = new InlineKeyboard()
                    .text("♂ ذكر", "marriage:gender:male")
                    .text("♀ أنثى", "marriage:gender:female")
                    .row()
                    .text("↩ العودة", "marriage:home");

                return ctx.editMessageText(
                    "⚧ تسجيل الجنس\n\n" +
                    "اختر الجنس الذي تريد تسجيله.\n" +
                    "يجب أن تكون البيانات صحيحة.\n" +
                    "لا يمكن تغيير التسجيل بعد تثبيته.",
                    {
                        reply_markup: keyboard
                    }
                );
            }

            // ------------------------------------------
            // SAVE GENDER
            // ------------------------------------------

            if (
                action === "marriage:gender:male" ||
                action === "marriage:gender:female"
            ) {
                const gender =
                    action === "marriage:gender:male"
                        ? "male"
                        : "female";

                await M.setGender(user.id, gender);

                await ctx.answerCallbackQuery({
                    text: "تم تسجيل الجنس."
                });

                return ctx.editMessageText(
                    "✅ تم تسجيل الجنس بنجاح." + FOOTER,
                    {
                        reply_markup: backKeyboard()
                    }
                );
            }

            // ------------------------------------------
            // PROPOSAL HELP
            // ------------------------------------------

            if (action === "marriage:proposal") {
                await ctx.answerCallbackQuery();

                return answer(
                    ctx,
                    "💌 طريقة طلب الزواج\n\n" +
                    "1. تأكد من تسجيل الجنس للطرفين.\n" +
                    "2. رد على رسالة الشخص المطلوب.\n" +
                    "3. اكتب المهر بعد كلمة زواج.\n\n" +
                    "مثال: زواج 500\n\n" +
                    "يمكن استعمال K و M و B و T.\n" +
                    "لن يُخصم المهر إلا بعد الموافقة."
                );
            }

            // ------------------------------------------
            // LOVE HELP
            // ------------------------------------------

            if (action === "marriage:love") {
                await ctx.answerCallbackQuery();

                return answer(
                    ctx,
                    "💗 حاسبة توافق الأسماء\n\n" +
                    "اكتب:\n" +
                    "زواج حب الاسم الأول | الاسم الثاني\n\n" +
                    "مثال:\n" +
                    "زواج حب أحمد | سارة\n\n" +
                    "النتيجة للترفيه فقط."
                );
            }

            // ------------------------------------------
            // MARRIAGE INFO
            // ------------------------------------------

            if (action === "marriage:info") {
                await ctx.answerCallbackQuery();

                const marriage = M.marriageOf(user.id);

                if (!marriage) {
                    return answer(
                        ctx,
                        "💔 لا يوجد زواج مسجل لك حاليًا."
                    );
                }

                const isHusband =
                    String(user.id) === String(marriage.husband);

                const partner = isHusband
                    ? marriage.wifeName
                    : marriage.husbandName;

                const date = new Date(
                    marriage.createdAt
                ).toLocaleDateString("en-GB");

                return answer(
                    ctx,
                    "❀ ━━ 𝗔𝗬𝗟𝗔 〢 𝗜𝗡𝗙𝗢 ━━ ❀\n\n" +
                    `💑 الشريك: ${esc(partner || "غير معروف")}\n` +
                    `💰 المهر: ${Number(marriage.dowry || 0).toLocaleString("en-US")} VLT\n` +
                    `📅 التاريخ: ${date}\n\n` +
                    "نتمنى لكما حياة مليئة بالاحترام والتفاهم."
                );
            }

            // ------------------------------------------
            // REQUESTS
            // ------------------------------------------

            if (action === "marriage:requests") {
                await ctx.answerCallbackQuery();

                return showRequests(ctx, user);
            }

            // ------------------------------------------
            // GROUP RECORDS
            // ------------------------------------------

            if (action === "marriage:records") {
                await ctx.answerCallbackQuery();

                if (
                    !ctx.chat ||
                    !["group", "supergroup"].includes(ctx.chat.type)
                ) {
                    return answer(
                        ctx,
                        "👑 سجل الزيجات متاح داخل المجموعات فقط."
                    );
                }

                const records = M.groupMarriages(ctx.chat.id);

                if (!records.length) {
                    return answer(
                        ctx,
                        "📜 لا توجد زيجات مسجلة في هذه المجموعة."
                    );
                }

                let text =
                    "❀ ━━ 𝗔𝗬𝗟𝗔 〢 𝗥𝗘𝗖𝗢𝗥𝗗𝗦 ━━ ❀\n\n";

                for (const record of records.slice(-15).reverse()) {
                    text +=
                        `💍 ${esc(record.husbandName)} × ${esc(record.wifeName)}\n` +
                        `💰 المهر: ${Number(record.dowry || 0).toLocaleString("en-US")} VLT\n\n`;
                }

                return answer(ctx, text);
            }

            // ------------------------------------------
            // ACCEPT REQUEST
            // ------------------------------------------

            const accept = /^marriage:accept:(.+)$/.exec(action);

            if (accept) {
                const result = await M.acceptRequest(
                    accept[1],
                    user
                );

                await ctx.answerCallbackQuery({
                    text: "تم قبول الزواج!"
                });

                // إزالة أزرار الطلب بعد القبول
                await ctx.editMessageReplyMarkup({
                    reply_markup: new InlineKeyboard()
                }).catch(() => {});

                const card = await makeCard(result);

                await ctx.replyWithPhoto(
                    new InputFile(card, "ayla-marriage.png"),
                    {
                        caption:
                            "❀ ━━ 𝗔𝗬𝗟𝗔 〢 𝗪𝗘𝗗𝗗𝗜𝗡𝗚 ━━ ❀\n\n" +
                            `💍 ${esc(result.husbandName)} × ${esc(result.wifeName)}\n` +
                            `💰 المهر: ${Number(result.dowry).toLocaleString("en-US")} VLT\n\n` +
                            "ألف مبروك! تم تسجيل الزواج رسميًا."
                    }
                );

                return;
            }

            // ------------------------------------------
            // REJECT REQUEST
            // ------------------------------------------

            const reject = /^marriage:reject:(.+)$/.exec(action);

            if (reject) {
                await M.rejectRequest(
                    reject[1],
                    user
                );

                await ctx.answerCallbackQuery({
                    text: "تم رفض الطلب."
                });

                return ctx.editMessageText(
                    "❌ تم رفض طلب الزواج.\n" +
                    "لكل شخص حرية الاختيار."
                );
            }

            return ctx.answerCallbackQuery();

        } catch (error) {
            console.error(
                "[AYLA MARRIAGE]",
                error && (error.stack || error.message)
            );

            return ctx.answerCallbackQuery({
                text: error.message || "حدث خطأ أثناء تنفيذ العملية.",
                show_alert: true
            }).catch(() => {});
        }
    });
};