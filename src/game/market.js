// سوق اللاعبين: جنيات وبيض وموارد. المعروض يُسحب من البائع (ضمانة) ويُعاد له عند الإلغاء أو انتهاء المدة.
// يُحفظ في جدول المجموعات تحت معرّف ثابت (لا حاجة لجدول جديد).
const D = require("./data");
const E = require("./engine");
const Res = require("./resources");
const F = require("./fairies");
const store = require("../core/store");

const KEY = 7770001, TTL = 7 * 86400e3, MAX_PER = 10, TAX = 0.05, MAX_PRICE = 9e14;
const fail = msg => ({ ok: false, msg });
const MULTS = [0.5, 1, 1.5, 2, 3];

const state = () => { const g = store.getGroup(KEY); return { list: g.list || [], seq: g.seq || 0 }; };
const save = (list, seq) => store.setGroup(KEY, { list, seq });

// ---------- سحب/إعطاء العناصر ----------
function takeItem(P, kind, ref, qty) {
    if (kind === "f") {
        const f = F.get(P, ref);
        if (!f) return null;
        if (f.hab) F.removeHabitat(P, f.id);
        P.fairies.splice(P.fairies.indexOf(f), 1);
        P.fequip = P.fequip.filter(x => x !== f.id);
        return { f: JSON.parse(JSON.stringify(f)) };
    }
    if (kind === "e") {
        const bag = E.bag(P), i = bag.findIndex(e => e.id === Number(ref));
        if (i < 0) return null;
        return { e: bag.splice(i, 1)[0] };
    }
    if (kind === "r") {
        if (!D.RES[ref] || !Res.take(P, ref, qty)) return null;
        return { r: ref, n: qty };
    }
    return null;
}
function giveItem(P, it) {
    if (it.f) {
        F.st(P);
        if (P.fairies.length >= F.OWN_CAP) return false;
        const f = it.f; f.id = ++P.fseq; f.hab = null; f.since = 0; P.fairies.push(f);
        return true;
    }
    if (it.e) { E.addEggToBag(P, it.e.tier, { bred: it.e.bred, pre: it.e.pre }); return true; }
    if (it.r) { Res.add(P, it.r, it.n); return true; }
    return false;
}
function describe(l) {
    const it = l.item;
    if (it.f) { const s = F.SPECIES[it.f.sp]; return `${s.e} ${it.f.nick || s.n} ${F.RANK_E[s.r]} Lv${F.lvOf(it.f)}`; }
    if (it.e) { const d = D.EGGS[it.e.tier]; return `${d.e} ${d.n}${it.e.bred ? " (تزاوج)" : ""}`; }
    return `${D.RES[it.r].e} ${D.RES[it.r].n} ×${it.n}`;
}
const kindOf = l => (l.item.f ? "f" : l.item.e ? "e" : "r");

// ---------- أسعار مقترحة ----------
function suggest(P, kind, ref, qty) {
    if (kind === "f") { const f = F.get(P, ref); return f ? Math.floor(F.SHOP_BASE[F.SPECIES[f.sp].r] * (1 + 0.15 * (F.lvOf(f) - 1))) : 0; }
    if (kind === "e") { const e = E.bag(P).find(x => x.id === Number(ref)); return e ? Math.floor(D.EGGS[e.tier].price * (e.bred ? 1.3 : 1)) : 0; }
    return Res.priceOf(P, ref) * Math.max(1, qty || 1);
}

// ---------- العمليات ----------
function prune(now) {
    const { list, seq } = state();
    const keep = [];
    let changed = false;
    for (const l of list) {
        if (now - l.at < TTL) { keep.push(l); continue; }
        const S = store.get(l.seller);
        if (S && giveItem(S, l.item)) { store.touch(S.id); changed = true; }
        else keep.push(l);          // لا مكان عند البائع: تبقى حتى يتوفر
    }
    if (changed) save(keep, seq);
    return keep;
}
const all = now => prune(now);
const mine = (uid, now) => all(now).filter(l => String(l.seller) === String(uid));

function sell(P, name, kind, ref, qty, price, now) {
    price = Math.floor(Number(price));
    if (!(price >= 1) || price > MAX_PRICE) return fail("سعر غير صالح.");
    const list = all(now);
    if (list.filter(l => String(l.seller) === String(P.id)).length >= MAX_PER) return fail("وصلت حد المعروضات (" + MAX_PER + ").");
    const it = takeItem(P, kind, ref, qty);
    if (!it) return fail("العنصر غير متاح.");
    const { seq } = state();
    const l = { id: seq + 1, seller: String(P.id), sname: name || "لاعب", item: it, price, at: now };
    list.push(l);
    save(list, seq + 1);
    return { ok: true, l, msg: "✅ عُرض " + describe(l) + " بسعر " + E.fmt(price) + " 🪙 (ضريبة البيع " + Math.round(TAX * 100) + "%). يبقى " + Math.round(TTL / 86400e3) + " أيام." };
}
function cancel(P, id, now) {
    const list = all(now), i = list.findIndex(l => l.id === Number(id));
    if (i < 0) return fail("العرض غير موجود.");
    const l = list[i];
    if (String(l.seller) !== String(P.id)) return fail("ليس عرضك.");
    if (!giveItem(P, l.item)) return fail("لا مكان لاستعادته (حديقتك ممتلئة).");
    list.splice(i, 1);
    save(list, state().seq);
    return { ok: true, msg: "↩️ أُعيد " + describe(l) + " إليك." };
}
function buy(P, id, now) {
    const list = all(now), i = list.findIndex(l => l.id === Number(id));
    if (i < 0) return fail("بيع هذا العرض أو انتهى.");
    const l = list[i];
    if (String(l.seller) === String(P.id)) return fail("هذا عرضك. ألغِه من معروضاتي.");
    if (P.coins < l.price) return fail("رصيدك لا يكفي. تحتاج " + E.fmt(l.price) + ".");
    if (!giveItem(P, l.item)) return fail("لا مكان لاستلامه (حديقة الجنيات ممتلئة).");
    P.coins -= l.price;
    const S = store.get(l.seller);
    const gain = Math.floor(l.price * (1 - TAX));
    if (S) { S.coins = E.clampCoins(S.coins + gain); store.touch(S.id); }
    list.splice(i, 1);
    save(list, state().seq);
    store.touch(P.id);
    return { ok: true, l, seller: l.seller, gain, msg: "🛒 اشتريت " + describe(l) + " بـ " + E.fmt(l.price) + " 🪙" };
}

module.exports = { KEY, TTL, MAX_PER, TAX, MULTS, all, mine, sell, cancel, buy, describe, kindOf, suggest, takeItem, giveItem };
