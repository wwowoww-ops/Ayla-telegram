
/**
 * ╔══════════════════════════════════════╗
 * ║             AYLA SERVICES            ║
 * ║                 v2.3                 ║
 * ╚══════════════════════════════════════╝
 */

const {
    esc,
    nameOf,
    link,
    HTML,
    cmd,
    digits
} = require("../lib/util");

const fs = require("fs");
const path = require("path");
const { InputFile } = require("grammy");
const sharp = require("sharp");
const stats = require("../lib/groupStats");

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
// SAKURA AVATAR FRAME — ORIGINAL AYLA FRAME
// ==================================================

const FRAME_PATH = path.join(
    __dirname,
    "../assets/ayla-frame.png"
);

async function getFramedAvatar(ctx, target, bot) {
    try {
        if (target.is_bot) return null;

        if (!fs.existsSync(FRAME_PATH)) {
            console.error("[AYLA AVATAR] Frame file not found");
            return null;
        }

        const photos = await ctx.api.getUserProfilePhotos(
            target.id,
            { limit: 1 }
        );

        if (!photos.total_count) return null;

        const sizes = photos.photos[0];
        const photo = sizes[sizes.length - 1];

        const file = await ctx.api.getFile(photo.file_id);

        if (!file.file_path) return null;

        const response = await fetch(
            `https://api.telegram.org/file/bot${bot.token}/${file.file_path}`
        );

        if (!response.ok) {
            throw new Error("Failed to download profile photo");
        }

        const original = Buffer.from(
            await response.arrayBuffer()
        );

        // تجهيز الإطار الأصلي مع الحفاظ على شفافيته
        const frame = await sharp(FRAME_PATH)
            .resize(1024, 1024, {
                fit: "fill"
            })
            .png()
            .toBuffer();

        // تجهيز صورة المستخدم
        const avatar = await sharp(original)
            .rotate()
            .resize(1024, 1024, {
                fit: "cover",
                position: "centre"
            })
            .png()
            .toBuffer();

        // وضع الصورة خلف الإطار الأصلي
        return await sharp(avatar)
            .composite([
                {
                    input: frame,
                    blend: "over"
                }
            ])
            .png()
            .toBuffer();

    } catch (error) {
        console.error(
            "[AYLA AVATAR]",
            error.message
        );

        return null;
    }
}

// ==================================================
// WORLD CLOCK
// ==================================================

const countryPages = [
    [
        { name: "تونس", flag: "🇹🇳", zone: "Africa/Tunis" },
        { name: "الجزائر", flag: "🇩🇿", zone: "Africa/Algiers" },
        { name: "المغرب", flag: "🇲🇦", zone: "Africa/Casablanca" },
        { name: "مصر", flag: "🇪🇬", zone: "Africa/Cairo" },
        { name: "السعودية", flag: "🇸🇦", zone: "Asia/Riyadh" },
        { name: "الإمارات", flag: "🇦🇪", zone: "Asia/Dubai" }
    ],
    [
        { name: "فلسطين", flag: "🇵🇸", zone: "Asia/Gaza" },
        { name: "الأردن", flag: "🇯🇴", zone: "Asia/Amman" },
        { name: "العراق", flag: "🇮🇶", zone: "Asia/Baghdad" },
        { name: "تركيا", flag: "🇹🇷", zone: "Europe/Istanbul" },
        { name: "فرنسا", flag: "🇫🇷", zone: "Europe/Paris" },
        { name: "ألمانيا", flag: "🇩🇪", zone: "Europe/Berlin" }
    ],
    [
        { name: "بريطانيا", flag: "🇬🇧", zone: "Europe/London" },
        { name: "إيطاليا", flag: "🇮🇹", zone: "Europe/Rome" },
        { name: "إسبانيا", flag: "🇪🇸", zone: "Europe/Madrid" },
        { name: "روسيا", flag: "🇷🇺", zone: "Europe/Moscow" },
        { name: "اليابان", flag: "🇯🇵", zone: "Asia/Tokyo" },
        { name: "الصين", flag: "🇨🇳", zone: "Asia/Shanghai" }
    ],
    [
        { name: "كوريا الجنوبية", flag: "🇰🇷", zone: "Asia/Seoul" },
        { name: "الهند", flag: "🇮🇳", zone: "Asia/Kolkata" },
        { name: "أمريكا", flag: "🇺🇸", zone: "America/New_York" },
        { name: "كندا", flag: "🇨🇦", zone: "America/Toronto" },
        { name: "البرازيل", flag: "🇧🇷", zone: "America/Sao_Paulo" },
        { name: "أستراليا", flag: "🇦🇺", zone: "Australia/Sydney" }
    ]
];

