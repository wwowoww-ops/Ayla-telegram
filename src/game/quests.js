// المهام اليومية والإنجازات.
// لا تحتاج تعديل أي ملف من اللعبة: تقرأ إحصائيات اللاعب (P.stats) وتقارنها بما كانت عليه
// أول اليوم. تُمنح المكافأة تلقائيًا عند الإكمال (انظر listeners/02-quests.js).
const D = require("./data");
const E = require("./engine");

// ---------- التاريخ (بتوقيت تونس) ----------
const dayKey = t => new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Tunis" }).format(new Date(t));

function hashStr(s) {
    let h = 2166136261;
    for (const c of String(s)) { h ^= c.codePointAt(0); h = Math.imul(h, 16777619) >>> 0; }
    return h;
}

// ---------- المهام اليومية ----------
// stat: اسم العداد في P.stats، أو دالة تحسب التقدم من اللاعب وحالته أول اليوم
const MISSION_POOL = [
    { id: "hunt",   text: n => `اصطد ${n} مرات`,        stat: "hunts",   targets: [3, 5, 8] },
    { id: "win",    text: n => `اربح ${n} مرات في الصيد`, stat: "wins",    targets: [2, 3, 5] },
    { id: "hatch",  text: n => (n === 1 ? "افقس بيضة" : `افقس ${n} بيضة`), stat: "hatched", targets: [1, 2] },
    { id: "breed",  text: () => "زاوج حيوانين",           stat: "bred",    targets: [1] },
    { id: "duel",   text: () => "خض مبارزة",              stat: "duels",   targets: [1] },
    { id: "collect", text: () => "اجمع أرباح حيواناتك",   fn: (P, b) => (P.collectAt > b.collectAt ? 1 : 0), targets: [1] },
    { id: "daily",  text: () => "خذ مكافأتك اليومية",     fn: (P, b) => (P.dailyAt > b.dailyAt ? 1 : 0), targets: [1] }
];
const MISSIONS_PER_DAY = 4;

const snapshot = P => ({
    hunts: P.stats.hunts, wins: P.stats.wins, hatched: P.stats.hatched, bred: P.stats.bred,
    duels: P.stats.duels, collectAt: P.collectAt, dailyAt: P.dailyAt
});

// يجهّز مهام اليوم إن لم تكن جاهزة (ويحفظ نقطة البداية)
function ensureMissions(P, now) {
    const day = dayKey(now);
    if (P.missions && P.missions.day === day) return P.missions;
    // اختيار ثابت لكل لاعب في اليوم الواحد
    const pool = [...MISSION_POOL];
    const chosen = [];
    let seed = hashStr(P.id + "|" + day);
    while (chosen.length < MISSIONS_PER_DAY && pool.length) {
        const i = seed % pool.length;
        const m = pool.splice(i, 1)[0];
        const target = m.targets[Math.floor(seed / 7) % m.targets.length];
        chosen.push({ id: m.id, target });
        seed = Math.imul(seed, 1103515245) + 12345 >>> 0;
    }
    P.missions = { day, base: snapshot(P), list: chosen, done: {}, bonus: false };
    return P.missions;
}

function missionProgress(P, mission) {
    const def = MISSION_POOL.find(m => m.id === mission.id);
    const base = P.missions.base;
    const cur = def.stat ? P.stats[def.stat] - base[def.stat] : def.fn(P, base);
    return Math.max(0, Math.min(mission.target, cur));
}
const missionText = mission => MISSION_POOL.find(m => m.id === mission.id).text(mission.target);

// مكافأة المهمة: ذهب ثابت + ما يعادل نصف ساعة من دخلك + طعام
function missionReward(P) {
    return { coins: E.clampCoins(2000 + E.incomeAll(P) * 0.5), items: { meat: 3 } };
}
function bonusReward(P) {
    return { coins: E.clampCoins(10000 + E.incomeAll(P) * 3), items: { cake: 2 } };
}

