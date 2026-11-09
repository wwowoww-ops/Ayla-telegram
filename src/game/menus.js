// قوائم إضافية للعبة: المهام، الإنجازات، الملف الشخصي، المخزن، الدليل
const { InlineKeyboard } = require("grammy");
const D = require("./data");
const E = require("./engine");
const Q = require("./quests");
const { esc } = require("../lib/util");

const HEADER = "🌸 ═══ 𝐀𝐘𝐋𝐀 〢 𝐏𝐄𝐓𝐒 ═══ 🌸";
const FOOTER = "╰┈➤ 𝐀𝐘𝐋𝐀 • 𝐏𝐄𝐓 𝐒𝐘𝐒𝐓𝐄𝐌 🌸";
const frame = text => `${HEADER}\n\n${text}\n\n${FOOTER}`;

const fmt = E.fmt;
const bar = (cur, max, n = 10) => {
    const f = Math.max(0, Math.min(n, Math.floor(cur / max * n)));
    return "█".repeat(f) + "░".repeat(n - f);
};

// أزرار التنقل بين القوائم الإضافية + الرجوع للقائمة الرئيسية للعبة
function nav(uid, current) {
    const kb = new InlineKeyboard();
    const tabs = [["quests", "🎯 مهام"], ["ach", "🏅 إنجازات"], ["profile", "👤 ملفي"], ["bag", "🎒 المخزن"]];
    tabs.filter(t => t[0] !== current).forEach(t => kb.text(t[1], `q:${uid}:${t[0]}`));
    if (current !== "guide") kb.text("📖 دليل", `q:${uid}:guide`);
    kb.row().text("🏠 القائمة الرئيسية", `g:${uid}:home`);
    return kb;
}

// إشعار بما تحقق الآن (يظهر أعلى القائمة)
function settledNote(res) {
    if (!res || !res.any) return "";
    const lines = [];
    res.missions.forEach(m => lines.push(`✅ مهمة: ${m.text}  ← 🪙 ${fmt(m.reward.coins)} ${Q.itemsTxt(m.reward.items)}`));
    if (res.bonus) lines.push(`🎉 أنهيت كل مهام اليوم! 🪙 ${fmt(res.bonus.coins)} ${Q.itemsTxt(res.bonus.items)}`);
    res.achievements.forEach(a => lines.push(`🏅 إنجاز: ${a.name}  ← 🪙 ${fmt(a.reward.coins)} ${Q.itemsTxt(a.reward.items)}`));
    return lines.join("\n") + "\n\n";
}

function screenQuests(P, res, now) {
    const M = Q.ensureMissions(P, now);
    let text = settledNote(res) + "🎯 <b>مهام اليوم</b>\n";
    M.list.forEach(m => {
        const cur = Q.missionProgress(P, m);
        const done = !!M.done[m.id];
        text += `\n${done ? "✅" : "⬜"} ${Q.missionText(m)}\n   ${bar(cur, m.target)} ${cur}/${m.target}`;
    });
    const doneCount = M.list.filter(m => M.done[m.id]).length;
    const r = Q.missionReward(P), b = Q.bonusReward(P);
    text += `\n\n📊 أنجزت ${doneCount}/${M.list.length}`;
    text += `\n🎁 كل مهمة: 🪙 ${fmt(r.coins)} ${Q.itemsTxt(r.items)}`;
    text += `\n🏆 إكمال الكل: 🪙 ${fmt(b.coins)} ${Q.itemsTxt(b.items)}${M.bonus ? " ✅" : ""}`;
    text += "\n\n⏳ تتجدد منتصف الليل (توقيت تونس). المكافآت تُمنح تلقائيًا.";
    return { text: frame(text), kb: nav(P.id, "quests") };
}

function screenAchievements(P, res) {
    P.ach = P.ach || {};
    let total = 0, got = 0;
    let text = settledNote(res) + "🏅 <b>الإنجازات</b>\n";
    for (const c of Q.CATEGORIES) {
        const v = c.value(P);
        const done = c.tiers.filter((_, i) => P.ach[c.id + ":" + i]).length;
        total += c.tiers.length; got += done;
        const label = c.label ? c.label(v) : fmt(v);
        if (done >= c.tiers.length) { text += `\n✅ <b>${c.name}</b> — مكتمل`; continue; }
        const target = c.tiers[done];
        text += `\n🔸 <b>${c.name}</b> (${done}/${c.tiers.length})\n   ${bar(v, target)} ${c.label ? label + " ← " + c.label(target) : fmt(v) + "/" + fmt(target)}` +
            `  ← 🪙 ${fmt(Q.TIER_COINS[done])}`;
    }
    text = text.replace("🏅 <b>الإنجازات</b>\n", `🏅 <b>الإنجازات</b> — ${got}/${total}\n`);
    text += "\n\n✨ تُمنح المكافأة تلقائيًا عند الوصول للهدف.";
    return { text: frame(text), kb: nav(P.id, "ach") };
}

