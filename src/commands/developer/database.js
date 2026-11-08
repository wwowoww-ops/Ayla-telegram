
/**
 * ╔══════════════════════════════════════╗
 * ║           AYLA DATABASE               ║
 * ║                 v1.1                 ║
 * ╚══════════════════════════════════════╝
 *
 * Database Panel
 * Manual Save
 * Database Information
 * Storage Statistics
 * JSON Backup
 */

const { InlineKeyboard, InputFile } = require("grammy");

const { cmd, HTML } = require("../../lib/util");
const store = require("../../core/store");

const OWNER_ID = "7401027785";
const CALLBACK = "ayla_db:";

// ==================================================
// HELPERS
// ==================================================

function formatBytes(bytes) {
    bytes = Number(bytes || 0);

    if (bytes < 1024) return bytes + " B";

    if (bytes < 1024 ** 2) {
        return (bytes / 1024).toFixed(2) + " KB";
    }

    if (bytes < 1024 ** 3) {
        return (bytes / 1024 ** 2).toFixed(2) + " MB";
    }

    return (bytes / 1024 ** 3).toFixed(2) + " GB";
}

function mainKeyboard() {
    return new InlineKeyboard()
        .text("حفظ الآن", CALLBACK + "save")
        .text("تحديث المعلومات", CALLBACK + "refresh")
        .row()
        .text("إحصائيات التخزين", CALLBACK + "storage")
        .row()
        .text("إنشاء نسخة احتياطية", CALLBACK + "backup");
}

// ==================================================
// DATABASE PANEL
// ==================================================

async function panel() {
    const info = await store.databaseInfo();
    const stats = store.stats();

    return (
        "✿ <b>AYLA — DATABASE</b>\n" +
        "━━━━━━━━━━━━━━━━━━\n\n" +

        "◈ <b>معلومات القاعدة</b>\n" +
        "• الاسم: <code>" + info.name + "</code>\n" +
        "• الحجم: <b>" + info.size + "</b>\n" +
        "• حجم الجداول: <b>" +
            formatBytes(info.tablesBytes) + "</b>\n" +
        "• الاتصالات الحالية: <b>" +
            info.connections + "</b>\n" +
        "• الصفوف المقدّرة: <b>" +
            info.estimatedRows + "</b>\n" +
        "• معدل إصابة الذاكرة: <b>" +
            (info.cacheHitRate === null
                ? "غير متاح"
                : info.cacheHitRate + "%") +
        "</b>\n\n" +

        "◈ <b>بيانات AYLA</b>\n" +
        "• اللاعبون: <b>" + stats.players + "</b>\n" +
        "• المجموعات: <b>" + stats.groups + "</b>\n" +
        "• تغييرات اللاعبين المعلّقة: <b>" +
            stats.dirtyPlayers + "</b>\n" +
        "• تغييرات المجموعات المعلّقة: <b>" +
            stats.dirtyGroups + "</b>\n\n" +

        "━━━━━━━━━━━━━━━━━━\n" +
        "✿ اختر العملية من الأزرار."
    );
}

// ==================================================
// STORAGE PANEL
// ==================================================

function storagePanel() {
    const stats = store.stats();

    return (
        "✿ <b>AYLA — STORAGE</b>\n" +
        "━━━━━━━━━━━━━━━━━━\n\n" +

        "◈ <b>الذاكرة الحالية</b>\n" +
        "• عدد اللاعبين: <b>" + stats.players + "</b>\n" +
        "• عدد المجموعات: <b>" + stats.groups + "</b>\n\n" +

        "◈ <b>البيانات غير المحفوظة</b>\n" +
        "• تغييرات اللاعبين: <b>" +
            stats.dirtyPlayers + "</b>\n" +
        "• تغييرات المجموعات: <b>" +
            stats.dirtyGroups + "</b>\n\n" +

        "◈ <b>نظام الحفظ</b>\n" +
        "• اللاعبون: كل 20 دقيقة.\n" +
        "• المجموعات: كل 5 دقائق.\n" +
        "• الحفظ اليدوي: متاح من اللوحة.\n\n" +

        "━━━━━━━━━━━━━━━━━━"
    );
}

// ==================================================
// MESSAGE EDIT
// ==================================================

async function show(ctx, text, markup = mainKeyboard()) {
    try {
        await ctx.editMessageText(text, {
            parse_mode: "HTML",
            reply_markup: markup
        });
    } catch (e) {
        if (!String(e.message).includes("message is not modified")) {
            console.error("[AYLA DB] Edit error:", e.message);
        }
    }
}

