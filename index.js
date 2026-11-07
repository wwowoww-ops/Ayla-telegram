const { Bot, InlineKeyboard } = require("grammy");
const config = require("./config");

// الأولوية لمتغير Railway إن وُجد، وإلا يُقرأ الرمز من config.js
const token = process.env.BOT_TOKEN || config.token;
if (!token || token === "ضع_التوكن_هنا") {
    console.error("❌ لم تضع الرمز في config.js");
    process.exit(1);
}

const bot = new Bot(token);

const esc = s => String(s).replace(/[&<>]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
const nameOf = u => [u.first_name, u.last_name].filter(Boolean).join(" ") || "صديقي";

bot.command("start", ctx =>
    ctx.reply("أهلًا! أنا IKUYA 🐾\nجرّب: /ping أو اكتب: منشن أو قائمة"));

bot.command("ping", ctx => ctx.reply("pong ✅"));

// منشن حقيقي: يظهر الاسم قابلًا للنقر
bot.hears(/^[.!/]?منشن$/, ctx => {
    const u = ctx.from;
    return ctx.reply(
        `مرحبًا <a href="tg://user?id=${u.id}">${esc(nameOf(u))}</a> 👋`,
        { parse_mode: "HTML" }
    );
});

// أزرار تفاعلية
bot.hears(/^[.!/]?قائمة$/, ctx => {
    const kb = new InlineKeyboard()
        .text("🐾 حيواني", "pet").text("🛒 المتجر", "shop").row()
        .text("❌ إغلاق", "close");
    return ctx.reply("اختر:", { reply_markup: kb });
});
bot.callbackQuery("pet", ctx => ctx.answerCallbackQuery({ text: "قريبًا: لعبة الحيوان" }));
bot.callbackQuery("shop", ctx => ctx.answerCallbackQuery({ text: "قريبًا: المتجر" }));
bot.callbackQuery("close", async ctx => {
    await ctx.answerCallbackQuery();
    await ctx.deleteMessage().catch(() => {});
});

bot.catch(err => console.error("[BOT ERROR]", (err.error && err.error.message) || err));

bot.start({
    drop_pending_updates: true,
    onStart: me => console.log("✅ البوت يعمل: @" + me.username)
});