const { Bot } = require("grammy");
const config = require("./config");
const { run } = require("./src/core/lifecycle");

// متغيرات Railway لها الأولوية إن وُجدت، وإلا تُقرأ القيم من config.js
const token = process.env.BOT_TOKEN || config.token;
const dbUrl = process.env.DATABASE_URL || config.databaseUrl;

if (!token || /ضع_/.test(token)) { console.error("لم تضع التوكن في config.js"); process.exit(1); }
if (!dbUrl || /ضع_/.test(dbUrl)) { console.error("لم تضع رابط القاعدة في config.js"); process.exit(1); }

const bot = new Bot(token);
bot.api.config.use(require("./src/lib/kbfit").transformer);
bot.catch(err => console.error("[bot error]", (err.error && err.error.message) || err));

// تزامن لكل مستخدم: grammY يعالج التحديثات واحدًا بعد الآخر، فأي أمر بطيء (ذكاء اصطناعي، توليد صور، قاعدة بيانات)
// كان يجمّد أزرار الجميع. هنا يمضي كل مستخدم في طابوره الخاص (يحفظ ترتيب ضغطاته) ولا ينتظره غيره.
const lanes = new Map();
bot.use((ctx, next) => {
    const key = String((ctx.from && ctx.from.id) || (ctx.chat && ctx.chat.id) || "x");
    const prev = lanes.get(key) || Promise.resolve();
    const cur = prev.then(() => next()).catch(e => console.error("[bot error]", (e && e.message) || e));
    lanes.set(key, cur);
    cur.then(() => { if (lanes.get(key) === cur) lanes.delete(key); });
    return Promise.resolve();   // لا ننتظر: الحلقة الرئيسية تتابع فورًا
});

run(bot, dbUrl);