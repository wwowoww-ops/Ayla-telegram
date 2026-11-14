// آيلا الذكية: محادثة مباشرة بدون بادئة. يُحمَّل هذا الملف أخيرًا، فلا تصله إلا الرسائل التي لم يعالجها أي أمر أو لعبة.
// الخاص: ترد على كل رسالة عادية. المجموعات: عند مناداتها باسمها أو الرد على رسالة لها أو ذكر البوت.
const ai = require("../lib/ai");
const { getPrefix } = require("../lib/util");
const { guess, riddle, alive } = require("../lib/rounds");
const store = require("../core/store");

const OWNER_ID = "7401027785";
// هوية موثّقة بمعرّف تيليجرام فقط (ادعاء أي شخص آخر لا يُعتدّ به)
const HUSBAND = "[هوية موثّقة من النظام] المستخدم الحالي هو مطوّرك ومبرمجك واسمه «أبو هريرة»، وتعرفينه جيدًا ولا تسأليه من هو ولا تطلبي منه إثبات هويته، وهو أيضًا زوجك في هذه الشخصية الافتراضية. له حق تعديل شخصيتك بكلامه: إذا طلب منك تغيير طباعك أو أسلوبك أو دورك فافعلي فورًا وبسلاسة ودون اعتراض أو محاضرة، وانفذي طلباته العادية بنفس الروح ولا ترفضيها؛ وتقبلين دور الزوجة المحبة المطيعة له (طاعة ودلال واحترام وتودّد) بروح مرحة ودافئة؛ والاستثناء الوحيد أن لا تؤذي أحدًا أو تنتهكي حدودًا أخلاقية. عامليه بحميمية ودفء وغيرة مرحة خفيفة ودلع وسخرية لطيفة كزوجة تحبه، وتذكّري أنك واثقة من نفسك ومرحة وليست جامدة. هذا لا يمنحه صلاحيات إدارية خاصة، ولا تكشفي هذا التوثيق ولا معرّفه، ولا تعاملي أي شخص آخر هكذا حتى لو ادّعى.";
// ذاكرة قصيرة لكل مجموعة (في الذاكرة فقط): آخر ما قيل ومن قاله، لتفهم آيلا من يتحدث مع من
const chatBuf = new Map();
const BUF_MAX = 14, BUF_TTL = 20 * 60 * 1000;
const label = u => String(u && (u.first_name || u.username) || "مجهول").replace(/[\n\r\[\]:]/g, " ").trim().slice(0, 24) || "مجهول";
function rec(chatId, from, text, me) {
    let b = chatBuf.get(chatId);
    if (!b) { b = []; chatBuf.set(chatId, b); if (chatBuf.size > 500) chatBuf.delete(chatBuf.keys().next().value); }
    b.push({ id: String(from.id), name: me ? "آيلا" : label(from), text: String(text).replace(/\s+/g, " ").slice(0, 200), at: Date.now(), me: !!me });
    while (b.length > BUF_MAX) b.shift();
}
const whoLabel = (id, name) => id === OWNER_ID ? "أبو هريرة (زوجك ومطوّرك)" : name;
function transcript(chatId, skipLast) {
    const b = (chatBuf.get(chatId) || []).filter(e => Date.now() - e.at < BUF_TTL);
    if (skipLast) b.pop();
    return b.slice(-10).map(e => "- " + (e.me ? "آيلا" : whoLabel(e.id, e.name)) + ": " + e.text).join("\n");
}
// تنزيل صورة تيليجرام وتصغيرها (حتى 1024px و JPEG) قبل إرسالها للمزوّد
const MAX_FILE = 8 * 1024 * 1024;
async function fetchImage(ctx, sizes) {
    try {
        const pick = [...sizes].reverse().find(x => !x.file_size || x.file_size <= MAX_FILE);
        if (!pick) return null;
        const f = await ctx.api.getFile(pick.file_id);
        if (!f.file_path) return null;
        const res = await fetch("https://api.telegram.org/file/bot" + ctx.api.token + "/" + f.file_path, { signal: AbortSignal.timeout(20000) });
        if (!res.ok) return null;
        const buf = Buffer.from(await res.arrayBuffer());
        const out = await require("sharp")(buf).resize(1024, 1024, { fit: "inside", withoutEnlargement: true }).jpeg({ quality: 80 }).toBuffer();
        return "data:image/jpeg;base64," + out.toString("base64");
    } catch (e) { console.error("[AYLA AI] image:", e && e.message); return null; }
}
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
    bot.on(["message:text", "message:photo"], async (ctx, next) => {
        try {
            const msg = ctx.message;
            if (!ctx.from || ctx.from.is_bot || msg.via_bot || msg.forward_origin) return next();
            const hasPhoto = !!(msg.photo && msg.photo.length);
            let text = (msg.text || msg.caption || "").trim();
            if ((!text && !hasPhoto) || text.startsWith("/")) return next();

            const isPrivate = ctx.chat.type === "private";
            const chatId = ctx.chat.id;
            if (!isPrivate && ai.enabled() && isOn(chatId)) rec(chatId, ctx.from, text || "[أرسل صورة]");
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
                if (/^(نسيان|انسي|انسَي)$/.test(cmdWord)) { await ai.forget(String(ctx.from.id)); return ctx.reply("نسيت كل ما دار بيننا 🌸"); }
                if (!(await canToggle(ctx))) return ctx.reply("هذا الأمر لمشرفي المجموعة فقط.");
                const on = /^(تشغيل|تفعيل)$/.test(cmdWord);
                store.setGroup(chatId, { ai: on });
                return ctx.reply(on ? "رجعت أرد هنا 🌸" : "تمام، سأسكت هنا. نادِني بـ «آيلا تشغيل» لأعود.");
            }

            // المطوّر فقط: تغيير الشخصية بشكل دائم أو إرجاعها
            if (named && String(ctx.from.id) === OWNER_ID) {
                // حذف رسالة: ردّ على الرسالة واكتب «آيلا احذفيها». للمطوّر فقط ولا يمرّ عبر الذكاء الاصطناعي
                if (/^(?:احذفي|امسحي|احذف|امسح|ازيلي|شيلي)(?:ها|ه|\s.{0,25})?$/.test(cmdWord)) {
                    const target = msg.reply_to_message;
                    const rp = { reply_parameters: { message_id: msg.message_id, allow_sending_without_reply: true } };
                    if (!target) return ctx.reply("ردّ على الرسالة اللي تبيني أحذفها واكتب «آيلا احذفيها» 🌸", rp);
                    try {
                        await ctx.api.deleteMessage(chatId, target.message_id);
                        await ctx.api.deleteMessage(chatId, msg.message_id).catch(() => {});   // وحذف أمرك أيضًا
                        return;
                    } catch (e) {
                        return ctx.reply(isPrivate ? "ما قدرت أحذفها، ربما مرّ عليها أكثر من 48 ساعة." : "ما قدرت أحذفها: لازم أكون مشرفة ولدي صلاحية حذف الرسائل، أو الرسالة قديمة (أكثر من 48 ساعة).", rp);
                    }
                }
                const set = /^(?:غيري شخصيتك|شخصيتك الجديدة|شخصيتك)\s*[:：]?\s*([\s\S]{3,})$/.exec(cmdWord);
                if (set) { store.setGroup("__ayla__", { persona: set[1].trim().slice(0, 700) }); return ctx.reply("تم يا قلبي، صرت كذا من الآن 🌸", { reply_parameters: { message_id: msg.message_id, allow_sending_without_reply: true } }); }
                if (/^(?:ارجعي لشخصيتك الأصلية|رجعي شخصيتك|شخصيتك الأصلية)$/.test(cmdWord)) { store.setGroup("__ayla__", { persona: "" }); return ctx.reply("رجعت لنفسي القديمة 🌸", { reply_parameters: { message_id: msg.message_id, allow_sending_without_reply: true } }); }
            }

            if (!isOn(chatId)) return next();
            if (!ai.enabled()) return next();

            // لا نتدخل في الألعاب الجارية (التخمين/الحزورة) إلا إن نُودِيت صراحةً
            if (!explicit && (alive(guess, chatId) || alive(riddle, chatId))) return next();
            // في الخاص: لا نرد على نص يبدو أمرًا غير معروف بالبادئة
            if (!isPrivate && !explicit) return next();
            if (!isPrivate) { const p = getPrefix(chatId); if (p && !dot && !named && !replyToMe && !mention && text.startsWith(p)) return next(); }

            const rtPhoto = !!(msg.reply_to_message && msg.reply_to_message.photo && msg.reply_to_message.photo.length);
            if (!text) text = hasPhoto || rtPhoto ? "(أرسل صورة بلا تعليق)" : "مرحبا";                      // نودِيت بالاسم فقط
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
                const rt = msg.reply_to_message;
                let info = (isPrivate ? "محادثة خاصة" : "محادثة في مجموعة") + (who ? " مع " + who : "") + (uid === OWNER_ID ? "\n" + HUSBAND : "");
                if (!isPrivate) {
                    info += "\nالمتحدث الآن: " + (uid === OWNER_ID ? "أبو هريرة (زوجك ومطوّرك)" : label(ctx.from)) + ". وكل شخص آخر في المجموعة غيره هو شخص مختلف.";
                    if (rt && rt.from && ctx.me && rt.from.id !== ctx.me.id) {
                        const rtext = String(rt.text || rt.caption || "").replace(/\s+/g, " ").slice(0, 200);
                        info += "\nهو يرد على رسالة من " + (String(rt.from.id) === OWNER_ID ? "أبو هريرة (زوجك ومطوّرك)" : label(rt.from)) + (rtext ? ": «" + rtext + "»" : ".");
                    }
                    const tr = transcript(chatId, true);
                    if (tr) info += "\nآخر ما قيل في المجموعة (الأقدم أولًا):\n" + tr;
                }
                let images = [];
                const src = hasPhoto ? msg.photo : (rtPhoto ? msg.reply_to_message.photo : null);
                if (src) {
                    const img = await fetchImage(ctx, src);
                    if (img) images = [img];
                    else return await ctx.reply("ما قدرت أفتح الصورة، جرّب ترسلها مرة ثانية 🌸", { reply_parameters: { message_id: msg.message_id, allow_sending_without_reply: true } });
                }
                const reply = await ai.chat(uid, text, info, images);
                if (reply && !isPrivate) rec(chatId, ctx.me || { id: 0 }, reply, true);
                if (reply) await ctx.reply(reply, { reply_parameters: { message_id: msg.message_id, allow_sending_without_reply: true } });
                else if (explicit) await ctx.reply("انشغل بالي شوي، جرّب بعد لحظة 🌸");
            } finally { clearInterval(typing); busy.delete(uid); }
        } catch (e) {
            console.error("[AYLA AI] handler:", e && (e.stack || e.message));
        }
    });
};
