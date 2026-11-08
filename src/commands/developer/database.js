
/**
 * ╔══════════════════════════════════════╗
 * ║           AYLA DATABASE               ║
 * ║                 v1.0                 ║
 * ╚══════════════════════════════════════╝
 */

const { InlineKeyboard } = require("grammy");
const { cmd, HTML } = require("../../lib/util");
const store = require("../../core/store");

const OWNER_ID = "7401027785";
const CALLBACK = "ayla_db:";

// ==================================================
// FORMAT
// ==================================================

function formatBytes(bytes) {
    bytes = Number(bytes || 0);

    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 ** 2)
        return (bytes / 1024).toFixed(2) + " KB";
    if (bytes < 1024 ** 3)
        return (bytes / 1024 ** 2).toFixed(2) + " MB";

    return (bytes / 1024 ** 3).toFixed(2) + " GB";
}

// ==================================================
// KEYBOARD
// ==================================================

function mainKeyboard() {
    return new InlineKeyboard()
        .text("حفظ الآن", CALLBACK + "save")
        .text("تحديث المعلومات", CALLBACK + "refresh")
        .row()
        .text("إحصائيات التخزين", CALLBACK + "storage");
}

// ==================================================
// DATABASE PANEL
// ==================================================

async function panel() {
    const [info] = await Promise.all([
        store.databaseInfo()
    ]);

    const stats = store.stats();

    return (
        "✿ <b>AYLA — DATABASE</b>\n" +
        "━━━━━━━━━━━━━━━━━━\n\n" +

        "◈ <b>معلومات القاعدة</b>\n" +
        "• الاسم: <code>" + info.name + "</code>\n" +
        "• الحجم: <b>" + info.size + "</b>\n" +
        "• حجم الجداول: <b>" + formatBytes(info.tablesBytes) + "</b>\n" +
        "• الاتصالات الحالية: <b>" + info.connections + "</b>\n" +
        "• الصفوف المقدّرة: <b>" + info.estimatedRows + "</b>\n" +
        "• معدل إصابة الذاكرة: <b>" +
            (info.cacheHitRate === null
                ? "غير متاح"
                : info.cacheHitRate + "%") +
        "</b>\n\n" +

        "◈ <b>بيانات AYLA</b>\n" +
        "• اللاعبون: <b>" + stats.players + "</b>\n" +
        "• المجموعات: <b>" + stats.groups + "</b>\n" +
        "• تغييرات اللاعبين المعلّقة: <b>" + stats.dirtyPlayers + "</b>\n" +
        "• تغييرات المجموعات المعلّقة: <b>" + stats.dirtyGroups + "</b>\n\n" +

        "━━━━━━━━━━━━━━━━━━\n" +
        "✿ اختر العملية من الأزرار."
    );
}

// ==================================================
// STORAGE DETAILS
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
        "• تغييرات اللاعبين: <b>" + stats.dirtyPlayers + "</b>\n" +
        "• تغييرات المجموعات: <b>" + stats.dirtyGroups + "</b>\n\n" +

        "◈ <b>نظام الحفظ</b>\n" +
        "• اللاعبون: كل 20 دقيقة.\n" +
        "• المجموعات: كل 5 دقائق.\n" +
        "• الحفظ اليدوي: متاح من اللوحة.\n\n" +

        "━━━━━━━━━━━━━━━━━━"
    );
}

// ==================================================
// EDIT MESSAGE
// ==================================================

async function show(ctx, text, markup = mainKeyboard()) {
    try {
        await ctx.editMessageText(text, {
            parse_mode: "HTML",
            reply_markup: markup
        });
    } catch (e) {
        if (!String(e.message).includes("message is not modified")) {
            console.error("[DATABASE PANEL]", e.message);
        }
    }
}

// ==================================================
// COMMANDS
// ==================================================

module.exports = function (bot) {

    // الأمر الرئيسي: قاعدة
    cmd(bot, ["قاعدة"], async ctx => {
        if (String(ctx.from.id) !== OWNER_ID) return;

        try {
            const text = await panel();

            await ctx.reply(text, {
                ...HTML,
                reply_markup: mainKeyboard()
            });

        } catch (e) {
            console.error("[DATABASE]", e.message);

            await ctx.reply(
                "⚠️ تعذّر جلب معلومات قاعدة البيانات."
            );
        }
    });

    // ==================================================
    // BUTTON HANDLER
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
            if (action === "refresh") {
                await ctx.answerCallbackQuery({
                    text: "تم تحديث المعلومات."
                });

                return show(ctx, await panel());
            }

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
                    "• اللاعبون المحفوظون: " + result.players + "\n" +
                    "• المجموعات المحفوظة: " + result.groups
                );
            }

            await ctx.answerCallbackQuery({
                text: "عملية غير معروفة."
            });

        } catch (e) {
            console.error("[DATABASE BUTTON]", e.message);

            await show(
                ctx,
                "⚠️ <b>تعذّرت العملية</b>\n\n" +
                "حدث خطأ أثناء الاتصال بقاعدة البيانات.\n" +
                "يمكنك المحاولة مجددًا."
            );
        }
    });
};
