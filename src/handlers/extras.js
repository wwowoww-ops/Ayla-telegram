// أزرار متجر النوادر (xn) وتدوير الحيوانات (xr)
const store = require("../core/store");
const X = require("../game/extras");
const M = require("../game/extrasMenu");

module.exports = function (bot) {
    const guard = async (ctx, fn) => {
        try {
            if (String(ctx.from.id) !== ctx.match[1]) return await ctx.answerCallbackQuery({ text: "هذه القائمة ليست لك.", show_alert: true });
            const P = store.get(ctx.match[1]);
            if (!P) return await ctx.answerCallbackQuery({ text: "اكتب: حيواني لتبدأ" });
            const r = fn(P);
            if (r.touched) store.touch(P.id);
            await ctx.answerCallbackQuery(r.alert ? { text: r.alert, show_alert: true } : undefined);
            await ctx.editMessageText(r.scr.text, { parse_mode: "HTML", reply_markup: r.scr.kb }).catch(e => {
                if (!/not modified/i.test(String(e && (e.description || e.message)))) throw e;
            });
        } catch (e) {
            console.error("[EXTRAS CALLBACK ERROR]", e && (e.stack || e.message));
            await ctx.answerCallbackQuery({ text: "حدث خطأ مؤقت" }).catch(() => {});
        }
    };
    bot.callbackQuery(/^xn:(\d+):(\w+)(?::(\w+))?$/, ctx => guard(ctx, P => {
        const act = ctx.match[2], arg = ctx.match[3];
        if (act === "buy") { const r = X.buy(P, arg, 1); return r.ok ? { touched: true, scr: M.shop(P, "✅ " + r.msg) } : { alert: r.msg, scr: M.shop(P) }; }
        if (act === "open") { const r = X.openBox(P); return r.ok ? { touched: true, scr: M.shop(P, r.msg) } : { alert: r.msg, scr: M.shop(P) }; }
        return { scr: M.shop(P) };
    }));
    bot.callbackQuery(/^xr:(\d+):(\w+)(?::(\d+))?$/, ctx => guard(ctx, P => {
        const act = ctx.match[2], n = Number(ctx.match[3]);
        switch (act) {
            case "ask": return { scr: M.ask(P, n) };
            case "go": { const r = X.recycleBulk(P, n, M.LEVELS[1]); return r.ok ? { touched: true, scr: M.recycle(P, "✅ " + r.msg) } : { alert: r.msg, scr: M.recycle(P) }; }
            case "list": return { scr: M.list(P, n || 0) };
            case "pick": return { scr: M.pick(P, n) };
            case "do": { const r = X.recycle(P, [n]); return r.ok ? { touched: true, scr: M.recycle(P, "✅ " + r.msg) } : { alert: r.msg, scr: M.recycle(P) }; }
            default: return { scr: M.recycle(P) };
        }
    }));
};
