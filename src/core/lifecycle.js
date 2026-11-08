/**
 * ╔══════════════════════════════════════╗
 * ║             AYLA LIFECYCLE             ║
 * ║                 v2.4                 ║
 * ╚══════════════════════════════════════╝
 *
 * التشغيل:
 * 1. انتظار النسخة السابقة.
 * 2. الاتصال بقاعدة البيانات.
 * 3. تحميل نظام الزواج.
 * 4. تحميل الأوامر والمستمعات.
 * 5. تشغيل البوت.
 *
 * الإغلاق:
 * 1. منع تكرار عملية الإغلاق.
 * 2. إيقاف استقبال التحديثات.
 * 3. حفظ بيانات الزواج.
 * 4. حفظ بيانات اللاعبين والمجموعات.
 * 5. إغلاق قاعدة البيانات.
 */

const store = require("./store");
const marriage = require("./marriage");
const { loadAll } = require("./loader");

function run(bot, dbUrl) {
    let closing = false;
    let started = false;

    async function shutdown(code = 0) {
        if (closing) return;

        closing = true;

        console.log("[AYLA] جارٍ إيقاف البوت وحفظ البيانات...");

        if (started) {
            try {
                await bot.stop();
            } catch (e) {
                console.error(
                    "[AYLA] ملاحظة أثناء إيقاف البوت:",
                    e.message
                );
            }
        }

        try {
            await marriage.saveNow();
            console.log("[AYLA] تم حفظ بيانات الزواج.");
        } catch (e) {
            console.error(
                "[AYLA] فشل حفظ الزواج:",
                e.message
            );

            code = 1;
        }

        try {
            await store.shutdown();
            console.log("[AYLA] تم إغلاق قاعدة البيانات.");
        } catch (e) {
            console.error(
                "[AYLA] فشل إغلاق قاعدة البيانات:",
                e.message
            );

            code = 1;
        }

        process.exit(code);
    }

    process.once("SIGTERM", () => shutdown(0));
    process.once("SIGINT", () => shutdown(0));

    process.on("unhandledRejection", error => {
        console.error(
            "[AYLA] unhandledRejection:",
            error && (error.stack || error.message || error)
        );
    });

    process.on("uncaughtException", error => {
        console.error(
            "[AYLA] uncaughtException:",
            error && (error.stack || error.message || error)
        );

        shutdown(1);
    });

    async function start() {
        const wait = Math.max(
            0,
            Number(process.env.STARTUP_WAIT_SECONDS || 15)
        );

        if (wait > 0) {
            console.log(
                "[AYLA] انتظار " + wait +
                " ثانية لتسليم النسخة السابقة..."
            );

            await new Promise(resolve =>
                setTimeout(resolve, wait * 1000)
            );
        }

        if (closing) return;

        try {
            await store.init(dbUrl);

            console.log("[AYLA] تم الاتصال بقاعدة البيانات.");

            await marriage.init();

            console.log("[AYLA] تم تحميل نظام الزواج.");

            if (closing) return;

            loadAll(bot);

            console.log("[AYLA] تم تحميل الأوامر والمستمعات.");

            if (closing) return;

            await bot.start({
                drop_pending_updates: true,

                onStart: me => {
                    started = true;

                    console.log(
                        "[AYLA] البوت يعمل: @" + me.username
                    );
                }
            });

        } catch (error) {
            console.error(
                "[AYLA] فشل تشغيل البوت:",
                error && (error.stack || error.message || error)
            );

            await shutdown(1);
        }
    }

    start().catch(error => {
        console.error("[AYLA] خطأ تشغيل غير متوقع:", error);
        shutdown(1);
    });
}

module.exports = { run };