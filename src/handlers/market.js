// أزرار سوق اللاعبين
const store = require("../core/store");
const M = require("../game/market");
const MM = require("../game/market-menu");
const { nameOf } = require("../lib/util");

module.exports = function (bot) {
    bot.callbackQuery(/^mk:(\d+):(\w+)(?::([\w-]+))?(?::([\w-]+))?(?::(\w+))?$/, async ctx => {
        try {
            if (String(ctx.from.id) !== ctx.match[1]) return await ctx.answerCallbackQuery({ text: "هذه القائمة ليست لك.", show_alert: true });
            const P = store.get(ctx.match[1]);
            if (!P) return await ctx.answerCallbackQuery({ text: "اكتب: حيواني لتبدأ" });
            const [, , act, a, b, c] = ctx.match, now = Date.now();
            let scr, r = null;
            switch (act) {
                case "ls": scr = MM.screenList(P, a, Number(b) || 0); break;
                case "bc": scr = MM.screenBuy(P, a); break;
                case "by":
                    r = M.buy(P, a, now);
                    scr = MM.screenMain(P, r.msg);
                    if (r.ok) bot.api.sendMessage(r.seller, `🤝 بيع عرضك ${M.describe(r.l)}! وصلك 🪙 ${require("../game/engine").fmt(r.gain)} بعد الضريبة.`).catch(() => {});
                    break;
                case "sell": scr = MM.screenSell(P); break;
                case "sf": scr = MM.screenPickF(P, Number(a) || 0); break;
                case "se": scr = MM.screenPickE(P, Number(a) || 0); break;
                case "sr": scr = MM.screenPickR(P); break;
                case "pf": scr = MM.screenPrice(P, "f", a); break;
                case "pe": scr = MM.screenPrice(P, "e", a); break;
                case "pr": scr = MM.screenQty(P, a); break;
                case "pq": scr = MM.screenPrice(P, "r", a, Number(b)); break;
                case "do": {
                    let ref = a, qty = 1;
                    if (b === undefined) { scr = MM.screenSell(P); break; }
                    // do:<kind>:<ref[-qty]>:<multIdx>
                    const kind = a; ref = b; const mi = Number(c);
                    if (kind === "r") { const i = ref.lastIndexOf("-"); qty = Number(ref.slice(i + 1)); ref = ref.slice(0, i); }
                    const base = M.suggest(P, kind, ref, qty);
                    const price = Math.max(1, Math.floor(base * (M.MULTS[mi] || 1)));
                    r = M.sell(P, nameOf(ctx.from), kind, ref, qty, price, now);
                    scr = MM.screenMy(P, r.msg);
                    break;
                }
                case "my": scr = MM.screenMy(P); break;
                case "cx": r = M.cancel(P, a, now); scr = MM.screenMy(P, r.msg); break;
                default: scr = MM.screenMain(P);
            }
            if (r && r.ok) store.touch(P.id);
            await ctx.answerCallbackQuery(r && !r.ok ? { text: r.msg, show_alert: true } : undefined);
            await ctx.editMessageText(scr.text, { parse_mode: "HTML", reply_markup: scr.kb }).catch(e => {
                if (!/not modified/i.test(String(e && (e.description || e.message)))) throw e;
            });
        } catch (e) {
            console.error("[MARKET CALLBACK ERROR]", e && (e.stack || e.message));
            await ctx.answerCallbackQuery({ text: "حدث خطأ مؤقت" }).catch(() => {});
        }
    });
};
