
// أوامر القوائم الإضافية للعبة الحيوان
const { cmd } = require("../../lib/util");
const store = require("../../core/store");
const ui = require("../../game/ui");
const Q = require("../../game/quests");
const M = require("../../game/menus");

const send = (ctx, scr) =>
    ctx.reply(scr.text, {
        parse_mode: "HTML",
        reply_markup: scr.kb
    });

// يجهّز اللاعب ويمنح ما أنجزه قبل عرض القائمة
function prepare(ctx) {
    const P = ui.ensure(ctx.from);
    const now = Date.now();
    const res = Q.settle(P, now);
    store.touch(P.id);

    return { P, res, now };
}

module.exports = function (bot) {

    // =========================
    // الأوامر النصية
    // =========================

    cmd(bot, ["مهام", "مهامي", "المهام"], ctx => {
        const { P, res, now } = prepare(ctx);
        return send(ctx, M.screenQuests(P, res, now));
    }, { menu: "المهام اليومية", category: "animals" });

    cmd(bot, ["انجازات", "إنجازات", "انجازاتي", "الانجازات"], ctx => {
        const { P, res } = prepare(ctx);
        return send(ctx, M.screenAchievements(P, res));
    }, { menu: "الإنجازات", category: "animals" });

    cmd(bot, ["ملفي", "بروفايل", "بطاقتي"], ctx => {
        const { P, now } = prepare(ctx);
        return send(ctx, M.screenProfile(P, now));
    }, { menu: "ملفي", category: "animals" });

    cmd(bot, ["مخزن", "مخزني", "حقيبتي", "المخزن"], ctx => {
        const { P } = prepare(ctx);
        return send(ctx, M.screenBag(P));
    }, { menu: "المخزن", category: "animals" });

    cmd(bot, ["دليل", "الدليل"], ctx => {
        const { P } = prepare(ctx);
        return send(ctx, M.screenGuide(P));
    }, { menu: "دليل اللعبة", category: "animals" });

    // =========================
    // أزرار القوائم الإضافية
    // =========================

    bot.callbackQuery(
        /^q:(\d+):(quests|ach|profile|bag|guide)$/,
        async ctx => {
            const uid = ctx.match[1];
            const page = ctx.match[2];

            // القائمة لصاحبها فقط
            if (String(ctx.from.id) !== uid) {
                return ctx.answerCallbackQuery({
                    text: "هذه القائمة ليست لك.",
                    show_alert: true
                });
            }

            try {
                const P = store.get(uid);

                if (!P) {
                    return ctx.answerCallbackQuery({
                        text: "اكتب: حيواني لتبدأ"
                    });
                }

                const now = Date.now();
                const res = Q.settle(P, now);
                store.touch(P.id);

                let scr;

                switch (page) {
                    case "quests":
                        scr = M.screenQuests(P, res, now);
                        break;

                    case "ach":
                        scr = M.screenAchievements(P, res);
                        break;

                    case "profile":
                        scr = M.screenProfile(P, now);
                        break;

                    case "bag":
                        scr = M.screenBag(P);
                        break;

                    case "guide":
                        scr = M.screenGuide(P);
                        break;
                }

                if (!scr) {
                    return ctx.answerCallbackQuery({
                        text: "القائمة غير موجودة."
                    });
                }

                await ctx.editMessageText(scr.text, {
                    parse_mode: "HTML",
                    reply_markup: scr.kb
                });

                await ctx.answerCallbackQuery();

            } catch (error) {
                console.error(
                    "[AYLA EXTRA MENUS ERROR]",
                    error && (error.stack || error.message)
                );

                try {
                    await ctx.answerCallbackQuery({
                        text: "تعذر فتح القائمة. حاول مجددًا."
                    });
                } catch (_) {}
            }
        }
    );
};
