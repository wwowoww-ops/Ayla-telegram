
/**
 * ╔══════════════════════════════════════╗
 * ║               AYLA ID                ║
 * ║                 v1.3                 ║
 * ╚══════════════════════════════════════╝
 */

"use strict";

const https = require("https");
const { InputFile } = require("grammy");

const {
    esc,
    nameOf,
    link,
    HTML,
    cmd
} = require("../../lib/util");

const store = require("../../core/store");
const F = require("../../game/frames");
const { renderCard } = require("../../lib/idcard");

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
// DOWNLOAD PHOTO
// ==================================================

function downloadFile(url) {
    return new Promise((resolve, reject) => {
        const req = https.get(url, response => {
            if (response.statusCode !== 200) {
                response.resume();
                return reject(
                    new Error("Telegram download failed: " + response.statusCode)
                );
            }

            const chunks = [];

            response.on("data", chunk => chunks.push(chunk));
            response.on("end", () => resolve(Buffer.concat(chunks)));
            response.on("error", reject);
        });

        req.setTimeout(20000, () => {
            req.destroy(new Error("Photo download timeout"));
        });

        req.on("error", reject);
    });
}

async function getPhotoBuffer(ctx, fileId) {
    const file = await ctx.api.getFile(fileId);

    if (!file.file_path) {
        throw new Error("Telegram file_path is missing");
    }

    const url =
        `https://api.telegram.org/file/bot${ctx.api.token}/${file.file_path}`;

    return downloadFile(url);
}

// ==================================================
// AYLA ID
// ==================================================

module.exports = function (bot) {

    cmd(
        bot,
        ["ايدي", "id", "معرفي", "معلومات"],
        async ctx => {

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

            try {
                const photos = await ctx.api.getUserProfilePhotos(
                    target.id,
                    { limit: 1 }
                );

                if (photos.total_count > 0) {
                    const sizes = photos.photos[0];
                    const photo = sizes[sizes.length - 1];

                    const P = store.get(String(target.id));

                    let frame = null;

                    if (P?.frame) {
                        const selected = F.byId(P.frame);

                        if (selected && F.isUnlocked(P, selected)) {
                            frame = selected;
                        }
                    }

                    if (frame) {
                        try {
                            const photoBuffer = await getPhotoBuffer(
                                ctx,
                                photo.file_id
                            );

                            const result = await renderCard(
                                photoBuffer,
                                frame
                            );

                            if (result.animated) {
                                return ctx.replyWithAnimation(
                                    new InputFile(
                                        result.buffer,
                                        "ayla-id.gif"
                                    ),
                                    {
                                        caption,
                                        ...HTML
                                    }
                                );
                            }

                            return ctx.replyWithPhoto(
                                new InputFile(
                                    result.buffer,
                                    "ayla-id.jpg"
                                ),
                                {
                                    caption,
                                    ...HTML
                                }
                            );

                        } catch (error) {
                            console.error(
                                "[AYLA ID FRAME ERROR]",
                                error.stack || error.message
                            );
                        }
                    }

                    return ctx.replyWithPhoto(photo.file_id, {
                        caption,
                        ...HTML
                    });
                }

            } catch (error) {
                console.error(
                    "[AYLA ID PHOTO ERROR]",
                    error.stack || error.message
                );
            }

            return ctx.reply(caption, HTML);
        },
        {
            menu: "ايدي",
            category: "services"
        }
    );
};
