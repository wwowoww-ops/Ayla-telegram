const {
    esc,
    nameOf,
    link,
    HTML,
    cmd
} = require("../../lib/util");

const stats = require("../../lib/groupStats");

// ==================================================
// DESIGN
// ==================================================

function stylize(text) {
    return Array.from(String(text)).map(char => {
        const code = char.charCodeAt(0);

        if (code >= 65 && code <= 90)
            return String.fromCodePoint(0x1D5D4 + code - 65);

        if (code >= 97 && code <= 122)
            return String.fromCodePoint(0x1D5EE + code - 97);

        return char;
    }).join("");
}

const HEADER = service =>
    `❀ ━━ 𝗔𝗬𝗟𝗔 〢 ${stylize(service)} ━━ ❀`;

const FOOTER = "❀ ━━━━━━━━━━━━━ ❀";

const sessions = new Map();

// ==================================================
// KEYBOARD
// ==================================================

function statsKeyboard() {
    return {
        inline_keyboard: [
            [
                {
                    text: "❀ إحصائيات اليوم",
                    callback_data: "ayla_stats_daily"
                },
                {
                    text: "✿ إحصائيات الأسبوع",
                    callback_data: "ayla_stats_weekly"
                }
            ],
            [{
                text: "✿ إغلاق",
                callback_data: "ayla_stats_close"
            }]
        ]
    };
}

// ==================================================
// STATISTICS FORMAT
// ==================================================

function formatTop(users) {
    if (!users.length) {
        return "لا توجد بيانات حتى الآن.";
    }

    return users.slice(0, 10).map((user, index) => {
        const username = user.username
            ? ` (@${esc(user.username)})`
            : "";

        return `${index + 1}. ${esc(user.name)}${username}\n   💬 ${user.messages} رسالة`;
    }).join("\n\n");
}

function dailyText(chatId, title) {
    const result = stats.getDaily(chatId);

    return (
        `${HEADER("DAILY STATISTICS")}\n\n` +
        `🏷️ ${esc(title)}\n` +
        `📅 التاريخ: <code>${result.date}</code>\n` +
        `💬 رسائل اليوم: <b>${result.messages}</b>\n` +
        `👥 الأعضاء النشطون: <b>${result.users.length}</b>\n\n` +
        `✿ <b>الأكثر نشاطًا</b>\n\n` +
        formatTop(result.users) +
        `\n\n${FOOTER}`
    );
}

function weeklyText(chatId, title) {
    const result = stats.getWeekly(chatId);

    const days = result.days.map(day =>
        `• <code>${day.date}</code> — ${day.messages} رسالة`
    ).join("\n");

    return (
        `${HEADER("WEEKLY STATISTICS")}\n\n` +
        `🏷️ ${esc(title)}\n` +
        `📊 إجمالي آخر 7 أيام: <b>${result.messages}</b>\n` +
        `👥 الأعضاء النشطون: <b>${result.users.length}</b>\n\n` +
        `✿ <b>نشاط الأيام</b>\n${days}\n\n` +
        `✿ <b>الأكثر نشاطًا</b>\n\n` +
        formatTop(result.users) +
        `\n\n${FOOTER}`
    );
}

// ==================================================
// GROUP PERMISSIONS
// ==================================================

function permissionText(permissions) {
    if (!permissions) return "غير متاحة";

    const items = [
        ["can_send_messages", "إرسال الرسائل"],
        ["can_send_audios", "إرسال الصوتيات"],
        ["can_send_documents", "إرسال الملفات"],
        ["can_send_photos", "إرسال الصور"],
        ["can_send_videos", "إرسال الفيديوهات"],
        ["can_send_polls", "إنشاء الاستطلاعات"],
        ["can_add_web_page_previews", "معاينة الروابط"],
        ["can_invite_users", "دعوة الأعضاء"],
        ["can_pin_messages", "تثبيت الرسائل"],
        ["can_change_info", "تغيير معلومات المجموعة"]
    ];

    return items.map(([key, label]) =>
        `${permissions[key] ? "✓" : "✗"} ${label}`
    ).join("\n");
}

// ==================================================
// AYLA — GROUP INFO
// ==================================================