function screenProfile(P, now) {
    const pets = [...P.pets].sort((a, b) => E.power(b) - E.power(a));
    const top = pets[0];
    const s = P.stats;
    const days = Math.max(1, Math.floor((now - P.created) / 86400000) + 1);
    let text = `👤 <b>${esc(P.name)}</b> — اليوم ${days} في اللعبة\n\n` +
        `🪙 الرصيد: <b>${fmt(P.coins)}</b>\n` +
        `⚔️ القوة الكلية: ${fmt(E.totalPower(P))}\n` +
        `💰 الدخل: ${fmt(E.incomeAll(P))}/ساعة\n` +
        `🐾 الحظيرة: ${P.pets.length}/${P.slots}   🥚 الحضانة: ${P.eggs.length}/${P.hatchSlots}\n` +
        `🔥 المواظبة: ${P.streak || 0} يوم\n`;
    if (top) {
        const sp = E.spOf(top), r = D.RARITIES[sp.r];
        text += `\n👑 أقوى حيوان: ${sp.e} ${esc(top.nick || sp.n)} ${r.e} Lv.${top.lv}${top.st ? " " + "⭐".repeat(top.st) : ""} — ${fmt(E.power(top))}\n`;
    }
    text += `\n📈 <b>الإحصائيات</b>\n` +
        `• الصيد: ${fmt(s.hunts)} (فوز ${fmt(s.wins)})\n` +
        `• المبارزات: ${fmt(s.duels)} (فوز ${fmt(s.duelWins)})\n` +
        `• البيض المفقوس: ${fmt(s.hatched)}\n` +
        `• التزاوج: ${fmt(s.bred)}`;
    return { text: frame(text), kb: nav(P.id, "profile") };
}

function screenBag(P) {
    const foods = Object.keys(P.items).filter(id => P.items[id] > 0 && D.FOODS[id]);
    let text = "🎒 <b>المخزن</b>\n\n";
    if (!foods.length) text += "فارغ. اشترِ طعامًا من 🛒 المتجر.\n";
    foods.forEach(id => {
        const f = D.FOODS[id];
        const eff = [`جوع +${f.hg}`];
        if (f.xp && !f.el) eff.push(`خبرة +${Math.round(f.xp * 100)}%`);
        if (f.el) eff.push(`${D.ELEMENTS[f.el].e} ${D.ELEMENTS[f.el].n}`);
        text += `${f.e} <b>${f.n}</b> ×${P.items[id]} — ${eff.join(" · ")}\n`;
    });
    const t = Date.now();
    text += `\n🥚 <b>البيض</b>\n`;
    if (!P.eggs.length) text += "لا بيض في الحضانة.\n";
    P.eggs.forEach(e => {
        const d = D.EGGS[e.tier];
        text += `${d.e} ${d.n}${e.bred ? " (تزاوج)" : ""}: ${e.readyAt <= t ? "🐣 جاهزة" : "⏳ " + E.dur(e.readyAt - t)}\n`;
    });
    return { text: frame(text), kb: nav(P.id, "bag") };
}

function screenGuide(P) {
    const text =
        "📖 <b>دليل سريع</b>\n\n" +
        "1️⃣ افقس بيضتك الأولى من 🥚 الحضانة.\n" +
        "2️⃣ أطعم حيوانك وجمّع الأرباح 💰 كل فترة.\n" +
        "3️⃣ اصطد ⚔️ لتربح ذهبًا وخبرة وبيضًا.\n" +
        "4️⃣ اشترِ بيضًا أغلى لندرة أعلى.\n" +
        "5️⃣ زاوج 🧬 حيوانين لبيضة بجودة أعلى.\n" +
        "6️⃣ العناصر: 🔥>🌿>🪨>⚡>💧>🔥، و✨↔🌑.\n" +
        "7️⃣ أنجز 🎯 المهام اليومية و🏅 الإنجازات، فمكافآتها تأتيك تلقائيًا.\n\n" +
        "الأوامر: حيواني • مهام • انجازات • ملفي • مخزن";
    return { text: frame(text), kb: nav(P.id, "guide") };
}

module.exports = { screenQuests, screenAchievements, screenProfile, screenBag, screenGuide, settledNote, frame };