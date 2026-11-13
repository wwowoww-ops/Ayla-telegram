// المشغّل المرتبط بالبوت: يرسل ويحدّث رسائل القتال المباشر ولوحات التحكم، وينهي القتال ويعلن النتيجة.
// يُستعمل من handlers/boss.js ومن المؤقت في listeners/06-extras.js (نسخة واحدة لكل بوت).
const B = require("./index");
const BM = require("./menu");
const Live = require("./live");
const Fight = require("./fight");

const isNotModified = e => /not modified/i.test(String(e && (e.description || e.message)));
const log = (tag, e) => console.error(`[BOSS ${tag}]`, e && e.message);

module.exports = function (bot) {
    if (bot._bossDriver) return bot._bossDriver;
    const d = {};
    const edit = (chatId, msgId, scr) => msgId
        ? bot.api.editMessageText(chatId, msgId, scr.text, { parse_mode: "HTML", reply_markup: scr.kb }).catch(e => { if (!isNotModified(e)) log("EDIT", e); })
        : Promise.resolve();

    d.editMain = async chatId => {
        const b = B.get(chatId);
        if (b && b.msg) await edit(chatId, b.msg, BM.screenBoss(chatId, Date.now()));
    };

    d.sendResult = async (chatId, res) => {
        await bot.api.sendMessage(chatId, BM.resultText(res), { parse_mode: "HTML", reply_markup: res.canceled ? undefined : BM.resultKb() });
        await d.editMain(chatId);
    };

    // يبدأ القتال المباشر: رسالة القتال + لوحة لكل لاعب يدوي
    d.startLive = async (chatId, res) => {
        const now = Date.now();
        const s = Live.begin(chatId, res.parts, res.boss, now);
        const scr = BM.screenLive(s, now);
        const m = await bot.api.sendMessage(chatId, "⚔️ <b>بدأ القتال!</b>\n\n" + scr.text, { parse_mode: "HTML" });
        s.msg = m.message_id;
        for (const uid of Live.manualUids(s)) {
            const ps = BM.screenPanel(s, uid, now);
            try {
                const pm = await bot.api.sendMessage(chatId, ps.text, { parse_mode: "HTML", reply_markup: ps.kb, reply_to_message_id: s.msg });
                s.panels[uid] = pm.message_id;
            } catch (e) { log("PANEL", e); }
        }
        await d.editMain(chatId);
    };

    d.refreshLive = async chatId => {
        const s = Live.get(chatId);
        if (s) await edit(chatId, s.msg, BM.screenLive(s, Date.now()));
    };

    // ينفّذ الجولة القادمة (عند تأكيد الجميع أو انتهاء المهلة)
    d.advance = async chatId => {
        const s = Live.get(chatId);
        if (!s || s.busy) return;
        s.busy = true;
        try {
            const now = Date.now();
            const r = Live.run(s, now);
            if (r.done) {
                const res = B.finalize(chatId, s.parts, Fight.report(s.st), now);
                Live.end(chatId);
                await edit(chatId, s.msg, BM.screenLive(s, now, true));
                for (const mid of Object.values(s.panels)) await bot.api.deleteMessage(chatId, mid).catch(() => {});
                if (res && res.ok) await d.sendResult(chatId, res);
            } else {
                await edit(chatId, s.msg, BM.screenLive(s, now));
                for (const uid of Live.manualUids(s)) await edit(chatId, s.panels[uid], BM.screenPanel(s, uid, now));
            }
        } catch (e) { log("ADVANCE", e); }
        finally { s.busy = false; }
    };

    // إعلان نتيجة begin/start (من الزر أو المؤقت)
    d.announce = async (chatId, res) => {
        if (!res || !res.ok) return;
        if (res.live) return d.startLive(chatId, res);
        return d.sendResult(chatId, res);
    };

    d.tick = async now => {
        for (const id of Live.dueChats(now)) await d.advance(id);
    };

    bot._bossDriver = d;
    return d;
};