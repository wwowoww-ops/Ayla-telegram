// إشعار خاص عندما يصبح بيض اللاعب جاهزًا للفقس (يُعطَّل بالأمر .اشعارات)
const store = require("../core/store");
const X = require("../game/extras");

module.exports = function (bot) {
    let busy = false;
    const tick = async () => {
        if (busy) return;
        busy = true;
        try {
            const list = X.readyEggs(store.all(), Date.now());
            for (const r of list) {
                store.touch(r.P.id);
                await bot.api.sendMessage(r.uid, "🥚 جاهزة للفقس!\n" + (r.n > 1 ? "عندك " + r.n + " بيضات" : "بيضتك") + " جاهزة. افتح 🥚 الحضانة أو اكتب «حيواني».\n(لإيقاف الإشعارات اكتب: اشعارات)").catch(() => {});
                await new Promise(res => setTimeout(res, 400));
            }
        } catch (e) { console.error("[EGG NOTIFY]", e && e.message); }
        busy = false;
    };
    setTimeout(tick, 20000); setInterval(tick, 60000);
};
