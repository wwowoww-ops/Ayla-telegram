// شاشات البوس الجماعي (v2): التسجيل، اختيار الحيوانات، النتائج، التفاصيل
const { InlineKeyboard } = require("grammy");
const B = require("./boss");
const S = require("./bossSkills");
const E = require("./engine");
const D = require("./data");
const store = require("../core/store");
const { frame } = require("./menus");

const esc = s => String(s).replace(/[&<>]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
const medal = i => ["🥇", "🥈", "🥉"][i] || (i + 1) + ".";
const PER_PAGE = 8;
const cut = t => (t.length > 3900 ? t.slice(0, 3890) + "\n…" : t);

const petLabel = pet => {
    const s = D.SPECIES[pet.sp];
    return `${s.e}${D.ELEMENTS[pet.el].e}${D.RARITIES[s.r].e}`;
};

// ---------- الشاشة الرئيسية في المجموعة ----------
function screenBoss(chatId, now, note) {
    const b = B.get(chatId);
    const kb = new InlineKeyboard();
    const pre = note ? note + "\n\n" : "";
    if (B.open(b)) {
        const k = B.kindOf(b), el = D.ELEMENTS[k.el];
        const list = Object.values(b.reg);
        let t = pre + `${k.e} <b>${k.n}</b>  ${el.e} ${el.n}  <i>(مستوى ${b.level + 1})</i>\n\n`;
        t += `📝 <b>التسجيل مفتوح</b> — ينتهي بعد ${E.dur(Math.max(0, b.regEnd - now))}\n`;
        t += `يبدأ القتال تلقائيًا عند انتهاء المهلة، أو عندما يستعد الجميع (لاعبان فأكثر)، أو عندما يبدأه من استدعى الزعيم.\n\n`;
        t += `👥 <b>المسجّلون (${list.length}):</b>\n`;
        t += list.length ? list.map(r => `${r.ready ? "✅" : "⏳"} ${esc(r.n)} — ${r.pets.length} حيوان`).join("\n") : "لا أحد بعد.";
        t += `\n\n💡 ${D.ELEMENTS[Object.keys(D.BEATS).find(x => D.BEATS[x] === k.el)].e} حيوانات العنصر الذي يهزم عنصر الزعيم تضربه أقوى. وحيوانات الماء والنور تعالج الفريق!`;
        kb.text("📝 تسجيل / تعديل فريقي", "bs:reg").row().text("▶️ ابدأ القتال", "bs:go").text("🔄 تحديث", "bs:ref");
        return { text: frame(cut(t)), kb };
    }
    const G = store.getGroup(chatId);
    const cool = G.bossNextAt && now < G.bossNextAt;
    let t = pre + "👑 <b>البوس الجماعي</b>\n\n";
    if (b && b.report) {
        const k = B.kindOf(b);
        t += `آخر قتال: ${k.e} ${k.n} — ${b.killed ? "🎉 هُزم" : "💀 نجا"}\n`;
        const top = b.report.players && b.report.players[0];
        if (top) t += `🥇 ${esc(top.n)} (${E.fmt(top.dmg)} ضرر)\n`;
        t += "\n";
    }
    t += cool ? "⏳ الزعيم القادم يظهر بعد " + E.dur(G.bossNextAt - now) + "." : "لا يوجد زعيم الآن. استدعِ واحدًا ليسجّل الجميع ويقاتلوه معًا!";
    if (G.bossKills) t += `\n\n🏆 زعماء هُزموا في هذه المجموعة: ${G.bossKills}`;
    if (!cool) kb.text("🔥 استدعاء الزعيم", "bs:spawn").row();
    if (b && b.report) kb.text("📋 تفاصيل آخر قتال", "bs:det:0");
    return { text: frame(t), kb };
}

// ---------- واجهة اختيار الحيوانات (لكل لاعب) ----------
function skillLines(pet) {
    const d = S.describe(pet);
    return `${petLabel(pet)} <b>${esc(pet.nick || D.SPECIES[pet.sp].n)}</b> Lv${pet.lv} — ⚔️ ${E.fmt(E.power(pet))}\n   • ${d.passive}\n   • ${d.active}`;
}
function screenPick(P, chatId, page, note) {
    const b = B.get(chatId);
    const r = B.open(b) && b.reg[P.id];
    if (!r) return { text: frame("انتهى التسجيل أو لست مسجّلًا."), kb: new InlineKeyboard() };
    const all = B.ranked(P);
    const pages = Math.max(1, Math.ceil(all.length / PER_PAGE));
    page = Math.min(Math.max(0, page | 0), pages - 1);
    const sel = r.pets.map(id => P.pets.find(p => p.id === id)).filter(Boolean);
    let t = (note ? note + "\n\n" : "") + `⚔️ <b>فريقك لقتال ${B.kindOf(b).n}</b>\nاختر حتى ${B.TEAM} حيوانات (${sel.length}/${B.TEAM}).\n\n`;
    t += sel.length ? sel.map(skillLines).join("\n\n") : "لم تختر شيئًا بعد.";
    t += `\n\n${r.ready ? "✅ أنت جاهز" : "⏳ لم تضغط جاهز بعد"}`;
    const kb = new InlineKeyboard();
    const slice = all.slice(page * PER_PAGE, (page + 1) * PER_PAGE);
    slice.forEach((p, i) => {
        kb.text(`${r.pets.includes(p.id) ? "✅" : "▫️"} ${petLabel(p)} Lv${p.lv}`, `bs:pk:${P.id}:${p.id}:${page}`);
        if (i % 2) kb.row();
    });
    if (slice.length % 2) kb.row();
    if (pages > 1) {
        if (page > 0) kb.text("⬅️", `bs:pg:${P.id}:${page - 1}`);
        kb.text(`${page + 1}/${pages}`, `bs:pg:${P.id}:${page}`);
        if (page < pages - 1) kb.text("➡️", `bs:pg:${P.id}:${page + 1}`);
        kb.row();
    }
    if (r.ready) kb.text("↩️ إلغاء الجاهزية", `bs:nr:${P.id}:${page}`);
    else kb.text("✔️ جاهز للقتال", `bs:rd:${P.id}:${page}`);
    kb.row().text("🚪 انسحاب", `bs:lv:${P.id}`).text("🔙 إغلاق", `bs:cl:${P.id}`);
    return { text: cut(t), kb };
}

// ---------- النتيجة (تُرسل للمجموعة) ----------
function resultText(res) {
    const b = res.boss, k = B.kindOf(b);
    if (res.canceled) return frame(`🚫 أُلغي ${k.n}: لم يسجّل أحد.`);
    const rep = res.report;
    let t = res.killed ? `🎉 <b>هُزم ${k.n}!</b>` : `💀 <b>صمد ${k.n}!</b>  (بقي ${Math.round(rep.bossLeft / rep.bossMax * 100)}% من حياته)`;
    t += `\n⏱️ ${rep.rounds} جولات · 👥 ${res.results.length} لاعبًا\n\n`;
    res.results.slice(0, 10).forEach((r, i) => {
        t += `${medal(i)} <b>${esc(r.n)}</b> — ⚔️ ${E.fmt(r.dmg)}${r.heal ? " · 💚 " + E.fmt(r.heal) : ""}\n   🪙 ${E.fmt(r.coins)}${r.got.length ? " · " + r.got.join(" · ") : ""}\n`;
    });
    t += res.killed ? "\n🧪 كل مشارك أخذ إكسير الحياة. وصاحب أعلى مساهمة نال إطارًا حصريًا!" : "\nلم يُهزم الزعيم، فكانت المكافآت صغيرة. اجمعوا علاجًا وحماية وحاولوا ثانية!";
    return frame(cut(t));
}
const resultKb = () => new InlineKeyboard().text("📋 التفاصيل", "bs:det:0");

// ---------- التفاصيل ----------
function screenDetails(chatId, page) {
    const b = B.get(chatId);
    const rep = b && b.report;
    const back = new InlineKeyboard().text("🔙 رجوع", "bs:ref");
    if (!rep) return { text: frame("لا توجد تفاصيل."), kb: back };
    const k = B.kindOf(b);
    const tabs = (p) => new InlineKeyboard()
        .text(p === 0 ? "• اللاعبون •" : "اللاعبون", "bs:det:0").text(p === 1 ? "• الحيوانات •" : "الحيوانات", "bs:det:1").text(p === 2 ? "• الأحداث •" : "الأحداث", "bs:det:2")
        .row().text("🔙 رجوع", "bs:ref");
    page = Math.min(2, Math.max(0, page | 0));
    const units = rep.units;
    const sum = f => units.reduce((s, u) => s + f(u), 0);
    let t = `📋 <b>تفاصيل قتال ${k.n}</b> ${b.killed ? "🎉" : "💀"}\n`;
    if (page === 0) {
        const heals = sum(u => u.healN), healAmt = sum(u => u.heal), dead = sum(u => u.deaths), rev = sum(u => u.rev);
        t += `\n📊 <b>إجمالي:</b>\n⏱️ جولات: ${rep.rounds}\n⚔️ ضرر الفريق: ${E.fmt(sum(u => u.dmg))}\n💚 مرات العلاج: ${heals} (${E.fmt(healAmt)})\n💀 سقوط: ${dead}${rev ? " · 💫 إحياء: " + rev : ""}\n🩸 ضرر تلقّاه الفريق: ${E.fmt(sum(u => u.taken))}\n`;
        const mvpD = [...units].sort((a, c) => c.dmg - a.dmg)[0], mvpH = [...units].sort((a, c) => c.heal - a.heal)[0], tank = [...units].sort((a, c) => c.taken - a.taken)[0];
        if (mvpD && mvpD.dmg) t += `\n🏅 أكثر ضررًا: ${mvpD.e}${esc(mvpD.owner)} (${E.fmt(mvpD.dmg)})`;
        if (mvpH && mvpH.heal) t += `\n💚 أكثر علاجًا: ${mvpH.e}${esc(mvpH.owner)} (${E.fmt(mvpH.heal)})`;
        if (tank && tank.taken) t += `\n🛡️ أكثر تحمّلًا: ${tank.e}${esc(tank.owner)} (${E.fmt(tank.taken)})`;
        t += `\n\n👥 <b>اللاعبون:</b>\n`;
        (rep.players || []).slice(0, 12).forEach((p, i) => {
            t += `${medal(i)} ${esc(p.n)}: ⚔️ ${E.fmt(p.dmg)} · 💚 ${E.fmt(p.heal)} (${p.healN}×) · 🩸 ${E.fmt(p.taken)}${p.deaths ? " · 💀" + p.deaths : ""}\n`;
        });
    } else if (page === 1) {
        t += `\n🐾 <b>كل حيوان</b> (بالضرر):\n`;
        [...units].sort((a, c) => c.dmg + c.heal - (a.dmg + a.heal)).slice(0, 24).forEach(u => {
            t += `${u.e}${D.ELEMENTS[u.el].e} ${esc(u.owner)}${u.alive ? "" : " 💀"}: ⚔️ ${E.fmt(u.dmg)}`;
            if (u.heal) t += ` · 💚 ${E.fmt(u.heal)} (${u.healN}×)`;
            t += ` · 🩸 ${E.fmt(u.taken)} · ✨${u.casts}\n`;
        });
    } else {
        t += `\n📜 <b>أبرز الأحداث:</b>\n` + (rep.events.length ? rep.events.map(esc).join("\n") : "—");
    }
    return { text: frame(cut(t)), kb: tabs(page) };
}

module.exports = { screenBoss, screenPick, screenDetails, resultText, resultKb, esc };