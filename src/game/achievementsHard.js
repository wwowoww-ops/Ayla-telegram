// إنجازات صعبة جديدة تُضاف إلى القائمة الحالية دون تعديل quests.js.
// كل فئة لها 4 درجات، وبعضها يفتح إطارات حصرية (انظر framesMore.js).
const Q = require("./quests");
const E = require("./engine");
const D = require("./data");

const count = (P, f) => P.pets.reduce((n, p) => n + (f(p) ? 1 : 0), 0);
const st = (P, k) => (P.stats && P.stats[k]) || 0;

const HARD = [
    { id: "collect", name: "جامع الأنواع",       unit: "نوعًا مختلفًا",    tiers: [12, 24, 34, 40], value: P => new Set(P.pets.map(p => p.sp)).size },
    { id: "adv",     name: "المحاربون القدامى",   unit: "حيوانًا بنجمة+",   tiers: [3, 10, 25, 50],  value: P => count(P, p => p.st >= 1) },
    { id: "star5",   name: "الأساطير الخماسية",   unit: "حيوانًا ⭐⭐⭐⭐⭐", tiers: [1, 3, 10, 25],   value: P => count(P, p => p.st >= 5) },
    { id: "sss",     name: "الكمال",              unit: "حيوانًا SSS",      tiers: [1, 3, 10, 30],   value: P => count(P, p => E.grade(p.q) === "SSS") },
    { id: "elems",   name: "سيّد العناصر",        unit: "عناصر بنجمتين+",   tiers: [1, 3, 5, 7],     value: P => new Set(P.pets.filter(p => p.st >= 2).map(p => p.el)).size },
    { id: "bdmg",    name: "ضرر البوس",           unit: "ضرر على الزعماء",  tiers: [1e6, 1e8, 1e10, 1e12], value: P => st(P, "bossDmg") },
    { id: "bkills",  name: "قاتل الزعماء",        unit: "زعيم هُزم",        tiers: [1, 5, 20, 50],   value: P => st(P, "bossKills") },
    { id: "bmvp",    name: "نجم المعركة",         unit: "مرة أكبر ضرر",     tiers: [1, 3, 10, 25],   value: P => st(P, "bossTop") },
    { id: "frames",  name: "هاوي الإطارات",       unit: "إطارًا مملوكًا",   tiers: [5, 15, 30, 50],  value: P => require("./frames").FRAMES.filter(f => require("./frames").isUnlocked(P, f)).length },
    { id: "taxes",   name: "دافع الضرائب",        unit: "عملة ضرائب",       tiers: [1e12, 1e14, 1e15, 1e16], value: P => st(P, "taxPaid") },
    { id: "hungry",  name: "المربّي الصبور",      unit: "وجبة من الأوعية",  tiers: [100, 1000, 10000, 100000], value: P => st(P, "bowlMeals") }
];

let done = false;
function install() {
    if (done) return;
    done = true;
    HARD.forEach(c => { if (!Q.CATEGORIES.some(x => x.id === c.id)) Q.CATEGORIES.push(c); });
    // مكافآت الإنجازات أقل لتناسب الاقتصاد الصعب
    [20e3, 1e6, 50e6, 5e9].forEach((v, i) => { Q.TIER_COINS[i] = v; });
}

module.exports = { HARD, install };