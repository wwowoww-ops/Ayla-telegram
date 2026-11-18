// الموسم الأسبوعي: نقاط من نشاط الأسبوع (فرق الإحصاءات عن بداية الأسبوع)، ترتيب، ومكافآت للمتصدرين.
// لا يغيّر بيانات اللعبة: يضيف فقط P.season (لقطة بداية الأسبوع) و P.seasonWon (سجل الجوائز)، وحالة عامة في إعدادات مجموعة "__season".
const store = require("../core/store");
const E = require("./engine");
const Res = require("./resources");
const D = require("./data");

// ---------- الإعدادات (عدّل من هنا) ----------
const WEEK = 7 * 24 * 3600e3;
const EPOCH = Date.UTC(2023, 11, 31, 23, 0, 0);   // الاثنين 00:00 بتوقيت تونس (UTC+1)
const MIN_PTS = 50;                                // أقل نقاط لنيل مكافأة المشاركة
const POINTS = [                                   // [المفتاح في stats، النقاط لكل وحدة، الوصف]
    ["wins", 5, "انتصارات الصيد"], ["hunts", 1, "محاولات الصيد"], ["duelWins", 15, "انتصارات المبارزة"], ["duels", 3, "مبارزات"],
    ["hatched", 4, "بيض فقس"], ["bred", 10, "تزاوج"], ["bossKills", 40, "زعماء شاركت في هزيمتهم"]
];
// المكافآت: الترتيب → { res: {...}, egg: درجة البيضة }
const PRIZES = [
    { res: { crystal: 200, dust: 100 }, essN: 20, egg: 5, fairy: 3 },
    { res: { crystal: 120, dust: 60 }, essN: 12, egg: 4 },
    { res: { crystal: 80, dust: 40 }, essN: 8, egg: 3 }
];
const TOP10 = { res: { crystal: 40 }, egg: 2 };    // المراكز 4–10
const PART = { res: { crystal: 15 }, egg: 1 };     // كل من وصل الحد الأدنى

const idAt = now => Math.floor((now - EPOCH) / WEEK);
const startOf = id => EPOCH + id * WEEK;
const endOf = id => startOf(id + 1);

const snap = P => { const s = P.stats || {}, o = {}; POINTS.forEach(([k]) => { o[k] = Number(s[k]) || 0; }); return o; };
// يضمن وجود لقطة الأسبوع الحالي للاعب (تُؤخذ عند أول نشاط له في الأسبوع)
function ensure(P, now) {
    const id = idAt(now);
    if (!P.season || P.season.id !== id) { P.season = { id, base: snap(P) }; return true; }
    return false;
}
function pointsOf(P, id) {
    if (!P.season || P.season.id !== id) return 0;
    const s = P.stats || {};
    return Math.floor(POINTS.reduce((t, [k, w]) => t + Math.max(0, (Number(s[k]) || 0) - (P.season.base[k] || 0)) * w, 0));
}
function ranking(id) {
    return store.all().filter(p => p && p.season && p.season.id === id).map(p => ({ id: String(p.id), name: p.name || "لاعب", pts: pointsOf(p, id) }))
        .filter(r => r.pts > 0).sort((a, b) => b.pts - a.pts || (a.id < b.id ? -1 : 1));
}
const state = () => store.getGroup("__season") || {};
const hist = () => Array.isArray(state().hist) ? state().hist : [];

function prizeFor(rank, pts) {
    if (rank >= 1 && rank <= PRIZES.length) return PRIZES[rank - 1];
    if (rank <= 10) return TOP10;
    return pts >= MIN_PTS ? PART : null;
}
function give(P, prize, rng) {
    const got = { res: {}, egg: null, fairy: null, ess: null };
    Object.entries(prize.res).forEach(([k, v]) => { Res.add(P, k, v); got.res[k] = v; });
    if (prize.essN) { const el = D.EL_KEYS[Math.floor(rng() * D.EL_KEYS.length)], id = "ess_" + el; if (D.RES[id]) { Res.add(P, id, prize.essN); got.ess = { id, n: prize.essN }; } }
    if (prize.egg != null) { E.addEggToBag(P, prize.egg); got.egg = prize.egg; }
    if (prize.fairy != null) { try { const F = require("./fairies"), l = F.SPECIES ? Object.values(F.SPECIES).filter(x => x.r === prize.fairy) : []; if (l.length && F.addFairy(P, l[Math.floor(rng() * l.length)].id)) got.fairy = true; } catch (e) { /* لا جنيات */ } }
    return got;
}
// ينهي الموسم المنتهي (الأحدث فقط) مرة واحدة ويوزّع الجوائز؛ يُرجع قائمة الفائزين للإشعار
function settle(now, rng = Math.random) {
    const G = state(), cur = idAt(now);
    if (typeof G.settled !== "number") { store.setGroup("__season", { settled: cur - 1, hist: hist() }); return []; }
    const target = cur - 1;
    if (G.settled >= target) return [];
    const rows = ranking(target), won = [];
    rows.forEach((r, i) => {
        const rank = i + 1, pr = prizeFor(rank, r.pts), P = store.get(r.id);
        if (!pr || !P) return;
        const got = give(P, pr, rng);
        P.seasonWon = (Array.isArray(P.seasonWon) ? P.seasonWon : []).concat([{ id: target, rank, pts: r.pts }]).slice(-8);
        store.touch(P.id);
        won.push({ uid: r.id, name: r.name, rank, pts: r.pts, got });
    });
    const h = hist().concat([{ id: target, at: endOf(target), rows: rows.slice(0, 10), total: rows.length }]).slice(-4);
    store.setGroup("__season", { settled: target, hist: h });
    return won;
}
module.exports = { WEEK, MIN_PTS, POINTS, PRIZES, TOP10, PART, idAt, startOf, endOf, ensure, pointsOf, ranking, hist, settle, prizeFor, state };
