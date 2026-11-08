
/**
 * ╔══════════════════════════════════════╗
 * ║              AYLA MENU               ║
 * ║                 v2.3                 ║
 * ╚══════════════════════════════════════╝
 */

const { cmd } = require("../lib/util");
const { InlineKeyboard } = require("grammy");

const PHOTO_URL = "https://files.catbox.moe/ccdo9v.jpg";

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
// CATEGORIES
// ==================================================

const CATEGORIES = {
    animals: {
        text: format(
            "𝗔𝗡𝗜𝗠𝗔𝗟",
            "✿ <b>الحيوان</b>\n" +
            "• حيواني\n" +
            "• بيض\n" +
            "• حضانة\n" +
            "• سوق\n" +
            "• متجر\n" +
            "• صيد\n" +
            "• عناصر\n" +
            "• ترتيب\n" +
            "• المتصدرين\n" +
            "• توب\n" +
            "• الأغنياء\n" +
            "• جمع\n" +
            "• أرباح\n" +
            "• تسمية\n\n" +

            "✿ <b>الاقتصاد</b>\n" +
            "• يومي\n" +
            "• راتب\n" +
            "• مكافأة\n" +
            "• رصيد\n" +
            "• تحويل\n\n" +

            "✿ <b>المبارزة</b>\n" +
            "• مبارزة\n" +
            "• نزال"
        )
    },

    games: {
        text: format(
            "𝗚𝗔𝗠𝗘𝗦",
            "✿ لا يوجد أوامر حاليًا."
        )
    },

    fun: {
        text: format(
            "𝗙𝗨𝗡",
            "✿ لا يوجد أوامر حاليًا."
        )
    },

    services: {
        text: format(
            "𝗦𝗘𝗥𝗩𝗜𝗖𝗘𝗦",
            "• ايدي\n" +
            "• المجموعة\n" +
            "• وقت\n" +
            "• بادئة"
        )
    }
};

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
    const page = CATEGORIES[category];
    if (!page) return;

    return api.sendMessage(chatId, page.text, {
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
                await ctx.api.deleteMessage(chatId, message.message_id);
            } catch (_) {}

            return sendMainMenu(ctx.api, chatId);
        }

        if (CATEGORIES[action]) {
            try {
                await ctx.api.deleteMessage(chatId, message.message_id);
            } catch (_) {}

            return sendCategory(ctx.api, chatId, action);
        }
    });

    // Ping
    bot.command("ping", ctx =>
        ctx.reply("pong ✅")
    );
};
