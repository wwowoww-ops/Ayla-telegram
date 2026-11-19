// أوامر: .نوادر  .تدوير  .تدفئة  .اشعارات  .اغراضي
const { cmd } = require("../../lib/util");
const store = require("../../core/store");
const ui = require("../../game/ui");
const X = require("../../game/extras");
const M = require("../../game/extrasMenu");
const E = require("../../game/engine");

module.exports = function (bot) {
    const html = (ctx, scr) => ctx.reply(scr.text, { parse_mode: "HTML", reply_markup: scr.kb });
    cmd(bot, ["نوادر", "متجر_النوادر", "النوادر"], ctx => html(ctx, M.shop(ui.ensure(ctx.from))), { menu: "متجر النوادر", category: "animals" });
    cmd(bot, ["تدوير", "دور", "تدوير_الحيوانات"], ctx => html(ctx, M.recycle(ui.ensure(ctx.from))), { menu: "تدوير الحيوانات", category: "animals" });

    // .تدفئة [رقم_البيضة]: بدون رقم تُدفَّأ أول بيضة غير جاهزة قابلة للتدفئة
    cmd(bot, ["تدفئة", "دفئ"], (ctx, args) => {
        const P = ui.ensure(ctx.from), now = Date.now();
        const id = Number(String(args || "").trim());
        const egg = id ? P.eggs.find(e => e.id === id) : P.eggs.find(e => X.warmInfo(P, e, now).canWarm);
        if (!egg) return ctx.reply("🥚 لا توجد بيضة قابلة للتدفئة الآن.\nالتدفئة تحتاج 🍯 عسل الحضانة (من .نوادر)، وتُقصّر 10% من المدة حتى 3 مرات لكل بيضة.");
        const r = X.warm(P, egg.id, now);
        if (r.ok) store.touch(P.id);
        return ctx.reply(r.msg);
    }, { menu: "تدفئة البيض", category: "animals" });

    cmd(bot, ["اشعارات", "إشعارات"], ctx => {
        const P = ui.ensure(ctx.from);
        P.notify = P.notify === false;
        store.touch(P.id);
        return ctx.reply(P.notify === false ? "🔕 أُوقفت إشعارات جاهزية البيض." : "🔔 ستصلك رسالة خاصة عندما تصبح بيضتك جاهزة للفقس.\n(يجب أن تكون قد بدأت محادثة خاصة مع البوت.)");
    }, { menu: "إشعارات البيض", category: "animals" });

    cmd(bot, ["اغراضي", "أغراضي"], ctx => {
        const P = ui.ensure(ctx.from);
        const l = Object.entries(X.ITEMS).map(([id, it]) => it.e + " " + it.n + ": " + X.have(P, id)).join("\n");
        return ctx.reply("🎒 أغراضك\n" + l);
    }, { menu: "أغراضي", category: "animals" });
};
