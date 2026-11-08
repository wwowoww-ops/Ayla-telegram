// تشغيل البوت وإيقافه: انتظار، اتصال بالقاعدة، تحميل الملفات، حفظ عند الإغلاق
const store = require("./store");
const { loadAll } = require("./loader");

function run(bot, dbUrl) {
    let closing = false;

    async function shutdown(code) {
        if (closing) return;
        closing = true;
        try { await bot.stop(); } catch (e) { /* لا شيء */ }
        await store.shutdown();   // حفظ اللاعبين قبل الخروج
        process.exit(code);
    }
    process.once("SIGTERM", () => shutdown(0));
    process.once("SIGINT", () => shutdown(0));
    process.on("unhandledRejection", e => console.error("[unhandled]", e && (e.stack || e.message || e)));
    process.on("uncaughtException", e => { console.error("[uncaught]", e && (e.stack || e.message)); shutdown(1); });

    (async () => {
        // Railway يشغّل النسخة الجديدة قبل إيقاف القديمة. ننتظر لتحفظ القديمة بياناتها أولًا
        const wait = Number(process.env.STARTUP_WAIT_SECONDS || 15);
        if (wait > 0) {
            console.log("انتظار " + wait + " ثانية لتسليم النسخة السابقة...");
            await new Promise(r => setTimeout(r, wait * 1000));
        }
        try {
            await store.init(dbUrl);
        } catch (e) {
            console.error("تعذر الاتصال بقاعدة البيانات:", e && e.message);
            process.exit(1);   // Railway يعيد التشغيل تلقائيًا
        }
        loadAll(bot);
        await bot.start({
            drop_pending_updates: true,
            onStart: me => console.log("البوت يعمل: @" + me.username)
        });
    })();
}

module.exports = { run };