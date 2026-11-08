
/**
 * ╔══════════════════════════════════════╗
 * ║          🌸 AYLA — SERVICES           ║
 * ║          Useful Tools v1.0            ║
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

const crypto = require("crypto");

// ==================================================
// 🌸 أدوات مساعدة
// ==================================================

const COUNTRIES = [
    { name: "تونس 🇹🇳", zone: "Africa/Tunis" },
    { name: "الجزائر 🇩🇿", zone: "Africa/Algiers" },
    { name: "المغرب 🇲🇦", zone: "Africa/Casablanca" },
    { name: "مصر 🇪🇬", zone: "Africa/Cairo" },
    { name: "السعودية 🇸🇦", zone: "Asia/Riyadh" },
    { name: "الإمارات 🇦🇪", zone: "Asia/Dubai" },
    { name: "فلسطين 🇵🇸", zone: "Asia/Gaza" },
    { name: "الأردن 🇯🇴", zone: "Asia/Amman" },
    { name: "العراق 🇮🇶", zone: "Asia/Baghdad" },
    { name: "تركيا 🇹🇷", zone: "Europe/Istanbul" },
    { name: "فرنسا 🇫🇷", zone: "Europe/Paris" },
    { name: "ألمانيا 🇩🇪", zone: "Europe/Berlin" },
    { name: "بريطانيا 🇬🇧", zone: "Europe/London" },
    { name: "إيطاليا 🇮🇹", zone: "Europe/Rome" },
    { name: "إسبانيا 🇪🇸", zone: "Europe/Madrid" },
    { name: "روسيا 🇷🇺", zone: "Europe/Moscow" },
    { name: "اليابان 🇯🇵", zone: "Asia/Tokyo" },
    { name: "الصين 🇨🇳", zone: "Asia/Shanghai" },
    { name: "كوريا الجنوبية 🇰🇷", zone: "Asia/Seoul" },
    { name: "الهند 🇮🇳", zone: "Asia/Kolkata" },
    { name: "الولايات المتحدة 🇺🇸", zone: "America/New_York" },
    { name: "كندا 🇨🇦", zone: "America/Toronto" },
    { name: "البرازيل 🇧🇷", zone: "America/Sao_Paulo" },
    { name: "أستراليا 🇦🇺", zone: "Australia/Sydney" }
];

function getTime(zone) {
    const now = new Date();

    const time = new Intl.DateTimeFormat("ar-TN-u-nu-latn", {
        timeZone: zone,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false
    }).format(now);

    const date = new Intl.DateTimeFormat("ar-TN-u-nu-latn", {
        timeZone: zone,
        dateStyle: "full"
    }).format(now);

    return { time, date };
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

    // 🆔 ايدي
    cmd(bot, ["ايدي", "id", "معرفي"], async ctx => {
        const target =
            ctx.message.reply_to_message?.from || ctx.from;

        return ctx.reply(
            `🌸 <b>AYLA — ID</b>\n\n` +
            `👤 ${link(target.id, nameOf(target))}\n` +
            `🆔 <code>${target.id}</code>\n` +
            (target.username
                ? `🔗 @${esc(target.username)}\n`
                : "") +
            `💬 <code>${ctx.chat.id}</code>`,
            HTML
        );
    });

    // 👤 معلومات المستخدم
    cmd(bot, ["معلومات"], async ctx => {
        const target =
            ctx.message.reply_to_message?.from || ctx.from;

        return ctx.reply(
            `🌸 <b>AYLA — PROFILE</b>\n\n` +
            `👤 الاسم: ${esc(nameOf(target))}\n` +
            `🆔 المعرف: <code>${target.id}</code>\n` +
            `🔗 الحساب: ${
                target.username
                    ? "@" + esc(target.username)
                    : "غير متوفر"
            }\n` +
            `🤖 بوت: ${target.is_bot ? "نعم" : "لا"}`,
            HTML
        );
    });

    // 🕒 الوقت حسب الدولة
    cmd(bot, ["وقت", "الوقت"], async (ctx, args) => {
        if (!args) {
            return ctx.reply(
                "🌸 <b>AYLA — WORLD CLOCK</b>\n\n" +
                "اكتب اسم الدولة بعد الأمر.\n\n" +
                "مثال:\n" +
                "<code>وقت تونس</code>\n" +
                "<code>وقت اليابان</code>\n\n" +
                "الدول المتاحة:\n" +
                COUNTRIES.map(c => "• " + c.name).join("\n"),
                HTML
            );
        }

        const query = args.toLowerCase().trim();

        const country = COUNTRIES.find(c =>
            c.name.toLowerCase().includes(query) ||
            c.zone.toLowerCase().includes(query)
        );

        if (!country)
            return ctx.reply("🌸 لم أجد هذه الدولة في قائمة آيلا.");

        const { time, date } = getTime(country.zone);

        return ctx.reply(
            `🌸 <b>AYLA — WORLD CLOCK</b>\n\n` +
            `🌍 الدولة: ${country.name}\n` +
            `🕒 الوقت: <b>${time}</b>\n` +
            `📅 التاريخ: ${date}`,
            HTML
        );
    });

    // 🧮 الحساب
    cmd(bot, ["حساب", "احسب"], async (ctx, args) => {
        if (!args)
            return ctx.reply(
                "🌸 أرسل العملية الحسابية.\nمثال: <code>حساب 25*4+10</code>",
                HTML
            );

        try {
            const result = calculate(args);

            return ctx.reply(
                `🌸 <b>AYLA — CALCULATOR</b>\n\n` +
                `🧮 <code>${esc(args)}</code>\n` +
                `♡ النتيجة: <b>${result.toLocaleString("en-US")}</b>`,
                HTML
            );
        } catch (e) {
            return ctx.reply("🌸 " + e.message);
        }
    });

    // 🔤 عد الكلمات والحروف
    cmd(bot, ["عد", "عدد"], async (ctx, args) => {
        const text = args ||
            ctx.message.reply_to_message?.text || "";

        if (!text)
            return ctx.reply("🌸 اكتب نصًا أو استخدم الأمر بالرد على رسالة.");

        const trimmed = text.trim();
        const words = trimmed ? trimmed.split(/\s+/).length : 0;

        return ctx.reply(
            `🌸 <b>AYLA — TEXT COUNTER</b>\n\n` +
            `🔤 الحروف: ${Array.from(text).length}\n` +
            `📝 الكلمات: ${words}\n` +
            `📏 المسافات: ${(text.match(/\s/g) || []).length}`,
            HTML
        );
    });

    // 👥 معلومات المجموعة
    cmd(bot, ["معلومات_المجموعة", "معلومات المجموعة"], async ctx => {
        if (ctx.chat.type === "private")
            return ctx.reply("🌸 هذا الأمر يعمل داخل المجموعات فقط.");

        const chat = await ctx.getChat();
        const count = await ctx.getChatMembersCount();

        return ctx.reply(
            `🌸 <b>AYLA — GROUP INFO</b>\n\n` +
            `🏷️ الاسم: ${esc(chat.title || "غير معروف")}\n` +
            `🆔 المعرف: <code>${chat.id}</code>\n` +
            `👥 الأعضاء: ${count}\n` +
            `📌 النوع: مجموعة`,
            HTML
        );
    });

    // 👑 معرفة مشرفي المجموعة
    cmd(bot, ["ادمن", "الادمن", "المشرفين"], async ctx => {
        if (ctx.chat.type === "private")
            return ctx.reply("🌸 هذا الأمر يعمل داخل المجموعات فقط.");

        const admins = await ctx.getChatAdministrators();

        const list = admins.map((admin, index) => {
            const user = admin.user;
            const role =
                admin.status === "creator"
                    ? "👑 مالك"
                    : "🛡️ مشرف";

            return `${index + 1}. ${esc(nameOf(user))} — ${role}`;
        });

        return ctx.reply(
            `🌸 <b>AYLA — ADMINS</b>\n\n` +
            (list.join("\n") || "لا يوجد مشرفون."),
            HTML
        );
    });

};
