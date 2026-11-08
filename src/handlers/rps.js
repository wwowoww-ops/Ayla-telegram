// أزرار حجر ورقة مقص
const { pick } = require("../lib/util");

const SHAPES = { r: ["🪨", "حجر"], p: ["📄", "ورقة"], s: ["✂️", "مقص"] };
const BEATS = { r: "s", p: "r", s: "p" };   // الأول يغلب الثاني

module.exports = function (bot) {
    bot.callbackQuery(/^rps:(\d+):([rps])$/, async ctx => {
        if (String(ctx.from.id) !== ctx.match[1]) {
            return ctx.answerCallbackQuery({ text: "هذه الجولة ليست لك. اكتب: حجر" });
        }
        const mine = ctx.match[2];
        const theirs = pick(["r", "p", "s"]);
        const result = mine === theirs ? "🤝 تعادل!" : BEATS[mine] === theirs ? "🎉 فزت!" : "😎 فزت أنا!";
        await ctx.answerCallbackQuery();
        await ctx.editMessageText(`${SHAPES[mine][0]} أنت: ${SHAPES[mine][1]}\n${SHAPES[theirs][0]} أنا: ${SHAPES[theirs][1]}\n\n${result}`).catch(() => {});
    });
};