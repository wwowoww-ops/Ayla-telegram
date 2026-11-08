/**
 * ╔══════════════════════════════════════╗
 * ║              AYLA SERVICES            ║
 * ║                 v1.0                 ║
 * ╚══════════════════════════════════════╝
 */

// معلومات تشغيل البوت والاستضافة

const os = require("os");
const fs = require("fs");
const { cmd, HTML } = require("../../lib/util");
const store = require("../../core/store");

const DEVELOPER = "أبو هريرة";
const BOT_NAME = "AYLA";

// تنسيق الأرقام بالأرقام الإنجليزية
function number(value) {
    return new Intl.NumberFormat("en-US", {
        maximumFractionDigits: 2
    }).format(value);
}

// تحويل الحجم إلى MB أو GB
function size(bytes) {
    if (!Number.isFinite(bytes) || bytes < 0)
        return "غير متاح";

    if (bytes >= 1024 ** 3)
        return number(bytes / (1024 ** 3)) + " GB";

    return number(bytes / (1024 ** 2)) + " MB";
}

// تنسيق مدة التشغيل
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

// معرفة منصة الاستضافة
function hosting() {
    if (process.env.RAILWAY_PROJECT_ID)
        return "Railway";

    if (process.env.RENDER)
        return "Render";

    if (process.env.HEROKU_APP_NAME)
        return "Heroku";

    if (process.env.VERCEL)
        return "Vercel";

    return "غير محددة";
}

// معلومات التخزين
async function diskInfo() {
    try {
        if (typeof fs.promises.statfs !== "function")
            return null;

        const d = await fs.promises.statfs("/");

        const total = d.blocks * d.bsize;
        const free = d.bavail * d.bsize;
        const used = total - (d.bfree * d.bsize);

        return { total, free, used };
    } catch {
        return null;
    }
}

// معلومات قاعدة البيانات
async function databaseInfo() {
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
            const cpu = os.loadavg();
            const disk = await diskInfo();

            let db = null;

            try {
                db = await databaseInfo();
            } catch {
                db = null;
            }

            const dbStatus = db
                ? "🟢 متصل"
                : "🔴 غير متاح";

            const dbSize = db && db.size
                ? db.size
                : "غير متاح";

            const dbConnections = db
                ? number(db.connections)
                : "غير متاح";

            const ram = size(memory.rss);
            const heap = size(memory.heapUsed);
            const heapTotal = size(memory.heapTotal);

            const storage = disk
                ? `${size(disk.used)} مستخدم / ${size(disk.total)} إجمالي`
                : "غير متاح";

            const available = disk
                ? size(disk.free)
                : "غير متاح";

            const uptime = formatUptime(process.uptime());

            const text =
                "❀ ━━ 𝗔𝗬𝗟𝗔 〢 𝗨𝗣𝗧𝗜𝗠𝗘 ━━ ❀\n\n" +

                "🤖 **معلومات البوت**\n" +
                `✿ الاسم: ${BOT_NAME}\n` +
                `✿ المطوّر: ${DEVELOPER}\n` +
                `✿ مدة التشغيل: ${uptime}\n` +
                `✿ الاستضافة: ${hosting()}\n` +
                `✿ Node.js: ${process.version}\n\n` +

                "📊 **موارد النظام**\n" +
                `✿ RAM للعملية: ${ram}\n` +
                `✿ Heap المستخدم: ${heap}\n` +
                `✿ Heap الإجمالي: ${heapTotal}\n` +
                `✿ أنوية المعالج: ${number(os.cpus().length)}\n` +
                `✿ متوسط حمل CPU: ${number(cpu[0])}\n` +
                `✿ التخزين المستخدم: ${storage}\n` +
                `✿ التخزين المتاح: ${available}\n\n` +

                "🗄 **قاعدة البيانات**\n" +
                `✿ الحالة: ${dbStatus}\n` +
                `✿ الحجم: ${dbSize}\n` +
                `✿ الاتصالات: ${dbConnections}\n\n` +

                "👥 **المستخدمون**\n" +
                "✿ العدد: غير متاح حاليًا\n\n" +

                "❀ ━━━━━━━━━━━━━ ❀";

            return ctx.reply(text, {
                parse_mode: "Markdown"
            });
        },
        {
            menu: "ابتـايم",
            category: "services"
        }
    );
};