// شاشات البوس الجماعي (v3): التسجيل، اختيار الحيوانات والنمط، القتال المباشر، النتائج، التفاصيل
const { InlineKeyboard } = require("grammy");
const B = require("./index");
const S = require("./skills");
const E = require("../engine");
const D = require("../data");
const store = require("../../core/store");
const Live = require("./live");
const Fight = require("./fight");
const { frame } = require("../menus");

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
    if (b && b.phase === "live") {
        const k = B.kindOf(b);
        return { text: frame(pre + `${k.e} <b>${k.n}</b>\n\n⚔️ <b>القتال جارٍ الآن!</b> تابع رسالة القتال أدناه.`), kb };
    }
    if (B.open(b)) {
        const k = B.kindOf(b), el = D.ELEMENTS[k.el];
        const list = Object.values(b.reg);
        let t = pre + `${k.e} <b>${k.n}</b>  ${el.e} ${el.n}  <i>(مستوى ${b.level + 1})</i>\n\n`;
        t += `📝 <b>التسجيل مفتوح</b> — ينتهي بعد ${E.dur(Math.max(0, b.regEnd - now))}\n`;
        t += `يبدأ القتال تلقائيًا عند انتهاء المهلة، أو عندما يستعد الجميع (لاعبان فأكثر)، أو عندما يبدأه من استدعى الزعيم.\n\n`;
        t += `👥 <b>المسجّلون (${list.length}):</b>\n`;
        t += list.length ? list.map(r => `${r.ready ? "✅" : "⏳"} ${r.mode === "manual" ? "🎮" : "🤖"} ${esc(r.n)} — ${r.pets.length} حيوان`).join("\n") : "لا أحد بعد.";
        t += `\n\n🎮 يدوي: تختار مهارات حيواناتك كل جولة · 🤖 أوتو: يقاتل الذكاء الاصطناعي عنك.`;
        t += `\n\n💡 ${D.beatenBy(k.el).map(x => D.ELEMENTS[x].e).join("")} حيوانات العنصر الذي يهزم عنصر الزعيم تضربه أقوى. وحيوانات الماء والنور تعالج الفريق!`;
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
    const Gx = G;
    if (!cool) kb.text("🔥 استدعاء الزعيم", "bs:spawn").row();
    else kb.text(`⏩ تسريع ساعة (${B.SPEED_COST}🔷)`, "bs:sp").text(`⚡ استدعاء فوري (${B.nowCost(Gx)}🔷)`, "bs:sn").row();
    kb.text("🎯 اختر الزعيم", "bs:gl").row();
    if (b && b.report) kb.text("📋 تفاصيل آخر قتال", "bs:det:0");
    return { text: frame(t), kb };
}

// اختيار نوع الزعيم بالموارد
function screenGuided(chatId) {
    const kb = new InlineKeyboard();
    let t = `🎯 <b>استدعاء موجّه</b>\nيظهر الزعيم الذي تختاره فورًا (يتجاوز الانتظار).\nالتكلفة: ${B.GUIDE_CRYSTALS} 🔷 + ${B.GUIDE_ESS} جواهر من عنصره.\n`;
    B.KINDS.forEach((k, i) => {
        const r = D.RES["ess_" + k.el];
        t += `\n${k.e} ${k.n} — ${r.e} ${r.n}`;
        kb.text(`${k.e} ${k.n}`, `bs:gd:${i}`);
        if (i % 2) kb.row();
    });
    kb.row().text("🔙 رجوع", "bs:ref");
    return { text: frame(t), kb };
}

// بفات فريقك في هذا القتال
function teamBuffs(P, b, r) {
    const Fair = require("../fairies"), fm = Fair.bossMods(P), k = B.kindOf(b);
    const pc = x => Math.round(x * 100) + "%";
    const lines = [];
    const pets = (r.pets || []).map(id => P.pets.find(p => p.id === id)).filter(Boolean);
    const adv = pets.filter(p => D.elementMult(p.el, k.el) > 1).length, weak = pets.filter(p => D.elementMult(p.el, k.el) < 1).length;
    if (adv) lines.push(`⬆️ ${adv} حيوان يتفوق عنصره على ${k.n}`);
    if (weak) lines.push(`⬇️ ${weak} حيوان عنصره ضعيف أمامه`);
    const aura = pets.filter(p => p.el === "light").length, heal = pets.filter(p => p.el === "water" || p.el === "light").length;
    if (aura) lines.push(`🌟 هالة النور: +ضرر للجميع`);
    if (!heal) lines.push("⚠️ لا معالج في فريقك (ماء/نور)");
    if (fm.atk) lines.push(`🧚 جنياتك: +${pc(fm.atk)} ضرر على البوس`);
    if (fm.hp) lines.push(`🧚 جنياتك: +${pc(fm.hp)} حياة`);
    if (fm.heal) lines.push(`🧚 جنياتك: +${pc(fm.heal)} علاج`);
    if (fm.dr) lines.push(`🧚 جنياتك: −${pc(fm.dr)} ضرر مستلم`);
    if (r.boost) lines.push(`💪 تعزيز بالبلورات: +${pc(B.BOOST_ATK)} ضرر`);
    return lines.length ? "\n\n✨ <b>بفاتك الحالية:</b>\n" + lines.join("\n") : "";
}

