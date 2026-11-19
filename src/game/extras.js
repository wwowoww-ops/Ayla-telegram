// إضافات اللعبة: متجر النوادر (عسل الحضانة، حجر الطفرة، صندوق النوادر)، تدفئة البيض (تقصير محدود وليس تسريعًا دائمًا)،
// وتدوير الحيوانات الزائدة إلى موارد. لا يغيّر بيانات اللاعبين الحالية؛ يضيف P.nov فقط وحقولًا اختيارية على البيض.
const D = require("./data");
const E = require("./engine");
const Res = require("./resources");

const fail = msg => ({ ok: false, msg });
const ok = (msg, extra) => Object.assign({ ok: true, msg }, extra || {});
const fmt = E.fmt;
const buffs = P => { try { return require("./fairies").buffs(P); } catch (e) { return {}; } };
const postX = P => { try { return require("./posts").extra(P); } catch (e) { return { warmMax: 0, warmCd: 0, mut: 0 }; } };   // بفات الحضانة من وظائف الحيوانات
const warmMax = P => WARM_MAX + postX(P).warmMax;
const warmCd = P => Math.floor(WARM_CD * (1 - Math.min(0.5, postX(P).warmCd)));

// ---------- الإعدادات (عدّل من هنا) ----------
const HOUR = 3600e3;
const WARM_PCT = 0.10;        // كل تدفئة تقصّر 10% من مدة الفقس الأصلية
const WARM_MAX = 3;           // أقصى تدفئات للبيضة الواحدة (الحد الأقصى للتقصير 30%)
const WARM_CD = 1 * HOUR;     // الانتظار بين تدفئتين لنفس البيضة
const STONE_BOOST = 0.15;     // زيادة فرصة الطفرة العنصرية عند استعمال الحجر
const RC = [1, 2, 5, 12, 30, 80, 200, 500, 1300];   // عوائد التدوير الأساسية (بلورات) بحسب الندرة
const MAX_BULK = 60;          // أقصى عدد حيوانات في تدوير جماعي واحد

const ITEMS = {
    honey: { n: "عسل الحضانة", e: "🍯", price: 6, d: `يقصّر وقت فقس بيضة ${WARM_PCT * 100}% من مدتها الأصلية (حتى ${WARM_MAX} مرات لكل بيضة، مرة كل ساعة)` },
    stone: { n: "حجر الطفرة", e: "🧿", price: 18, d: `يرفع فرصة الطفرة العنصرية ${STONE_BOOST * 100}% في تزاوج واحد (يلزم اختلاف عناصر الأبوين)` },
    box:   { n: "صندوق النوادر", e: "🎁", price: 30, d: "مفاجأة: بلورات أو جواهر أو بيضة أو عسل أو حجر" }
};
const items = P => (P.nov = P.nov && typeof P.nov === "object" ? P.nov : {});   // حقل منفصل عن P.items (مخزن الطعام)
const have = (P, id) => Math.max(0, Math.floor(Number(items(P)[id]) || 0));

function buy(P, id, qty) {
    const it = ITEMS[id];
    qty = Math.floor(Number(qty) || 1);
    if (!it) return fail("غرض غير معروف.");
    if (!(qty >= 1 && qty <= 100)) return fail("كمية غير صالحة.");
    const cost = it.price * qty;
    if (!Res.take(P, "crystal", cost)) return fail("تحتاج " + cost + " 🔷 (لديك " + Res.have(P, "crystal") + ").");
    items(P)[id] = have(P, id) + qty;
    return ok("اشتريت " + qty + " × " + it.e + " " + it.n + " بـ " + cost + " 🔷");
}

// صندوق النوادر
function openBox(P, rng = Math.random) {
    if (have(P, "box") < 1) return fail("لا تملك صندوقًا.");
    items(P).box--;
    const x = rng();
    let msg;
    if (x < 0.50) { const n = 12 + Math.floor(rng() * 30); Res.add(P, "crystal", n); msg = n + " 🔷 بلورة"; }
    else if (x < 0.75) { const el = D.EL_KEYS[Math.floor(rng() * D.EL_KEYS.length)], n = 3 + Math.floor(rng() * 6); Res.add(P, "ess_" + el, n); msg = n + " " + D.RES["ess_" + el].e + " " + D.RES["ess_" + el].n; }
    else if (x < 0.87) { const t = 1 + Math.floor(rng() * 3); E.addEggToBag(P, t); msg = D.EGGS[t].e + " " + D.EGGS[t].n + " (في المحفظة)"; }
    else if (x < 0.95) { items(P).honey = have(P, "honey") + 2; msg = "2 🍯 عسل الحضانة"; }
    else { items(P).stone = have(P, "stone") + 1; msg = "🧿 حجر الطفرة"; }
    return ok("🎁 فتحتَ الصندوق ووجدت: " + msg);
}

