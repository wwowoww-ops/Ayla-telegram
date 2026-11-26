// رسالة لطيفة للاعب الذي غاب يومين أو أكثر: حيواناتك اشتاقت لك (مرتان كحد أقصى لكل غياب: بعد 48 ساعة وبعد 96 ساعة).
// تُحترم نافذة النهار (10 صباحًا–9 مساءً بتوقيت تونس) ويُوقفها أمر «اشعارات».
const store = require("../core/store");
const E = require("../game/engine");
const D = require("../game/data");
const config = require("../web/config");

const HOUR = 3600e3, STAGES = [48 * HOUR, 96 * HOUR], SEEN_GAP = 10 * 60e3;
const hourTn = now => Number(new Intl.DateTimeFormat("en-GB", { hour: "numeric", hour12: false, timeZone: "Africa/Tunis" }).format(now)) % 24;
const pick = a => a[Math.floor(Math.random() * a.length)];

function text(P, days, stage, now) {
    const main = P.pets.find(p => p.id === P.main) || P.pets[0], nm = main ? (main.nick || E.spOf(main).n) : null, em = main ? E.spOf(main).e : "🐾";
    const gain = Math.floor(E.incomeAll(P) * (D.C || D.CONFIG || { COLLECT_CAP_H: 12 }).COLLECT_CAP_H);
    const eggs = (P.eggs || []).filter(e => e.readyAt <= now).length;
    const lines = [];
    if (stage === 0) lines.push(pick([
        `${em} ${nm || "حيواناتك"} يسأل عنك! مرّ ${days} أيام ولم يرك 🥺`,
        `🐾 حيواناتك تنظر إلى الباب كل صباح وتنتظرك… اشتاقوا لك كثيرًا ${em}`,
        `${em} ${nm || "حيواناتك"} يرسل لك سلامًا ويقول: «أين اختفيت؟» 💌`
    ]));
    else lines.push(pick([
        `${em} ${nm || "حيواناتك"} ما زال ينتظرك بصبر… لا بأس إن انشغلت، سنكون هنا دائمًا 🤍`,
        `🌙 مرّت ${days} أيام. حيواناتك تحرس مزرعتك وتشتاق لقصصك 🐾`
    ]));
    lines.push("");
    if (gain > 0) lines.push(`🪙 جمعت لك حظيرتك دخلًا يصل إلى ${E.fmt(gain)}`);
    if (eggs) lines.push(`🥚 عندك ${eggs} ${eggs > 1 ? "بيضات" : "بيضة"} جاهزة للفقس`);
    if ((P.streak || 0) >= 2) lines.push(`🔥 سلسلتك اليومية (${P.streak} أيام) تنتظر أن تُكمل!`);
    if (P.tame) lines.push(`🐲 فرصة ترويض زعيم تنتظرك في «حظيرة الزعماء»`);
    lines.push(`🎁 ومكافأتك اليومية تنتظرك، وفيها بيضة`);
    lines.push("", "ادخل متى شئت 🌸 (لإيقاف هذه الرسائل اكتب: اشعارات)");
    return lines.join("\n");
}

module.exports = function (bot) {
    // يسجّل آخر ظهور عند أي رسالة من لاعب موجود
    bot.use(async (ctx, next) => {
        const u = ctx.from, P = u && !u.is_bot ? store.get(u.id) : null, now = Date.now();
        if (P && now - (P.seen || 0) > SEEN_GAP) { P.seen = now; P.cbStage = 0; store.touch(P.id); }
        return next();
    });
    let busy = false;
    const tick = async () => {
        if (busy) return; busy = true;
        try {
            const now = Date.now(), h = hourTn(now);
            if (h >= 10 && h < 21) {
                for (const P of store.all()) {
                    if (!P || !P.pets || !P.pets.length || P.notify === false) continue;
                    if (!P.seen) { P.seen = now; store.touch(P.id); continue; }       // اللاعبون القدامى: يبدأ العدّ من الآن
                    const st = P.cbStage || 0, away = now - P.seen;
                    if (st >= STAGES.length || away < STAGES[st]) continue;
                    P.cbStage = st + 1; store.touch(P.id);
                    try { await bot.api.sendMessage(P.id, text(P, Math.floor(away / (24 * HOUR)), st, now), config.url ? { reply_markup: { inline_keyboard: [[{ text: "🎮 العب الآن", web_app: { url: config.url } }]] } } : {}); }
                    catch (e) { P.notify = false; store.touch(P.id); }                 // حظر البوت: لا نكرر المحاولة
                    await new Promise(r => setTimeout(r, 600));
                }
            }
        } catch (e) { console.error("[COMEBACK]", e && e.message); }
        busy = false;
    };
    setTimeout(tick, 60000); setInterval(tick, 30 * 60e3);
};
