// أماكن الأكل (أوعية): يشتريها اللاعب ويضعها في حظيرة بكمية طعام محدودة،
// فتأكل منها الحيوانات الجائعة تلقائيًا دون تدخل. المنطق مشترك بين البوت والتطبيق المصغّر.
const D = require("./data");
const E = require("./engine");

const MAX_BOWLS = 12;                  // أقصى عدد أوعية
const CAP = 100;                       // أقصى كمية طعام في الوعاء الواحد
const FOODS = ["date", "meat", "feast"];   // الأطعمة المسموح وضعها
const BASE_PRICE = 5000, GROWTH = 2.2;     // سعر الوعاء يزيد مع كل وعاء

const bowls = P => (P.bowls = P.bowls || []);
const fail = msg => ({ ok: false, msg });
const find = (P, id) => bowls(P).find(b => b.id === id);
const price = P => Math.floor(BASE_PRICE * Math.pow(GROWTH, bowls(P).length));
const isPlaced = b => b.pen != null;

// -1 = كل الحظائر، 0 = الكبرى، أو رقم حظيرة موجودة
const penOk = (P, pen) => pen === -1 || pen === 0 || (P.pens || []).some(x => x.id === pen);
function penName(P, pen) {
    if (pen === -1) return "🌍 كل الحظائر";
    if (pen === 0) return "🏡 الكبرى";
    const p = (P.pens || []).find(x => x.id === pen);
    return p ? p.name : "؟";
}
const owned = (P, food) => P.items[food] || 0;
function take(P, food, n) {
    P.items[food] = owned(P, food) - n;
    if (P.items[food] <= 0) delete P.items[food];
}
function give(P, food, n) { if (n > 0) P.items[food] = owned(P, food) + n; }

// ---------- شراء ووضع وتعبئة وإزالة ----------
function buy(P) {
    if (bowls(P).length >= MAX_BOWLS) return fail("وصلت أقصى عدد من الأوعية (" + MAX_BOWLS + ").");
    const c = price(P);
    if (P.coins < c) return fail("تحتاج " + E.fmt(c) + " 🪙 لشراء وعاء.");
    P.coins -= c;
    P.bowlSeq = (P.bowlSeq || 0) + 1;
    bowls(P).push({ id: P.bowlSeq, pen: null, food: null, qty: 0 });
    return { ok: true, msg: "🥣 اشتريت وعاءً جديدًا." };
}

// يضع عددًا من الأوعية غير الموضوعة في حظيرة، كل وعاء بكمية من نفس الطعام
function placeMany(P, count, pen, food, qty) {
    const free = bowls(P).filter(b => !isPlaced(b));
    if (!Number.isInteger(count) || count < 1) return fail("اختر عدد الأوعية.");
    if (!free.length) return fail("لا تملك أوعية غير موضوعة. اشترِ وعاءً أولًا.");
    if (count > free.length) return fail("عندك " + free.length + " وعاء غير موضوع فقط.");
    if (!Number.isInteger(pen) || !penOk(P, pen)) return fail("حظيرة غير صالحة.");
    if (!FOODS.includes(food)) return fail("هذا الطعام لا يوضع في الأوعية.");
    if (!Number.isInteger(qty) || qty < 1 || qty > CAP) return fail("الكمية من 1 إلى " + CAP + " لكل وعاء.");
    const need = count * qty, have = owned(P, food), f = D.FOODS[food];
    if (have < need) return fail("تحتاج " + need + " " + f.n + " وعندك " + have + " فقط.");
    take(P, food, need);
    free.slice(0, count).forEach(b => { b.pen = pen; b.food = food; b.qty = qty; });
    return { ok: true, msg: "🥣 وُضع " + count + " وعاء في " + penName(P, pen) + " (" + f.e + " ×" + qty + " لكل وعاء)." };
}

// يضيف طعامًا من نفس النوع إلى وعاء موضوع
function refill(P, id, qty) {
    const b = find(P, id);
    if (!b || !isPlaced(b)) return fail("وعاء غير موضوع.");
    if (!Number.isInteger(qty) || qty < 1) return fail("كمية غير صالحة.");
    const space = CAP - b.qty;
    if (space <= 0) return fail("الوعاء ممتلئ (" + CAP + ").");
    const f = D.FOODS[b.food], q = Math.min(qty, space, owned(P, b.food));
    if (q <= 0) return fail("لا تملك " + f.n + ". اشترِ من المتجر.");
    take(P, b.food, q);
    b.qty += q;
    return { ok: true, msg: "تمت تعبئة " + f.e + " ×" + q + " (الآن " + b.qty + "/" + CAP + ")." };
}

// يزيل وعاءً (أو كل الموضوعة إذا id = -1) ويُرجع الطعام المتبقي للمخزن
function remove(P, id) {
    const list = id === -1 ? bowls(P).filter(isPlaced) : [find(P, id)].filter(b => b && isPlaced(b));
    if (!list.length) return fail("لا يوجد وعاء موضوع.");
    let back = 0;
    list.forEach(b => { give(P, b.food, b.qty); back += b.qty; b.pen = null; b.food = null; b.qty = 0; });
    return { ok: true, msg: "تمت الإزالة" + (back ? " وعاد " + back + " من الطعام لمخزنك." : ".") };
}

// ---------- الأكل التلقائي ----------
function tick(P, now) {
    const list = bowls(P).filter(b => isPlaced(b) && b.qty > 0);
    if (!list.length) return { meals: 0, emptied: 0 };
    let meals = 0, emptied = 0;
    for (const pet of P.pets) {
        const mine = list.filter(b => b.pen === -1 || b.pen === (pet.pen || 0));
        for (let guard = 0; guard < 400; guard++) {
            const b = mine.find(x => x.qty > 0);
            if (!b) break;
            const f = D.FOODS[b.food];
            const thr = Math.max(10, 100 - f.hg);                       // يأكل حين لا يضيع شيء من الطعام
            const tEat = pet.hg > thr ? pet.hgAt + (pet.hg - thr) * D.C.HUNGER_MS : pet.hgAt;
            if (tEat > now) break;
            const hAt = Math.max(0, pet.hg - (tEat - pet.hgAt) / D.C.HUNGER_MS);
            pet.hg = Math.min(100, hAt + f.hg);
            pet.hgAt = tEat;
            if (f.xp && !f.el && pet.lv < D.C.LV_CAP) E.addXp(pet, E.xpNeed(pet.lv) * f.xp);
            b.qty--; meals++;
            if (b.qty === 0) emptied++;
        }
    }
    return { meals, emptied };
}

module.exports = { MAX_BOWLS, CAP, FOODS, price, bowls, isPlaced, penName, penOk, buy, placeMany, refill, remove, tick };