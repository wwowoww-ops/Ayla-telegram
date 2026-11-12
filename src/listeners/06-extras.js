// يحمّل الإنجازات الصعبة، ويشغّل مؤقت بدء قتال البوس عند انتهاء مهلة التسجيل وإعلان نتيجته
const B = require("../game/boss");
const BM = require("../game/bossMenu");

module.exports = function (bot) {
    require("../game/achievementsHard").install();

    let loaded = false;
    const timer = setInterval(async () => {
        try {
            if (!loaded) { loaded = true; await B.loadActive(); }
            await B.tickAll(Date.now(), async (chatId, res) => {
                await bot.api.sendMessage(chatId, BM.resultText(res), { parse_mode: "HTML", reply_markup: res.canceled ? undefined : BM.resultKb() });
                // تحديث الرسالة الرئيسية للبوس (كانت تعرض التسجيل)
                const b = B.get(chatId), scr = BM.screenBoss(chatId, Date.now());
                if (b && b.msg) await bot.api.editMessageText(chatId, b.msg, scr.text, { parse_mode: "HTML", reply_markup: scr.kb }).catch(() => {});
            });
        } catch (e) { console.error("[BOSS TICK]", e && e.message); }
    }, 30 * 1000);
    if (timer.unref) timer.unref();
};