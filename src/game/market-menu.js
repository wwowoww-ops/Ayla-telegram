// شاشات سوق اللاعبين
const { InlineKeyboard } = require("grammy");
const M = require("./market");
const E = require("./engine");
const D = require("./data");
const F = require("./fairies");
const Res = require("./resources");
const { frame } = require("./menus");

const cb = (P, ...p) => `mk:${P.id}:${p.join(":")}`;
const PER = 6;
const esc = s => String(s).replace(/[&<>]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
const KN = { f: "🧚 الجنيات", e: "🥚 البيض", r: "🔷 الموارد" };

function screenMain(P, note, now = Date.now()) {
    const all = M.all(now), mine = all.filter(l => String(l.seller) === String(P.id));
    const n = k => all.filter(l => M.kindOf(l) === k).length;
    const t = (note ? note + "\n\n" : "") + `🤝 <b>سوق اللاعبين</b> — 🪙 ${E.fmt(P.coins)}\nاعرض جنياتك وبيضك وموارد للبيع، أو اشترِ من غيرك.\nضريبة البيع ${Math.round(M.TAX * 100)}% · المعروض يبقى ${Math.round(M.TTL / 86400e3)} أيام ثم يعود لصاحبه.`;
    const kb = new InlineKeyboard()
        .text(`🧚 جنيات (${n("f")})`, cb(P, "ls", "f", 0)).text(`🥚 بيض (${n("e")})`, cb(P, "ls", "e", 0)).text(`🔷 موارد (${n("r")})`, cb(P, "ls", "r", 0)).row()
        .text("➕ بيع", cb(P, "sell")).text(`📦 معروضاتي (${mine.length})`, cb(P, "my")).row()
        .text("🔙 رجوع", `g:${P.id}:more`);
    return { text: frame(t), kb };
}

function screenList(P, kind, page, note, now = Date.now()) {
    const list = M.all(now).filter(l => M.kindOf(l) === kind).sort((a, b) => a.price - b.price);
    const pages = Math.max(1, Math.ceil(list.length / PER));
    page = Math.min(Math.max(0, page | 0), pages - 1);
    const kb = new InlineKeyboard();
    let t = (note ? note + "\n\n" : "") + `${KN[kind]} — سوق اللاعبين (الأرخص أولًا)\n🪙 ${E.fmt(P.coins)}\n`;
    if (!list.length) t += "\nلا معروضات الآن.";
    list.slice(page * PER, page * PER + PER).forEach(l => {
        t += `\n#${l.id} ${M.describe(l)} — 🪙 ${E.fmt(l.price)} · 👤 ${esc(l.sname)}`;
        kb.text(`🛒 ${M.describe(l)} · ${E.fmt(l.price)}`, cb(P, "bc", l.id)).row();
    });
    if (pages > 1) {
        if (page > 0) kb.text("◀️", cb(P, "ls", kind, page - 1));
        kb.text(`${page + 1}/${pages}`, cb(P, "ls", kind, page));
        if (page < pages - 1) kb.text("▶️", cb(P, "ls", kind, page + 1));
        kb.row();
    }
    kb.text("🔙 رجوع", cb(P, "main"));
    return { text: frame(t), kb };
}

function screenBuy(P, id, now = Date.now()) {
    const l = M.all(now).find(x => x.id === Number(id));
    if (!l) return screenMain(P, "بيع هذا العرض أو انتهى.");
    let t = `🛒 <b>تأكيد الشراء</b>\n${M.describe(l)}\n`;
    if (l.item.f) t += "↳ " + F.buffTxt(F.buffOf(l.item.f)) + "\n";
    t += `السعر: 🪙 ${E.fmt(l.price)} (رصيدك ${E.fmt(P.coins)})\nالبائع: ${esc(l.sname)}`;
    return { text: frame(t), kb: new InlineKeyboard().text("✅ اشترِ", cb(P, "by", l.id)).text("❌ لا", cb(P, "ls", M.kindOf(l), 0)) };
}

function screenSell(P) {
    const t = "➕ <b>ماذا تبيع؟</b>\nيُسحب المعروض منك ويُحفظ حتى يُباع أو تلغيه.";
    const kb = new InlineKeyboard().text("🧚 جنية", cb(P, "sf", 0)).text("🥚 بيضة", cb(P, "se", 0)).text("🔷 مورد", cb(P, "sr")).row().text("🔙 رجوع", cb(P, "main"));
    return { text: frame(t), kb };
}

// اختيار الأسعار بمضاعفات السعر المقترح
function priceButtons(P, kb, base, mk) {
    M.MULTS.forEach((m, i) => { kb.text(`${E.fmt(Math.max(1, Math.floor(base * m)))}`, mk(i)); if (i % 3 === 2) kb.row(); });
    kb.row();
}
function screenPickF(P, page) {
    const list = F.st(P).fairies.slice().sort((a, b) => F.sp(b).r - F.sp(a).r || F.lvOf(b) - F.lvOf(a));
    const pages = Math.max(1, Math.ceil(list.length / 8));
    page = Math.min(Math.max(0, page | 0), pages - 1);
    const kb = new InlineKeyboard();
    list.slice(page * 8, page * 8 + 8).forEach(f => kb.text(`${F.sp(f).e} ${f.nick || F.sp(f).n} Lv${F.lvOf(f)} ${F.RANK_E[F.sp(f).r]}`, cb(P, "pf", f.id)).row());
    if (pages > 1) { if (page > 0) kb.text("◀️", cb(P, "sf", page - 1)); if (page < pages - 1) kb.text("▶️", cb(P, "sf", page + 1)); kb.row(); }
    kb.text("🔙 رجوع", cb(P, "sell"));
    return { text: frame("🧚 اختر الجنية التي تبيعها:" + (list.length ? "" : "\nلا تملك جنيات.")), kb };
}
function screenPickE(P, page) {
    const list = [...E.bag(P)].sort((a, b) => b.tier - a.tier);
    const pages = Math.max(1, Math.ceil(list.length / 8));
    page = Math.min(Math.max(0, page | 0), pages - 1);
    const kb = new InlineKeyboard();
    list.slice(page * 8, page * 8 + 8).forEach(e => kb.text(`${D.EGGS[e.tier].e} ${D.EGGS[e.tier].n}${e.bred ? " (تزاوج)" : ""}`, cb(P, "pe", e.id)).row());
    if (pages > 1) { if (page > 0) kb.text("◀️", cb(P, "se", page - 1)); if (page < pages - 1) kb.text("▶️", cb(P, "se", page + 1)); kb.row(); }
    kb.text("🔙 رجوع", cb(P, "sell"));
    return { text: frame("🥚 اختر البيضة من محفظتك:" + (list.length ? "" : "\nمحفظتك فارغة.")), kb };
}
function screenPickR(P) {
    const kb = new InlineKeyboard();
    const ids = Object.keys(P.res || {}).filter(id => D.RES[id] && P.res[id] > 0);
    ids.forEach(id => kb.text(`${Res.label(id)} ×${P.res[id]}`, cb(P, "pr", id)).row());
    kb.text("🔙 رجوع", cb(P, "sell"));
    return { text: frame("🔷 اختر المورد:" + (ids.length ? "" : "\nلا موارد.")), kb };
}
function screenQty(P, id) {
    const have = Res.have(P, id), kb = new InlineKeyboard();
    [1, 5, 25, have].filter((q, i, a) => q >= 1 && q <= have && a.indexOf(q) === i).forEach(q => kb.text("×" + q, cb(P, "pq", id, q)));
    kb.row().text("🔙 رجوع", cb(P, "sr"));
    return { text: frame(`${Res.label(id)} — عندك ${have}. كم تبيع؟`), kb };
}
function screenPrice(P, kind, ref, qty) {
    const base = M.suggest(P, kind, ref, qty);
    if (!base) return screenSell(P);
    const kb = new InlineKeyboard();
    priceButtons(P, kb, base, i => cb(P, "do", kind, ref + (kind === "r" ? "-" + qty : ""), i));
    kb.text("🔙 رجوع", cb(P, "sell"));
    return { text: frame(`💲 <b>اختر سعر العرض</b>\nالسعر المقترح: ${E.fmt(base)} 🪙\nالأزرار = نصف السعر، المقترح، ×1.5، ×2، ×3.`), kb };
}

function screenMy(P, note, now = Date.now()) {
    const list = M.mine(P.id, now);
    const kb = new InlineKeyboard();
    let t = (note ? note + "\n\n" : "") + "📦 <b>معروضاتي</b>\n";
    if (!list.length) t += "\nلا شيء معروض.";
    list.forEach(l => { t += `\n#${l.id} ${M.describe(l)} — 🪙 ${E.fmt(l.price)}`; kb.text(`↩️ إلغاء #${l.id}`, cb(P, "cx", l.id)).row(); });
    kb.text("🔙 رجوع", cb(P, "main"));
    return { text: frame(t), kb };
}

module.exports = { screenMain, screenList, screenBuy, screenSell, screenPickF, screenPickE, screenPickR, screenQty, screenPrice, screenMy };