function getTime(zone) {
    const now = new Date();

    return {
        time: new Intl.DateTimeFormat("ar-TN-u-nu-latn", {
            timeZone: zone,
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: false
        }).format(now),

        date: new Intl.DateTimeFormat("ar-TN-u-nu-latn", {
            timeZone: zone,
            dateStyle: "full"
        }).format(now)
    };
}

function clockKeyboard(page) {
    const countries = countryPages[page];
    const keyboard = [];

    for (let i = 0; i < countries.length; i += 2) {
        keyboard.push(
            countries.slice(i, i + 2).map((country, j) => ({
                text: `${country.flag} ${country.name}`,
                callback_data: `ayla_clock_${page}_${i + j}`
            }))
        );
    }

    const nav = [];

    if (page > 0) {
        nav.push({
            text: "⬅️ السابق",
            callback_data: `ayla_page_${page - 1}`
        });
    }

    if (page < countryPages.length - 1) {
        nav.push({
            text: "التالي ➡️",
            callback_data: `ayla_page_${page + 1}`
        });
    }

    if (nav.length) keyboard.push(nav);

    keyboard.push([{
        text: "✿ إغلاق",
        callback_data: "ayla_clock_close"
    }]);

    return { inline_keyboard: keyboard };
}

// ==================================================
// GROUP STATISTICS
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
// GROUP INFO
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
        `${permissions[key] ? "✅" : "❌"} ${label}`
    ).join("\n");
}

// ==================================================
// COMMANDS
// ==================================================

