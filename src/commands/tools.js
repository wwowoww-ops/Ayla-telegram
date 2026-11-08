// أوامر الخدمات (بدون قاعدة بيانات)
const crypto = require("crypto");
const { esc, nameOf, link, HTML, cmd, digits } = require("./lib/util");

// ---------- آلة حاسبة آمنة (بدون eval) ----------
function calc(input) {
    const s = digits(input).replace(/[×xX]/g, "*").replace(/[÷:]/g, "/").replace(/٫/g, ".").replace(/[,،\s]/g, "");
    if (!s || s.length > 80 || !/^[0-9+\-*/%^().]+$/.test(s)) throw new Error("تعبير غير صالح");
    let i = 0;
    const peek = () => s[i];
    const num = () => {
        const m = s.slice(i).match(/^\d*\.?\d+|^\d+\.?/);
        if (!m) throw new Error("تعبير غير صالح");
        i += m[0].length;
        return parseFloat(m[0]);
    };
    function primary() {
        if (peek() === "(") { i++; const v = expr(); if (peek() !== ")") throw new Error("قوس ناقص"); i++; return v; }
        return num();
    }
    function power() {
        const b = primary();
        if (peek() === "^") { i++; const e = unary(); if (Math.abs(e) > 1000) throw new Error("الأس كبير جدًا"); return Math.pow(b, e); }
        return b;
    }
    function unary() {
        if (peek() === "-") { i++; return -unary(); }
        if (peek() === "+") { i++; return unary(); }
        return power();
    }
    function term() {
        let v = unary();
        while (peek() === "*" || peek() === "/" || peek() === "%") {
            const op = s[i++], r = unary();
            if ((op === "/" || op === "%") && r === 0) throw new Error("لا يمكن القسمة على صفر");
            v = op === "*" ? v * r : op === "/" ? v / r : v % r;
        }
        return v;
    }
    function expr() {
        let v = term();
        while (peek() === "+" || peek() === "-") { const op = s[i++], r = term(); v = op === "+" ? v + r : v - r; }
        return v;
    }
    const v = expr();
    if (i < s.length) throw new Error("تعبير غير صالح");
    if (!Number.isFinite(v)) throw new Error("الناتج كبير جدًا");
    return v;
}
const fmtNum = v => Number(v.toPrecision(12)).toLocaleString("en-US", { maximumFractionDigits: 10 });

module.exports = Object.assign(function (bot) {
    // ايدي: بالرد على شخص يعرض رقمه
    cmd(bot, ["ايدي", "id", "معرفي", "هويتي"], async ctx => {
        const t = ctx.message.reply_to_message && ctx.message.reply_to_message.from;
        const u = t || ctx.from;
        return ctx.reply(
            `🆔 ${link(u.id, nameOf(u))}\n• رقم الحساب: <code>${u.id}</code>` +
            (u.username ? `\n• المعرّف: @${esc(u.username)}` : "") +
            `\n• رقم الدردشة: <code>${ctx.chat.id}</code>`, HTML);
    });

    // حساب: .حساب 2+3*4
    cmd(bot, ["حساب", "احسب"], async (ctx, args) => {
        const src = args || (ctx.message.reply_to_message && ctx.message.reply_to_message.text) || "";
        if (!src) return ctx.reply("اكتب العملية. أمثلة:\n.حساب 25*4+10\n.حساب (12+8)/5\n.حساب 2^10");
        try {
            return ctx.reply(`🧮 ${esc(src)}\n= <b>${fmtNum(calc(src))}</b>`, HTML);
        } catch (e) {
            return ctx.reply("❌ " + e.message + "\nالمسموح: + - × ÷ % ^ وأقواس.");
        }
    });

    // وقت / تاريخ بتوقيت تونس
    cmd(bot, ["وقت", "الوقت", "ساعة", "الساعة", "تاريخ", "التاريخ"], async ctx => {
        const now = new Date();
        const t = new Intl.DateTimeFormat("ar-TN-u-nu-latn", { timeZone: "Africa/Tunis", hour: "2-digit", minute: "2-digit", hour12: false }).format(now);
        const g = new Intl.DateTimeFormat("ar-TN-u-nu-latn", { timeZone: "Africa/Tunis", dateStyle: "full" }).format(now);
        let h = "";
        try { h = new Intl.DateTimeFormat("ar-SA-u-ca-islamic-umalqura-nu-latn", { timeZone: "Africa/Tunis", dateStyle: "long" }).format(now); } catch (e) { /* لا شيء */ }
        return ctx.reply(`🕒 الساعة الآن (تونس): <b>${t}</b>\n📅 ${g}` + (h ? `\n🌙 ${h}` : ""), HTML);
    });

    // كلمة سر قوية: .كلمة_سر 16
    cmd(bot, ["كلمة_سر", "باسورد", "password"], async (ctx, args) => {
        let n = parseInt(digits(args), 10);
        if (!Number.isFinite(n)) n = 14;
        n = Math.min(Math.max(n, 8), 40);
        const sets = ["abcdefghijkmnopqrstuvwxyz", "ABCDEFGHJKLMNPQRSTUVWXYZ", "23456789", "!@#$%*?-_"];
        const all = sets.join("");
        const out = sets.map(x => x[crypto.randomInt(x.length)]);
        while (out.length < n) out.push(all[crypto.randomInt(all.length)]);
        for (let i = out.length - 1; i > 0; i--) { const j = crypto.randomInt(i + 1); [out[i], out[j]] = [out[j], out[i]]; }
        return ctx.reply(`🔐 كلمة سر (${n} خانة):\n<code>${esc(out.join(""))}</code>\n\n⚠️ المجموعة ترى هذه الرسالة، فاحذفها ولا تستخدمها لحساب مهم.`, HTML);
    });

    // عكس نص / عدد حروف
    cmd(bot, ["عكس"], async (ctx, args) => {
        const src = args || (ctx.message.reply_to_message && ctx.message.reply_to_message.text) || "";
        if (!src) return ctx.reply("اكتب: .عكس نصك، أو رد على رسالة واكتب: .عكس");
        return ctx.reply("🔁 " + Array.from(src).reverse().join(""));
    });
    cmd(bot, ["عد", "عدد"], async (ctx, args) => {
        const src = args || (ctx.message.reply_to_message && ctx.message.reply_to_message.text) || "";
        if (!src) return ctx.reply("اكتب: .عد نصك، أو رد على رسالة واكتب: .عد");
        const words = src.trim().split(/\s+/).length;
        return ctx.reply(`🔤 الحروف: ${Array.from(src).length}\n📝 الكلمات: ${words}`);
    });
}, { calc });