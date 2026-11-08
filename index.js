const { Bot } = require("grammy");
const config = require("./config");
const { run } = require("./src/core/lifecycle");

// متغيرات Railway لها الأولوية إن وُجدت، وإلا تُقرأ القيم من config.js
const token = process.env.BOT_TOKEN || config.token;
const dbUrl = process.env.DATABASE_URL || config.databaseUrl;

if (!token || /ضع_/.test(token)) { console.error("لم تضع التوكن في config.js"); process.exit(1); }
if (!dbUrl || /ضع_/.test(dbUrl)) { console.error("لم تضع رابط القاعدة في config.js"); process.exit(1); }

const bot = new Bot(token);
bot.catch(err => console.error("[bot error]", (err.error && err.error.message) || err));

run(bot, dbUrl);