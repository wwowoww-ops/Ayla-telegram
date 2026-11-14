// قوائم الجنيات: الرئيسية، التجهيز، المتجر، الإطلاق، الدليل
const { InlineKeyboard } = require("grammy");
const F = require("./index");
const E = require("../engine");
const { frame } = require("../menus");

const sorted = P => [...F.st(P).fairies].sort((a, b) => F.sp(b).r - F.sp(a).r || F.lvOf(b) - F.lvOf(a) || a.id - b.id);

function header(P, note) {
    F.st(P);
    return (note ? note + "\n\n" : "") + `🧚 <b>حديقة الجنيات</b> — ${P.fairies.length}/${F.OWN_CAP}\n🪙 ${E.fmt(P.coins)} · خانات التجهيز: ${P.fequip.length}/${P.fslots} · ✨ غبار: ${(P.res && P.res.dust) || 0}\n`;
}
const nm = f => f.nick || F.sp(f).n;
function habLine(P, f) {
    const h = F.HABITATS[f.hab], ms = F.nextLvMs(f);
    return `${h.e} ${h.n}: ${F.sp(f).e} ${nm(f)} Lv${F.lvOf(f)}` + (ms > 0 ? ` — المستوى التالي بعد ${E.dur(ms)}` : F.lvOf(f) >= F.MAX_LV ? " — أعلى مستوى" : "");
}
function line(P, f) {
    const lv = F.lvOf(f), on = P.fequip.includes(f.id), s = F.sp(f);
    const ms = F.nextLvMs(f);
    const nxt = lv >= F.MAX_LV ? "أعلى مستوى" : f.hab ? "المستوى التالي بعد " + E.dur(ms) : "🌿 ليست في بيئة (لا تتلفل)";
    return `${on ? "✅" : "▫️"} ${s.e} <b>${esc(nm(f))}</b>${f.nick ? " (" + s.n + ")" : ""} ${F.RANK_E[s.r]} — ${F.RARITIES[s.r]} · مستوى ${lv}/${F.MAX_LV}\n    ↳ ${F.buffTxt(F.buffOf(f))}\n    ⏳ ${nxt}`;
}
function esc(x) { return String(x).replace(/[&<>]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c])); }
const cb = (P, ...p) => `fy:${P.id}:${p.join(":")}`;

// الرئيسية: المجهزة فقط
function screenMain(P, note) {
    F.st(P);
    const eq = P.fequip.map(id => F.get(P, id)).filter(Boolean);
    let t = header(P, note) + "\n";
    t += eq.length ? "<b>المجهزة الآن:</b>\n" + eq.map(f => line(P, f)).join("\n") : "لا جنية مجهزة. افتح 🧚 جنياتي لتجهيز واحدة.";
    const tot = F.buffs(P);
    if (Object.keys(tot).length) t += "\n\n✨ <b>مجموع البفات:</b> " + F.buffTxt(tot);
    const h = F.inHabitat(P);
    t += "\n\n" + (h ? habLine(P, h) : "🌿 لا جنية في البيئة (وحدها تتلفل).");
    const kb = new InlineKeyboard()
        .text(`🧚 جنياتي (${P.fairies.length})`, cb(P, "my", 0)).text("🌿 البيئة", cb(P, "hv")).row()
        .text("🛒 متجر الجنيات", cb(P, "shop")).text("🤝 سوق اللاعبين", `mk:${P.id}:main`).row()
        .text("📊 النسب", cb(P, "rt")).text("📖 الدليل", cb(P, "gd"));
    const sp = F.slotPrice(P);
    if (sp) kb.row().text(`➕ خانة تجهيز (${E.fmt(sp)})`, cb(P, "slot"));
    kb.row().text("🏠 القائمة الرئيسية", `g:${P.id}:home`);
    return { text: frame(t.slice(0, 3900)), kb };
}

// كل جنياتي
function screenMine(P, page, note) {
    const list = sorted(P), per = 8, pages = Math.max(1, Math.ceil(list.length / per));
    page = Math.min(Math.max(0, page | 0), pages - 1);
    const kb = new InlineKeyboard();
    list.slice(page * per, page * per + per).forEach(f => {
        kb.text(`${P.fequip.includes(f.id) ? "✅" : f.hab ? "🌿" : "▫️"} ${F.sp(f).e} ${nm(f)} Lv${F.lvOf(f)} ${F.RANK_E[F.sp(f).r]}`, cb(P, "cd", f.id)).row();
    });
    if (pages > 1) {
        if (page > 0) kb.text("◀️", cb(P, "my", page - 1));
        kb.text(`${page + 1}/${pages}`, cb(P, "my", page));
        if (page < pages - 1) kb.text("▶️", cb(P, "my", page + 1));
        kb.row();
    }
    kb.text("🔙 رجوع", cb(P, "main"));
    const t = header(P, note) + (list.length ? "\nاختر جنية لفتح إعداداتها (✅ مجهزة · 🌿 في البيئة):" : "\nلا تملك جنيات بعد. اصطدها بالصيد أو اشترها من المتجر.");
    return { text: frame(t), kb };
}

