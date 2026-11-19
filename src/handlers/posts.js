// أزرار وظائف الحيوانات (po)
const store = require("../core/store");
const Po = require("../game/posts");
const M = require("../game/postsMenu");

module.exports = function (bot) {
    bot.callbackQuery(/^po:(\d+):(\w+)(?::(\w+))?(?::(\w+))?$/, async ctx => {
        try {
            if (String(ctx.from.id) !== ctx.match[1]) return await ctx.answerCallbackQuery({ text: "هذه القائمة ليست لك.", show_alert: true });
            const P = store.get(ctx.match[1]);
            if (!P) return await ctx.answerCallbackQuery({ text: "اكتب: حيواني لتبدأ" });
            const act = ctx.match[2], a = ctx.match[3], b = ctx.match[4];
            let scr, alert;
            switch (act) {
                case "v": scr = M.view(P, a); break;
                case "ls": scr = M.list(P, a, Number(b) || 0); break;
                case "as": { const r = Po.assign(P, a, Number(b)); if (r.ok) { store.touch(P.id); scr = M.view(P, a, "✅ " + r.msg); } else { alert = r.msg; scr = M.list(P, a, 0); } break; }
                case "rm": { const r = Po.unassign(P, Number(b)); if (r.ok) store.touch(P.id); else alert = r.msg; scr = M.view(P, a, r.ok ? "✅ " + r.msg : undefined); break; }
                default: scr = M.main(P);
            }
            await ctx.answerCallbackQuery(alert ? { text: alert, show_alert: true } : undefined);
            await ctx.editMessageText(scr.text, { parse_mode: "HTML", reply_markup: scr.kb }).catch(e => {
                if (!/not modified/i.test(String(e && (e.description || e.message)))) throw e;
            });
        } catch (e) {
            console.error("[POSTS CALLBACK ERROR]", e && (e.stack || e.message));
            await ctx.answerCallbackQuery({ text: "حدث خطأ مؤقت" }).catch(() => {});
        }
    });
};
