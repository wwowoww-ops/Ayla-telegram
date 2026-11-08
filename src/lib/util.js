// أدوات مشتركة بين ملفات الأوامر

const esc = s => String(s).replace(/[&<>]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
const nameOf = u => [u.first_name, u.last_name].filter(Boolean).join(" ") || u.username || "مستخدم";
const link = (id, name) => `<a href="tg://user?id=${id}">${esc(name)}</a>`;
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
const HTML = { parse_mode: "HTML" };

// تحويل الأرقام العربية والفارسية إلى لاتينية
const digits = s => String(s)
    .replace(/[٠-٩]/g, d => "٠١٢٣٤٥٦٧٨٩".indexOf(d))
    .replace(/[۰-۹]/g, d => "۰۱۲۳۴۵۶۷۸۹".indexOf(d));

// توحيد النص العربي للمقارنة (بدون تشكيل، وأ إ آ = ا، ة = ه، ى = ي، وبدون "ال")
const norm = s => String(s).toLowerCase()
    .replace(/[\u064B-\u065F\u0670\u0640]/g, "")
    .replace(/[أإآ]/g, "ا").replace(/ة/g, "ه").replace(/ى/g, "ي")
    .replace(/[^\p{L}\p{N}\s]/gu, "").replace(/\s+/g, " ").trim()
    .replace(/^ال/, "");

// تسجيل أمر عربي ويحمي من أي خطأ.
// الكلمة وحدها تعمل بدون نقطة (مثل: يومي)، أما مع كلام بعدها فيلزم نقطة قبلها (مثل: .حساب 2+2)
// حتى لا يتفاعل البوت مع الكلام العادي في المجموعة.
function cmd(bot, names, handler) {
    const alt = names.join("|");
    const re = new RegExp("^(?:[./!](?:" + alt + ")(?:\\s+([\\s\\S]*))?|(?:" + alt + "))$", "i");
    bot.hears(re, async ctx => {
        try {
            await handler(ctx, ((ctx.match && ctx.match[1]) || "").trim());
        } catch (e) {
            console.error("[CMD ERROR]", e && e.message);
            await ctx.reply("⚠️ حدث خطأ مؤقت، حاول بعد قليل.").catch(() => {});
        }
    });
}

// رقم ثابت من نص (للنتائج التي لا تتغير لنفس المدخلات)
function hash(str) {
    let h = 2166136261;
    for (const c of String(str)) { h ^= c.codePointAt(0); h = Math.imul(h, 16777619) >>> 0; }
    return h;
}

module.exports = { esc, nameOf, link, pick, HTML, digits, norm, cmd, hash };