// بطاقة جنية: كل إعداداتها
function screenCard(P, id, note) {
    const f = F.get(P, id);
    if (!f) return screenMine(P, 0, "غير موجودة.");
    const on = P.fequip.includes(f.id);
    const kb = new InlineKeyboard();
    kb.text(on ? "❎ إزالة من التجهيز" : "✅ تجهيز", cb(P, "tg", f.id)).row();
    kb.text(f.hab ? "🌿 نزع من البيئة" : "🌿 ضع في البيئة", f.hab ? cb(P, "hr", f.id) : cb(P, "hb", f.id));
    kb.text("✏️ تسمية", cb(P, "rn", f.id)).row();
    if ((P.res && P.res.dust) > 0 && F.lvOf(f) < F.MAX_LV) kb.text("✨ غبار ×1", cb(P, "du", f.id, 1)).text("×5", cb(P, "du", f.id, 5)).row();
    kb.text("🤝 بيع في السوق", `mk:${P.id}:sf:${f.id}`).text("🕊️ إطلاق", cb(P, "ra", f.id)).row();
    kb.text("🔙 جنياتي", cb(P, "my", 0));
    const t = (note ? note + "\n\n" : "") + `🆔 رقم الجنية: <b>${f.id}</b>\n` + line(P, f) + (f.hab ? "\n" + habLine(P, f) : "") +
        `\n\n🔼 ينمو إلى: ${F.famTxt(F.sp(f).fam, F.sp(f).r, F.MAX_LV)}`;
    return { text: frame(t), kb };
}

function screenPickHab(P, id) {
    const f = F.get(P, id);
    if (!f) return screenMine(P, 0, "غير موجودة.");
    const kb = new InlineKeyboard();
    let t = `🌿 <b>اختر بيئة لـ ${F.sp(f).e} ${esc(nm(f))}</b>\nجنية واحدة فقط تتلفل في البيئة، بلا وقت محدد، وتنزعها متى شئت.\n`;
    Object.entries(F.HABITATS).forEach(([k, h]) => {
        const fav = h.fams.includes(F.sp(f).fam);
        t += `\n${h.e} ${h.n}${fav ? " ⭐ مناسبة ×" + F.HAB_FAV : ""}`;
        kb.text(`${h.e} ${h.n}${fav ? " ⭐" : ""}`, cb(P, "hp", f.id, k));
    });
    kb.row().text("🔙 رجوع", cb(P, "cd", f.id));
    return { text: frame(t), kb };
}

function screenHabitat(P, note) {
    const h = F.inHabitat(P);
    const kb = new InlineKeyboard();
    let t = header(P, note) + "\n🌿 <b>البيئة</b>\nجنية واحدة تتلفل بلا وقت محدد. المناسبة لبيئتها تتلفل ×" + F.HAB_FAV + ".\n\n";
    Object.values(F.HABITATS).forEach(x => { t += `${x.e} ${x.n}: ${[...new Set(x.fams.map(k => F.FAM[k].n))].join("، ")}\n`; });
    t += "\n";
    if (h) { t += habLine(P, h); kb.text("🌿 نزعها", cb(P, "hr", h.id)).text("⚙️ إعداداتها", cb(P, "cd", h.id)).row(); }
    else t += "فارغة. افتح جنياتي واختر جنية ثم 🌿 ضع في البيئة.";
    kb.text("🧚 جنياتي", cb(P, "my", 0)).text("🔙 رجوع", cb(P, "main"));
    return { text: frame(t), kb };
}

function screenRename(P, id) {
    const f = F.get(P, id);
    if (!f) return screenMine(P, 0, "غير موجودة.");
    const t = `✏️ <b>تسمية ${F.sp(f).e} ${esc(nm(f))}</b>\nاكتب في المحادثة:\n<code>.سمي_جنية ${f.id} الاسم</code>\n(حتى 16 حرفًا، ولإزالة الاسم اكتب الأمر بلا اسم)`;
    return { text: frame(t), kb: new InlineKeyboard().text("🔙 رجوع", cb(P, "cd", f.id)) };
}

function screenRates(P) {
    return { text: frame(F.ratesTxt()), kb: new InlineKeyboard().text("🔙 رجوع", cb(P, "main")) };
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
    kb.text("📊 النسب", cb(P, "rt")).text("🔙 رجوع", `fy:${P.id}:main`);
    return { text: frame(t), kb };
}

function screenRelease(P, note, askId) {
    const f = F.get(P, askId);
    if (!f) return screenMine(P, 0, note || "غير موجودة.");
    const t = (note ? note + "\n\n" : "") + `🕊️ هل تريد إطلاق ${F.label(f)} (مستوى ${F.lvOf(f)})؟ لا رجعة ولا تعويض.`;
    return { text: frame(t), kb: new InlineKeyboard().text("✅ نعم، أطلقها", cb(P, "rc", f.id)).text("❌ لا", cb(P, "cd", f.id)) };
}

function screenGuide(P) {
    let t = "📖 <b>دليل الجنيات</b>\n• <b>الحصول:</b> اصطدها عند الفوز في الصيد (فرصة صغيرة جدًا، وأفضل في المناطق العالية وبجنيات الحظ)، أو اشترها من المتجر اليومي، أو بجائزة البوس لصاحب أعلى ضرر.\n• <b>المستوى (التلفيل):</b> ضع جنية واحدة في 🌿 البيئة فتتلفل بلا وقت محدد، وانزعها متى شئت. البيئة المناسبة ×1.5، والغبار ✨ يسرّع. الأندر تنمو أبطأ.\n• <b>الخانات:</b> تعمل بفات الجنيات المجهزة فقط.\n\n";
    F.RARITIES.forEach((rn, r) => {
        t += `${F.RANK_E[r]} <b>${rn}</b> — مستوى كل ${F.HOURS_PER_LV[r]} ساعة تلفيل\n`;
        Object.values(F.SPECIES).filter(s => s.r === r).forEach(s => { t += `   ${s.e} ${s.n}: ${F.famTxt(s.fam, r, 1)}\n`; });
    });
    return { text: frame(t.slice(0, 3900)), kb: new InlineKeyboard().text("🔙 رجوع", `fy:${P.id}:main`) };
}

module.exports = { screenMain, screenMine, screenCard, screenPickHab, screenHabitat, screenRename, screenRates, screenShop, screenRelease, screenGuide };