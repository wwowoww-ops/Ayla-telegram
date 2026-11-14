// تزاوج مشترك بين لاعبين (استعارة): كل طرف بحيوانه، ويتفقان على من يأخذ البيضة ومن يدفع.
// الحالة في الذاكرة فقط (عرض مؤقت 10 دقائق): لا يضيع شيء لأن شيئًا لا يُسحب قبل القبول.
const E = require("./engine");
const store = require("../core/store");

const TTL = 10 * 60e3;
const offers = new Map();
let seq = 0;
const fail = msg => ({ ok: false, msg });

function create(from, to) {
    const now = Date.now();
    for (const [k, o] of offers) if (now - o.at > TTL) offers.delete(k);
    const id = ++seq;
    const o = { id, from: String(from.id), fromName: from.name, to: String(to.id), toName: to.name, at: now, stage: "pet", aPet: null, eggTo: null, costMode: null, bPet: null };
    offers.set(id, o);
    return o;
}
const get = id => { const o = offers.get(Number(id)); if (o && Date.now() - o.at > TTL) { offers.delete(o.id); return null; } return o || null; };
const end = id => offers.delete(Number(id));

const eligible = (P, now) => P.pets.filter(p => (p.lv >= require("./data").C.BREED_LV || p.st > 0) && p.cdBreed <= now).sort((a, b) => E.power(b) - E.power(a));

// الأسعار: يقسَّم الإجمالي بحسب الاتفاق
function costs(o, PA, PB) {
    const a = E.getPet(PA, o.aPet), b = E.getPet(PB, o.bPet);
    const total = E.breedCost(a, b);
    if (o.costMode === "a") return { a: total, b: 0, total };
    if (o.costMode === "b") return { a: 0, b: total, total };
    return { a: Math.ceil(total / 2), b: Math.floor(total / 2), total };
}

function execute(o, now, rng = Math.random) {
    const PA = store.get(o.from), PB = store.get(o.to);
    if (!PA || !PB) return fail("أحد اللاعبين غير موجود.");
    const a = E.getPet(PA, o.aPet), b = E.getPet(PB, o.bPet);
    if (!a || !b) return fail("أحد الحيوانين لم يعد موجودًا.");
    const c = costs(o, PA, PB);
    const r = E.breedPair(PA, a, PB, b, c.a, c.b, o.eggTo, now, rng);
    if (r.ok) { store.touch(PA.id); store.touch(PB.id); end(o.id); }
    return Object.assign(r, { c, a, b, PA, PB });
}

module.exports = { TTL, create, get, end, eligible, costs, execute };
