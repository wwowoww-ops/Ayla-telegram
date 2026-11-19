// شاشات وظائف الحيوانات (po): نظرة عامة، وظيفة، واختيار حيوان
const { InlineKeyboard } = require("grammy");
const D = require("./data");
const E = require("./engine");
const Po = require("./posts");
const { esc } = require("../lib/util");

const nm = p => E.spOf(p).e + " " + esc(p.nick || E.spOf(p).n) + " " + D.RARITIES[E.spOf(p).r].e + " Lv." + p.lv + (p.st ? " " + "⭐".repeat(p.st) : "") + " " + D.ELEMENTS[p.el].e + (p.elb ? D.ELEMENTS[p.elb].e : "");
const plain = s => s.replace(/<[^>]+>/g, "");

function main(P, msg) {
    const s = Po.st(P), tot = Po.total(P);
    let t = "🧰 <b>وظائف الحيوانات</b>\n━━━━━━━━━━━━━━━━━━\nضع حيواناتك الزائدة في وظائف تعطيك بفات دائمة. الحيوان الموظَّف لا يقاتل في الزعيم، وحيوانك الأساسي لا يُوظَّف.\n\n";
    Po.POST_IDS.forEach(id => {
        const d = Po.POSTS[id], pets = s[id].map(pid => E.getPet(P, pid)).filter(Boolean);
        t += d.e + " <b>" + d.n + "</b> (" + pets.length + "/" + d.slots + ")" + (pets.length ? ": " + pets.map(p => E.spOf(p).e).join(" ") : " — فارغة") + "\n";
    });
    t += "\n" + (Object.keys(tot).length ? "✨ <b>مجموع بفاتك:</b>\n" + Po.fxText(tot).split(" · ").map(x => "• " + x).join("\n") : "لم تعيّن أحدًا بعد. اختر وظيفة وابدأ!");
    t += "\n\n🐔 الدجاجة أفضل حاضنة، وكل حيوان له وظيفة يتفوّق فيها (علامة ⭐).";
    if (msg) t += "\n\n" + msg;
    const kb = new InlineKeyboard();
    Po.POST_IDS.forEach((id, i) => { kb.text(Po.POSTS[id].e + " " + Po.POSTS[id].n, "po:" + P.id + ":v:" + id); if (i % 2 === 1) kb.row(); });
    kb.row().text("🏠 القائمة الرئيسية", "g:" + P.id + ":home");
    return { text: t, kb };
}

function view(P, id, msg) {
    const d = Po.POSTS[id];
    if (!d) return main(P);
    const pets = Po.st(P)[id].map(pid => E.getPet(P, pid)).filter(Boolean);
    let t = d.e + " <b>" + d.n + "</b> (" + pets.length + "/" + d.slots + ")\n━━━━━━━━━━━━━━━━━━\n" + d.d + "\n\n";
    if (pets.length) pets.forEach(p => { const a = Po.aptitude(p, id), fx = Po.petFx(p, id); t += nm(p) + (a > 1 ? " ⭐" : "") + "\n   ↳ " + (Po.fxText(fx) || "—") + "\n"; });
    else t += "لا أحد هنا بعد.\n";
    if (msg) t += "\n" + msg;
    const kb = new InlineKeyboard();
    pets.forEach(p => kb.text("❌ إزالة " + E.spOf(p).e, "po:" + P.id + ":rm:" + id + ":" + p.id));
    if (pets.length) kb.row();
    if (pets.length < d.slots) kb.text("➕ تعيين حيوان", "po:" + P.id + ":ls:" + id + ":0").row();
    kb.text("🔙 الوظائف", "po:" + P.id + ":main");
    return { text: t, kb };
}

function list(P, id, page) {
    const d = Po.POSTS[id];
    if (!d) return main(P);
    const all = Po.candidates(P, id), per = 6, pages = Math.max(1, Math.ceil(all.length / per));
    page = Math.max(0, Math.min(page, pages - 1));
    const kb = new InlineKeyboard();
    all.slice(page * per, page * per + per).forEach(p => {
        const here = Po.postOf(P, p.id);
        kb.text((Po.aptitude(p, id) > 1 || (id === "boss" && Po.fitList(p).includes("boss")) ? "⭐ " : "") + plain(nm(p)) + (here ? " (" + Po.POSTS[here].e + ")" : ""), "po:" + P.id + ":as:" + id + ":" + p.id).row();
    });
    if (pages > 1) { if (page > 0) kb.text("◀️", "po:" + P.id + ":ls:" + id + ":" + (page - 1)); if (page < pages - 1) kb.text("▶️", "po:" + P.id + ":ls:" + id + ":" + (page + 1)); kb.row(); }
    kb.text("🔙 رجوع", "po:" + P.id + ":v:" + id);
    return { text: d.e + " <b>اختر حيوانًا لـ" + d.n + "</b> — صفحة " + (page + 1) + "/" + pages + "\n⭐ = مناسب لهذه الوظيفة (أثره أكبر). الأعلى ندرة ومستوى أقوى أثرًا.\n(من هو في وظيفة أخرى سيُنقل إلى هنا.)", kb };
}

module.exports = { main, view, list };
