/**
 * ╔══════════════════════════════════════╗
 * ║              AYLA ANIMALS             ║
 * ║                 v1.0                 ║
 * ╚══════════════════════════════════════╝
 */

// المبارزة: .مبارزة 5000 بالرد على رسالة الخصم
// القبول والرفض في handlers/duel.js

const { InlineKeyboard } = require("grammy");
const { cmd, link, HTML } = require("../../lib/util");
const E = require("../../game/engine");
const D = require("../../game/data");
const store = require("../../core/store");
const ui = require("../../game/ui");
const pending = require("../../game/pending");
const { parseAmount } = require("./economy");

module.exports = function (bot) {

    cmd(bot,
        ["مبارزة", "مبارزه", "نزال"],
        async (ctx, args) => {

            const target =
                ctx.message.reply_to_message &&
                ctx.message.reply_to_message.from;

            if (
                !target ||
                target.is_bot ||
                target.id === ctx.from.id
            ) {
                return ctx.reply(
                    "↩️ رد على رسالة خصمك واكتب: .مبارزة 5000 (الرهان اختياري)"
                );
            }

            const A = ui.ensure(ctx.from);
            const B = store.get(target.id);

            if (!B)
                return ctx.reply(
                    "خصمك لم يبدأ اللعبة بعد. يكتب: حيواني"
                );

            const bet = args ? parseAmount(args) : 0;

            if (!(bet >= 0))
                return ctx.reply("❌ رهان غير صالح.");

            const check = E.duelCheck(
                A,
                B,
                bet,
                ui.now()
            );

            if (!check.ok)
                return ctx.reply("❌ " + check.msg);

            pending.set(
                A.id + ":" + B.id,
                {
                    bet,
                    at: ui.now()
                }
            );

            const kb = new InlineKeyboard()
                .text(
                    "⚔️ أقبل التحدي",
                    `d:${A.id}:${B.id}:y`
                )
                .text(
                    "❌ رفض",
                    `d:${A.id}:${B.id}:n`
                );

            const a = check.a;
            const b = check.b;

            return ctx.reply(
                `⚔️ ${link(A.id, A.name)} يتحدى ${link(B.id, B.name)}!\n` +
                `${ui.nameP(a)} (${ui.fmt(E.power(a))} ${D.ELEMENTS[a.el].e}) ضد ${ui.nameP(b)} (${ui.fmt(E.power(b))} ${D.ELEMENTS[b.el].e})\n` +
                (bet ? `💰 الرهان: ${ui.fmt(bet)} 🪙\n` : "") +
                "يقبل خلال دقيقتين:",
                {
                    ...HTML,
                    reply_markup: kb
                }
            );
        },
        {
            menu: "مبارزة",
            category: "animals"
        }
    );
};