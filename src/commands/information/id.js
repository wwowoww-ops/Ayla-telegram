const {
    esc,
    nameOf,
    link,
    HTML,
    cmd
} = require("../../lib/util");

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

// ==================================================
// AYLA — ID / USER INFO
// ==================================================

module.exports = function (bot) {

    cmd(bot, ["ايدي", "id", "معرفي", "معلومات"], async ctx => {

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

        // إرسال صورة الحساب الأصلية دون إطار
        try {
            const photos = await ctx.api.getUserProfilePhotos(
                target.id,
                { limit: 1 }
            );

            if (photos.total_count > 0) {
                const sizes = photos.photos[0];
                const photo = sizes[sizes.length - 1];

                return ctx.replyWithPhoto(photo.file_id, {
                    caption,
                    ...HTML
                });
            }
        } catch (error) {
            console.error("[AYLA ID PHOTO]", error.message);
        }

        // إذا لم تتوفر صورة
        return ctx.reply(caption, HTML);
    });
};