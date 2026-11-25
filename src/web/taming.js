"use strict";
// طقس الترويض: بعد هزيمة الزعيم تُمنح فرصة ترويض لصاحب أكبر ضرر (وللمشاركين أحيانًا). يجرّب اللاعب 5 محاولات بأساليب مختلفة:
// لكل زعيم أسلوب يحبه وآخر يقبله، والباقي يكرهه. تقرأ تلميحه وتصل بثقته إلى 100 لتروّضه.
const E = require("../game/engine");
const D = require("../game/data");
const Res = require("../game/resources");
const APP = [["food", "🍖", "طعام شهي"], ["song", "🎵", "لحن هادئ"], ["magic", "✨", "وميض سحري"], ["touch", "🤝", "لمسة حنونة"]];
const FAV = { fire: "food", water: "song", plant: "touch", earth: "food", thunder: "magic", light: "magic", dark: "song", ice: "touch", wind: "song", poison: "food", metal: "magic" };
const HINT = {
    food: "يشمّ الهواء ويلعق شفتيه…", song: "يميل برأسه ويصغي لصوت بعيد…",
    magic: "عيناه تلمعان بانعكاس الوهج حولك…", touch: "يقترب خطوة ويتفحّص يدك بحذر…"
};
const TRIES = 5, GOAL = 100, TTL = 48 * 3600e3, OFFER = 25, RETRY = 60;
const BAD = ["زمجر غاضبًا 😠", "تراجع للخلف 😤", "أدار ظهره 😒"], OK = ["هزّ رأسه بتردد 🙂", "قبل الهدية على مضض 😐"], LOVE = ["أحبّها كثيرًا! 🤩", "اهتزّ فرحًا! 😍", "ارتخت عضلاته واقترب 🥰"];
const pick = a => a[Math.floor(Math.random() * a.length)];

function start(P, kind, now) {
    if (P.tamed || P.tame) return false;
    const fav = FAV[kind.el] || "food", others = APP.map(a => a[0]).filter(x => x !== fav);
    P.tame = { kind: kind.id, n: kind.n, e: kind.e, el: kind.el, fav, ok: pick(others), trust: 0, tries: TRIES, log: [], last: null, exp: now + TTL, retried: false };
    return true;
}
function create(P, t, now) {
    const sid = D.BOSS_SP[t.kind]; if (!sid) return null;
    const bp = E.makePet(P, sid, t.el, 1.2, now, 0); P.tamed = t.kind; P.tamedEver = true;
    P.pens = P.pens || [];
    if (!P.pens.some(x => x.id === E.BOSS_PEN)) P.pens.push({ id: E.BOSS_PEN, name: "👑 حظيرة الزعماء" });
    if (bp) bp.pen = E.BOSS_PEN;
    return bp;
}
const live = (P, now) => { if (P.tame && now > P.tame.exp) delete P.tame; return P.tame || null; };

function step(P, a, now) {
    const t = live(P, now); if (!t) return { ok: false, msg: "لا فرصة ترويض عندك الآن. اهزم زعيمًا أولًا." };
    if (t.tries <= 0) return { ok: false, msg: "انتهت محاولاتك. جرّب إعادة المحاولة بالبلورات." };
    const k = String(a.ap), ap = APP.find(x => x[0] === k); if (!ap) return { ok: false, msg: "أسلوب غير معروف." };
    let d, line;
    if (k === t.fav) { d = t.last === k ? 22 : 45; line = pick(LOVE); } else if (k === t.ok) { d = t.last === k ? 10 : 20; line = pick(OK); } else { d = -15; line = pick(BAD); }
    t.trust = Math.max(0, Math.min(GOAL, t.trust + d)); t.tries--; t.last = k;
    t.log.push(ap[1] + " " + line + " (" + (d > 0 ? "+" : "") + d + ")"); if (t.log.length > 6) t.log.shift();
    if (t.trust >= GOAL) { const bp = create(P, t, now); delete P.tame; return { ok: true, tamed: true, msg: "🎉 روّضت " + t.n + "! صار حيوانك في حظيرة الزعماء 👑" + (bp ? "" : "") }; }
    if (t.tries <= 0) return { ok: true, msg: "💨 نفدت محاولاتك والثقة " + t.trust + "/" + GOAL + ". يمكنك إعادة المحاولة بالبلورات." };
    return { ok: true, msg: ap[1] + " " + line };
}
function offer(P, a, now) {
    const t = live(P, now); if (!t) return { ok: false, msg: "لا فرصة ترويض." };
    if (!Res.take(P, "crystal", OFFER)) return { ok: false, msg: "تحتاج 🔷 " + OFFER + " بلورة قربانًا." };
    t.trust = Math.min(GOAL, t.trust + 30); t.log.push("💎 قدّمت قربانًا من البلورات (+30)");
    if (t.trust >= GOAL) { create(P, t, now); delete P.tame; return { ok: true, tamed: true, msg: "🎉 روّضت " + t.n + "!" }; }
    return { ok: true, msg: "💎 قبل القربان (+30) والثقة " + t.trust + "/" + GOAL };
}
function retry(P, a, now) {
    const t = live(P, now); if (!t) return { ok: false, msg: "لا فرصة ترويض." };
    if (t.tries > 0) return { ok: false, msg: "ما زالت لديك محاولات." };
    if (t.retried) return { ok: false, msg: "استخدمت إعادة المحاولة من قبل." };
    if (!Res.take(P, "crystal", RETRY)) return { ok: false, msg: "تحتاج 🔷 " + RETRY + " بلورة." };
    t.retried = true; t.tries = 3; return { ok: true, msg: "🔁 3 محاولات جديدة، والثقة محفوظة." };
}
function view(P, now) {
    const t = live(P, now); if (!t) return null;
    return { n: t.n, e: t.e, trust: t.trust, goal: GOAL, tries: t.tries, log: t.log, hint: HINT[t.fav], left: Math.max(0, t.exp - now), canRetry: t.tries <= 0 && !t.retried, offer: OFFER, retryCost: RETRY, apps: APP.map(x => ({ id: x[0], e: x[1], n: x[2] })), mood: t.last ? (t.last === t.fav ? "love" : t.last === t.ok ? "ok" : "bad") : "" };
}
module.exports = { start, step, offer, retry, view };
