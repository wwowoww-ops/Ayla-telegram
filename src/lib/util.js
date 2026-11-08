
/**
 * ╔══════════════════════════════════════╗
 * ║              AYLA UTILS              ║
 * ║                 v2.2                 ║
 * ╚══════════════════════════════════════╝
 */

// ==================================================
// IMPORTS
// ==================================================

const store = require("../core/store");

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

function getPrefix(chatId) {
    if (!chatId) return DEFAULT_PREFIX;

    return store.getGroupPrefix(chatId);
}

function setPrefix(chatId, prefix) {
    if (!chatId) {
        throw new Error("معرّف المجموعة غير موجود");
    }

    prefix = String(prefix ?? "").trim();

    if (prefix.length > 3 || /\s/.test(prefix)) {
        throw new Error(
            "البادئة يجب أن تكون من 1 إلى 3 رموز دون مسافات"
        );
    }

    store.setGroupPrefix(chatId, prefix);

    return prefix;
}

// ==================================================
// COMMAND MENU REGISTRY
// ==================================================

// الأوامر التي تسمح بإظهارها في القائمة
const commandRegistry = new Map();

/**
 * تسجيل أمر في قائمة AYLA.
 *
 * menu:
 * الاسم العربي الظاهر للمستخدم.
 *
 * category:
 * animals | games | fun | services
 *
 * hidden:
 * إخفاء الأمر من القائمة.
 */

function registerMenuCommand(names, options = {}) {
    if (!options.menu || options.hidden) return;

    const category = options.category || "services";

    const allowedCategories = [
        "animals",
        "games",
        "fun",
        "services"
    ];

    if (!allowedCategories.includes(category)) {
        console.warn(
            "[AYLA MENU] قسم غير معروف:",
            category
        );
        return;
    }

    const key = `${category}:${options.menu}`;

    commandRegistry.set(key, {
        name: String(options.menu),
        category
    });
}

// ==================================================
// MENU GETTERS
// ==================================================

function getMenuCommands(category = null) {
    const commands = Array.from(commandRegistry.values());

    if (!category) return commands;

    return commands.filter(command =>
        command.category === category
    );
}

function getMenuCategories() {
    return {
        animals: getMenuCommands("animals"),
        games: getMenuCommands("games"),
        fun: getMenuCommands("fun"),
        services: getMenuCommands("services")
    };
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
 * الخاص:
 * الأوامر تعمل دون بادئة.
 *
 * المجموعات:
 * الأوامر تحتاج بادئة المجموعة.
 *
 * options.noPrefix:
 * يسمح للأمر بالعمل دون بادئة.
 *
 * options.menu:
 * الاسم الظاهر في القائمة.
 *
 * options.category:
 * قسم الأمر.
 *
 * options.hidden:
 * إخفاء الأمر من القائمة.
 */

function cmd(bot, names, handler, options = {}) {
    if (!Array.isArray(names)) {
        names = [names];
    }

    registerMenuCommand(names, options);

    const alternatives = names.map(escapeRegex).join("|");

    const commandRegex = new RegExp(
        "^(?:" + alternatives + ")(?:\\s+([\\s\\S]*))?$",
        "i"
    );

    bot.on("message:text", async (ctx, next) => {
        const text = ctx.message.text.trim();

        const chatType = ctx.chat.type;
        const isPrivate = chatType === "private";

        let commandText = text;

        if (!isPrivate) {
            const prefix = getPrefix(ctx.chat.id);

            if (options.noPrefix) {
                // الأمر يعمل دون بادئة أو معها
                if (prefix && text.startsWith(prefix)) {
                    commandText = text
                        .slice(prefix.length)
                        .trim();
                }
            } else {
                // إذا كانت البادئة مفعّلة
                if (prefix) {
                    if (!text.startsWith(prefix)) {
                        return next();
                    }

                    commandText = text
                        .slice(prefix.length)
                        .trim();
                } else {
                    // المجموعة دون بادئة
                    commandText = text;
                }
            }
        }

        const match = commandRegex.exec(commandText);

        if (!match) return next();

        try {
            await handler(
                ctx,
                (match[1] || "").trim()
            );
        } catch (e) {
            console.error(
                "[CMD ERROR]",
                e && (e.stack || e.message)
            );

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

    // Prefix
    getPrefix,
    setPrefix,
    DEFAULT_PREFIX,

    // Menu registry
    getMenuCommands,
    getMenuCategories
};
