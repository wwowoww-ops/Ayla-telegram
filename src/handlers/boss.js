// أزرار البوس الجماعي (v3): استدعاء، تسجيل، اختيار الحيوانات والنمط، بدء القتال، لوحة القتال اليدوي، التفاصيل
const store = require("../core/store");
const B = require("../game/boss");
const BM = require("../game/boss/menu");
const Live = require("../game/boss/live");

const isNotModified = e => /not modified/i.test(String(e && (e.description || e.message)));
const opts = scr => ({ parse_mode: "HTML", reply_markup: scr.kb });
const nameOf = u => [u.first_name, u.last_name].filter(Boolean).join(" ") || u.username || "لاعب";

module.exports = function (bot) {
    const driver = require("../game/boss/driver")(bot);
    const editMain = chatId => driver.editMain(chatId);
    // بدء القتال وإعلانه (أوتو فوري أو مباشر)
    async function runFight(ctx, chatId) {
        const res = B.begin(chatId, Date.now());
        if (!res.ok) return res;
        await driver.announce(chatId, res);
        return res;
    }

    bot.callbackQuery(/^bs:(spawn|reg|go|ref|det|pk|pg|rd|nr|lv|cl|md|cm|ok|sp|sn|gl|gd|bo)(?::(\d+))?(?::(\d+))?(?::(\d+))?$/, async ctx => {
        try {
            const chat = ctx.chat;
            if (!chat) return;
            const act = ctx.match[1], now = Date.now();
            let cid = chat.id;
            // في الخاص: فريقك يُرتَّب هنا، والمجموعة هي آخر مجموعة سجّلت فيها
            if (chat.type === "private") {
                const Pp = store.get(ctx.from.id);
                if (!Pp || !Pp.bossChat || !["pk", "pg", "rd", "nr", "lv", "cl", "md", "bo"].includes(act)) return await ctx.answerCallbackQuery({ text: "هذا الزر يعمل داخل المجموعة.", show_alert: true });
                cid = Pp.bossChat;
            }
            const edit = scr => ctx.editMessageText(scr.text, opts(scr)).catch(e => { if (!isNotModified(e)) throw e; });

            if (act === "ref") { await ctx.answerCallbackQuery(); return await edit(BM.screenBoss(cid, now)); }
            if (act === "det") { await ctx.answerCallbackQuery(); return await edit(BM.screenDetails(cid, ctx.match[2])); }

            // لوحة القتال المباشر: لصاحبها فقط
            if (act === "cm" || act === "ok") {
                const uid = ctx.match[2];
                if (String(ctx.from.id) !== uid) return await ctx.answerCallbackQuery({ text: "هذه اللوحة ليست لك.", show_alert: true });
                const s = Live.get(cid);
                if (!s) { await ctx.answerCallbackQuery({ text: "انتهى القتال.", show_alert: true }); return await ctx.deleteMessage().catch(() => {}); }
                if (act === "cm") {
                    const r = Live.setCmd(s, uid, Number(ctx.match[3]), Number(ctx.match[4]));
                    if (!r.ok) return await ctx.answerCallbackQuery({ text: r.msg, show_alert: true });
                    await ctx.answerCallbackQuery();
                    return await edit(BM.screenPanel(s, uid, now));
                }
                const r = Live.confirm(s, uid);
                if (!r.ok) return await ctx.answerCallbackQuery({ text: r.msg, show_alert: true });
                await ctx.answerCallbackQuery({ text: "✅ تم التأكيد" });
                await edit(BM.screenPanel(s, uid, now));
                if (r.all) return await driver.advance(cid);
                return await driver.refreshLive(cid);
            }

            // أزرار الاختيار: لصاحبها فقط (المعرّف في الزر)
            if (["pk", "pg", "rd", "nr", "lv", "cl", "md", "bo"].includes(act)) {
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
                else if (act === "bo") { page = Number(ctx.match[3]); r = B.boost(cid, P); if (r.ok) { store.touch(P.id); note = r.msg; } }
                else if (act === "md") { page = Number(ctx.match[3]); const cur = B.get(cid); const rr = B.open(cur) && cur.reg[uid]; r = B.setMode(cid, uid, rr && rr.mode === "manual" ? "auto" : "manual"); }
                else { page = Number(ctx.match[3]); r = B.setReady(cid, uid, act === "rd"); }
                if (r && !r.ok) { await ctx.answerCallbackQuery({ text: r.msg, show_alert: true }); return; }
                await ctx.answerCallbackQuery(act === "rd" ? { text: "✅ أنت جاهز" } : undefined);
                await edit(BM.screenPick(P, cid, page, note));
                if (act === "rd" || act === "nr" || act === "pk" || act === "md") await editMain(cid);
                if (act === "rd" && r.all) await runFight(ctx, cid);
                return;
            }

            const P = store.get(ctx.from.id);
            if (!P) return await ctx.answerCallbackQuery({ text: "اكتب: حيواني لتبدأ اللعبة", show_alert: true });
            const name = nameOf(ctx.from);

            if (act === "sp") {
                const r = B.speedUp(cid, P, now);
                await ctx.answerCallbackQuery({ text: r.msg, show_alert: !r.ok });
                if (r.ok) store.touch(P.id);
                return await edit(BM.screenBoss(cid, now, r.ok ? r.msg : ""));
            }
            if (act === "gl") { await ctx.answerCallbackQuery(); return await edit(BM.screenGuided(cid)); }
            if (act === "sn" || act === "gd") {
                const kindId = act === "gd" ? (B.KINDS[Number(ctx.match[2])] || {}).id : undefined;
                const r = B.summonNow(cid, P, now, name, kindId);
                if (!r.ok) { await ctx.answerCallbackQuery({ text: r.msg, show_alert: true }); return; }
                store.touch(P.id);
                r.boss.msg = ctx.callbackQuery.message.message_id;
                store.setGroup(cid, { boss: r.boss });
                await ctx.answerCallbackQuery({ text: "🔥 ظهر الزعيم!" });
                return await edit(BM.screenBoss(cid, now, "🔥 <b>" + BM.esc(name) + "</b> استدعى الزعيم بالموارد! سجّلوا فرقكم."));
            }

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
                await ctx.answerCallbackQuery({ text: "📝 راجع رسالتك الخاصة لترتيب فريقك" });
                const scr = BM.screenPick(P, cid, 0);
                P.bossChat = cid; store.touch(P.id);
                const dm = `👑 <b>استعد للزعيم!</b> (${BM.esc(chat.title || "المجموعة")})\nرتّب حيواناتك هنا بهدوء بدل الزحمة في المجموعة.\n\n` + scr.text;
                try {
                    await bot.api.sendMessage(ctx.from.id, dm, { parse_mode: "HTML", reply_markup: scr.kb });
                    await ctx.reply(`📨 ${BM.esc(name)} أرسلتُ لك رسالة خاصة لترتيب فريقك واستعدادك.`, { parse_mode: "HTML", reply_to_message_id: ctx.callbackQuery.message.message_id });
                } catch (e) {
                    await ctx.reply(`⚠️ ${BM.esc(name)} لم أستطع مراسلتك في الخاص (ابدأ محادثة معي أولًا). رتّب فريقك هنا:\n` + scr.text, { parse_mode: "HTML", reply_markup: scr.kb, reply_to_message_id: ctx.callbackQuery.message.message_id });
                }
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