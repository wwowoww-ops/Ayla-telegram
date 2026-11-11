// يطبّق ضريبة الثروة اليومية عند أي نشاط للاعب في البوت
const store = require("../core/store");
const W = require("../game/wealth");

module.exports = function (bot) {
    bot.use(async (ctx, next) => {
        const user = ctx.from;
        const P = user && !user.is_bot ? store.get(user.id) : null;
        if (P) {
            try {
                if (W.apply(P, Date.now()) > 0) store.touch(P.id);
            } catch (e) { console.error("[WEALTH]", e && e.message); }
        }
        return next();
    });
};