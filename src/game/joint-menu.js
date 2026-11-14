// شاشات التزاوج المشترك
const { InlineKeyboard } = require("grammy");
const J = require("./joint");
const E = require("./engine");
const D = require("./data");
const store = require("../core/store");
const { frame } = require("./menus");

const esc = s => String(s).replace(/[&<>]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
const cb = (o, ...p) => `jb:${o.id}:${p.join(":")}`;
const pl = p => `${E.spOf(p).e}${D.ELEMENTS[p.el].e} ${esc(p.nick || E.spOf(p).n)} Lv${p.lv} ${D.RARITIES[E.spOf(p).r].e} ${E.grade(p.q)}`;
const EGG = { a: "للمبادر", b: "للطرف الآخر", f: "🎲 قرعة" };
const COST = { a: "المبادر يدفع الكل", s: "مناصفة", b: "الطرف الآخر يدفع الكل" };

function head(o) { return `🤝 <b>تزاوج مشترك</b>\n👤 ${esc(o.fromName)} ⟷ 👤 ${esc(o.toName)}\n`; }

function petList(P, o, act, page, now) {
    const list = J.eligible(P, now), per = 6, pages = Math.max(1, Math.ceil(list.length / per));
    page = Math.min(Math.max(0, page | 0), pages - 1);
    const kb = new InlineKeyboard();
    list.slice(page * per, page * per + per).forEach(p => kb.text(pl(p), cb(o, act, p.id)).row());
    if (pages > 1) { if (page > 0) kb.text("◀️", cb(o, "pg" + act, page - 1)); if (page < pages - 1) kb.text("▶️", cb(o, "pg" + act, page + 1)); kb.row(); }
    kb.text("🚫 إلغاء", cb(o, "x"));
    return { kb, empty: !list.length };
}

function screen(o, page = 0, now = Date.now()) {
    const PA = store.get(o.from), PB = store.get(o.to);
    if (o.stage === "pet") {
        const { kb, empty } = petList(PA, o, "pa", page, now);
        return { text: frame(head(o) + `\n${esc(o.fromName)}: اختر حيوانك للتزاوج.` + (empty ? "\n(لا حيوان مؤهل: المستوى " + D.C.BREED_LV + " وراحة)" : "")), kb, who: o.from };
    }
    if (o.stage === "egg") {
        const kb = new InlineKeyboard().text("🥚 لي", cb(o, "eg", "a")).text("🥚 له", cb(o, "eg", "b")).text("🎲 قرعة", cb(o, "eg", "f")).row().text("🚫 إلغاء", cb(o, "x"));
        return { text: frame(head(o) + `\nحيوانك: ${pl(E.getPet(PA, o.aPet))}\n\nلمن تذهب البيضة؟`), kb, who: o.from };
    }
    if (o.stage === "cost") {
        const kb = new InlineKeyboard().text("أدفع أنا", cb(o, "cm", "a")).text("مناصفة", cb(o, "cm", "s")).text("هو يدفع", cb(o, "cm", "b")).row().text("🚫 إلغاء", cb(o, "x"));
        return { text: frame(head(o) + `\nالبيضة: ${EGG[o.eggTo]}\n\nمن يدفع تكلفة التزاوج؟`), kb, who: o.from };
    }
    if (o.stage === "offer") {
        const a = E.getPet(PA, o.aPet);
        const kb = new InlineKeyboard().text("✅ أقبل واختار حيواني", cb(o, "ac")).text("❌ أرفض", cb(o, "x"));
        return { text: frame(head(o) + `\n${esc(o.fromName)} يعرض حيوانه: ${pl(a)}\n🥚 البيضة: ${EGG[o.eggTo].replace("للمبادر", "لـ" + esc(o.fromName)).replace("للطرف الآخر", "لـ" + esc(o.toName))}\n💰 التكلفة: ${COST[o.costMode]}\n\n${esc(o.toName)}: هل تقبل؟ (العرض 10 دقائق)`), kb, who: o.to, offer: true };
    }
    if (o.stage === "pickB") {
        const { kb, empty } = petList(PB, o, "pb", page, now);
        return { text: frame(head(o) + `\n${esc(o.toName)}: اختر حيوانك.` + (empty ? "\n(لا حيوان مؤهل)" : "")), kb, who: o.to };
    }
    return { text: frame("انتهى العرض."), kb: new InlineKeyboard(), who: null };
}

module.exports = { screen, pl };
