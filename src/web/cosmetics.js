"use strict";
// ألقاب وإطارات تُفتح تلقائيًا بالإنجازات. لا تُخزَّن إلا اختيارات اللاعب (P.cos = {title, frame}) ويُحسب المفتوح عند الطلب.
const D = require("../game/data");
const Dex = require("./dex");
const best = P => (P.pets || []).reduce((m, p) => Math.max(m, D.SPECIES[p.sp] ? D.SPECIES[p.sp].r : 0), 0);
const cnt = (P, k) => ((P.cnt || {})[k] || 0);
const st = (P, k) => (P.stats || {})[k] || 0;
const dexHave = P => { const v = Dex.view(P); return { have: v.have, total: v.total, groups: v.groups.filter(g => g.have === g.total).length }; };
const ally = P => (P.alliance ? 1 : 0);

// [id, نص، شرط (للعرض)، اختبار]
const TITLES = [
    ["newbie", "🐣 مبتدئ", "متاح للجميع", () => true],
    ["hunter", "🏹 صيّاد", "100 مرة صيد", P => st(P, "hunts") >= 100],
    ["hunter2", "🗡️ صيّاد ماهر", "1000 مرة صيد", P => st(P, "hunts") >= 1000],
    ["hunter3", "🐺 سيد الصيد", "10000 مرة صيد", P => st(P, "hunts") >= 10000],
    ["duel", "⚔️ مبارز", "10 انتصارات في المبارزات", P => st(P, "duelWins") >= 10],
    ["duel2", "🥇 بطل المبارزات", "50 انتصارًا في المبارزات", P => st(P, "duelWins") >= 50],
    ["duel3", "🏟️ أسطورة الحلبة", "250 انتصارًا في المبارزات", P => st(P, "duelWins") >= 250],
    ["breed", "🧬 مربٍّ", "50 تزاوجًا", P => st(P, "bred") >= 50],
    ["hatch", "🥚 فقّاس", "50 بيضة مفقوسة", P => st(P, "hatched") >= 50],
    ["hatch2", "🐣 ساحر الفقس", "200 بيضة مفقوسة", P => st(P, "hatched") >= 200],
    ["streak", "📅 مواظب", "14 يومًا متتاليًا", P => (P.streak || 0) >= 14],
    ["streak2", "🔥 لا ينقطع", "30 يومًا متتاليًا", P => (P.streak || 0) >= 30],
    ["pets", "🐾 جامع الحيوانات", "30 حيوانًا", P => (P.pets || []).length >= 30],
    ["pets2", "🏞️ سيد المزرعة", "60 حيوانًا", P => (P.pets || []).length >= 60],
    ["rare", "✨ صاحب النادر", "امتلاك حيوان بندرة عالية (5)", P => best(P) >= 4],
    ["rare2", "🌟 صائد الأساطير", "امتلاك حيوان بأعلى ندرة", P => best(P) >= 6],
    ["dex", "📖 عالم الأنواع", "اكتشاف 25 نوعًا", P => dexHave(P).have >= 25],
    ["dex2", "📚 الموسوعة الحيّة", "اكتشاف كل الأنواع", P => { const d = dexHave(P); return d.have >= d.total; }],
    ["exp", "🧭 مستكشف", "5 رحلات استكشاف", P => cnt(P, "exp") >= 5],
    ["exp2", "🗺️ رحّالة", "25 رحلة استكشاف", P => cnt(P, "exp") >= 25],
    ["raid", "🏴‍☠️ قرصان", "3 غارات ناجحة", P => cnt(P, "raid") >= 3],
    ["raid2", "☠️ ملك القراصنة", "25 غارة ناجحة", P => cnt(P, "raid") >= 25],
    ["ally", "🤝 حليف", "الانضمام إلى تحالف", P => !!ally(P) || !!(P.allyEver)],
    ["ally2", "🛡️ قائد التحالف", "تحالف بمستوى 3", P => P.alliance && require("./map").perk(P).lvl >= 3],
    ["ally3", "👑 إمبراطور", "تحالف بمستوى 8", P => P.alliance && require("./map").perk(P).lvl >= 8],
    ["rich", "💎 ثري", "مليار عملة", P => P.coins >= 1e9],
    ["rich2", "🤑 قارون", "كوادريليون عملة", P => P.coins >= 1e15]
];
const T = Object.fromEntries(TITLES.map(t => [t[0], t]));
const Fr = require("../game/frames"), E = require("../game/engine");
const safe = (fn, P) => { try { return !!fn(P); } catch (e) { return false; } };

