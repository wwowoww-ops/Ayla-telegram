// يشغّل خادم التطبيق المصغّر داخل البوت (على المنفذ الذي تحدده Railway)
const { createServer } = require("../web/server");
const config = require("../web/config");

module.exports = function (bot) {
    const port = Number(process.env.PORT || 3000);
    const domain = process.env.RAILWAY_PUBLIC_DOMAIN;
    config.url = process.env.WEBAPP_URL || (domain ? "https://" + domain : null);

    const server = createServer(bot.token);
    server.on("error", e => console.error("[WEBAPP] تعذر تشغيل الخادم:", e.message));
    server.listen(port, "0.0.0.0", () => console.log("[WEBAPP] يعمل على المنفذ " + port + (config.url ? " — " + config.url : " (لا يوجد رابط عام بعد)")));

    // زر القائمة بجانب خانة الكتابة في المحادثات الخاصة
    if (config.url) {
        bot.api.setChatMenuButton({ menu_button: { type: "web_app", text: "🎮 العب", web_app: { url: config.url } } })
            .catch(e => console.error("[WEBAPP] زر القائمة:", e.message));
    }
};