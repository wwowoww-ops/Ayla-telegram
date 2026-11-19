// شاشات: متجر النوادر (xn) وتدوير الحيوانات (xr)
const { InlineKeyboard } = require("grammy");
const D = require("./data");
const E = require("./engine");
const Res = require("./resources");
const X = require("./extras");
const { esc } = require("../lib/util");
const fmt = E.fmt;

const nm = p => E.spOf(p).e + " " + esc(p.nick || E.spOf(p).n) + " " + D.RARITIES[E.spOf(p).r].e + " Lv." + p.lv + (p.st ? " " + "⭐".repeat(p.st) : "") + " " + D.ELEMENTS[p.el].e + (p.elb ? D.ELEMENTS[p.elb].e : "");
const yieldTxt = v => v.crystal + " 🔷" + Object.entries(v.ess).map(([k, n]) => " + " + n + " " + D.RES[k].e).join("");

// ---------- متجر النوادر ----------
function shop(P, msg) {
    const cr = Res.have(P, "crystal");
    let t = "🛍️ <b>متجر النوادر</b>\n━━━━━━━━━━━━━━━━━━\n🔷 بلوراتك: <b>" + fmt(cr) + "</b>\n\n";
    t += Object.entries(X.ITEMS).map(([id, it]) => it.e + " <b>" + it.n + "</b> — " + it.price + " 🔷 (لديك " + X.have(P, id) + ")\n   ↳ " + it.d).join("\n\n");
    t += "\n\n💡 البلورات تأتي من الزعيم والموسم الأسبوعي وتدوير الحيوانات.";
    if (msg) t += "\n\n" + msg;
    const kb = new InlineKeyboard();
    Object.entries(X.ITEMS).forEach(([id, it]) => kb.text("شراء " + it.e + " (" + it.price + "🔷)", "xn:" + P.id + ":buy:" + id));
    kb.row();
    if (X.have(P, "box") > 0) kb.text("🎁 افتح صندوقًا (" + X.have(P, "box") + ")", "xn:" + P.id + ":open").row();
    kb.text("♻️ تدوير الحيوانات", "xr:" + P.id + ":main").text("🏆 الموسم", "ss:" + P.id + ":cur").row();
    kb.text("🏠 القائمة الرئيسية", "g:" + P.id + ":home");
    return { text: t, kb };
}

// ---------- التدوير ----------
const LEVELS = [10, 25, 50];
function recycle(P, msg) {
    const rars = [0, 1, 2, 3];
    let t = "♻️ <b>تدوير الحيوانات</b>\n━━━━━━━━━━━━━━━━━━\nحوّل الحيوانات الزائدة إلى بلورات وجواهر عناصرها. الحيوان الأساسي وذو النجوم والنخبة محميّون دائمًا.\n\n";
    t += "🐾 حيواناتك: " + P.pets.length + "/" + P.slots + "\n🧚 بعض الجنيات ترفع عوائد التدوير.\n\n<b>تدوير جماعي سريع</b> (حتى المستوى " + LEVELS[1] + "):\n";
    const kb = new InlineKeyboard();
    rars.forEach(r => {
        const c = X.candidates(P, r, LEVELS[1]);
        t += D.RARITIES[r].e + " حتى " + D.RARITIES[r].n + ": " + c.length + " حيوان\n";
        if (c.length) kb.text(D.RARITIES[r].e + " حتى " + D.RARITIES[r].n + " (" + c.length + ")", "xr:" + P.id + ":ask:" + r).row();
    });
    kb.text("🔎 اختيار حيوان بعينه", "xr:" + P.id + ":list:0").row().text("🛍️ المتجر", "xn:" + P.id + ":main").text("🏠 الرئيسية", "g:" + P.id + ":home");
    if (msg) t += "\n" + msg;
    return { text: t, kb };
}
function ask(P, r) {
    const c = X.candidates(P, r, LEVELS[1]);
    if (!c.length) return recycle(P, "لا حيوانات مناسبة.");
    const tot = { crystal: 0, ess: {} };
    c.forEach(p => { const v = X.recycleValue(P, p); tot.crystal += v.crystal; Object.entries(v.ess).forEach(([k, n]) => { tot.ess[k] = (tot.ess[k] || 0) + n; }); });
    const t = "♻️ <b>تأكيد التدوير</b>\nسيُدوَّر <b>" + c.length + "</b> حيوانًا (حتى " + D.RARITIES[r].n + " ومستوى " + LEVELS[1] + "):\n" +
        c.slice(0, 12).map(nm).join("\n") + (c.length > 12 ? "\n… و" + (c.length - 12) + " أخرى" : "") + "\n\n🎁 ستحصل على: " + yieldTxt(tot) + "\n⚠️ لا يمكن التراجع.";
    return { text: t, kb: new InlineKeyboard().text("✅ نعم، دوّرها", "xr:" + P.id + ":go:" + r).text("❌ إلغاء", "xr:" + P.id + ":main") };
}
function list(P, page) {
    const all = P.pets.filter(p => p.id !== P.main).sort((a, b) => E.power(a) - E.power(b)), per = 6, pages = Math.max(1, Math.ceil(all.length / per));
    page = Math.max(0, Math.min(page, pages - 1));
    const kb = new InlineKeyboard();
    all.slice(page * per, page * per + per).forEach(p => kb.text(nm(p).replace(/<[^>]+>/g, ""), "xr:" + P.id + ":pick:" + p.id).row());
    if (pages > 1) { if (page > 0) kb.text("◀️", "xr:" + P.id + ":list:" + (page - 1)); if (page < pages - 1) kb.text("▶️", "xr:" + P.id + ":list:" + (page + 1)); kb.row(); }
    kb.text("🔙 رجوع", "xr:" + P.id + ":main");
    return { text: "🔎 <b>اختر حيوانًا للتدوير</b> (الأضعف أولًا) — صفحة " + (page + 1) + "/" + pages + "\nالقائمة لا تعرض حيوانك الأساسي.", kb };
}
function pick(P, id) {
    const p = E.getPet(P, id);
    if (!p || p.id === P.main) return recycle(P, "حيوان غير صالح.");
    const prot = p.st > 0 || E.isElite(p);
    const t = "♻️ <b>تدوير حيوان</b>\n" + nm(p) + "\n🎖 جودة " + E.grade(p.q) + (E.isElite(p) ? " 👑 نخبة" : "") + "\n\n🎁 ستحصل على: " + yieldTxt(X.recycleValue(P, p)) + (prot ? "\n⚠️ هذا حيوان مميّز (نجوم/نخبة) — تأكد قبل التدوير!" : "") + "\n⚠️ لا يمكن التراجع.";
    return { text: t, kb: new InlineKeyboard().text("✅ نعم، دوّره", "xr:" + P.id + ":do:" + p.id).text("❌ إلغاء", "xr:" + P.id + ":list:0") };
}
module.exports = { shop, recycle, ask, list, pick, LEVELS };
