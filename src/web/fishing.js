"use strict";
// صيد البحر: ارمِ الصنارة من الرصيف. 6 رميات تتجدد رمية كل 30 دقيقة.
// 26 نوع سمك في 6 ندرات: اجمعها كلها في «كتاب الأسماك»، وسجّل أكبر حجم لكل نوع، وأكمل كل ندرة لتنال جائزة.
// حيواناتك المائية (ماء/ثلج) ترفع فرصة الأسماك النادرة.
const D = require("../game/data");
const E = require("../game/engine");
const Res = require("../game/resources");
const MAX = 6, EVERY = 30 * 60000;
const RAR = [["شائعة", "⚪"], ["غير شائعة", "🟢"], ["نادرة", "🔵"], ["ملحمية", "🟣"], ["أسطورية", "🟠"], ["خرافية", "🔴"]];
const W = [50, 28, 13, 6, 2.2, 0.8];                                  // أوزان الندرة الأساسية
const COIN_M = [0.05, 0.12, 0.3, 0.8, 2, 5];                          // عملات = دخل ساعة × المضاعف
// [id, اسم, رمز, ندرة, أصغر حجم سم, أكبر حجم سم]
const SP = [
    [1, "سردين", "🐟", 0, 8, 20], [2, "بلطي", "🐠", 0, 15, 40], [3, "جمبري", "🦐", 0, 5, 15], [4, "سلطعون", "🦀", 0, 10, 30], [5, "صدفة", "🐚", 0, 3, 10], [6, "سمكة منتفخة", "🐡", 0, 10, 35],
    [7, "دنيس", "🐠", 1, 25, 50], [8, "ماكريل", "🐟", 1, 20, 45], [9, "كركند", "🦞", 1, 25, 60], [10, "حبّار", "🦑", 1, 20, 70], [11, "قنديل البحر", "🪼", 1, 15, 60], [12, "محار", "🦪", 1, 8, 20],
    [13, "سمكة المهرّج", "🐠", 2, 8, 18], [14, "أخطبوط", "🐙", 2, 40, 150], [15, "سلحفاة بحرية", "🐢", 2, 60, 130], [16, "فقمة", "🦭", 2, 100, 200], [17, "ثعلب البحر", "🦦", 2, 80, 130],
    [18, "قرش", "🦈", 3, 150, 450], [19, "دلفين", "🐬", 3, 150, 270], [20, "مرجان ذهبي", "🪸", 3, 20, 80],
    [21, "حوت أزرق", "🐋", 4, 1500, 3000], [22, "حوت العنبر", "🐳", 4, 1100, 1800], [23, "حورية البحر", "🧜", 4, 150, 190], [24, "ثعبان البحر العملاق", "🐍", 4, 400, 900],
    [25, "تنين البحر", "🐉", 5, 800, 2500], [26, "السمكة الذهبية الأسطورية", "🌟", 5, 30, 60]
];
const BY = Object.fromEntries(SP.map(s => [s[0], { id: s[0], n: s[1], e: s[2], r: s[3], lo: s[4], hi: s[5] }]));
const byRar = r => SP.filter(s => s[3] === r).map(s => s[0]);
// جائزة إكمال كل ندرة: [بلورات، رمز بيضة (فئة) أو -1]
const GROUP_PRIZE = [[10, -1], [25, 0], [60, 1], [150, 2], [400, 3], [1200, 4]];

