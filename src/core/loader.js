// يحمّل كل ملفات المجلدات التالية تلقائيًا، بهذا الترتيب.
// listeners أولًا لأنها تعترض الرسائل قبل الأوامر.
// لإضافة ميزة جديدة: ضع ملفًا في المجلد المناسب يصدّر دالة تستقبل bot.
// ولإضافة نوع جديد من المجلدات: أضف اسمه في FOLDERS.
const fs = require("fs");
const path = require("path");

const FOLDERS = ["listeners", "handlers", "commands"];
const SRC = path.join(__dirname, "..");

function loadAll(bot) {
    let count = 0;
    for (const folder of FOLDERS) {
        const dir = path.join(SRC, folder);
        let files = [];
        try { files = fs.readdirSync(dir).filter(f => f.endsWith(".js")).sort(); }
        catch (e) { continue; }   // المجلد غير موجود، لا مشكلة

        for (const file of files) {
            const name = folder + "/" + file;
            try {
                const register = require(path.join(dir, file));
                if (typeof register !== "function") {
                    console.error("[loader] " + name + " لا يصدّر دالة، تم تجاهله");
                    continue;
                }
                register(bot);
                count++;
            } catch (e) {
                // ملف معطوب لا يوقف بقية البوت
                console.error("[loader] فشل تحميل " + name + ":", e && e.message);
            }
        }
    }
    console.log("[loader] تم تحميل " + count + " ملف");
}

module.exports = { loadAll };