
/**
 * ╔══════════════════════════════════════╗
 * ║              AYLA UTILS               ║
 * ║                 v2.0                 ║
 * ╚══════════════════════════════════════╝
 */

// ==================================================
// BASIC TOOLS
// ==================================================

const esc = s => String(s).replace(/[&<>]/g, c => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;"
}[c]));

const nameOf = u =>
    [u.first_name, u.last_name].filter(Boolean).join(" ") ||
    u.username ||
    "مستخدم";

const link = (id, name) =>
    `<a href="tg://user?id=${id}">${esc(name)}</a>`;

const pick = arr => arr[Math.floor(Math.random() * arr.length)];

const HTML = { parse_mode: "HTML" };

// ==================================================
// DIGITS
// ==================================================

const digits = s => String(s)
    .replace(/[٠-٩]/g, d => "٠١٢٣٤٥٦٧٨٩".indexOf(d))
    .replace(/[۰-۹]/g, d => "۰۱۲۳۴۵۶۷۸۹".indexOf(d));

// ==================================================
// NORMALIZE
// ==================================================

const norm = s => String(s).toLowerCase()
    .replace(/[\u064B-\u065F\u0670\u0640]/g, "")
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/[^\p{L}\p{N}\s]/gu, "")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^ال/, "");

// ==================================================
// GROUP PREFIX SYSTEM
// ==================================================

const DEFAULT_PREFIX = "!";
const groupPrefixes = new Map();

function getPrefix(chatId) {
    if (!chatId) return DEFAULT_PREFIX;
    return groupPrefixes.has(String(chatId))
        ? groupPrefixes.get(String(chatId))
        : DEFAULT_PREFIX;
}

function setPrefix(chatId, prefix) {
    if (!chatId) throw new Error("معرّف المجموعة غير موجود");

    prefix = String(prefix ?? "").trim();

    if (prefix.length > 3 || /\s/.test(prefix)) {
        throw new Error("البادئة يجب أن تكون من 1 إلى 3 رموز دون مسافات");
    }

    groupPrefixes.set(String(chatId), prefix);
    return prefix;
}

// ==================================================
// COMMAND REGISTER
// ==================================================

function escapeRegex(s) {
    return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * cmd(bot, names, handler, options)
 *
 * الخاص: بدون بادئة.
 * المجموعات: بالبادئة الخاصة بها.
 *
 * options.noPrefix:
 * يسمح للأمر بالعمل دون بادئة في المجموعات أيضًا.
 */

function cmd(bot, names, handler, options = {}) {
    const alternatives = names.map(escapeRegex).join("|");
    const commandRegex = new RegExp(
        "^(?:" + alternatives + ")(?:\\s+([\\s\\S]*))?$",
        "i"
    );

    bot.on("message:text", async (ctx, next) => {
        const text = ctx.message.text.trim();
        const chatType = ctx.chat.type;
        const isPrivate = chatType === "private";

        let prefix = isPrivate ? "" : getPrefix(ctx.chat.id);
        let commandText = text;

        if (!isPrivate) {
            if (options.noPrefix) {
                // يسمح بالأمر دون بادئة أو مع بادئة المجموعة
                if (prefix && text.startsWith(prefix)) {
                    commandText = text.slice(prefix.length).trim();
                }
            } else {
                if (!prefix || !text.startsWith(prefix)) {
                    return next();
                }

                commandText = text.slice(prefix.length).trim();
            }
        }

        const match = commandRegex.exec(commandText);

        if (!match) return next();

        try {
            await handler(ctx, (match[1] || "").trim());
        } catch (e) {
            console.error("[CMD ERROR]", e && (e.stack || e.message));

            await ctx.reply(
                "⚠️ حدث خطأ مؤقت، حاول بعد قليل."
            ).catch(() => {});
        }
    });
}

// ==================================================
// HASH
// ==================================================

function hash(str) {
    let h = 2166136261;

    for (const c of String(str)) {
        h ^= c.codePointAt(0);
        h = Math.imul(h, 16777619) >>> 0;
    }

    return h;
}

// ==================================================
// EXPORTS
// ==================================================

module.exports = {
    esc,
    nameOf,
    link,
    pick,
    HTML,
    digits,
    norm,
    cmd,
    hash,

    getPrefix,
    setPrefix,
    DEFAULT_PREFIX
};
