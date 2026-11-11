// شاشات البوس الجماعي (نص وأزرار) تُستخدم في الأمر والأزرار والمؤقت
const { InlineKeyboard } = require("grammy");
const B = require("./boss");
const E = require("./engine");
const D = require("./data");
const { frame } = require("./menus");

const esc = s => String(s).replace(/[&<>]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
const bar = (cur, max, n = 14) => { const f = Math.max(0, Math.min(n, Math.round(cur / max * n))); return "█".repeat(f) + "░".repeat(n - f); };

function topLines(b, n = 5) {
    const r = B.ranking(b);
    if (!r.length) return "لم يهاجمه أحد بعد.";
    return r.slice(0, n).map((x, i) => `${["🥇", "🥈", "🥉"][i] || (i + 1) + "."} ${esc(x.n)} — ${E.fmt(x.d)} <i>(${x.hits} هجمة)</i>`).join("\n");
}

// شاشة الزعيم النشط
function screenBoss(chatId, now, note) {
    const b = B.get(chatId);
    const kb = new InlineKeyboard();
    if (!b || b.done) {
        const G = require("../core/store").getGroup(chatId);
        let text = (note ? note + "\n\n" : "") + "👑 <b>البوس الجماعي</b>\n\n";
        if (G.bossNextAt && now < G.bossNextAt) text += "⏳ الزعيم القادم يظهر بعد " + E.dur(G.bossNextAt - now) + ".";
        else text += "لا يوجد زعيم الآن. استدعِ زعيمًا جديدًا ليهاجمه الجميع معًا!";
        if (G.bossKills) text += `\n\n🏆 زعماء هُزموا في هذه المجموعة: ${G.bossKills}`;
        if (!(G.bossNextAt && now < G.bossNextAt)) kb.text("🔥 استدعاء الزعيم", "bs:spawn");
        return { text: frame(text), kb };
    }
    B.regen(b, now);
    const k = B.kindOf(b), el = D.ELEMENTS[k.el];
    const left = Math.max(0, b.endAt - now);
    let text = (note ? note + "\n\n" : "") + `${k.e} <b>${k.n}</b>  ${el.e} ${el.n}  <i>(مستوى ${b.level + 1})</i>\n\n`;
    text += `❤️ ${bar(b.hp, b.maxHp)}\n${E.fmt(Math.ceil(b.hp))} / ${E.fmt(b.maxHp)}\n\n`;
    text += `⏳ ينتهي بعد ${E.dur(left)}\n🩹 يتجدد ${Math.round(B.REGEN_PER_H * 100)}% من حياته كل ساعة!\n`;
    text += `💡 حيوانات من عنصر <b>${D.ELEMENTS[Object.keys(D.BEATS || {}).find(x => D.BEATS[x] === k.el) || k.el].n}</b> تضربه أقوى.\n\n`;
    text += "🏆 <b>أعلى ضرر:</b>\n" + topLines(b);
    kb.text("⚔️ هجوم", "bs:atk").text("🔄 تحديث", "bs:ref").row().text("📊 الترتيب الكامل", "bs:rank");
    return { text: frame(text), kb };
}

function screenRank(chatId) {
    const b = B.get(chatId);
    if (!b) return { text: frame("لا يوجد زعيم."), kb: new InlineKeyboard().text("🔙 رجوع", "bs:ref") };
    const k = B.kindOf(b);
    return { text: frame(`📊 <b>ترتيب الضرر — ${k.n}</b>\n\n${topLines(b, 15)}`), kb: new InlineKeyboard().text("🔙 رجوع", "bs:ref") };
}

// نص نتيجة النهاية (يُرسل للمجموعة)
function resultText(res) {
    const b = res.boss, k = B.kindOf(b);
    let t = res.killed ? `🎉 <b>هُزم ${k.n}!</b>\n\n` : `💀 <b>انتهى الوقت وبقي ${k.n} حيًّا...</b>\n\n`;
    if (!res.results.length) return frame(t + "لم يشارك أحد.");
    res.results.slice(0, 10).forEach(r => {
        t += `${["🥇", "🥈", "🥉"][r.rank - 1] || r.rank + "."} <b>${esc(r.n)}</b> — ${E.fmt(r.d)} ضرر\n   🪙 ${E.fmt(r.coins)}${r.got.length ? " · " + r.got.join(" · ") : ""}\n`;
    });
    t += res.killed ? "\n🧪 كل مشارك أخذ إكسير الحياة. وصاحب أكبر ضرر نال إطارًا حصريًا!" : "\nلم يُهزم الزعيم، فكانت المكافآت صغيرة. تحدّوه معًا في المرة القادمة!";
    return frame(t);
}

module.exports = { screenBoss, screenRank, resultText, esc };