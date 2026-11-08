/**
 * ╔══════════════════════════════════════╗
 * ║              AYLA ANIMALS             ║
 * ║                 v1.0                 ║
 * ╚══════════════════════════════════════╝
 */

// أوامر لعبة الحيوان النصية
// الأزرار في handlers/pets.js

const { cmd, esc } = require("../../lib/util");
const E = require("../../game/engine");
const store = require("../../core/store");
const ui = require("../../game/ui");

const send = (ctx, scr) =>
    ctx.reply(scr.text, {
        parse_mode: "HTML",
        reply_markup: scr.kb
    });

module.exports = function (bot) {

    // الواجهة الرئيسية
    cmd(bot,
        ["حيواني", "حيوان", "حيواناتي", "لعبة_الحيوان", "حيوانات"],
        ctx => send(ctx, ui.screenHome(ui.ensure(ctx.from))),
        {
            menu: "حيواني",
            category: "animals"
        }
    );

    // البيض والحضانة
    cmd(bot,
        ["بيض", "حضانة", "الحضانة"],
        ctx => send(ctx, ui.screenEggs(ui.ensure(ctx.from))),
        {
            menu: "البيض والحضانة",
            category: "animals"
        }
    );

    // السوق
    cmd(bot,
        ["سوق", "متجر_حيوان", "متجر"],
        ctx => send(ctx, ui.screenShop(ui.ensure(ctx.from))),
        {
            menu: "سوق الحيوان",
            category: "animals"
        }
    );

    // الصيد
    cmd(bot,
        ["صيد"],
        ctx => send(ctx, ui.screenHunt(ui.ensure(ctx.from))),
        {
            menu: "صيد",
            category: "animals"
        }
    );

    // العناصر
    cmd(bot,
        ["عناصر", "العناصر"],
        ctx => send(ctx, ui.screenElems(ui.ensure(ctx.from))),
        {
            menu: "العناصر",
            category: "animals"
        }
    );

    // المتصدرون
    cmd(bot,
        ["ترتيب", "المتصدرين", "توب", "الأغنياء"],
        ctx => send(ctx, ui.screenTop(ui.ensure(ctx.from))),
        {
            menu: "المتصدرون",
            category: "animals"
        }
    );

    // جمع الأرباح
    cmd(bot,
        ["جمع", "ارباح", "أرباح"],
        async ctx => {
            const P = ui.ensure(ctx.from);
            const r = E.collect(P, ui.now());

            store.touch(P.id);

            return ctx.reply(
                r.ok
                    ? "💰 " + r.msg + "\n🪙 رصيدك: " + ui.fmt(P.coins)
                    : "⏳ " + r.msg
            );
        },
        {
            menu: "جمع الأرباح",
            category: "animals"
        }
    );

    // تسمية الحيوان الأساسي
    cmd(bot,
        ["تسمية", "سمي", "سمّي"],
        async (ctx, args) => {
            const P = ui.ensure(ctx.from);
            const pet = E.getPet(P, P.main);
            const name = ui.clean(args);

            if (!pet)
                return ctx.reply("لا تملك حيوانًا أساسيًا بعد.");

            if (!name)
                return ctx.reply(
                    "اكتب: .تسمية اسم_الحيوان (حتى 16 حرفًا)"
                );

            pet.nick = name;
            store.touch(P.id);

            return ctx.reply(
                `✅ صار اسمه ${E.spOf(pet).e} ${esc(name)}`
            );
        },
        {
            menu: "تسمية الحيوان",
            category: "animals"
        }
    );
};