module.exports = function (bot) {

    cmd(bot, ["المجموعة"], async ctx => {

        if (ctx.chat.type === "private") {
            return ctx.reply(
                "هذا الأمر يعمل داخل المجموعات فقط."
            );
        }

        const chat = await ctx.getChat();

        let count = "غير متاح";
        let admins = [];
        let adminCount = "غير متاح";

        try {
            count = await ctx.api.getChatMemberCount(
                ctx.chat.id
            );
        } catch (_) {}

        try {
            admins = await ctx.getChatAdministrators();
            adminCount = admins.length;
        } catch (_) {}

        const adminList = admins.length
            ? admins.slice(0, 15).map((item, index) => {
                const user = item.user;

                const role = item.status === "creator"
                    ? "مالك"
                    : "مشرف";

                return `${index + 1}. ${link(user.id, nameOf(user))} — ${role}`;
            }).join("\n")
            : "تعذر جلب قائمة المشرفين.";

        const permissions = permissionText(chat.permissions);
        const total = stats.getTotal(ctx.chat.id);

        const msg = await ctx.reply(
            `${HEADER("GROUP INFO")}\n\n` +
            `🏷️ الاسم: <b>${esc(chat.title || "غير معروف")}</b>\n` +
            `🆔 المعرف: <code>${chat.id}</code>\n` +
            `🔗 الرابط: ${chat.username ? "@" + esc(chat.username) : "مجموعة خاصة"}\n` +
            `👥 الأعضاء: <b>${count}</b>\n` +
            `🛡️ المشرفون: <b>${adminCount}</b>\n` +
            `💬 الرسائل المسجلة: <b>${total}</b>\n` +
            `⏳ وضع البطء: ${chat.slow_mode_delay ? chat.slow_mode_delay + " ثانية" : "معطل"}\n` +
            `📌 محتوى محمي: ${chat.has_protected_content ? "نعم" : "لا"}\n\n` +
            `✿ <b>المشرفون</b>\n${adminList}\n\n` +
            `✿ <b>إعدادات المجموعة</b>\n${permissions}\n\n` +
            `اختر نوع الإحصائيات:\n\n` +
            FOOTER,
            {
                ...HTML,
                reply_markup: statsKeyboard()
            }
        );

        sessions.set(`${ctx.chat.id}:${msg.message_id}`, {
            userId: ctx.from.id,
            chatId: ctx.chat.id,
            title: chat.title || "المجموعة"
        });
    });

    // ==================================================
    // CALLBACKS — GROUP STATISTICS
    // ==================================================

    bot.on("callback_query:data", async (ctx, next) => {

        const data = ctx.callbackQuery.data;

        if (!data.startsWith("ayla_stats_")) {
            return next();
        }

        const message = ctx.callbackQuery.message;

        if (!message) {
            return ctx.answerCallbackQuery();
        }

        const key = `${message.chat.id}:${message.message_id}`;
        const session = sessions.get(key);

        if (!session || session.userId !== ctx.from.id) {
            return ctx.answerCallbackQuery({
                text: "هذه القائمة ليست لك.",
                show_alert: true
            });
        }

        if (data === "ayla_stats_close") {
            sessions.delete(key);
            await ctx.deleteMessage().catch(() => {});
            return ctx.answerCallbackQuery();
        }

        if (data === "ayla_stats_daily") {
            await ctx.editMessageText(
                dailyText(session.chatId, session.title),
                {
                    ...HTML,
                    reply_markup: {
                        inline_keyboard: [
                            [{
                                text: "↩️ العودة",
                                callback_data: "ayla_stats_back"
                            }],
                            [{
                                text: "✿ إغلاق",
                                callback_data: "ayla_stats_close"
                            }]
                        ]
                    }
                }
            );

            return ctx.answerCallbackQuery();
        }

        if (data === "ayla_stats_weekly") {
            await ctx.editMessageText(
                weeklyText(session.chatId, session.title),
                {
                    ...HTML,
                    reply_markup: {
                        inline_keyboard: [
                            [{
                                text: "↩️ العودة",
                                callback_data: "ayla_stats_back"
                            }],
                            [{
                                text: "✿ إغلاق",
                                callback_data: "ayla_stats_close"
                            }]
                        ]
                    }
                }
            );

            return ctx.answerCallbackQuery();
        }

        if (data === "ayla_stats_back") {
            const total = stats.getTotal(session.chatId);

            await ctx.editMessageText(
                `${HEADER("GROUP INFO")}\n\n` +
                `🏷️ المجموعة: <b>${esc(session.title)}</b>\n` +
                `💬 الرسائل المسجلة: <b>${total}</b>\n\n` +
                `اختر نوع الإحصائيات:\n\n` +
                FOOTER,
                {
                    ...HTML,
                    reply_markup: statsKeyboard()
                }
            );

            return ctx.answerCallbackQuery();
        }

        return ctx.answerCallbackQuery();
    });
};