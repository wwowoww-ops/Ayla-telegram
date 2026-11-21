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
// [id, اسم، رمز، لون، شرط، اختبار]
const FRAMES = [
    ["plain", "بسيط", "", "#64748b", "متاح للجميع", () => true],
    ["bronze", "برونزي", "🥉", "#cd7f32", "10 مرات صيد", P => st(P, "hunts") >= 10],
    ["silver", "فضي", "🥈", "#cbd5e1", "100 مرة صيد", P => st(P, "hunts") >= 100],
    ["gold", "ذهبي", "🥇", "#facc15", "1000 مرة صيد", P => st(P, "hunts") >= 1000],
    ["diamond", "ألماسي", "💠", "#67e8f9", "10000 مرة صيد", P => st(P, "hunts") >= 10000],
    ["forest", "الغابة", "🌿", "#4ade80", "3 رحلات استكشاف", P => cnt(P, "exp") >= 3],
    ["flame", "اللهب", "🔥", "#f97316", "7 أيام متتالية", P => (P.streak || 0) >= 7],
    ["ice", "الجليد", "❄️", "#93c5fd", "إكمال ندرتين في كتاب المجموعة", P => dexHave(P).groups >= 2],
    ["pirate", "القراصنة", "🏴‍☠️", "#a8a29e", "5 غارات ناجحة", P => cnt(P, "raid") >= 5],
    ["ally", "التحالف", "🤝", "#60a5fa", "الانضمام إلى تحالف", P => !!ally(P)],
    ["royal", "ملكي", "👑", "#c084fc", "30 يومًا متتاليًا", P => (P.streak || 0) >= 30],
    ["rainbow", "قوس قزح", "🌈", "#f472b6", "اكتشاف كل الأنواع", P => { const d = dexHave(P); return d.have >= d.total; }],
    ["cosmos", "الكون", "🌌", "#818cf8", "امتلاك حيوان بأعلى ندرة", P => best(P) >= 6]
];
const T = Object.fromEntries(TITLES.map(t => [t[0], t])), F = Object.fromEntries(FRAMES.map(f => [f[0], f]));
const safe = (fn, P) => { try { return !!fn(P); } catch (e) { return false; } };

function view(P) {
    const c = P.cos || {};
    return {
        ok: true, title: c.title || "newbie", frame: c.frame || "plain",
        titles: TITLES.map(t => ({ id: t[0], n: t[1], req: t[2], have: safe(t[3], P) })),
        frames: FRAMES.map(f => ({ id: f[0], n: f[1], e: f[2], c: f[3], req: f[4], have: safe(f[5], P) })),
        count: TITLES.filter(t => safe(t[3], P)).length + FRAMES.filter(f => safe(f[5], P)).length - 2, total: TITLES.length + FRAMES.length - 2
    };
}
function set(P, a) {
    const c = P.cos = P.cos || {};
    if (a && a.title !== undefined) { const t = T[a.title]; if (!t || !safe(t[3], P)) return { ok: false, msg: "اللقب غير مفتوح بعد." }; c.title = t[0]; }
    if (a && a.frame !== undefined) { const f = F[a.frame]; if (!f || !safe(f[5], P)) return { ok: false, msg: "الإطار غير مفتوح بعد." }; c.frame = f[0]; }
    return { ok: true, msg: "✅ تم الحفظ.", cos: tag(P) };
}
// ما يُعرض مع اسم اللاعب للآخرين (يُرجع null إن كان الافتراضي)
function tag(P) {
    const c = P.cos || {}; let t = T[c.title], f = F[c.frame];
    if (t && !safe(t[3], P)) t = null; if (f && !safe(f[5], P)) f = null;
    if (!t && !f) return null;
    return { t: t && t[0] !== "newbie" ? t[1] : "", fe: f && f[0] !== "plain" ? f[2] : "", fc: f && f[0] !== "plain" ? f[3] : "" };
}
module.exports = { view, set, tag, TITLES, FRAMES };
