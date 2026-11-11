
/**
 * ╔══════════════════════════════════════╗
 * ║               AYLA ID                ║
 * ║                 v1.2                 ║
 * ╚══════════════════════════════════════╝
 */

"use strict";

const https = require("https");

const {
    esc,
    nameOf,
    link,
    HTML,
    cmd
} = require("../../lib/util");

const store = require("../../core/store");
const F = require("../../game/frames");
const { renderCard } = require("../../lib/udcard");

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
// DOWNLOAD TELEGRAM PHOTO
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
// AYLA — ID / USER INFO
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

                    // جلب بيانات اللاعب المستهدف
                    const P = store.get(String(target.id));

                    // تحديد الإطار المختار
                    let frame = null;

                    if (P && P.frame) {
                        const selected = F.byId(P.frame);

                        if (selected && F.isUnlocked(P, selected)) {
                            frame = selected;
                        }
                    }

                    // تركيب الإطار إن كان مختارًا
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
                                    { source: result.buffer },
                                    {
                                        caption,
                                        ...HTML
                                    }
                                );
                            }

                            return ctx.replyWithPhoto(
                                { source: result.buffer },
                                {
                                    caption,
                                    ...HTML
                                }
                            );

                        } catch (error) {
                            console.error(
                                "[AYLA ID FRAME]",
                                error.stack || error.message
                            );
                        }
                    }

                    // لا يوجد إطار أو فشل التركيب
                    return ctx.replyWithPhoto(photo.file_id, {
                        caption,
                        ...HTML
                    });
                }

            } catch (error) {
                console.error(
                    "[AYLA ID PHOTO]",
                    error.stack || error.message
                );
            }

            // إذا لم تتوفر صورة
            return ctx.reply(caption, HTML);
        },
        {
            menu: "ايدي",
            category: "services"
        }
    );
};