module.exports = function (bot) {

    // ==================================================
    // WORLD CLOCK
    // ==================================================

    cmd(bot, ["وقت", "الوقت"], async ctx => {
        const msg = await ctx.reply(
            `${HEADER("WORLD CLOCK")}\n\n` +
            `اختر الدولة لمعرفة الوقت الحالي:\n\n` +
            FOOTER,
            {
                ...HTML,
                reply_markup: clockKeyboard(0)
            }
        );

        sessions.set(`${ctx.chat.id}:${msg.message_id}`, {
            type: "clock",
            userId: ctx.from.id
        });
    });

    // ==================================================
    // USER ID
    // ==================================================

    cmd(bot, ["ايدي", "id", "معرفي"], async ctx => {
        const target =
            ctx.message.reply_to_message?.from || ctx.from;

        const username = target.username
            ? `@${esc(target.username)}`
            : "غير متوفر";

        const language = target.language_code
            ? esc(target.language_code)
            : "غير متوفر";

        const caption =
            `${HEADER("ID")}\n\n` +
            `👤 الاسم: ${link(target.id, nameOf(target))}\n` +
            `🆔 المعرف: <code>${target.id}</code>\n` +
            `🔗 الحساب: ${username}\n` +
            `🌐 اللغة: ${language}\n` +
            `🤖 حساب آلي: ${target.is_bot ? "نعم" : "لا"}\n` +
            `⭐ Telegram Premium: ${target.is_premium ? "نعم" : "غير معروف / لا"}\n` +
            `💬 معرف المحادثة: <code>${ctx.chat.id}</code>\n\n` +
            FOOTER;

        const avatar = await getFramedAvatar(ctx, target, bot);

        if (avatar) {
            return ctx.replyWithPhoto(
                new InputFile(avatar, "ayla-avatar.png"),
                {
                    caption,
                    ...HTML
                }
            );
        }

        return ctx.reply(caption, HTML);
    });

    // ==================================================
    // USER INFO
    // ==================================================

    cmd(bot, ["معلومات"], async ctx => {
        const target =
            ctx.message.reply_to_message?.from || ctx.from;

        return ctx.reply(
            `${HEADER("USER INFO")}\n\n` +
            `👤 الاسم: ${esc(nameOf(target))}\n` +
            `🆔 المعرف: <code>${target.id}</code>\n` +
            `🔗 الحساب: ${target.username ? "@" + esc(target.username) : "غير متوفر"}\n` +
            `🌐 اللغة: ${esc(target.language_code || "غير متوفر")}\n` +
            `🤖 حساب آلي: ${target.is_bot ? "نعم" : "لا"}\n\n` +
            FOOTER,
            HTML
        );
    });

    // ==================================================
    // TEXT COUNTER
    // ==================================================

    cmd(bot, ["عد", "عدد"], async (ctx, args) => {
        const text =
            args || ctx.message.reply_to_message?.text || "";

        if (!text) {
            return ctx.reply(
                `${HEADER("TEXT COUNTER")}\n\n` +
                `اكتب نصًا أو استخدم الأمر بالرد على رسالة.\n\n` +
                FOOTER,
                HTML
            );
        }

        const words = text.trim()
            ? text.trim().split(/\s+/).length
            : 0;

        return ctx.reply(
            `${HEADER("TEXT COUNTER")}\n\n` +
            `🔤 الحروف: <b>${Array.from(text).length}</b>\n` +
            `📝 الكلمات: <b>${words}</b>\n\n` +
            FOOTER,
            HTML
        );
    });

    // ==================================================
    // GROUP
    // ==================================================

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
            ? admins.slice(0, 15).map((item, i) => {
                const user = item.user;

                const role = item.status === "creator"
                    ? "👑 مالك"
                    : "🛡️ مشرف";

                return `${i + 1}. ${link(user.id, nameOf(user))} — ${role}`;
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
            type: "stats",
            userId: ctx.from.id,
            chatId: ctx.chat.id,
            title: chat.title || "المجموعة"
        });
    });

    // ==================================================
    // CALLBACKS
    // ==================================================

    bot.on("callback_query:data", async ctx => {
        const data = ctx.callbackQuery.data;

        if (
            !data.startsWith("ayla_clock_") &&
            !data.startsWith("ayla_page_") &&
            !data.startsWith("ayla_stats_")
        ) return;

        const message = ctx.callbackQuery.message;

        if (!message) {
            return ctx.answerCallbackQuery();
        }

        const key =
            `${message.chat.id}:${message.message_id}`;

        const session = sessions.get(key);

        if (!session || session.userId !== ctx.from.id) {
            return ctx.answerCallbackQuery({
                text: "هذه القائمة ليست لك.",
                show_alert: true
            });
        }

        // إغلاق القوائم

        if (
            data === "ayla_clock_close" ||
            data === "ayla_stats_close"
        ) {
            sessions.delete(key);
            await ctx.deleteMessage().catch(() => {});
            return ctx.answerCallbackQuery();
        }

        // إحصائيات اليوم

        if (
            data === "ayla_stats_daily" &&
            session.type === "stats"
        ) {
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

        // إحصائيات الأسبوع

        if (
            data === "ayla_stats_weekly" &&
            session.type === "stats"
        ) {
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

        // العودة إلى معلومات المجموعة

        if (
            data === "ayla_stats_back" &&
            session.type === "stats"
        ) {
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

        // صفحات الوقت

        if (session.type !== "clock") {
            return ctx.answerCallbackQuery();
        }

        if (data.startsWith("ayla_page_")) {
            const page = Number(data.split("_")[2]);

            if (
                !Number.isInteger(page) ||
                !countryPages[page]
            ) {
                return ctx.answerCallbackQuery();
            }

            await ctx.editMessageText(
                `${HEADER("WORLD CLOCK")}\n\n` +
                `اختر الدولة لمعرفة الوقت الحالي:\n` +
                `❀ الصفحة ${page + 1} من ${countryPages.length} ❀\n\n` +
                FOOTER,
                {
                    ...HTML,
                    reply_markup: clockKeyboard(page)
                }
            );

            return ctx.answerCallbackQuery();
        }

        const parts = data.split("_");
        const page = Number(parts[2]);
        const index = Number(parts[3]);

        const country = countryPages[page]?.[index];

        if (!country) {
            return ctx.answerCallbackQuery();
        }

        const { time, date } = getTime(country.zone);

        await ctx.editMessageText(
            `${HEADER("WORLD CLOCK")}\n\n` +
            `${country.flag} <b>${country.name}</b>\n\n` +
            `🕒 الوقت: <b>${time}</b>\n` +
            `📅 التاريخ: ${date}\n\n` +
            `❀ تم اختيار الدولة بنجاح ❀`,
            {
                ...HTML,
                reply_markup: {
                    inline_keyboard: [
                        [{
                            text: "↩️ اختيار دولة أخرى",
                            callback_data: `ayla_page_${page}`
                        }],
                        [{
                            text: "✿ إغلاق",
                            callback_data: "ayla_clock_close"
                        }]
                    ]
                }
            }
        );

        return ctx.answerCallbackQuery();
    });
};
