// ترحيل اللاعبين القدامى إلى نظام الموارد (مرة واحدة لكل لاعب) عند أول نشاط له
const store = require("../core/store");
const Res = require("../game/resources");

module.exports = function (bot) {
    bot.use(async (ctx, next) => {
        const user = ctx.from;
        const P = user && !user.is_bot ? store.get(user.id) : null;
        if (P) {
            try { if (Res.migrate(P)) store.touch(P.id); }
            catch (e) { console.error("[MIGRATE]", e && e.message); }
        }
        return next();
    });
};
