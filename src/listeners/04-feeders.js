// يطعم الحيوانات تلقائيًا من أوعية الأكل عند أي نشاط للاعب (أمر أو ضغطة زر)
const store = require("../core/store");
const F = require("../game/feeders");

module.exports = function (bot) {
    bot.use(async (ctx, next) => {
        const user = ctx.from;
        const P = user && !user.is_bot ? store.get(user.id) : null;
        if (P) {
            try {
                const r = F.tick(P, Date.now());
                if (r.meals) store.touch(P.id);
            } catch (e) { console.error("[FEEDERS]", e && e.message); }
        }
        return next();
    });
};