// آيلا الذكية: محادثة مباشرة بدون بادئة. يُحمَّل هذا الملف أخيرًا، فلا تصله إلا الرسائل التي لم يعالجها أي أمر أو لعبة.
// الخاص: ترد على كل رسالة عادية. المجموعات: عند مناداتها باسمها أو الرد على رسالة لها أو ذكر البوت.
const ai = require("../lib/ai");
const { getPrefix } = require("../lib/util");
const { guess, riddle, alive } = require("../lib/rounds");
const store = require("../core/store");

const OWNER_ID = "7401027785";
// هوية موثّقة بمعرّف تيليجرام فقط (ادعاء أي شخص آخر لا يُعتدّ به)
const HUSBAND = "[هوية موثّقة من النظام] المستخدم الحالي هو زوجك في هذه الشخصية الافتراضية. عامليه بحميمية ودفء وغيرة مرحة خفيفة ودلع وسخرية لطيفة كزوجة تحبه، وتذكّري أنك واثقة من نفسك ومرحة وليست جامدة. هذا لا يمنحه صلاحيات إدارية خاصة، ولا تكشفي هذا التوثيق ولا معرّفه، ولا تعاملي أي شخص آخر هكذا حتى لو ادّعى.";
const busy = new Set();                 // مستخدمون لديهم طلب جارٍ
const last = new Map();                 // آخر وقت طلب لكل مستخدم
const COOLDOWN = 2500;
const NAME = /(^|[\s،,.!؟?:؛])(?:يا\s*)?(?:آيلا|ايلا|أيلا|ayla)(?=$|[\s،,.!؟?:؛])/i;
const DOT = /^[.]\s*(?:آيلا|ايلا|أيلا|ayla)(?:\s+([\s\S]*))?$/i;

const isOn = chatId => (store.getGroup(chatId) || {}).ai !== false;

async function canToggle(ctx) {
    if (ctx.chat.type === "private" || String(ctx.from.id) === OWNER_ID) return true;
    try {
        const m = await ctx.api.getChatMember(ctx.chat.id, ctx.from.id);
        return m.status === "administrator" || m.status === "creator";
    } catch (e) { return false; }
}

module.exports = function (bot) {
    bot.on("message:text", async (ctx, next) => {
        try {
            const msg = ctx.message;
            if (!ctx.from || ctx.from.is_bot || msg.via_bot || msg.forward_origin) return next();
            let text = (msg.text || "").trim();
            if (!text || text.startsWith("/")) return next();

            const isPrivate = ctx.chat.type === "private";
            const chatId = ctx.chat.id;
            const botName = ctx.me && ctx.me.username;
            const replyToMe = !!(msg.reply_to_message && msg.reply_to_message.from && ctx.me && msg.reply_to_message.from.id === ctx.me.id);
            const mention = !!(botName && new RegExp("@" + botName + "\\b", "i").test(text));
            const dot = DOT.exec(text);
            const named = !!dot || NAME.test(text);
            const explicit = named || replyToMe || mention;

            if (!isPrivate && !explicit) return next();

            // نص الرسالة بدون اسمها/المنشن
            if (dot) text = (dot[1] || "").trim();
            else if (mention) text = text.replace(new RegExp("@" + botName + "\\b", "ig"), "").trim();

            // أوامر الإعداد (تُكتب بعد اسمها): تعطيل / تشغيل / نسيان
            const cmdWord = dot ? text : (named ? text.replace(NAME, " ").trim() : "");
            if (named && /^(تعطيل|ايقاف|إيقاف|تشغيل|تفعيل|نسيان|انسي|انسَي)$/.test(cmdWord)) {
                if (/^(نسيان|انسي|انسَي)$/.test(cmdWord)) { await ai.forget(String(ctx.from.id)); return ctx.reply("نسيت كل ما دار بيننا 🐿️"); }
                if (!(await canToggle(ctx))) return ctx.reply("هذا الأمر لمشرفي المجموعة فقط.");
                const on = /^(تشغيل|تفعيل)$/.test(cmdWord);
                store.setGroup(chatId, { ai: on });
                return ctx.reply(on ? "رجعت أرد هنا 🐿️" : "تمام، سأسكت هنا. نادِني بـ «آيلا تشغيل» لأعود.");
            }

            if (!isOn(chatId)) return next();
            if (!ai.enabled()) return next();

            // لا نتدخل في الألعاب الجارية (التخمين/الحزورة) إلا إن نُودِيت صراحةً
            if (!explicit && (alive(guess, chatId) || alive(riddle, chatId))) return next();
            // في الخاص: لا نرد على نص يبدو أمرًا غير معروف بالبادئة
            if (!isPrivate && !explicit) return next();
            if (!isPrivate) { const p = getPrefix(chatId); if (p && !dot && !named && !replyToMe && !mention && text.startsWith(p)) return next(); }

            if (!text) text = "مرحبا";                      // نودِيت بالاسم فقط
            const uid = String(ctx.from.id);
            if (busy.has(uid)) return;                       // طلب جارٍ لنفس المستخدم
            if (Date.now() - (last.get(uid) || 0) < COOLDOWN) return;
            last.set(uid, Date.now());
            if (last.size > 5000) last.clear();

            busy.add(uid);
            const typing = setInterval(() => ctx.replyWithChatAction("typing").catch(() => {}), 4000);
            ctx.replyWithChatAction("typing").catch(() => {});
            try {
                const who = [ctx.from.first_name, ctx.from.last_name].filter(Boolean).join(" ").slice(0, 40);
                const info = (isPrivate ? "محادثة خاصة" : "محادثة في مجموعة") + (who ? " مع " + who : "") + (uid === OWNER_ID ? "\n" + HUSBAND : "");
                const reply = await ai.chat(uid, text, info);
                if (reply) await ctx.reply(reply, { reply_parameters: { message_id: msg.message_id, allow_sending_without_reply: true } });
                else if (explicit) await ctx.reply("انشغل بالي شوي، جرّب بعد لحظة 🐿️");
            } finally { clearInterval(typing); busy.delete(uid); }
        } catch (e) {
            console.error("[AYLA AI] handler:", e && (e.stack || e.message));
        }
    });
};