// ---------- الإنجازات ----------
// كل فئة لها درجات. نعرض الدرجة التالية وتقدمها.
const best = (P, f) => P.pets.reduce((m, p) => Math.max(m, f(p)), 0);
const CATEGORIES = [
    { id: "hunts",   name: "الصيد",          unit: "مرة صيد",        tiers: [10, 100, 1000, 10000],       value: P => P.stats.hunts },
    { id: "wins",    name: "الانتصارات",     unit: "انتصار",         tiers: [5, 50, 500, 5000],           value: P => P.stats.wins },
    { id: "hatched", name: "الفقس",          unit: "بيضة مفقوسة",    tiers: [1, 10, 50, 200],             value: P => P.stats.hatched },
    { id: "bred",    name: "التزاوج",        unit: "تزاوج",          tiers: [1, 10, 50, 200],             value: P => P.stats.bred },
    { id: "duels",   name: "المبارزات",      unit: "فوز في مبارزة",  tiers: [1, 10, 50, 250],             value: P => P.stats.duelWins },
    { id: "streak",  name: "المواظبة",       unit: "يوم متتالي",     tiers: [3, 7, 14, 30],               value: P => P.streak },
    { id: "pets",    name: "حظيرة الحيوانات", unit: "حيوان",          tiers: [5, 12, 30, 60],              value: P => P.pets.length },
    { id: "rarity",  name: "الندرة",         unit: "أعلى ندرة (1-7)", tiers: [3, 4, 5, 7], value: P => 1 + best(P, p => D.SPECIES[p.sp].r), label: v => D.RARITIES[Math.min(6, v - 1)].n },
    { id: "stars",   name: "النجوم",         unit: "نجوم لحيوان",    tiers: [1, 2, 3, 5],                 value: P => best(P, p => p.st) },
    { id: "level",   name: "المستوى",        unit: "مستوى لحيوان",   tiers: [10, 25, 40, 50],             value: P => best(P, p => p.lv) },
    { id: "power",   name: "القوة",          unit: "قوة كلية",       tiers: [1e3, 1e5, 1e7, 1e9],         value: P => E.totalPower(P) },
    { id: "coins",   name: "الثروة",         unit: "عملة",           tiers: [1e6, 1e9, 1e12, 1e15],       value: P => P.coins }
];
// مكافأة الدرجة (0..3): ذهب كبير وطعام
const TIER_COINS = [50e3, 5e6, 500e6, 50e9];
const TIER_ITEMS = [{ meat: 2 }, { feast: 2 }, { cake: 2 }, { potion: 1 }];

// ---------- منح المكافآت ----------
function give(P, reward) {
    P.coins = E.clampCoins(P.coins + reward.coins);
    require("./resources").grantItems(P, reward.items);
}
const itemsTxt = items => { const R = require("./resources"), tmp = { res: {} }; return R.listTxt(R.grantItems(tmp, items)); };

// يفحص ما أنجزه اللاعب ويمنحه تلقائيًا. يرجع قائمة بما تحقق الآن (للإشعار).
function settle(P, now) {
    const out = { missions: [], bonus: null, achievements: [] };
    const M = ensureMissions(P, now);

    for (const m of M.list) {
        if (M.done[m.id] || missionProgress(P, m) < m.target) continue;
        const r = missionReward(P);
        give(P, r);
        M.done[m.id] = true;
        out.missions.push({ text: missionText(m), reward: r });
    }
    if (!M.bonus && M.list.every(m => M.done[m.id])) {
        const r = bonusReward(P);
        give(P, r);
        M.bonus = true;
        out.bonus = r;
    }

    P.ach = P.ach || {};
    for (const c of CATEGORIES) {
        const v = c.value(P);
        c.tiers.forEach((target, i) => {
            const key = c.id + ":" + i;
            if (P.ach[key] || v < target) return;
            const r = { coins: TIER_COINS[i], items: TIER_ITEMS[i] };
            give(P, r);
            P.ach[key] = now;
            out.achievements.push({ name: `${c.name} ${["I", "II", "III", "IV"][i]}`, reward: r });
        });
    }
    out.any = out.missions.length > 0 || !!out.bonus || out.achievements.length > 0;
    return out;
}

module.exports = {
    dayKey, ensureMissions, missionProgress, missionText, missionReward, bonusReward,
    CATEGORIES, TIER_COINS, TIER_ITEMS, settle, itemsTxt, MISSIONS_PER_DAY
};