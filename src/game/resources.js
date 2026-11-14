// الموارد (حلّت محل الطعام): بلورات وغبار وجواهر العناصر. تُصطاد وتُستخدم في الترقية والتطور والتعزيزات.
// المنطق مشترك بين البوت والتطبيق المصغّر.
const D = require("./data");
const E = require("./engine");

const XP_PER_CRYSTAL = 0.03;          // كل بلورة = 3% من خبرة المستوى الحالي
const fail = msg => ({ ok: false, msg });

const R = P => (P.res = P.res || {});
const have = (P, id) => R(P)[id] || 0;
function add(P, id, n) {
    n = Math.floor(n);
    if (!D.RES[id] || !(n > 0)) return 0;
    R(P)[id] = have(P, id) + n;
    return n;
}
function take(P, id, n) {
    n = Math.floor(n);
    if (!(n > 0) || have(P, id) < n) return false;
    R(P)[id] = have(P, id) - n;
    if (R(P)[id] <= 0) delete R(P)[id];
    return true;
}
const label = id => D.RES[id].e + " " + D.RES[id].n;
const lineOf = (id, n) => D.RES[id].e + "×" + E.fmt(n);
const listTxt = (map) => Object.keys(map || {}).filter(id => D.RES[id] && map[id] > 0).map(id => lineOf(id, map[id])).join(" ");

// ---------- تحويل الأطعمة القديمة ----------
const FOOD_TO_CRYSTAL = { date: 0, meat: 1, feast: 2, cake: 6, potion: 25, elixir: 80, tear: 300 };
function foodValue(id) {
    if (!/^fruit_/.test(id) && id in FOOD_TO_CRYSTAL) return { id: "crystal", n: FOOD_TO_CRYSTAL[id] };
    const m = /^fruit_(\w+)$/.exec(id);
    if (m && D.RES["ess_" + m[1]]) return { id: "ess_" + m[1], n: 2 };
    return null;
}
// يحوّل مكافآت قديمة على شكل أطعمة إلى موارد
function grantItems(P, items) {
    const got = {};
    for (const id of Object.keys(items || {})) {
        const v = foodValue(id);
        if (v) { const n = add(P, v.id, v.n * items[id]); if (n) got[v.id] = (got[v.id] || 0) + n; }
        else if (D.RES[id]) { const n = add(P, id, items[id]); if (n) got[id] = (got[id] || 0) + n; }
    }
    return got;
}
// ترحيل لاعب قديم: يحوّل ما يملكه من طعام إلى موارد مرة واحدة
function migrate(P) {
    if (!P || P.rv >= 1) return false;
    P.rv = 1;
    P.res = P.res || {};
    const items = P.items || {};
    for (const id of Object.keys(items)) {   // فواكه العناصر فقط تتحول إلى جواهر
        if (!/^fruit_/.test(id)) continue;
        const v = foodValue(id);
        if (v) { add(P, v.id, v.n * items[id]); delete items[id]; }
    }
    if (!(P.res.crystal > 0)) add(P, "crystal", 2);
    return true;
}

// ---------- الاستخدام ----------
// بلورات → خبرة لحيوان
function useCrystals(P, petId, n) {
    const pet = E.getPet(P, petId);
    n = Math.floor(Number(n));
    if (!pet) return fail("الحيوان غير موجود.");
    if (!(n >= 1)) return fail("كمية غير صالحة.");
    if (pet.lv >= D.C.LV_CAP) return fail("وصل أعلى مستوى. رقّه بنجمة ⭐.");
    n = Math.min(n, have(P, "crystal"));
    if (n < 1) return fail("لا تملك بلورات. اصطد أو اشترِ من المتجر.");
    take(P, "crystal", n);
    const lv = E.givePct(pet, XP_PER_CRYSTAL * n);
    return { ok: true, used: n, msg: "🔷 استخدمت " + n + " بلورة (+" + Math.round(XP_PER_CRYSTAL * n * 100) + "% خبرة)" + (lv ? " ⬆️ مستوى " + pet.lv : "") };
}

// ---------- المتجر ----------
function topRarity(P) { return (P.pets || []).reduce((m, p) => Math.max(m, E.spOf(p).r), 0); }
function priceOf(P, id) {
    const base = Math.max(50, Math.floor(D.EGGS[topRarity(P)].price / 40));
    if (id === "crystal") return base;
    if (id === "dust") return base * 10;
    return base * 4;
}
function buy(P, id, qty) {
    qty = Math.floor(Number(qty));
    if (!D.RES[id] || !(qty >= 1 && qty <= 1000)) return fail("طلب غير صالح.");
    const cost = priceOf(P, id) * qty;
    if (P.coins < cost) return fail("رصيدك لا يكفي. تحتاج " + E.fmt(cost) + ".");
    P.coins -= cost;
    add(P, id, qty);
    return { ok: true, msg: "اشتريت " + qty + " × " + label(id) + "." };
}

module.exports = { XP_PER_CRYSTAL, R, have, add, take, label, lineOf, listTxt, foodValue, grantItems, migrate, useCrystals, priceOf, buy, topRarity };
