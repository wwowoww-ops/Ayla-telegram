/**
 * ╔══════════════════════════════════════╗
 * ║              AYLA ANIMALS             ║
 * ║                 v1.0                 ║
 * ╚══════════════════════════════════════╝
 */

// العملات: المكافأة اليومية، الرصيد، التحويل

const { cmd, esc, nameOf, digits } = require("../../lib/util");
const E = require("../../game/engine");
const store = require("../../core/store");
const ui = require("../../game/ui");

const UNITS = {
    K: 1e3,
    M: 1e6,
    B: 1e9,
    T: 1e12
};

// "5M" أو "1,500" أو "٣٠٠" -> رقم (أو NaN)
function parseAmount(text) {
    const s = digits(text)
        .replace(/[,،\s]/g, "")
        .toUpperCase();

    const mult = UNITS[s.slice(-1)] || 1;

    return Math.floor(
        Number(mult === 1 ? s : s.slice(0, -1)) * mult
    );
}

module.exports = function (bot) {

    // المكافأة اليومية
    cmd(bot,
        ["يومي", "راتب", "مكافأة"],
        async ctx => {
            const P = ui.ensure(ctx.from);
            const r = E.daily(P, ui.now());

            store.touch(P.id);

            return ctx.reply(
                r.ok
                    ? "🎁 " + r.msg + "\n🪙 رصيدك: " + ui.fmt(P.coins)
                    : "⏳ " + r.msg
            );
        },
        {
            menu: "المكافأة اليومية",
            category: "animals"
        }
    );

    // عرض الرصيد
    cmd(bot,
        ["رصيدي", "رصيد", "فلوسي", "فلوس", "محفظتي"],
        async ctx => {
            const target =
                ctx.message.reply_to_message &&
                ctx.message.reply_to_message.from;

            if (target && !target.is_bot) {
                const T = store.get(target.id);

                return ctx.reply(
                    `🪙 رصيد ${esc(nameOf(target))}: ${ui.fmt(T ? T.coins : 0)}`
                );
            }

            const P = ui.ensure(ctx.from);

            return ctx.reply(
                `🪙 رصيدك: ${ui.fmt(P.coins)}\n` +
                `💰 دخلك: ${ui.fmt(E.incomeAll(P))}/ساعة`
            );
        },
        {
            menu: "الرصيد",
            category: "animals"
        }
    );

    // تحويل العملات
    // .تحويل 1000 بالرد على رسالة الشخص
    cmd(bot,
        ["تحويل", "حول"],
        async (ctx, args) => {
            const target =
                ctx.message.reply_to_message &&
                ctx.message.reply_to_message.from;

            if (!target || target.is_bot)
                return ctx.reply(
                    "↩️ رد على رسالة الشخص واكتب: .تحويل 1000"
                );

            if (target.id === ctx.from.id)
                return ctx.reply("❌ لا يمكنك التحويل لنفسك.");

            const amount = parseAmount(args);

            if (!Number.isFinite(amount) || amount < 1)
                return ctx.reply(
                    "❌ اكتب مبلغًا صحيحًا. مثال: .تحويل 1000 أو .تحويل 5M"
                );

            const from = ui.ensure(ctx.from);
            const to = ui.ensure(target);

            if (from.coins < amount)
                return ctx.reply(
                    "❌ رصيدك لا يكفي. رصيدك: " + ui.fmt(from.coins)
                );

            from.coins -= amount;
            to.coins = E.clampCoins(to.coins + amount);

            store.touch(from.id);
            store.touch(to.id);

            return ctx.reply(
                `✅ حوّلت ${ui.fmt(amount)} 🪙 إلى ${esc(nameOf(target))}\n` +
                `🪙 رصيدك الآن: ${ui.fmt(from.coins)}`
            );
        },
        {
            menu: "تحويل العملات",
            category: "animals"
        }
    );
};

module.exports.parseAmount = parseAmount;