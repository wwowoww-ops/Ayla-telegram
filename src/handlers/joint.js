// أزرار التزاوج المشترك: مبادر ← شروط ← عرض للطرف الآخر ← اختيار حيوانه ← تنفيذ
const store = require("../core/store");
const E = require("../game/engine");
const J = require("../game/joint");
const JM = require("../game/joint-menu");

module.exports = function (bot) {
    bot.callbackQuery(/^jb:(\d+):(\w+)(?::(\d+|\w))?$/, async ctx => {
        try {
            const o = J.get(ctx.match[1]), act = ctx.match[2], arg = ctx.match[3], now = Date.now();
            if (!o) { await ctx.answerCallbackQuery({ text: "انتهى هذا العرض.", show_alert: true }); return await ctx.editMessageText("⌛ انتهى عرض التزاوج المشترك.").catch(() => {}); }
            const uid = String(ctx.from.id);
            const owner = { a: o.from, b: o.to };
            // من يحق له كل خطوة
            const allowed = o.stage === "offer" ? [o.to, o.from] : [o.stage === "pickB" ? o.to : o.from];
            if (!allowed.includes(uid)) return await ctx.answerCallbackQuery({ text: "ليس دورك.", show_alert: true });
            const show = async (page) => {
                const s = JM.screen(o, page || 0, now);
                await ctx.editMessageText(s.text, { parse_mode: "HTML", reply_markup: s.kb }).catch(e => { if (!/not modified/i.test(String(e && (e.description || e.message)))) throw e; });
            };
            const deny = t => ctx.answerCallbackQuery({ text: t, show_alert: true });

            if (act === "x") { J.end(o.id); await ctx.answerCallbackQuery({ text: "أُلغي." }); return await ctx.editMessageText("🚫 أُلغي التزاوج المشترك.").catch(() => {}); }
            if (act === "pgpa" || act === "pgpb") { await ctx.answerCallbackQuery(); return await show(Number(arg)); }
            if (act === "pa" && o.stage === "pet") {
                const P = store.get(o.from), p = E.getPet(P, arg);
                if (!p || !J.eligible(P, now).includes(p)) return await deny("حيوان غير مؤهل.");
                o.aPet = p.id; o.stage = "egg";
            } else if (act === "eg" && o.stage === "egg") { o.eggTo = arg === "a" || arg === "b" ? arg : "f"; o.stage = "cost"; }
            else if (act === "cm" && o.stage === "cost") { o.costMode = ["a", "b"].includes(arg) ? arg : "s"; o.stage = "offer"; o.at = now; }
            else if (act === "ac" && o.stage === "offer") {
                if (uid !== o.to) return await deny("القبول للطرف الآخر فقط.");
                o.stage = "pickB";
            } else if (act === "pb" && o.stage === "pickB") {
                const P = store.get(o.to), p = E.getPet(P, arg);
                if (!p || !J.eligible(P, now).includes(p)) return await deny("حيوان غير مؤهل.");
                o.bPet = p.id;
                const r = J.execute(o, now);
                if (!r.ok) return await deny(r.msg);
                const W = r.winner;
                await ctx.answerCallbackQuery({ text: "🎉 تم!" });
                const esc = x => String(x).replace(/[&<>]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
                const price = r.c.total ? `\n💰 ${r.c.a ? esc(o.fromName) + ": " + E.fmt(r.c.a) + " " : ""}${r.c.b ? esc(o.toName) + ": " + E.fmt(r.c.b) : ""} 🪙` : "";
                const wn = String(W.id) === o.from ? o.fromName : o.toName;
                return await ctx.editMessageText(`🥚 <b>تم التزاوج المشترك!</b>\n${JM.pl(r.a)} ⟷ ${JM.pl(r.b)}${price}\n🎁 البيضة ذهبت إلى <b>${esc(wn)}</b>${r.mutated ? " ✨ (طفرة!)" : ""} (في محفظته 🎒)`, { parse_mode: "HTML" }).catch(() => {});
            } else return await deny("خطوة غير صالحة.");
            await ctx.answerCallbackQuery();
            await show(0);
        } catch (e) {
            console.error("[JOINT ERROR]", e && (e.stack || e.message));
            await ctx.answerCallbackQuery({ text: "حدث خطأ مؤقت" }).catch(() => {});
        }
    });
};
