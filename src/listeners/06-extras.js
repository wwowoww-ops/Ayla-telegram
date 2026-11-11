// يحمّل الإنجازات الصعبة، ويشغّل مؤقت إنهاء الزعماء وإعلان نتائجهم في المجموعات
const B = require("../game/boss");
const BM = require("../game/bossMenu");

module.exports = function (bot) {
    require("../game/achievementsHard").install();

    let loaded = false;
    const timer = setInterval(async () => {
        try {
            if (!loaded) { loaded = true; await B.loadActive(); }
            await B.tickAll(Date.now(), (chatId, res) =>
                bot.api.sendMessage(chatId, BM.resultText(res), { parse_mode: "HTML" }));
        } catch (e) { console.error("[BOSS TICK]", e && e.message); }
    }, 60 * 1000);
    if (timer.unref) timer.unref();
};