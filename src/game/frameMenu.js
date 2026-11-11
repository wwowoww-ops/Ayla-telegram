// شاشة الإطارات: صفحة رئيسية بالفئات، ثم صفحة لكل فئة فيها الاختيار والشراء
const { InlineKeyboard } = require("grammy");
const F = require("./frames");
const E = require("./engine");
const { frame } = require("./menus");

const inCat = c => F.FRAMES.filter(f => f.cat === c);

// الصفحة الرئيسية
function screenMain(P, note) {
    const have = F.FRAMES.filter(f => F.isUnlocked(P, f)).length;
    let text = (note ? note + "\n\n" : "") + `🖼️ <b>إطارات الصورة</b> — ${have}/${F.FRAMES.length}\n`;
    text += `تظهر حول صورة حسابك عند كتابة <b>ايدي</b>.\n🪙 رصيدك: ${E.fmt(P.coins)}\n\n`;
    const cur = F.byId(P.frame);
    text += cur && F.isUnlocked(P, cur) ? `✅ الحالي: ${cur.e} ${cur.name}\n\n` : "الحالي: بدون إطار\n\n";
    text += "اختر فئة:";
    const kb = new InlineKeyboard();
    F.CATS.forEach((c, i) => {
        const list = inCat(c.id), got = list.filter(f => F.isUnlocked(P, f)).length;
        kb.text(`${c.e} ${c.name} ${got}/${list.length}`, `f:${P.id}:cat:${c.id}`);
        if (i % 2) kb.row();
    });
    kb.row();
    if (P.frame) kb.text("🚫 إزالة الإطار", `f:${P.id}:off`).row();
    kb.text("🏅 الإنجازات", `q:${P.id}:ach`).text("🏠 القائمة الرئيسية", `g:${P.id}:home`);
    return { text: frame(text), kb };
}

// صفحة فئة
function screenCat(P, catId, note) {
    const cat = F.CATS.find(c => c.id === catId);
    if (!cat) return screenMain(P, note);
    const list = inCat(catId);
    const got = list.filter(f => F.isUnlocked(P, f)).length;
    let text = (note ? note + "\n\n" : "") + `${cat.e} <b>${cat.name}</b> — ${got}/${list.length}\n🪙 رصيدك: ${E.fmt(P.coins)}\n`;
    list.forEach(f => {
        const open = F.isUnlocked(P, f), on = P.frame === f.id;
        let line = `\n${open ? (on ? "✅" : "🔓") : "🔒"} ${f.e} <b>${f.name}</b>${f.frames > 1 ? " ✨" : ""}`;
        if (open) { if (on) line += " — مُفعّل"; }
        else {
            const how = [];
            if (f.price) how.push("🛒 " + E.fmt(f.price) + " 🪙");
            if (f.text) how.push("🏅 " + f.text);
            line += "\n    ↳ " + how.join(" أو ");
        }
        text += line;
    });
    const kb = new InlineKeyboard();
    let n = 0;
    list.filter(f => F.isUnlocked(P, f)).forEach(f => {
        kb.text((P.frame === f.id ? "✅ " : "") + f.e + " " + f.name, `f:${P.id}:set:${f.id}`);
        if (++n % 2 === 0) kb.row();
    });
    if (n % 2) kb.row();
    let b = 0;
    list.filter(f => f.price && !F.isUnlocked(P, f)).forEach(f => {
        kb.text(`🛒 ${f.e} ${E.fmt(f.price)}`, `f:${P.id}:buy:${f.id}`);
        if (++b % 2 === 0) kb.row();
    });
    if (b % 2) kb.row();
    kb.text("🔙 الفئات", `f:${P.id}:main`).text("🏠 القائمة الرئيسية", `g:${P.id}:home`);
    return { text: frame(text), kb };
}

// تتوافق مع الاستدعاء القديم: بدون فئة = الصفحة الرئيسية
const screenFrames = (P, note, cat) => (cat ? screenCat(P, cat, note) : screenMain(P, note));

module.exports = { screenFrames, screenMain, screenCat };