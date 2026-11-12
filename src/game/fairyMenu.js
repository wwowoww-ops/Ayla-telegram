// قوائم الجنيات: الرئيسية، التجهيز، الترقية، الدليل
const { InlineKeyboard } = require("grammy");
const F = require("./fairies");
const E = require("./engine");
const { frame } = require("./menus");

const stars = r => "⭐".repeat(r) || "—";

function header(P, note) {
    F.st(P);
    return (note ? note + "\n\n" : "") + `🧚 <b>الجنيات</b>\n✨ الغبار: ${P.dust} · 🪙 ${E.fmt(P.coins)}\nخانات التجهيز: ${P.fequip.length}/${P.fslots}\n`;
}
const row = (P, x) => {
    const on = P.fequip.includes(x.id);
    return `${on ? "✅" : "▫️"} ${x.t.e} <b>${x.t.n}</b> ${F.RANK_E[x.f.rank]}${F.RANKS[x.f.rank]} · مستوى ${x.f.lv}/${F.MAX_LV}` +
        (x.f.rank < F.MAX_RANK ? ` · نسخ ${x.f.copies}/${F.COPIES[x.f.rank]}` : "") + `\n    ↳ ${F.buffTxt(F.buffOf(x.t, x.f))}`;
};

function screenMain(P, note) {
    const list = F.owned(P);
    let t = header(P, note) + "\n";
    t += list.length ? list.map(x => row(P, x)).join("\n") : "لا تملك جنيات بعد. استدعِ أولى جنياتك!";
    t += `\n\n🔮 استدعاء: ${E.fmt(F.summonCost(P))} 🪙`;
    const kb = new InlineKeyboard()
        .text("🔮 استدعاء", `fy:${P.id}:sum`).text("🎒 التجهيز", `fy:${P.id}:eq`).row()
        .text("⬆️ ترقية بالغبار", `fy:${P.id}:up`).text("📖 الدليل", `fy:${P.id}:gd`);
    const sp = F.slotPrice(P);
    if (sp) kb.row().text(`➕ خانة جديدة (${E.fmt(sp)})`, `fy:${P.id}:slot`);
    kb.row().text("🏠 القائمة الرئيسية", `g:${P.id}:home`);
    return { text: frame(t.slice(0, 3900)), kb };
}

function screenEquip(P, note) {
    const list = F.owned(P);
    let t = header(P, note) + "\nاضغط لتجهيز جنية أو إزالتها. تعمل بفاتها في كل اللعبة وهي مجهزة.\n";
    const kb = new InlineKeyboard();
    list.forEach((x, i) => {
        kb.text(`${P.fequip.includes(x.id) ? "✅" : "▫️"} ${x.t.e} ${x.t.n}`, `fy:${P.id}:tg:${x.id}`);
        if (i % 2) kb.row();
    });
    if (list.length % 2) kb.row();
    kb.text("🔙 رجوع", `fy:${P.id}:main`);
    return { text: frame(t), kb };
}

function screenUp(P, note) {
    const list = F.owned(P);
    let t = header(P, note) + "\nالترقية تكلّف غبارًا ✨ (يأتي من البوس واليومية والصيد والنسخ الزائدة):\n";
    const kb = new InlineKeyboard();
    list.forEach((x, i) => {
        const max = x.f.lv >= F.MAX_LV;
        t += `\n${x.t.e} ${x.t.n}: مستوى ${x.f.lv}${max ? " (أعلى مستوى)" : " ← " + F.upDust(x.f) + " ✨"}`;
        kb.text(`${x.t.e} ${max ? "✔️" : "⬆️ " + F.upDust(x.f) + "✨"}`, `fy:${P.id}:lv:${x.id}`);
        if (i % 3 === 2) kb.row();
    });
    kb.row().text("🔙 رجوع", `fy:${P.id}:main`);
    return { text: frame(t.slice(0, 3900)), kb };
}

function screenGuide(P) {
    let t = "📖 <b>دليل الجنيات</b>\nكل جنية يمكن استدعاؤها بالعملات. النسخ المكررة ترفع <b>الرتبة</b>، والغبار يرفع <b>المستوى</b>.\n\n";
    F.TYPES.forEach(x => {
        const base = F.buffTxt(x.fx);
        const mx = F.buffTxt(F.buffOf(x, { rank: F.MAX_RANK, lv: F.MAX_LV }));
        t += `${x.e} <b>${x.n}</b>${x.mythic ? " 🌟 نادرة" : ""}\n   البداية: ${base}\n   الأقصى: ${mx}\n`;
    });
    return { text: frame(t.slice(0, 3900)), kb: new InlineKeyboard().text("🔙 رجوع", `fy:${P.id}:main`) };
}

module.exports = { screenMain, screenEquip, screenUp, screenGuide };