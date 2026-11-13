
/**
 * ╔══════════════════════════════════════╗
 * ║              AYLA MENU               ║
 * ║                 v3.0                 ║
 * ╚══════════════════════════════════════╝
 */

const {
    cmd,
    getMenuCategories
} = require("../../lib/util");

const { InlineKeyboard } = require("grammy");

const PHOTO_URL = "https://files.catbox.moe/ccdo9v.jpg";

// ==================================================
// DESIGN
// ==================================================

const HEADER = section =>
    `❀ ━━ 𝗔𝗬𝗟𝗔 〢 ${section} ━━ ❀`;

const FOOTER = "❀ ━━━━━━━━━━━━━ ❀";

const format = (section, content) =>
    `${HEADER(section)}\n\n${content}\n\n${FOOTER}`;

// ==================================================
// MAIN MENU
// ==================================================

const MAIN_TEXT = format(
    "𝗠𝗘𝗡𝗨",
    "أهلًا بك في عالم آيلا!\n" +
    "اختر القسم الذي تريد استكشافه.\n\n" +
    "✿ نتمنى لك وقتًا ممتعًا."
);

function mainKeyboard() {
    return new InlineKeyboard()
        .text("🐲 لعبة الحيوان", "ayla:animals")
        .text("🎮 الألعاب", "ayla:games")
        .row()
        .text("😂 الترفيه", "ayla:fun")
        .text("🛠️ الخدمات", "ayla:services");
}

// ==================================================
// CATEGORY CONFIG
// ==================================================

const CATEGORY_CONFIG = {
    animals: {
        title: "𝗔𝗡𝗜𝗠𝗔𝗟"
    },

    games: {
        title: "𝗚𝗔𝗠𝗘𝗦"
    },

    fun: {
        title: "𝗙𝗨𝗡"
    },

    services: {
        title: "𝗦𝗘𝗥𝗩𝗜𝗖𝗘𝗦"
    }
};

// ==================================================
// CATEGORY CONTENT
// ==================================================

function buildCategory(category) {
    const config = CATEGORY_CONFIG[category];

    if (!config) return null;

    const categories = getMenuCategories();
    const commands = categories[category] || [];

    let content;

    if (!commands.length) {
        content = "✿ لا يوجد أوامر حاليًا.";
    } else {
        content = commands
            .map(command => `• ${command.name}`)
            .join("\n");
    }

    return format(config.title, content);
}

// ==================================================
// KEYBOARDS
// ==================================================

function backKeyboard() {
    return new InlineKeyboard()
        .text("↩️ القائمة الرئيسية", "ayla:menu");
}

// ==================================================
// MENU FUNCTIONS
// ==================================================

async function sendMainMenu(api, chatId) {
    return api.sendPhoto(chatId, PHOTO_URL, {
        caption: MAIN_TEXT,
        parse_mode: "HTML",
        reply_markup: mainKeyboard()
    });
}

async function sendCategory(api, chatId, category) {
    const text = buildCategory(category);

    if (!text) return;

    return api.sendMessage(chatId, text, {
        parse_mode: "HTML",
        reply_markup: backKeyboard()
    });
}

// ==================================================
// BOT
// ==================================================

module.exports = function (bot) {

    // Main menu
    bot.command("start", ctx =>
        sendMainMenu(ctx.api, ctx.chat.id)
    );

    // Help commands
    cmd(
        bot,
        ["اوامر", "الاوامر", "أوامر", "الأوامر", "مساعدة", "قائمة"],
        ctx => sendMainMenu(ctx.api, ctx.chat.id)
    );

    // Menu buttons
    bot.callbackQuery(/^ayla:/, async ctx => {
        const action = ctx.callbackQuery.data.split(":")[1];
        const message = ctx.callbackQuery.message;

        await ctx.answerCallbackQuery();

        if (!message) return;

        const chatId = message.chat.id;

        if (action === "menu") {
            try {
                await ctx.api.deleteMessage(
                    chatId,
                    message.message_id
                );
            } catch (_) {}

            return sendMainMenu(ctx.api, chatId);
        }

        if (CATEGORY_CONFIG[action]) {
            try {
                await ctx.api.deleteMessage(
                    chatId,
                    message.message_id
                );
            } catch (_) {}

            return sendCategory(ctx.api, chatId, action);
        }
    });

    // Ping
    bot.command("ping", ctx =>
        ctx.reply("pong ✅")
    );
};