// ==================================================
// BACKUP
// ==================================================

async function createBackup(ctx) {
    const backup = store.exportData();

    const json = JSON.stringify(backup, null, 2);

    const buffer = Buffer.from(json, "utf8");

    const date = new Date()
        .toISOString()
        .replace(/[:.]/g, "-");

    const filename = `AYLA-backup-${date}.json`;

    const caption =
        "✿ <b>AYLA — BACKUP</b>\n" +
        "━━━━━━━━━━━━━━━━━━\n\n" +
        "✓ تم إنشاء النسخة الاحتياطية بنجاح.\n\n" +
        "◈ <b>محتويات النسخة</b>\n" +
        "• اللاعبون: <b>" + backup.players.length + "</b>\n" +
        "• المجموعات: <b>" + backup.groups.length + "</b>\n\n" +
        "◈ <b>معلومات النسخة</b>\n" +
        "• الإصدار: <b>" + backup.version + "</b>\n" +
        "• الحجم: <b>" + formatBytes(buffer.length) + "</b>\n" +
        "• التاريخ: <code>" + backup.createdAt + "</code>\n\n" +
        "━━━━━━━━━━━━━━━━━━\n" +
        "احتفظ بهذا الملف لاستعادة بيانات AYLA لاحقًا.";

    await ctx.replyWithDocument(
        new InputFile(buffer, filename),
        {
            caption,
            parse_mode: "HTML"
        }
    );
}

// ==================================================
// COMMAND
// ==================================================

module.exports = function(bot) {

    // فتح لوحة قاعدة البيانات
    cmd(bot, ["قاعدة"], async ctx => {
        if (String(ctx.from.id) !== OWNER_ID) return;

        try {
            await ctx.reply(
                await panel(),
                {
                    ...HTML,
                    reply_markup: mainKeyboard()
                }
            );
        } catch (e) {
            console.error("[AYLA DB] Panel error:", e.message);

            await ctx.reply(
                "تعذّر جلب معلومات قاعدة البيانات."
            );
        }
    });

    // ==================================================
    // CALLBACKS
    // ==================================================

    bot.callbackQuery(/^ayla_db:/, async ctx => {

        if (String(ctx.from.id) !== OWNER_ID) {
            return ctx.answerCallbackQuery({
                text: "هذه اللوحة خاصة بالمطوّر.",
                show_alert: true
            });
        }

        const action = ctx.callbackQuery.data.slice(
            CALLBACK.length
        );

        try {

            // تحديث المعلومات
            if (action === "refresh") {
                await ctx.answerCallbackQuery({
                    text: "تم تحديث المعلومات."
                });

                return show(ctx, await panel());
            }

            // إحصائيات التخزين
            if (action === "storage") {
                await ctx.answerCallbackQuery();

                const buttons = new InlineKeyboard()
                    .text("العودة", CALLBACK + "refresh");

                return show(
                    ctx,
                    storagePanel(),
                    buttons
                );
            }

            // الحفظ الفوري
            if (action === "save") {
                await ctx.answerCallbackQuery({
                    text: "بدأ الحفظ الفوري..."
                });

                await show(
                    ctx,
                    "⏳ <b>AYLA — DATABASE</b>\n\n" +
                    "جارٍ حفظ التغييرات المعلّقة..."
                );

                const result = await store.flush();

                const updatedPanel = await panel();

                return show(
                    ctx,
                    updatedPanel +
                    "\n\n<b>✓ اكتمل الحفظ الفوري</b>\n" +
                    "• اللاعبون المحفوظون: " +
                    result.players + "\n" +
                    "• المجموعات المحفوظة: " +
                    result.groups
                );
            }

            // إنشاء نسخة احتياطية
            if (action === "backup") {
                await ctx.answerCallbackQuery({
                    text: "جارٍ إنشاء النسخة الاحتياطية..."
                });

                await createBackup(ctx);

                return;
            }

            await ctx.answerCallbackQuery({
                text: "عملية غير معروفة."
            });

        } catch (e) {
            console.error(
                "[AYLA DB] Callback error:",
                e.message
            );

            try {
                await ctx.answerCallbackQuery({
                    text: "تعذّرت العملية.",
                    show_alert: true
                });
            } catch (_) {}

            await show(
                ctx,
                "⚠️ <b>تعذّرت العملية</b>\n\n" +
                "حدث خطأ أثناء تنفيذ العملية.\n" +
                "يمكنك المحاولة مجددًا."
            );
        }
    });
};
