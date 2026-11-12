// أزرار البوس الجماعي (v2): استدعاء، تسجيل، اختيار الحيوانات، بدء القتال، التفاصيل
const store = require("../core/store");
const B = require("../game/boss");
const BM = require("../game/bossMenu");

const isNotModified = e => /not modified/i.test(String(e && (e.description || e.message)));
const opts = scr => ({ parse_mode: "HTML", reply_markup: scr.kb });
const nameOf = u => [u.first_name, u.last_name].filter(Boolean).join(" ") || u.username || "لاعب";

module.exports = function (bot) {
    // تحديث الرسالة الرئيسية للبوس (المحفوظ رقمها عند الاستدعاء)
    async function editMain(chatId, note) {
        const b = B.get(chatId);
        if (!b || !b.msg) return;
        const scr = BM.screenBoss(chatId, Date.now(), note);
        await bot.api.editMessageText(chatId, b.msg, scr.text, opts(scr)).catch(e => { if (!isNotModified(e)) console.error("[BOSS EDIT]", e && e.message); });
    }
    // بدء القتال وإعلان النتيجة
    async function runFight(ctx, chatId) {
        const res = B.start(chatId, Date.now());
        if (!res.ok) return res;
        await bot.api.sendMessage(chatId, BM.resultText(res), { parse_mode: "HTML", reply_markup: res.canceled ? undefined : BM.resultKb() });
        await editMain(chatId);
        return res;
    }

    bot.callbackQuery(/^bs:(spawn|reg|go|ref|det|pk|pg|rd|nr|lv|cl)(?::(\d+))?(?::(\d+))?(?::(\d+))?$/, async ctx => {
        try {
            const chat = ctx.chat;
            if (!chat || chat.type === "private") return await ctx.answerCallbackQuery({ text: "داخل المجموعات فقط." });
            const act = ctx.match[1], now = Date.now(), cid = chat.id;
            const edit = scr => ctx.editMessageText(scr.text, opts(scr)).catch(e => { if (!isNotModified(e)) throw e; });

            if (act === "ref") { await ctx.answerCallbackQuery(); return await edit(BM.screenBoss(cid, now)); }
            if (act === "det") { await ctx.answerCallbackQuery(); return await edit(BM.screenDetails(cid, ctx.match[2])); }

            // أزرار الاختيار: لصاحبها فقط (المعرّف في الزر)
            if (["pk", "pg", "rd", "nr", "lv", "cl"].includes(act)) {
                const uid = ctx.match[2];
                if (String(ctx.from.id) !== uid) return await ctx.answerCallbackQuery({ text: "هذه القائمة ليست لك.", show_alert: true });
                const P = store.get(uid);
                if (!P) return await ctx.answerCallbackQuery({ text: "اكتب: حيواني لتبدأ", show_alert: true });
                if (act === "cl") { await ctx.answerCallbackQuery(); return await ctx.deleteMessage().catch(() => {}); }
                if (act === "lv") {
                    const r = B.leave(cid, uid);
                    await ctx.answerCallbackQuery({ text: r.ok ? "انسحبت من القتال." : r.msg });
                    await ctx.deleteMessage().catch(() => {});
                    return await editMain(cid);
                }
                let note = "", page = 0, r;
                if (act === "pk") { page = Number(ctx.match[4]); r = B.toggle(cid, P, ctx.match[3]); }
                else if (act === "pg") { page = Number(ctx.match[3]); }
                else { page = Number(ctx.match[3]); r = B.setReady(cid, uid, act === "rd"); }
                if (r && !r.ok) { await ctx.answerCallbackQuery({ text: r.msg, show_alert: true }); return; }
                await ctx.answerCallbackQuery(act === "rd" ? { text: "✅ أنت جاهز" } : undefined);
                await edit(BM.screenPick(P, cid, page, note));
                if (act === "rd" || act === "nr" || act === "pk") await editMain(cid);
                if (act === "rd" && r.all) await runFight(ctx, cid);
                return;
            }

            const P = store.get(ctx.from.id);
            if (!P) return await ctx.answerCallbackQuery({ text: "اكتب: حيواني لتبدأ اللعبة", show_alert: true });
            const name = nameOf(ctx.from);

            if (act === "spawn") {
                const r = B.spawn(cid, now, ctx.from.id, name);
                if (!r.ok) { await ctx.answerCallbackQuery({ text: r.msg, show_alert: true }); return await edit(BM.screenBoss(cid, now)); }
                r.boss.msg = ctx.callbackQuery.message.message_id;
                store.setGroup(cid, { boss: r.boss });
                await ctx.answerCallbackQuery({ text: "🔥 ظهر الزعيم! سجّل الآن" });
                return await edit(BM.screenBoss(cid, now, "🔥 <b>ظهر زعيم جديد! سجّلوا فرقكم.</b>"));
            }

            if (act === "reg") {
                const r = B.join(cid, P, name, now);
                if (!r.ok) return await ctx.answerCallbackQuery({ text: r.msg, show_alert: true });
                await ctx.answerCallbackQuery({ text: "📝 اختر فريقك في الرسالة الجديدة" });
                const scr = BM.screenPick(P, cid, 0);
                await ctx.reply(`👤 ${BM.esc(name)}\n` + scr.text, { parse_mode: "HTML", reply_markup: scr.kb, reply_to_message_id: ctx.callbackQuery.message.message_id });
                return await editMain(cid);
            }

            if (act === "go") {
                const b = B.get(cid);
                if (!B.open(b)) return await ctx.answerCallbackQuery({ text: "لا يوجد تسجيل مفتوح.", show_alert: true });
                if (String(b.by) !== String(ctx.from.id)) return await ctx.answerCallbackQuery({ text: "يبدأ القتال من استدعى الزعيم (" + (b.byName || "؟") + ") أو ينتظر الوقت.", show_alert: true });
                if (!Object.keys(b.reg).length) return await ctx.answerCallbackQuery({ text: "لم يسجّل أحد بعد.", show_alert: true });
                await ctx.answerCallbackQuery({ text: "⚔️ بدأ القتال!" });
                return await runFight(ctx, cid);
            }
        } catch (e) {
            console.error("[BOSS CALLBACK ERROR]", e && (e.stack || e.message));
            await ctx.answerCallbackQuery({ text: "حدث خطأ مؤقت" }).catch(() => {});
        }
    });
};