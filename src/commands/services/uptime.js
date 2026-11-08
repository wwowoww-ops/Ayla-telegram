/**
 * ╔══════════════════════════════════════╗
 * ║              AYLA SERVICES            ║
 * ║                 v1.1                 ║
 * ╚══════════════════════════════════════╝
 */

// معلومات تشغيل البوت والاستضافة

const os = require("os");
const { cmd } = require("../../lib/util");
const store = require("../../core/store");

const DEVELOPER = "أبو هريرة";
const BOT_NAME = "AYLA";

function number(value) {
    return new Intl.NumberFormat("en-US", {
        maximumFractionDigits: 2
    }).format(value);
}

function size(bytes) {
    if (!Number.isFinite(bytes))
        return "غير متاح";

    return number(bytes / (1024 * 1024)) + " MB";
}

function formatUptime(seconds) {
    seconds = Math.floor(seconds);

    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    const parts = [];

    if (days) parts.push(days + " يوم");
    if (hours) parts.push(hours + " ساعة");
    if (minutes) parts.push(minutes + " دقيقة");

    parts.push(secs + " ثانية");

    return parts.join(" و ");
}

function hosting() {
    if (process.env.RAILWAY_PROJECT_ID)
        return "Railway";

    if (process.env.RENDER)
        return "Render";

    if (process.env.HEROKU_APP_NAME)
        return "Heroku";

    return "غير محددة";
}

// قراءة عدد اللاعبين المسجلين
function getUserCount() {
    try {
        const users = store.all();

        if (users instanceof Map)
            return users.size;

        if (Array.isArray(users))
            return users.length;

        if (users && typeof users === "object")
            return Object.keys(users).length;

        return null;
    } catch (error) {
        console.error("[UPTIME USERS]", error.message);
        return null;
    }
}

// معلومات قاعدة البيانات
async function getDatabase() {
    try {
        if (typeof store.databaseInfo !== "function")
            return null;

        return await store.databaseInfo();
    } catch (error) {
        console.error("[UPTIME DATABASE]", error.message);
        return null;
    }
}

module.exports = function (bot) {

    cmd(bot,
        ["ابتايم", "uptime"],
        async ctx => {

            const memory = process.memoryUsage();
            const uptime = formatUptime(process.uptime());

            const userCount = getUserCount();

            let db = null;

            try {
                db = await getDatabase();
            } catch {
                db = null;
            }

            const dbStatus = db
                ? "🟢 متصل"
                : "🔴 غير متاح";

            const dbSize = db?.size || "غير متاح";

            const dbConnections =
                Number.isFinite(db?.connections)
                    ? number(db.connections)
                    : "غير متاح";

            const usersText =
                userCount === null
                    ? "غير متاح"
                    : number(userCount);

            const text =
                "❀ ━━ 𝗔𝗬𝗟𝗔 〢 𝗨𝗣𝗧𝗜𝗠𝗘 ━━ ❀\n\n" +

                "🤖 معلومات البوت\n" +
                `✿ الاسم: ${BOT_NAME}\n` +
                `✿ المطوّر: ${DEVELOPER}\n` +
                `✿ مدة التشغيل: ${uptime}\n` +
                `✿ الاستضافة: ${hosting()}\n` +
                `✿ Node.js: ${process.version}\n\n` +

                "📊 موارد العملية\n" +
                `✿ RAM: ${size(memory.rss)}\n` +
                `✿ Heap المستخدم: ${size(memory.heapUsed)}\n` +
                `✿ Heap الإجمالي: ${size(memory.heapTotal)}\n\n` +

                "🗄 قاعدة البيانات\n" +
                `✿ الحالة: ${dbStatus}\n` +
                `✿ الحجم: ${dbSize}\n` +
                `✿ الاتصالات: ${dbConnections}\n\n` +

                "👥 مستخدمو لعبة الحيوان\n" +
                `✿ العدد: ${usersText}\n\n` +

                "❀ ━━━━━━━━━━━━━ ❀";

            return ctx.reply(text);
        },
        {
            menu: "ابتـايم",
            category: "services"
        }
    );
};