function F(P, now) {
    const f = (P.fish = P.fish || { en: MAX, enAt: now });
    if (!f.col) f.col = {}; if (!f.claimed) f.claimed = {};
    if (f.en < MAX) {
        const n = Math.floor((now - f.enAt) / EVERY);
        if (n > 0) { f.en = Math.min(MAX, f.en + n); f.enAt = f.en >= MAX ? now : f.enAt + n * EVERY; }
    } else f.enAt = now;
    return f;
}
const luckOf = P => Math.min(0.2, P.pets.filter(p => p.el === "water" || p.elb === "water" || p.el === "ice").length * 0.02);
const haveCount = P => Object.keys(F(P, Date.now()).col).filter(id => BY[id]).length;
function book(P, now) {
    const f = F(P, now);
    return {
        total: SP.length, have: Object.keys(f.col).filter(id => BY[id]).length,
        groups: RAR.map((r, i) => {
            const ids = byRar(i), have = ids.filter(id => f.col[id]).length;
            return { r: i, n: r[0], e: r[1], total: ids.length, have, claimed: !!f.claimed[i], prize: GROUP_PRIZE[i][0] + "🔷" + (GROUP_PRIZE[i][1] >= 0 ? " + " + D.EGGS[GROUP_PRIZE[i][1]].e : "") };
        }),
        list: SP.map(s => { const c = f.col[s[0]]; return { id: s[0], n: s[1], e: s[2], r: s[3], have: !!c, count: c ? c.n : 0, best: c ? c.best : 0 }; })
    };
}
function view(P, now) {
    const f = F(P, now);
    return { en: f.en, max: MAX, left: f.en >= MAX ? 0 : Math.max(0, f.enAt + EVERY - now), luck: Math.round(luckOf(P) * 100), total: (P.cnt && P.cnt.fish) || 0, have: Object.keys(f.col).filter(id => BY[id]).length, species: SP.length };
}
function cast(P, now, rng = Math.random) {
    const f = F(P, now);
    if (f.en < 1) return { ok: false, msg: "لا رميات الآن. تتجدد رمية كل 30 دقيقة." };
    if (f.en >= MAX) f.enAt = now;
    f.en--;
    P.cnt = P.cnt || {}; P.cnt.fish = (P.cnt.fish || 0) + 1;
    const luck = luckOf(P), loot = [], inc = E.incomeAll(P);
    const give = (id, n) => { const k = Res.add(P, id, n); if (k) loot.push(Res.lineOf(id, k)); };
    const coins = m => { const c = E.clampCoins(Math.max(50, inc * m)); P.coins = E.clampCoins(P.coins + c); loot.push("🪙 " + E.fmt(c)); };
    const ev = rng();
    if (ev < 0.02) {                                              // كنز
        give("crystal", 8 + Math.floor(rng() * 6)); give("dust", 2); coins(1.5); E.addEggToBag(P, 1); loot.push(D.EGGS[1].e + " " + D.EGGS[1].n);
        return { ok: true, kind: "treasure", title: "صندوق كنز غارق!", emoji: "🧰", loot, msg: "🧰 صندوق كنز غارق!" };
    }
    // السمكة: الندرة بالأوزان والحظ يدفع للأندر
    const wts = W.map((w, i) => w * (1 + luck * 4 * i));
    let t = rng() * wts.reduce((a, b) => a + b, 0), r = 0; while (r < wts.length - 1 && t >= wts[r]) { t -= wts[r]; r++; }
    const ids = byRar(r), sp = BY[ids[Math.floor(rng() * ids.length)]];
    const size = Math.round(sp.lo + (sp.hi - sp.lo) * Math.pow(rng(), 1.6) * 10) / 10;       // الأحجام الكبيرة أندر
    const c = f.col[sp.id] || (f.col[sp.id] = { n: 0, best: 0 });
    const first = c.n === 0, record = !first && size > c.best;
    c.n++; if (size > c.best) c.best = size;
    coins(COIN_M[r]);
    if (r >= 1 && rng() < 0.5) give(rng() < 0.6 ? "ess_water" : "ess_ice", 1 + Math.floor(r / 2));
    if (r >= 2) give("crystal", r);
    if (first) give("crystal", 2 * (r + 1));
    if (r >= 3 && rng() < 0.25) { const tier = Math.min(3, r - 2); E.addEggToBag(P, tier); loot.push(D.EGGS[tier].e + " " + D.EGGS[tier].n); }
    const lenTxt = size >= 100 ? (size / 100).toFixed(2).replace(/\.?0+$/, "") + " م" : size + " سم";
    return { ok: true, kind: "fish", sp: { id: sp.id, n: sp.n, e: sp.e, r, rn: RAR[r][0], re: RAR[r][1] }, size: lenTxt, first, record, loot, title: sp.n, emoji: sp.e,
        msg: sp.e + " اصطدت " + sp.n + " (" + lenTxt + ")" + (first ? " — نوع جديد!" : record ? " — رقم قياسي!" : "") };
}
function claim(P, a, now) {
    const f = F(P, now), r = Number(a && a.r);
    if (!(r >= 0 && r < RAR.length)) return { ok: false, msg: "ندرة غير معروفة." };
    if (f.claimed[r]) return { ok: false, msg: "استلمت هذه الجائزة." };
    if (!byRar(r).every(id => f.col[id])) return { ok: false, msg: "لم تكتمل هذه الندرة بعد." };
    f.claimed[r] = 1;
    const [cr, egg] = GROUP_PRIZE[r]; Res.add(P, "crystal", cr);
    let txt = "🔷×" + cr; if (egg >= 0) { E.addEggToBag(P, egg); txt += " + " + D.EGGS[egg].e + " " + D.EGGS[egg].n; }
    return { ok: true, msg: "🎁 أكملت أسماك " + RAR[r][1] + " " + RAR[r][0] + ": " + txt };
}
module.exports = { view, cast, book, claim, haveCount, SPECIES_COUNT: SP.length };
