
/**
 * ╔══════════════════════════════════════╗
 * ║             AYLA LIFECYCLE             ║
 * ║                 v2.3                 ║
 * ╚══════════════════════════════════════╝
 *
 * تشغيل البوت:
 * 1. انتظار النسخة السابقة.
 * 2. الاتصال بقاعدة البيانات.
 * 3. تحميل نظام الزواج.
 * 4. تحميل الأوامر والمستمعات.
 * 5. تشغيل البوت.
 *
 * الإغلاق:
 * 1. إيقاف استقبال التحديثات.
 * 2. حفظ بيانات الزواج.
 * 3. حفظ اللاعبين والمجموعات.
 * 4. إغلاق اتصال قاعدة البيانات.
 */

const store = require("./store");
const marriage = require("./marriage");
const { loadAll } = require("./loader");

function run(bot, dbUrl) {
    let closing = false;

    async function shutdown(code) {
        if (closing) return;
        closing = true;

        console.log("[AYLA] جارٍ إيقاف البوت وحفظ البيانات...");

        try {
            await bot.stop();
        } catch (e) {
            // قد يكون البوت متوقفًا بالفعل
        }

        try {
            await marriage.saveNow();
            console.log("[AYLA] تم حفظ بيانات الزواج.");
        } catch (e) {
            console.error("[AYLA] فشل حفظ الزواج:", e.message);
        }

        try {
            await store.shutdown();
        } catch (e) {
            console.error("[AYLA] فشل إغلاق قاعدة البيانات:", e.message);
        }

        process.exit(code);
    }

    process.once("SIGTERM", () => shutdown(0));
    process.once("SIGINT", () => shutdown(0));

    process.on("unhandledRejection", e => {
        console.error(
            "[unhandled]",
            e && (e.stack || e.message || e)
        );
    });

    process.on("uncaughtException", e => {
        console.error(
            "[uncaught]",
            e && (e.stack || e.message || e)
        );

        shutdown(1);
    });

    (async () => {
        const wait = Math.max(
            0,
            Number(process.env.STARTUP_WAIT_SECONDS || 15)
        );

        if (wait > 0) {
            console.log(
                "انتظار " + wait +
                " ثانية لتسليم النسخة السابقة..."
            );

            await new Promise(resolve =>
                setTimeout(resolve, wait * 1000)
            );
        }

        try {
            await store.init(dbUrl);

            console.log("[AYLA] تم الاتصال بقاعدة البيانات.");

            await marriage.init();

            console.log("[AYLA] تم تحميل نظام الزواج.");

        } catch (e) {
            console.error(
                "[AYLA] تعذر تجهيز قاعدة البيانات:",
                e && (e.stack || e.message)
            );

            process.exit(1);
            return;
        }

        loadAll(bot);

        try {
            await bot.start({
                drop_pending_updates: true,
                onStart: me => {
                    console.log(
                        "البوت يعمل: @" + me.username
                    );
                }
            });
        } catch (e) {
            console.error(
                "[AYLA] فشل تشغيل البوت:",
                e && (e.stack || e.message)
            );

            await shutdown(1);
        }
    })();
}

module.exports = { run };
