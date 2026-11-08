
const fs = require("fs");
const path = require("path");

const FOLDERS = ["listeners", "handlers", "commands"];
const SRC = path.join(__dirname, "..");

// قراءة ملفات JavaScript داخل المجلد ومجلداته الفرعية
function getFiles(dir) {
    let entries = [];

    try {
        entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch (error) {
        return [];
    }

    const files = [];

    entries.sort((a, b) => a.name.localeCompare(b.name));

    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
            files.push(...getFiles(fullPath));
        } else if (entry.isFile() && entry.name.endsWith(".js")) {
            files.push(fullPath);
        }
    }

    return files;
}

function loadAll(bot) {
    let count = 0;

    for (const folder of FOLDERS) {
        const dir = path.join(SRC, folder);
        const files = getFiles(dir);

        for (const file of files) {
            const name = path.relative(SRC, file).split(path.sep).join("/");

            try {
                const register = require(file);

                if (typeof register !== "function") {
                    console.error(
                        "[loader] " + name + " لا يصدّر دالة، تم تجاهله"
                    );
                    continue;
                }

                register(bot);
                count++;

                console.log("[loader] تم تحميل " + name);
            } catch (error) {
                console.error(
                    "[loader] فشل تحميل " + name + ":",
                    error.message
                );
            }
        }
    }

    console.log("[loader] تم تحميل " + count + " ملف");
}

module.exports = { loadAll };
