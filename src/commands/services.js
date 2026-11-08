
/**
 * ╔══════════════════════════════════════╗
 * ║             AYLA SERVICES             ║
 * ║                v2.0                   ║
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

// ==================================================
// 🌸 إعدادات التصميم
// ==================================================

const HEADER = "ꕤ 𝐀𝐘𝐋𝐀 ꕤ";
const FOOTER = "❀ نتمنى لك يومًا جميلًا ❀";

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

const sessions = new Map();

// ==================================================
// 🕒 الوقت
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
// 🧮 آلة حاسبة آمنة
// ==================================================

function calculate(input) {
    const s = digits(input)
        .replace(/[×xX]/g, "*")
        .replace(/[÷:]/g, "/")
        .replace(/٫/g, ".")
        .replace(/[,،\s]/g, "");

    if (!s || s.length > 80 || !/^[0-9+\-*/%^().]+$/.test(s))
        throw new Error("العملية غير صالحة.");

    let i = 0;
    const peek = () => s[i];

    function number() {
        const m = s.slice(i).match(/^(?:\d+\.?\d*|\.\d+)/);
        if (!m) throw new Error("رقم غير صالح.");
        i += m[0].length;
        return Number(m[0]);
    }

    function primary() {
        if (peek() === "(") {
            i++;
            const v = expression();
            if (peek() !== ")") throw new Error("قوس ناقص.");
            i++;
            return v;
        }
        return number();
    }

    function power() {
        const b = primary();
        if (peek() === "^") {
            i++;
            const e = unary();
            if (Math.abs(e) > 1000) throw new Error("الأس كبير.");
            return Math.pow(b, e);
        }
        return b;
    }

    function unary() {
        if (peek() === "-") {
            i++;
            return -unary();
        }
        if (peek() === "+") {
            i++;
            return unary();
        }
        return power();
    }

    function term() {
        let v = unary();

        while (["*", "/", "%"].includes(peek())) {
            const op = s[i++];
            const r = unary();

            if ((op === "/" || op === "%") && r === 0)
                throw new Error("لا يمكن القسمة على صفر.");

            v = op === "*" ? v * r :
                op === "/" ? v / r : v % r;
        }

        return v;
    }

    function expression() {
        let v = term();

        while (peek() === "+" || peek() === "-") {
            const op = s[i++];
            const r = term();
            v = op === "+" ? v + r : v - r;
        }

        return v;
    }

    const result = expression();

    if (i !== s.length || !Number.isFinite(result))
        throw new Error("الناتج غير صالح أو كبير جدًا.");

    return Number(result.toPrecision(12));
}

// ==================================================
// 🌸 تسجيل الخدمات
// ==================================================

