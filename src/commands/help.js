
/**
 * ╔══════════════════════════════════════╗
 * ║              AYLA MENU               ║
 * ║                 v2.1                 ║
 * ╚══════════════════════════════════════╝
 */

const { esc, nameOf, HTML, cmd } = require("../lib/util");
const { InlineKeyboard } = require("grammy");

const PHOTO_URL = "https://files.catbox.moe/ccdo9v.jpg";

// ==================================================
// MAIN MENU
// ==================================================

const MAIN_TEXT =
    "🌸 <b>AYLA — MENU</b>\n\n" +
    "أهلًا بك في عالم آيلا!\n" +
    "اختر القسم الذي تريد استكشافه.\n\n" +
    "✿ نتمنى لك وقتًا ممتعًا.";

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
        text:
            "🐲 <b>لعبة الحيوان</b>\n\n" +
            "• حيواني\n" +
            "• بيض\n" +
            "• صيد\n" +
            "• عناصر\n" +
            "• ترتيب\n" +
            "• جمع\n" +
            "• يومي\n" +
            "• رصيد\n" +
            "• تسمية\n" +
            "• تحويل\n" +
            "• مبارزة"
    },

    games: {
        text:
            "🎮 <b>الألعاب</b>\n\n" +
            "✿ لا يوجد أوامر حاليًا."
    },

    fun: {
        text:
            "😂 <b>الترفيه</b>\n\n" +
            "✿ لا يوجد أوامر حاليًا."
    },

    services: {
        text:
            "🛠️ <b>الخدمات</b>\n\n" +
            "• ايدي\n" +
            "• وقت\n" +
            "• حساب\n" +
            "• كلمة_سر\n" +
            "• عكس\n" +
            "• عد\n" +
            "• منشن\n" +
            "• بادئة"
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

    // Mention
    cmd(bot, ["منشن"], ctx =>
        ctx.reply(
            `مرحبًا <a href="tg://user?id=${ctx.from.id}">${esc(nameOf(ctx.from))}</a> 👋`,
            HTML
        )
    );

    // Ping
    bot.command("ping", ctx =>
        ctx.reply("pong ✅")
    );
};
