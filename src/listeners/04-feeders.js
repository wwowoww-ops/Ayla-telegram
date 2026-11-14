// يطعم الحيوانات تلقائيًا من أوعية الأكل عند أي نشاط للاعب، ويرحّل فواكه العناصر القديمة إلى جواهر (مرة واحدة)
const store = require("../core/store");
const F = require("../game/feeders");
const Res = require("../game/resources");

module.exports = function (bot) {
    bot.use(async (ctx, next) => {
        const user = ctx.from;
        const P = user && !user.is_bot ? store.get(user.id) : null;
        if (P) {
            try {
                const m = Res.migrate(P);
                const r = F.tick(P, Date.now());
                if (r.meals || m) store.touch(P.id);
            } catch (e) { console.error("[FEEDERS]", e && e.message); }
        }
        return next();
    });
};