module.exports = function (bot) {

    // 🕒 فتح قائمة الوقت
    cmd(bot, ["وقت", "الوقت"], async ctx => {
        const page = 0;
        const msg = await ctx.reply(
            `${HEADER}\n\n` +
            `🌸 <b>WORLD CLOCK</b> 🌸\n\n` +
            `اختر الدولة لمعرفة الوقت الحالي:\n\n` +
            FOOTER,
            {
                ...HTML,
                reply_markup: clockKeyboard(page)
            }
        );

        sessions.set(`${ctx.chat.id}:${msg.message_id}`, {
            userId: ctx.from.id
        });
    });

    // أزرار الوقت
    bot.on("callback_query:data", async ctx => {
        const data = ctx.callbackQuery.data;

        if (!data.startsWith("ayla_clock_") &&
            !data.startsWith("ayla_page_")) return;

        const key = `${ctx.callbackQuery.message.chat.id}:${ctx.callbackQuery.message.message_id}`;
        const session = sessions.get(key);

        if (!session || session.userId !== ctx.from.id) {
            return ctx.answerCallbackQuery({
                text: "هذه القائمة ليست لك 🌸",
                show_alert: true
            });
        }

        if (data === "ayla_clock_close") {
            sessions.delete(key);
            await ctx.deleteMessage().catch(() => {});
            return ctx.answerCallbackQuery();
        }

        if (data.startsWith("ayla_page_")) {
            const page = Number(data.split("_")[2]);

            if (!Number.isInteger(page) || !countryPages[page]) {
                return ctx.answerCallbackQuery();
            }

            await ctx.editMessageText(
                `${HEADER}\n\n` +
                `🌸 <b>WORLD CLOCK</b> 🌸\n\n` +
                `اختر الدولة لمعرفة الوقت الحالي:\n\n` +
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

        if (!country) return ctx.answerCallbackQuery();

        const { time, date } = getTime(country.zone);

        await ctx.editMessageText(
            `${HEADER}\n\n` +
            `🌸 <b>WORLD CLOCK</b> 🌸\n\n` +
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

    // 🆔 ايدي
    cmd(bot, ["ايدي", "id", "معرفي"], async ctx => {
        const target = ctx.message.reply_to_message?.from || ctx.from;

        return ctx.reply(
            `${HEADER}\n\n` +
            `🌸 <b>USER ID</b>\n\n` +
            `👤 ${link(target.id, nameOf(target))}\n` +
            `🆔 <code>${target.id}</code>\n` +
            (target.username ? `🔗 @${esc(target.username)}\n` : "") +
            `💬 <code>${ctx.chat.id}</code>\n\n` +
            FOOTER,
            HTML
        );
    });

    // 👤 معلومات المستخدم
    cmd(bot, ["معلومات"], async ctx => {
        const target = ctx.message.reply_to_message?.from || ctx.from;

        return ctx.reply(
            `${HEADER}\n\n` +
            `🌸 <b>USER INFO</b>\n\n` +
            `👤 الاسم: ${esc(nameOf(target))}\n` +
            `🆔 المعرف: <code>${target.id}</code>\n` +
            `🔗 الحساب: ${target.username ? "@" + esc(target.username) : "غير متوفر"}\n` +
            `🤖 بوت: ${target.is_bot ? "نعم" : "لا"}\n\n` +
            FOOTER,
            HTML
        );
    });

    // 🧮 الحساب
    cmd(bot, ["حساب", "احسب"], async (ctx, args) => {
        if (!args) {
            return ctx.reply(
                `${HEADER}\n\n` +
                `🌸 <b>CALCULATOR</b>\n\n` +
                `أرسل العملية الحسابية.\n` +
                `مثال: <code>حساب 25*4+10</code>\n\n` +
                FOOTER,
                HTML
            );
        }

        try {
            const result = calculate(args);

            return ctx.reply(
                `${HEADER}\n\n` +
                `🌸 <b>CALCULATOR</b>\n\n` +
                `🧮 العملية: <code>${esc(args)}</code>\n` +
                `♡ النتيجة: <b>${result.toLocaleString("en-US")}</b>\n\n` +
                FOOTER,
                HTML
            );
        } catch (e) {
            return ctx.reply(`🌸 ${esc(e.message)}`);
        }
    });

    // 🔤 عد النص
    cmd(bot, ["عد", "عدد"], async (ctx, args) => {
        const text = args || ctx.message.reply_to_message?.text || "";

        if (!text) {
            return ctx.reply(
                `${HEADER}\n\n` +
                `🌸 <b>TEXT COUNTER</b>\n\n` +
                `اكتب نصًا أو استخدم الأمر بالرد على رسالة.\n\n` +
                FOOTER,
                HTML
            );
        }

        const words = text.trim() ? text.trim().split(/\s+/).length : 0;

        return ctx.reply(
            `${HEADER}\n\n` +
            `🌸 <b>TEXT COUNTER</b>\n\n` +
            `🔤 الحروف: ${Array.from(text).length}\n` +
            `📝 الكلمات: ${words}\n\n` +
            FOOTER,
            HTML
        );
    });

    // 👥 معلومات المجموعة
    cmd(bot, ["معلومات_المجموعة"], async ctx => {
        if (ctx.chat.type === "private")
            return ctx.reply("🌸 هذا الأمر يعمل داخل المجموعات فقط.");

        const chat = await ctx.getChat();
        const count = await ctx.getChatMembersCount();

        return ctx.reply(
            `${HEADER}\n\n` +
            `🌸 <b>GROUP INFO</b>\n\n` +
            `🏷️ الاسم: ${esc(chat.title || "غير معروف")}\n` +
            `🆔 المعرف: <code>${chat.id}</code>\n` +
            `👥 الأعضاء: ${count}\n\n` +
            FOOTER,
            HTML
        );
    });

    // 👑 المشرفون
    cmd(bot, ["ادمن", "الادمن", "المشرفين"], async ctx => {
        if (ctx.chat.type === "private")
            return ctx.reply("🌸 هذا الأمر يعمل داخل المجموعات فقط.");

        const admins = await ctx.getChatAdministrators();

        const list = admins.map((admin, i) => {
            const user = admin.user;
            const role = admin.status === "creator" ? "👑 مالك" : "🛡️ مشرف";

            return `${i + 1}. ${esc(nameOf(user))} — ${role}`;
        });

        return ctx.reply(
            `${HEADER}\n\n` +
            `🌸 <b>GROUP ADMINS</b>\n\n` +
            (list.join("\n") || "لا يوجد مشرفون.") +
            `\n\n${FOOTER}`,
            HTML
        );
    });

};