function view(P) {
    const c = P.cos || {};
    const titles = TITLES.map(t => ({ id: t[0], n: t[1], req: t[2], have: safe(t[3], P) }));
    return { ok: true, title: c.title || "newbie", titles, count: titles.filter(t => t.have).length - 1, total: titles.length - 1 };
}
function set(P, a) {
    const c = P.cos = P.cos || {};
    const t = T[a && a.title];
    if (!t || !safe(t[3], P)) return { ok: false, msg: "اللقب غير مفتوح بعد." };
    c.title = t[0];
    return { ok: true, msg: "✅ تم الحفظ.", cos: tag(P) };
}
// ---- الإطارات: نظام البوت نفسه (game/frames). المفتوح/المشترى/المفعّل يُحفظ في P.frame و P.fown ----
const wrapFrame = (P, fr) => ({ id: fr.id, n: fr.name, e: fr.e, cat: fr.cat, price: fr.price || 0, text: fr.text || "", have: Fr.isUnlocked(P, fr), on: P.frame === fr.id, anim: (fr.frames || 1) > 1 });
function frameList(P) {
    const w = Fr.FRAMES.find(f => f.win);
    return { ok: true, cur: P.frame || null, win: w ? w.win : null, cats: Fr.CATS.map(c => ({ id: c.id, n: c.name, e: c.e })), list: Fr.FRAMES.map(f => wrapFrame(P, f)) };
}
function frameAnim(P, a) {
    const fr = Fr.byId(a && a.id); if (!fr) return { ok: false, msg: "الإطار غير معروف." };
    const n = Math.min(fr.frames || 1, 8), out = [];
    for (let i = 0; i < n; i++) out.push(fr.draw(n > 1 ? i / n : 0));
    return { ok: true, id: fr.id, svg: out, win: fr.win || null, square: !!fr.square };
}
function frameSet(P, a) {
    if (a && a.off) { P.frame = null; return { ok: true, msg: "🚫 أُزيل الإطار.", cos: tag(P) }; }
    const fr = Fr.byId(a && a.id); if (!fr) return { ok: false, msg: "الإطار غير معروف." };
    if (!Fr.isUnlocked(P, fr)) return { ok: false, msg: "🔒 " + (fr.text || "هذا الإطار مغلق.") };
    P.frame = fr.id; return { ok: true, msg: "✅ فُعّل " + fr.name + ".", cos: tag(P) };
}
function frameBuy(P, a) {
    const fr = Fr.byId(a && a.id);
    if (!fr || !fr.price) return { ok: false, msg: "هذا الإطار لا يُشترى." };
    if (Fr.isUnlocked(P, fr)) return { ok: false, msg: "تملكه بالفعل." };
    if (P.coins < fr.price) return { ok: false, msg: "تحتاج " + E.fmt(fr.price) + " 🪙" };
    P.coins -= fr.price; P.fown = P.fown || {}; P.fown[fr.id] = true; P.frame = fr.id;
    return { ok: true, msg: "🛒 اشتريت " + fr.name + " وفُعّل.", cos: tag(P) };
}
// ما يُعرض مع اسم اللاعب للآخرين (يُرجع null إن لم يكن له لقب ولا إطار)
function tag(P) {
    const c = P.cos || {}; let t = T[c.title]; if (t && !safe(t[3], P)) t = null;
    const fr = P.frame ? Fr.byId(P.frame) : null, f = fr && Fr.isUnlocked(P, fr) ? fr : null;
    const tt = t && t[0] !== "newbie" ? t[1] : "";
    if (!tt && !f) return null;
    return { t: tt, fe: f ? f.e : "", fid: f ? f.id : "" };
}
module.exports = { view, set, tag, frameList, frameAnim, frameSet, frameBuy, TITLES };
