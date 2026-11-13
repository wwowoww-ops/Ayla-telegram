
"use strict";

// أمر فتح إطارات صورة الحساب
const { cmd } = require("../../lib/util");
const store = require("../../core/store");
const ui = require("../../game/ui");
const Q = require("../../game/quests");
const { screenFrames } = require("../../game/frames/menu");

module.exports = function (bot) {
    cmd(
        bot,
        ["إطارات", "اطارات", "إطاري", "إطاراتي"],
        async ctx => {
            try {
                const P = ui.ensure(ctx.from);

                Q.settle(P, Date.now());
                store.touch(P.id);

                const scr = screenFrames(P);

                return await ctx.reply(scr.text, {
                    parse_mode: "HTML",
                    reply_markup: scr.kb
                });

            } catch (error) {
                console.error(
                    "[FRAMES COMMAND ERROR]",
                    error.stack || error
                );

                return ctx.reply(
                    "❌ تعذر فتح قائمة الإطارات حاليًا."
                );
            }
        },
        {
            menu: "إطارات صورة الحساب",
            category: "animals"
        }
    );
};