// ---------- واجهة اختيار الحيوانات (لكل لاعب) ----------
function skillLines(pet) {
    const d = S.describe(pet);
    return `${petLabel(pet)} <b>${esc(pet.nick || D.SPECIES[pet.sp].n)}</b> Lv${pet.lv} — ⚔️ ${E.fmt(E.power(pet))}\n   • ${d.passive}\n` + d.skills.map((x, i) => `   ${["①", "②", "③"][i]} ${x}`).join("\n");
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
    t += `\n\n🕹️ النمط: <b>${r.mode === "manual" ? "🎮 يدوي (تختار المهارات كل جولة)" : "🤖 أوتو (القتال تلقائي)"}</b>`;
    t += `\n${r.ready ? "✅ أنت جاهز" : "⏳ لم تضغط جاهز بعد"}`;
    t += teamBuffs(P, b, r);
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
    kb.text(r.mode === "manual" ? "🎮 يدوي ← تحويل إلى أوتو 🤖" : "🤖 أوتو ← تحويل إلى يدوي 🎮", `bs:md:${P.id}:${page}`).row();
    if (!r.boost && !r.ready) kb.text(`💪 تعزيز +${Math.round(B.BOOST_ATK * 100)}% (${B.BOOST_COST}🔷)`, `bs:bo:${P.id}:${page}`).row();
    if (r.ready) kb.text("↩️ إلغاء الجاهزية", `bs:nr:${P.id}:${page}`);
    else kb.text("✔️ جاهز للقتال", `bs:rd:${P.id}:${page}`);
    kb.row().text("🚪 انسحاب", `bs:lv:${P.id}`).text("🔙 إغلاق", `bs:cl:${P.id}`);
    return { text: cut(t), kb };
}

// ---------- القتال المباشر ----------
const bar = (a, b, n = 12) => { const k = Math.max(0, Math.min(1, b ? a / b : 0)), f = Math.round(k * n); return "█".repeat(f) + "░".repeat(n - f); };
const secs = (s, now) => Math.max(0, Math.ceil((s.deadline - now) / 1000));

function screenLive(s, now, final) {
    const st = s.st, k = st.kind;
    let t = `${k.e} <b>${k.n}</b>  — الجولة ${Math.min(st.round + (st.done ? 0 : 1), Fight.ROUNDS)}/${Fight.ROUNDS}\n`;
    t += `❤️ ${bar(st.hp, st.maxHp)} ${Math.ceil(st.hp / st.maxHp * 100)}%${st.raged ? " 😡" : ""}${st.stun > 0 ? " 😵" : ""}${st.curse.n > 0 ? " ☠️" : ""}${st.burn.n > 0 ? " ♨️" : ""}\n\n`;
    t += `👥 <b>الفريق:</b>\n`;
    const by = {};
    st.units.forEach(u => { (by[u.uid] = by[u.uid] || []).push(u); });
    Object.entries(by).forEach(([uid, us]) => {
        const mode = s.modes[uid] === "manual" ? "🎮" : "🤖";
        const ok = s.modes[uid] === "manual" && !st.done ? (s.confirmed.has(uid) ? " ✅" : " ⏳") : "";
        t += `${mode} ${esc(us[0].owner)}${ok}: ` + us.map(u => `${u.e}${u.hp > 0 ? Math.ceil(u.hp / u.maxHp * 100) + "%" : "💀"}`).join(" ") + "\n";
    });
    if (s.last && s.last.length) t += `\n📜 <b>ما حدث في الجولة ${st.round}:</b>\n` + s.last.slice(0, 18).map(esc).join("\n");
    if (!st.done && !final) t += `\n\n⏱️ ${secs(s, now)} ث لاختيار الجولة القادمة (🎮 اختر من لوحتك ثم ✅). الأوتو يلعب وحده.`;
    return { text: frame(cut(t)), kb: new InlineKeyboard() };
}

// لوحة تحكم لاعب يدوي (رسالة خاصة بصاحبها)
function screenPanel(s, uid, now) {
    const st = s.st, mine = Live.unitsOf(s, uid);
    let t = `🎮 <b>لوحة التحكم</b> — ${esc(((s.parts.find(p => String(p.uid) === String(uid))) || {}).name || "")}\n`;
    t += `الجولة ${st.round + 1}/${Fight.ROUNDS} · ⏱️ ${secs(s, now)} ث\n\n`;
    const kb = new InlineKeyboard();
    mine.forEach(u => {
        const sel = s.cmds[u.id];
        const sk = S.SKILLS[u.el];
        t += `${u.hp > 0 ? u.e : "💀"} <b>${esc(u.pet.nick || D.SPECIES[u.pet.sp].n)}</b> — ❤️ ${Math.max(0, Math.ceil(u.hp))}/${u.maxHp}${u.shield > 0 ? " 🛡️" : ""}\n`;
        if (u.hp <= 0) { t += "   ساقط\n"; return; }
        t += "   " + sk.map((x, i) => `${["①", "②", "③"][i]}${x.e}${x.n}${u.cd[i] > 0 ? "⏳" + u.cd[i] : ""}`).join("  ") + "\n";
        t += `   المختار: ${sel === undefined ? "🤖 تلقائي" : sel === 0 ? "⚔️ هجوم" : sk[sel - 1].e + " " + sk[sel - 1].n}\n`;
        kb.text(`${u.e}${sel === 0 ? "✅" : ""}⚔️`, `bs:cm:${uid}:${u.id}:0`);
        sk.forEach((x, i) => {
            const cd = u.cd[i];
            kb.text(cd > 0 ? `⏳${cd}` : `${sel === i + 1 ? "✅" : ""}${x.e}`, `bs:cm:${uid}:${u.id}:${i + 1}`);
        });
        kb.row();
    });
    t += `\n⚔️ = هجوم عادي · ⏳ = جولات انتظار المهارة. ما لم تختر له يلعب تلقائيًا.`;
    kb.text("✅ تأكيد الجولة", `bs:ok:${uid}`);
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

module.exports = { screenGuided, teamBuffs, screenBoss, screenPick, screenLive, screenPanel, screenDetails, resultText, resultKb, esc };