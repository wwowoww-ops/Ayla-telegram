// قوائم الجنيات: الرئيسية، التجهيز، المتجر، الإطلاق، الدليل
const { InlineKeyboard } = require("grammy");
const F = require("./fairies");
const E = require("./engine");
const { frame } = require("./menus");

const sorted = P => [...F.st(P).fairies].sort((a, b) => F.sp(b).r - F.sp(a).r || F.lvOf(b) - F.lvOf(a) || a.id - b.id);

function header(P, note) {
    F.st(P);
    return (note ? note + "\n\n" : "") + `🧚 <b>حديقة الجنيات</b> — ${P.fairies.length}/${F.OWN_CAP}\n🪙 ${E.fmt(P.coins)} · خانات التجهيز: ${P.fequip.length}/${P.fslots}\n`;
}
function line(P, f) {
    const lv = F.lvOf(f), on = P.fequip.includes(f.id), s = F.sp(f);
    const nxt = lv >= F.MAX_LV ? "أعلى مستوى" : "المستوى التالي بعد " + E.dur(F.nextLvMs(f));
    return `${on ? "✅" : "▫️"} ${s.e} <b>${s.n}</b> ${F.RANK_E[s.r]} — ${F.RARITIES[s.r]} · مستوى ${lv}/${F.MAX_LV}\n    ↳ ${F.buffTxt(F.buffOf(f))}\n    ⏳ ${nxt}`;
}

function screenMain(P, note) {
    const list = sorted(P);
    let t = header(P, note) + "\n";
    t += list.length ? list.map(f => line(P, f)).join("\n") : "لا تملك جنيات بعد.\nاصطدها بالصيد (فرصة صغيرة جدًا عند الفوز)، أو اشترها من المتجر اليومي.";
    t += "\n\n⏳ تنمو الجنيات بمرور الوقت فقط، وتعمل بفاتها وهي مجهزة.";
    const kb = new InlineKeyboard()
        .text("🛒 متجر الجنيات", `fy:${P.id}:shop`).text("🎒 التجهيز", `fy:${P.id}:eq`).row()
        .text("🕊️ إطلاق", `fy:${P.id}:rl`).text("📖 الدليل", `fy:${P.id}:gd`);
    const sp = F.slotPrice(P);
    if (sp) kb.row().text(`➕ خانة تجهيز (${E.fmt(sp)})`, `fy:${P.id}:slot`);
    kb.row().text("🏠 القائمة الرئيسية", `g:${P.id}:home`);
    return { text: frame(t.slice(0, 3900)), kb };
}

function screenEquip(P, note) {
    const list = sorted(P);
    const kb = new InlineKeyboard();
    list.forEach((f, i) => {
        kb.text(`${P.fequip.includes(f.id) ? "✅" : "▫️"} ${F.sp(f).e} Lv${F.lvOf(f)}`, `fy:${P.id}:tg:${f.id}`);
        if (i % 3 === 2) kb.row();
    });
    if (list.length % 3) kb.row();
    kb.text("🔙 رجوع", `fy:${P.id}:main`);
    const t = header(P, note) + "\nاضغط لتجهيز جنية أو إزالتها (✅ = مجهزة).\n\n" + list.map(f => `${P.fequip.includes(f.id) ? "✅" : "▫️"} ${F.label(f)} Lv${F.lvOf(f)} — ${F.buffTxt(F.buffOf(f))}`).join("\n");
    return { text: frame(t.slice(0, 3900)), kb };
}

function screenShop(P, note) {
    const offers = F.shop(P);
    let t = header(P, note) + "\n🛒 <b>متجر الجنيات</b> (يتجدد كل يوم، وأسعاره ترتفع مع كثرة جنياتك)\n";
    const kb = new InlineKeyboard();
    offers.forEach((o, i) => {
        const s = F.SPECIES[o.sp];
        t += `\n${o.sold ? "❌ بيعت" : "🆕"} ${s.e} <b>${s.n}</b> ${F.RANK_E[s.r]} ${F.RARITIES[s.r]}\n    ↳ ${F.famTxt(s.fam, s.r, 1)} (ينمو إلى ${F.famTxt(s.fam, s.r, F.MAX_LV)})\n    🪙 ${E.fmt(o.price)}\n`;
        if (!o.sold) kb.text(`🛒 ${s.e} ${E.fmt(o.price)}`, `fy:${P.id}:buy:${i}`).row();
    });
    kb.text("🔙 رجوع", `fy:${P.id}:main`);
    return { text: frame(t), kb };
}

function screenRelease(P, note, askId) {
    const list = sorted(P);
    const kb = new InlineKeyboard();
    let t = header(P, note) + "\n🕊️ <b>إطلاق جنية</b> (لا رجعة ولا تعويض)\n";
    if (askId) {
        const f = F.get(P, askId);
        if (f) {
            t += `\nهل تريد إطلاق ${F.label(f)} (مستوى ${F.lvOf(f)})؟`;
            kb.text("✅ نعم، أطلقها", `fy:${P.id}:rc:${f.id}`).text("❌ لا", `fy:${P.id}:rl`);
            return { text: frame(t), kb };
        }
    }
    list.forEach((f, i) => { kb.text(`${F.sp(f).e} Lv${F.lvOf(f)}`, `fy:${P.id}:ra:${f.id}`); if (i % 4 === 3) kb.row(); });
    if (list.length % 4) kb.row();
    kb.text("🔙 رجوع", `fy:${P.id}:main`);
    return { text: frame(t), kb };
}

function screenGuide(P) {
    let t = "📖 <b>دليل الجنيات</b>\n• <b>الحصول:</b> اصطدها عند الفوز في الصيد (فرصة صغيرة جدًا، وأفضل في المناطق العالية وبجنيات الحظ)، أو اشترها من المتجر اليومي، أو بجائزة البوس لصاحب أعلى ضرر.\n• <b>المستوى:</b> يزيد بمرور الوقت فقط (لا أكل ولا تدريب). الأندر تنمو أبطأ.\n• <b>الخانات:</b> تعمل بفات الجنيات المجهزة فقط.\n\n";
    F.RARITIES.forEach((rn, r) => {
        t += `${F.RANK_E[r]} <b>${rn}</b> — مستوى كل ${F.HOURS_PER_LV[r]} ساعة\n`;
        Object.values(F.SPECIES).filter(s => s.r === r).forEach(s => { t += `   ${s.e} ${s.n}: ${F.famTxt(s.fam, r, 1)}\n`; });
    });
    return { text: frame(t.slice(0, 3900)), kb: new InlineKeyboard().text("🔙 رجوع", `fy:${P.id}:main`) };
}

module.exports = { screenMain, screenEquip, screenShop, screenRelease, screenGuide };