// أمر فتح أماكن الأكل
const { cmd } = require("../../lib/util");
const store = require("../../core/store");
const ui = require("../../game/ui");
const F = require("../../game/feeders");
const FM = require("../../game/feeders/menu");

module.exports = function (bot) {
    cmd(bot, ["اماكن الاكل", "أماكن الأكل", "مغذيات", "اوعية", "أوعية", "وعاء"], async ctx => {
        await ctx.reply("🔷 استُبدل الطعام وأماكن الأكل بـ<b>الموارد</b>: بلورات لرفع الحيوانات وجواهر العناصر للتطور. افتحها من 🛒 المتجر ← الموارد.", { parse_mode: "HTML" });
    }, { menu: "أماكن الأكل", category: "animals" });
};