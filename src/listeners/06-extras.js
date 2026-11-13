// يحمّل الإنجازات الصعبة، ويشغّل مؤقت بدء قتال البوس عند انتهاء مهلة التسجيل وإعلان نتيجته
const B = require("../game/boss");
const Live = require("../game/bossLive");

module.exports = function (bot) {
    require("../game/achievementsHard").install();

    const driver = require("../game/bossDriver")(bot);
    let loaded = false;
    // كل 5 ثوانٍ: يبدأ البوس عند انتهاء التسجيل، ويكمل جولات القتال المباشر عند انتهاء مهلتها
    const timer = setInterval(async () => {
        try {
            if (!loaded) { loaded = true; await B.loadActive(); }
            await B.tickAll(Date.now(), (chatId, res) => driver.announce(chatId, res), id => Live.has(id));
            await driver.tick(Date.now());
        } catch (e) { console.error("[BOSS TICK]", e && e.message); }
    }, 5 * 1000);
    if (timer.unref) timer.unref();
};