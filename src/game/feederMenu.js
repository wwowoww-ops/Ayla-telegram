// قوائم أماكن الأكل في اللعبة العادية (أزرار البوت)
const { InlineKeyboard } = require("grammy");
const D = require("./data");
const E = require("./engine");
const F = require("./feeders");

const HEADER = "🌸 ═══ 𝐀𝐘𝐋𝐀 〢 𝐏𝐄𝐓𝐒 ═══ 🌸";
const FOOTER = "╰┈➤ 𝐀𝐘𝐋𝐀 • 𝐏𝐄𝐓 𝐒𝐘𝐒𝐓𝐄𝐌 🌸";
const frame = t => `${HEADER}\n\n${t}\n\n${FOOTER}`;
const note = n => (n ? n + "\n\n" : "");
const bar = (cur, max, n = 10) => { const f = Math.max(0, Math.min(n, Math.round(cur / max * n))); return "█".repeat(f) + "░".repeat(n - f); };
const cb = (uid, ...p) => `fd:${uid}:${p.join(":")}`;

function bowlLine(P, b) {
    if (!F.isPlaced(b)) return `🥣 #${b.id} — غير موضوع`;
    const f = D.FOODS[b.food];
    return `🥣 #${b.id} — ${F.penName(P, b.pen)} · ${f.e} ${bar(b.qty, F.CAP, 8)} ${b.qty}/${F.CAP}` + (b.qty ? "" : " ⚠️ فارغ");
}

// القائمة الرئيسية
function screenMain(P, n) {
    const list = F.bowls(P);
    let text = note(n) + "🥣 <b>أماكن الأكل</b>\n";
    text += "ضع وعاء في حظيرة بكمية طعام محدودة، فتأكل منه حيواناتها الجائعة تلقائيًا حتى ينتهي.\n\n";
    text += list.length ? list.map(b => bowlLine(P, b)).join("\n") : "لا تملك أوعية بعد.";
    text += `\n\n🪙 رصيدك: ${E.fmt(P.coins)}`;
    const kb = new InlineKeyboard();
    list.forEach(b => kb.text(`🥣 #${b.id}`, cb(P.id, "b", b.id)));
    if (list.length) kb.row();
    if (list.length < F.MAX_BOWLS) kb.text(`🛒 اشترِ وعاءً (${E.fmt(F.price(P))} 🪙)`, cb(P.id, "buy")).row();
    if (list.some(F.isPlaced)) kb.text("📤 إزالة كل الأوعية", cb(P.id, "x", -1)).row();
    kb.text("🏠 القائمة الرئيسية", `g:${P.id}:home`);
    return { text: frame(text), kb };
}

// شاشة وعاء واحد
function screenBowl(P, id, n) {
    const b = F.bowls(P).find(x => x.id === id);
    if (!b) return screenMain(P, "هذا الوعاء غير موجود.");
    const kb = new InlineKeyboard();
    let text = note(n) + `🥣 <b>وعاء #${b.id}</b>\n\n`;
    if (!F.isPlaced(b)) {
        text += "غير موضوع. اختر حظيرة ثم الطعام والكمية.";
        kb.text("📍 ضعه في حظيرة", cb(P.id, "p", b.id)).row();
    } else {
        const f = D.FOODS[b.food];
        text += `📍 ${F.penName(P, b.pen)}\n${f.e} ${f.n}: ${bar(b.qty, F.CAP)} ${b.qty}/${F.CAP}\n` + (b.qty ? "تأكل منه الحيوانات الجائعة تلقائيًا." : "⚠️ فارغ! عبّئه ليعمل.");
        kb.text("➕ تعبئة", cb(P.id, "r", b.id)).text("📤 إزالة", cb(P.id, "x", b.id)).row();
    }
    kb.text("🔙 الأوعية", cb(P.id, "m"));
    return { text: frame(text), kb };
}

