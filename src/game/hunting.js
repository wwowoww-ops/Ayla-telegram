// الصيد: مهارات الحيوان (سلبية + مهارة فعّالة) ووحوش النخبة في المراحل الأخيرة.
// يعتمد على بيانات عناصر مهارات البوس (boss/skills.js) فيُحسّ الاعب أن مهاراته تعمل في كل مكان.
const D = require("./data");
const S = require("./boss/skills");

const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));
const els = pet => [pet.el, pet.el2].filter(Boolean);

// مضاعف الهجوم والتأثيرات من السلبية. العنصر الثانوي يعمل بنصف القوة.
function passive(pet) {
    const m = S.rm(pet), o = { atk: 1, lo: 0.8, foe: 1, double: 0, lines: [] };
    els(pet).forEach((el, i) => {
        const w = i === 0 ? 1 : 0.5, p = S.PASSIVE[el];
        if (el === "fire")    { o.atk *= 1 + 0.10 * m * w; }
        if (el === "plant")   { o.atk *= 1 + 0.05 * m * w; }
        if (el === "light")   { o.atk *= 1 + 0.04 * m * w; }
        if (el === "dark")    { o.atk *= 1 + 0.06 * m * w; }
        if (el === "water")   { o.lo = Math.min(1, o.lo + 0.03 * m * w); }
        if (el === "earth")   { o.foe *= 1 - Math.min(0.3, 0.06 * m * w); }
        if (el === "thunder") { o.double = Math.max(o.double, Math.min(0.5, 0.10 * m * w)); }
        o.lines.push(p.e + " " + p.n);
    });
    o.atk = Math.min(o.atk, 1.8);
    return o;
}

// مهارة فعّالة قد تُطلَق أثناء الصيد: مضاعفات للمهارات 1 و2 و3
const SKILL_MULT = [1.25, 1.5, 2.0];
const SKILL_W = [50, 35, 15];
function rollSkill(pet, rng) {
    const r = S.rarityOf(pet);
    if (rng() >= 0.30 + 0.04 * r) return null;
    const pool = [];
    els(pet).forEach(el => S.SKILLS[el].forEach((sk, i) => pool.push({ sk, i, el, w: SKILL_W[i] })));
    let x = rng() * pool.reduce((a, b) => a + b.w, 0), pick = pool[0];
    for (const c of pool) { x -= c.w; if (x <= 0) { pick = c; break; } }
    const mult = 1 + (SKILL_MULT[pick.i] - 1) * (1 + 0.06 * (S.rm(pet) - 1));
    return { mult: Math.min(mult, 2.6), name: pick.sk.e + " " + pick.sk.n, el: pick.el, tier: pick.i + 1 };
}

// وحوش النخبة: قدرة خاصة تقوّيها (المراحل الأخيرة)
const ELITE = [
    null,
    [{ n: "🛡️ درع سميك", m: 1.10 }, { n: "💢 غضب", m: 1.12 }],
    [{ n: "🔥 هالة حارقة", m: 1.16 }, { n: "🧿 جلد مسحور", m: 1.18 }],
    [{ n: "👁️ عين الإله", m: 1.25 }, { n: "🌀 تمزق الأبعاد", m: 1.30 }]
];
function rollElite(zone, rng) {
    const list = ELITE[zone.elite || 0];
    if (!list) return null;
    const t = list[Math.floor(rng() * list.length) % list.length];
    return { name: t.n, mult: t.m };
}

// يحسب كل شيء قبل المقارنة. fairyWar = بف الجنيات (وحوش أضعف)
function prepare(pet, zone, rng, fairyWar) {
    const monEl = zone.els[Math.floor(rng() * zone.els.length) % zone.els.length];
    const elite = rollElite(zone, rng);
    const pas = passive(pet);
    const skill = rollSkill(pet, rng);
    let monPower = zone.power * (0.85 + 0.3 * rng()) * (elite ? elite.mult : 1) * pas.foe * (1 - clamp(fairyWar || 0, 0, 0.6));
    const doubled = pas.double > 0 && rng() < pas.double;
    const mult = pas.atk * (skill ? skill.mult : 1) * (doubled ? 1.6 : 1);
    return { monEl, elite, pas, skill, doubled, monPower, mult, lo: pas.lo };
}

function notes(c) {
    const out = [];
    if (c.elite) out.push("👹 وحش نخبة: " + c.elite.name);
    if (c.skill) out.push("🌟 مهارة: " + c.skill.name + " (×" + c.skill.mult.toFixed(2) + ")");
    if (c.doubled) out.push("⚡ ضربة مزدوجة!");
    return out;
}

const RATES = {
    skill: "🌟 إطلاق مهارة: 30% + 4% لكل فئة ندرة",
    tiers: "المهارة 1: 50% · 2: 35% · 3: 15% (مضاعف ×1.25 / ×1.5 / ×2)",
    elite: "👑 وحوش النخبة من المرحلة 9 (قدرات تقوّي الوحش)",
    second: "🧿 العنصر الثانوي يعمل بنصف قوة السلبية ويضيف مهاراته"
};
module.exports = { passive, rollSkill, rollElite, prepare, notes, ELITE, RATES };