// ---------- تدفئة البيض ----------
function warmInfo(P, egg, now) {
    const n = egg.warm || 0, mx = warmMax(P), left = Math.max(0, (egg.warmAt || 0) + warmCd(P) - now);
    return { n, max: mx, wait: left, canWarm: egg.readyAt > now && n < mx && left === 0 };
}
function warm(P, eggId, now) {
    const egg = (P.eggs || []).find(e => e.id === Number(eggId));
    if (!egg) return fail("البيضة غير موجودة في الحضانة.");
    if (egg.readyAt <= now) return fail("البيضة جاهزة أصلًا 🐣");
    const w = warmInfo(P, egg, now);
    if (w.n >= w.max) return fail("وصلت هذه البيضة أقصى تدفئة (" + w.max + ").");
    if (w.wait > 0) return fail("انتظر " + E.dur(w.wait) + " قبل تدفئتها مجددًا.");
    if (have(P, "honey") < 1) return fail("لا تملك 🍯 عسل الحضانة. اشتره من متجر النوادر.");
    const base = E.eggMs(P, egg.tier, egg.bred), cut = Math.floor(base * WARM_PCT * (1 + (buffs(P).warm || 0)));
    const before = egg.readyAt - now;
    items(P).honey--;
    egg.readyAt = Math.max(now, egg.readyAt - cut);
    egg.warm = w.n + 1; egg.warmAt = now;
    return ok("🍯 دفّأتَ البيضة: نقص " + E.dur(Math.min(cut, before)) + " (" + egg.warm + "/" + w.max + "). المتبقي " + (egg.readyAt <= now ? "لا شيء — جاهزة!" : E.dur(egg.readyAt - now)));
}

// ---------- تدوير الحيوانات الزائدة ----------
function recycleValue(P, pet) {
    const r = E.spOf(pet).r, b = (buffs(P).recycle || 0);
    const mult = (1 + (pet.lv - 1) / 10) * (1 + 2 * pet.st) * pet.q * (1 + b);
    const ess = {}, n = Math.max(1, Math.ceil(RC[r] / 5 * (1 + b)));
    ess["ess_" + pet.el] = n;
    if (pet.elb) ess["ess_" + pet.elb] = (ess["ess_" + pet.elb] || 0) + Math.max(1, Math.ceil(n / 2));
    return { crystal: Math.max(1, Math.round(RC[r] * mult)), ess };
}
const posted = (P, pet) => { try { return require("./posts").isPosted(P, pet.id); } catch (e) { return false; } };
const protectedPet = (P, pet) => pet.id === P.main || pet.st > 0 || E.isElite(pet) || posted(P, pet);
function recycle(P, ids) {
    const list = [];
    for (const id of ids) { const p = E.getPet(P, Number(id)); if (p && !list.includes(p)) list.push(p); }
    if (!list.length) return fail("لا حيوانات للتدوير.");
    if (list.some(p => p.id === P.main)) return fail("لا يمكن تدوير حيوانك الأساسي.");
    if (P.pets.length - list.length < 1) return fail("يجب أن يبقى لك حيوان واحد على الأقل.");
    let crystal = 0; const ess = {};
    list.forEach(p => {
        const v = recycleValue(P, p);
        crystal += v.crystal; Object.entries(v.ess).forEach(([k, n]) => { ess[k] = (ess[k] || 0) + n; });
    });
    list.forEach(p => P.pets.splice(P.pets.indexOf(p), 1));
    Res.add(P, "crystal", crystal);
    Object.entries(ess).forEach(([k, n]) => Res.add(P, k, n));
    return ok("♻️ دوّرتَ " + list.length + " حيوان: " + crystal + " 🔷" + Object.entries(ess).map(([k, n]) => " + " + n + " " + D.RES[k].e).join(""), { crystal, ess, n: list.length });
}
// الحيوانات المرشّحة للتدوير الجماعي: بالندرة القصوى والمستوى الأقصى، دون المحميّين (أساسي/نجوم/نخبة)
function candidates(P, maxRar, maxLv) {
    return P.pets.filter(p => E.spOf(p).r <= maxRar && p.lv <= maxLv && !protectedPet(P, p)).slice(0, MAX_BULK);
}
function recycleBulk(P, maxRar, maxLv) {
    const c = candidates(P, maxRar, maxLv);
    if (!c.length) return fail("لا حيوانات مناسبة (المحميّ: الأساسي، ذو النجوم، والنخبة).");
    return recycle(P, c.map(p => p.id));
}

// ---------- إشعار جاهزية البيض ----------
// يرجع قائمة { uid, n } للاعبين الذين جهز لهم بيض ولم يُشعَروا بعد، ويعلّم البيض كمُشعَر
function readyEggs(players, now) {
    const out = [];
    players.forEach(P => {
        if (!P || P.notify === false || !Array.isArray(P.eggs)) return;
        const r = P.eggs.filter(e => e.readyAt <= now && !e.notified);
        if (!r.length) return;
        r.forEach(e => { e.notified = true; });
        out.push({ uid: String(P.id), n: r.length, P });
    });
    return out;
}

module.exports = { ITEMS, WARM_PCT, WARM_MAX, WARM_CD, warmMax, warmCd, STONE_BOOST, RC, items, have, buy, openBox, warm, warmInfo, recycleValue, recycle, recycleBulk, candidates, protectedPet, readyEggs };