// اختيار الحظيرة
function screenPickPen(P, id) {
    const kb = new InlineKeyboard();
    kb.text("🌍 كل الحظائر", cb(P.id, "pp", id, -1)).row();
    kb.text("🏡 الكبرى", cb(P.id, "pp", id, 0)).row();
    (P.pens || []).forEach(p => kb.text("🏞 " + p.name, cb(P.id, "pp", id, p.id)).row());
    kb.text("🔙 رجوع", cb(P.id, "b", id));
    return { text: frame(`📍 <b>أين تضع الوعاء #${id}؟</b>\nالحيوانات التي في الحظيرة المختارة فقط ستأكل منه.`), kb };
}

// اختيار الطعام
function screenPickFood(P, id, pen) {
    const kb = new InlineKeyboard();
    let any = false;
    F.FOODS.forEach(fid => {
        const have = P.items[fid] || 0, f = D.FOODS[fid];
        if (have > 0) { any = true; kb.text(`${f.e} ${f.n} ×${have}`, cb(P.id, "pf", id, pen, fid)).row(); }
    });
    kb.text("🔙 رجوع", cb(P.id, "p", id));
    const text = `🍖 <b>أي طعام تضع؟</b> (${F.penName(P, pen)})\n` + (any ? "اختر من مخزنك:" : "لا تملك طعامًا مناسبًا (تمر، لحم، وليمة). اشترِ من 🛒 المتجر أولًا.");
    return { text: frame(text), kb };
}

// اختيار الكمية
function screenPickQty(P, id, pen, food) {
    const f = D.FOODS[food], have = P.items[food] || 0, max = Math.min(F.CAP, have);
    const kb = new InlineKeyboard();
    const opts = [...new Set([5, 10, 25, 50, max].filter(q => q >= 1 && q <= max))].sort((a, b) => a - b);
    opts.forEach(q => kb.text(q === max ? `الأقصى ${q}` : String(q), cb(P.id, "pq", id, pen, food, q)));
    kb.row().text("🔙 رجوع", cb(P.id, "pp", id, pen));
    return { text: frame(`${f.e} <b>كم ${f.n} تضع؟</b>\nعندك ${have} · الحد لكل وعاء ${F.CAP}`), kb };
}

// تعبئة
function screenRefill(P, id) {
    const b = F.bowls(P).find(x => x.id === id);
    if (!b || !F.isPlaced(b)) return screenMain(P, "وعاء غير موضوع.");
    const f = D.FOODS[b.food], have = P.items[b.food] || 0, max = Math.min(F.CAP - b.qty, have);
    const kb = new InlineKeyboard();
    [...new Set([5, 10, 25, 50, max].filter(q => q >= 1 && q <= max))].sort((a, c) => a - c).forEach(q => kb.text(q === max ? `الأقصى ${q}` : "+" + q, cb(P.id, "rq", id, q)));
    kb.row().text("🔙 رجوع", cb(P.id, "b", id));
    return { text: frame(`➕ <b>تعبئة ${f.e} ${f.n}</b>\nالآن ${b.qty}/${F.CAP} · عندك ${have}` + (max < 1 ? "\n\nلا يمكن التعبئة (ممتلئ أو لا تملك طعامًا)." : "")), kb };
}

// يطبّق الضغطة ويرجع الشاشة التالية
function route(P, parts) {
    const a = parts[0], num = i => Number(parts[i]);
    let r = null;
    switch (a) {
        case "m": return screenMain(P);
        case "buy": r = F.buy(P); return screenMain(P, r.msg);
        case "b": return screenBowl(P, num(1));
        case "p": return screenPickPen(P, num(1));
        case "pp": return screenPickFood(P, num(1), num(2));
        case "pf": return screenPickQty(P, num(1), num(2), parts[3]);
        case "pq": r = F.placeMany(P, 1, num(2), parts[3], num(4)); return r.ok ? screenBowl(P, num(1), r.msg) : screenBowl(P, num(1), "❌ " + r.msg);
        case "r": return screenRefill(P, num(1));
        case "rq": r = F.refill(P, num(1), num(2)); return screenBowl(P, num(1), (r.ok ? "" : "❌ ") + r.msg);
        case "x": r = F.remove(P, num(1)); return screenMain(P, r.msg);
        default: return screenMain(P);
    }
}

module.exports = { screenMain, route };