
const stats = require("../lib/groupStats");

module.exports = function (bot) {
    bot.on("message", async (ctx, next) => {
        try {
            stats.record(ctx);
        } catch (error) {
            console.error("[STATISTICS]", error.message);
        }

        return next();
    });
};
