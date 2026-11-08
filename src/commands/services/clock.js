
/**
 * ╔══════════════════════════════════════╗
 * ║             AYLA SERVICES            ║
 * ║             WORLD CLOCK              ║
 * ╚══════════════════════════════════════╝
 */

const { HTML, cmd } = require("../../lib/util");

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
// COUNTRIES
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

// ==================================================
// TIME
// ==================================================

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

// ==================================================
// KEYBOARD
// ==================================================

function clockKeyboard(page) {
    const countries = countryPages[page];
    const keyboard = [];

    for (let i = 0; i < countries.length; i += 2) {
        keyboard.push(
            countries.slice(i, i + 2).map((country, j) => ({
                text: `${country.flag} ${country.name}`,
                callback_data: `ayla_clock_country_${page}_${i + j}`
            }))
        );
    }

    const nav = [];

    if (page > 0) {
        nav.push({
            text: "⬅️ السابق",
            callback_data: `ayla_clock_page_${page - 1}`
        });
    }

    if (page < countryPages.length - 1) {
        nav.push({
            text: "التالي ➡️",
            callback_data: `ayla_clock_page_${page + 1}`
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
// AYLA — WORLD CLOCK
// ==================================================

module.exports = function (bot) {

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
            userId: ctx.from.id
        });

    }, {
        menu: "وقت",
        category: "services"
    });

    // ==================================================
    // CALLBACKS — WORLD CLOCK
    // ==================================================

    bot.on("callback_query:data", async (ctx, next) => {

        const data = ctx.callbackQuery.data;

        if (!data.startsWith("ayla_clock_")) {
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

        // إغلاق القائمة
        if (data === "ayla_clock_close") {
            sessions.delete(key);
            await ctx.deleteMessage().catch(() => {});
            return ctx.answerCallbackQuery();
        }

        // التنقل بين الصفحات
        if (data.startsWith("ayla_clock_page_")) {
            const page = Number(data.split("_")[3]);

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

        // اختيار الدولة
        if (data.startsWith("ayla_clock_country_")) {
            const parts = data.split("_");
            const page = Number(parts[3]);
            const index = Number(parts[4]);

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
                                callback_data: `ayla_clock_page_${page}`
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
        }

        return ctx.answerCallbackQuery();
    });
};
