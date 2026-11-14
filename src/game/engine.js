// منطق لعبة الحيوان (دوال نقية على كائن اللاعب، بلا اتصال بتيليجرام ولا قاعدة بيانات)
const D = require("./data");
const { C } = D;

// ---------------- أدوات ----------------
const floor = Math.floor;
const clampCoins = n => Math.min(C.MAX_COINS, Math.max(0, floor(n)));
const fail = msg => ({ ok: false, msg });
const SUF = [[1e15, "Qa"], [1e12, "T"], [1e9, "B"], [1e6, "M"], [1e3, "K"]];

// 1,234 ثم 12.5K ثم 3.2M ... ثم 4.1Qa
function fmt(n) {
    n = Number(n) || 0;
    const a = Math.abs(n);
    if (a < 1e4) return Math.floor(n).toLocaleString("en-US");
    for (let i = 0; i < SUF.length; i++) {
        const [v, s] = SUF[i];
        if (a < v) continue;
        const val = Number((n / v).toPrecision(3));
        if (Math.abs(val) >= 1000 && i > 0) return Number((n / SUF[i - 1][0]).toPrecision(3)) + SUF[i - 1][1]; // 999,999 -> 1M
        return val + s;
    }
    return String(n);
}
function dur(ms) {
    const m = Math.ceil(ms / 60000);
    if (m < 60) return m + " دقيقة";
    const h = Math.floor(m / 60), r = m % 60;
    return h + " ساعة" + (r ? " و" + r + " دقيقة" : "");
}
const pick = (arr, rng) => arr[floor(rng() * arr.length) % arr.length];

// ---------------- اللاعب ----------------
function newPlayer(id, name, now) {
    return {
        id: String(id), name: name || "لاعب", coins: 5000,
        pets: [], petSeq: 0, eggs: [{ id: 1, tier: 0, readyAt: now }], eggSeq: 1,
        items: {}, res: { crystal: 3 }, rv: 1, eggBag: [], main: null,
        slots: C.BASE_SLOTS, hatchSlots: C.BASE_HATCH,
        collectAt: now, dailyAt: 0, streak: 0,
        stats: { hunts: 0, wins: 0, duels: 0, duelWins: 0, hatched: 0, bred: 0 },
        created: now
    };
}
const getPet = (P, id) => P.pets.find(p => p.id === Number(id)) || null;
const spOf = pet => D.SPECIES[pet.sp];

// ---------------- خصائص الحيوان ----------------
// الجوع أُلغي (حلّت الموارد محل الطعام)
const hungerNow = () => 100;
function setHunger(pet, v, now) { pet.hg = 100; pet.hgAt = now; }
const xpNeed = lv => floor(50 * Math.pow(lv, 1.55));
const starMult = st => 1 + 5 * st;
const lvMult = lv => 1 + 0.09 * (lv - 1);
function power(pet) {
    const s = spOf(pet);
    return floor(D.RARITIES[s.r].pow * s.v * pet.q * lvMult(pet.lv) * starMult(pet.st));
}
function incomePerHour(pet) {
    const s = spOf(pet);
    return D.RARITIES[s.r].inc * s.v * pet.q * (1 + 0.12 * (pet.lv - 1)) * starMult(pet.st);
}
function grade(q) { return q < 0.95 ? "C" : q < 1.05 ? "B" : q < 1.15 ? "A" : q < 1.3 ? "S" : q < 1.45 ? "SS" : "SSS"; }
const hungerFactor = () => 1;
const totalPower = P => P.pets.reduce((s, p) => s + power(p), 0);
const incomeAll = P => P.pets.reduce((s, p) => s + incomePerHour(p), 0);

function addXp(pet, amount) {
    if (pet.lv >= C.LV_CAP) { pet.xp = 0; return 0; }
    pet.xp += amount;
    let gained = 0;
    while (pet.lv < C.LV_CAP && pet.xp >= xpNeed(pet.lv)) { pet.xp -= xpNeed(pet.lv); pet.lv++; gained++; }
    if (pet.lv >= C.LV_CAP) pet.xp = 0;
    return gained;
}
const givePct = (pet, pct) => addXp(pet, xpNeed(pet.lv) * pct);

// ---------------- إنشاء حيوان ----------------
function makePet(P, spId, el, q, now, gen) {
    const pet = {
        id: ++P.petSeq, sp: spId, el, lv: 1, xp: 0, st: 0, q,
        hg: 100, hgAt: now, cdTrain: 0, cdPlay: 0, cdHunt: 0, cdBreed: 0, cdDuel: 0,
        nick: "", born: now, gen: gen || 0
    };
    P.pets.push(pet);
    if (P.main == null) P.main = pet.id;
    return pet;
}
function rollRarity(weights, rng) {
    const total = weights.reduce((a, b) => a + b, 0);
    let x = rng() * total;
    for (let i = 0; i < weights.length; i++) { x -= weights[i]; if (x < 0 && weights[i] > 0) return i; }
    return weights.findIndex(w => w > 0);
}
const rollQ = rng => Math.round((0.9 + rng() * 0.3) * 1000) / 1000;

// ---------------- الاقتصاد ----------------
// ---------------- البيض: المحفظة ثم الحضانة ----------------
const bag = P => (P.eggBag = P.eggBag || []);
function addEggToBag(P, tier, extra) {
    const e = Object.assign({ id: ++P.eggSeq, tier }, extra || {});
    bag(P).push(e);
    return e;
}
function eggMs(P, tier, bred) {
    let ms = D.EGGS[tier].min * 60000 * (bred ? 2 : 1);
    try { const h = require("./fairies").buffs(P).hatch; if (h) ms = floor(ms * (1 - h)); } catch (e) { /* لا جنيات */ }
    return ms;
}
function buyEgg(P, tier, now) {
    const egg = D.EGGS[tier];
    if (!egg) return fail("نوع بيض غير معروف.");
    if (P.coins < egg.price) return fail("رصيدك لا يكفي. تحتاج " + fmt(egg.price) + ".");
    P.coins -= egg.price;
    addEggToBag(P, tier);
    return { ok: true, msg: "اشتريت " + egg.e + " " + egg.n + " 🎒 وُضعت في محفظتك. ضعها في الحضانة متى شئت." };
}
function placeEgg(P, bagId, now) {
    const i = bag(P).findIndex(e => e.id === Number(bagId));
    if (i < 0) return fail("البيضة غير موجودة في المحفظة.");
    if (P.eggs.length >= P.hatchSlots) return fail("الحضانة ممتلئة (" + P.hatchSlots + ").");
    const e = bag(P).splice(i, 1)[0];
    const ms = eggMs(P, e.tier, e.bred);
    P.eggs.push(Object.assign({}, e, { readyAt: now + ms }));
    return { ok: true, msg: "وُضعت " + D.EGGS[e.tier].e + " " + D.EGGS[e.tier].n + " في الحضانة. تفقس بعد " + dur(ms) + "." };
}
function placeAll(P, now) {
    let n = 0;
    while (P.eggs.length < P.hatchSlots && bag(P).length) {
        let best = bag(P)[0];
        for (const e of bag(P)) if (e.tier > best.tier) best = e;
        if (!placeEgg(P, best.id, now).ok) break;
        n++;
    }
    return n ? { ok: true, n, msg: "وُضعت " + n + " بيضة في الحضانة." } : fail(bag(P).length ? "الحضانة ممتلئة." : "محفظة البيض فارغة.");
}
function hatchAll(P, now, rng) {
    const out = [];
    let full = false;
    for (const egg of [...P.eggs]) {
        if (egg.readyAt > now) continue;
        if (P.pets.length >= P.slots) { full = true; break; }
        const r = hatch(P, egg.id, now, rng);
        if (r.ok) out.push(r.pet);
    }
    if (!out.length) return fail(full ? "الحظيرة ممتلئة (" + P.slots + ")." : "لا بيض جاهز للفقس الآن.");
    return { ok: true, pets: out, full, msg: "فقست " + out.length + " بيضة!" + (full ? " (الحظيرة امتلأت)" : "") };
}

function hatch(P, eggId, now, rng) {
    const i = P.eggs.findIndex(e => e.id === Number(eggId));
    if (i < 0) return fail("البيضة غير موجودة.");
    const egg = P.eggs[i];
    if (egg.readyAt > now) return fail("لم تفقس بعد. تبقى " + dur(egg.readyAt - now) + ".");
    if (P.pets.length >= P.slots) return fail("الحظيرة ممتلئة (" + P.slots + "). وسّعها أو بع حيوانًا.");
    let spId, el, q, gen = 0;
    if (egg.pre) { ({ sp: spId, el, q, gen } = egg.pre); }
    else {
        const r = rollRarity(D.EGGS[egg.tier].w, rng);
        spId = pick(D.SPECIES_BY_RARITY[r], rng);
        el = pick(D.SPECIES[spId].els, rng);
        q = rollQ(rng);
    }
    P.eggs.splice(i, 1);
    const pet = makePet(P, spId, el, q, now, gen);
    P.stats.hatched++;
    return { ok: true, pet, msg: "فقست!" };
}

function buyFood() { return fail("استُبدل الطعام بالموارد 🔷. افتح المتجر ← الموارد."); }

const slotPrice = P => floor(50e3 * Math.pow(3, (P.slots - C.BASE_SLOTS) / 3));       // كل توسعة +3 أماكن
const hatchPrice = P => floor(2e6 * Math.pow(6, P.hatchSlots - C.BASE_HATCH));
function expandSlots(P) {
    const c = slotPrice(P);
    if (P.coins < c) return fail("تحتاج " + fmt(c) + ".");
    P.coins -= c; P.slots += 3;
    return { ok: true, msg: "صارت الحظيرة " + P.slots + " مكانًا." };
}
function expandHatch(P) {
    if (P.hatchSlots >= 10) return fail("وصلت الحد الأقصى للحضانة (10).");
    const c = hatchPrice(P);
    if (P.coins < c) return fail("تحتاج " + fmt(c) + ".");
    P.coins -= c; P.hatchSlots += 1;
    return { ok: true, msg: "صارت الحضانة " + P.hatchSlots + " أماكن." };
}

// ---------------- رعاية ----------------
function needsFood() { return false; }

function train(P, petId, now) {
    const pet = getPet(P, petId);
    if (!pet) return fail("الحيوان غير موجود.");
    if (pet.lv >= C.LV_CAP) return fail("وصل أعلى مستوى. رقّه بنجمة ⭐ من بطاقته.");
    if (pet.cdTrain > now) return fail("متعب! عد بعد " + dur(pet.cdTrain - now) + ".");
    if (needsFood(pet, now)) return fail("جائع جدًا! أطعمه أولًا.");
    setHunger(pet, hungerNow(pet, now) - 8, now);
    pet.cdTrain = now + C.TRAIN_CD;
    const lv = givePct(pet, 0.10);
    return { ok: true, msg: "تدريب ناجح! +10% خبرة" + (lv ? " ⬆️ مستوى " + pet.lv : "") };
}
function play(P, petId, now) {
    const pet = getPet(P, petId);
    if (!pet) return fail("الحيوان غير موجود.");
    if (pet.lv >= C.LV_CAP) return fail("وصل أعلى مستوى.");
    if (pet.cdPlay > now) return fail("يلهث! عد بعد " + dur(pet.cdPlay - now) + ".");
    if (needsFood(pet, now)) return fail("جائع جدًا! أطعمه أولًا.");
    setHunger(pet, hungerNow(pet, now) - 4, now);
    pet.cdPlay = now + C.PLAY_CD;
    const lv = givePct(pet, 0.04);
    return { ok: true, msg: "لعب ممتع! +4% خبرة" + (lv ? " ⬆️ مستوى " + pet.lv : "") };
}
function feed() { return fail("استُبدل الطعام بالموارد 🔷. استخدم البلورات من بطاقة الحيوان."); }

function starCost(pet) { return Math.floor(D.EGGS[Math.min(6, spOf(pet).r)].price * 1.8 * Math.pow(pet.st + 1, 2)); }
function upgrade(P, petId) {
    const pet = getPet(P, petId);
    if (!pet) return fail("الحيوان غير موجود.");
    if (pet.lv < C.LV_CAP) return fail("يجب أن يصل المستوى " + C.LV_CAP + ".");
    if (pet.st >= C.MAX_STARS) return fail("وصل أعلى عدد نجوم.");
    const c = starCost(pet);
    if (P.coins < c) return fail("تحتاج " + fmt(c) + ".");
    P.coins -= c; pet.st++; pet.lv = 1; pet.xp = 0;
    return { ok: true, msg: "ارتقى إلى " + "⭐".repeat(pet.st) + " وعاد للمستوى 1 بقوة أكبر!" };
}

// ---------------- الأرباح ----------------
function collect(P, now) {
    if (!P.pets.length) return fail("لا تملك حيوانات بعد.");
    const hours = Math.min(C.COLLECT_CAP_H, (now - P.collectAt) / 3600000);
    if (hours < 0.02) return fail("لا أرباح جديدة الآن. عد بعد قليل.");
    let total = 0;
    for (const p of P.pets) total += incomePerHour(p) * hours * hungerFactor(hungerNow(p, now));
    total = clampCoins(total);
    P.coins = clampCoins(P.coins + total);
    P.collectAt = now;
    return { ok: true, total, hours, msg: "جمعت " + fmt(total) + " 🪙 عن " + (hours >= 1 ? hours.toFixed(1) + " ساعة" : Math.round(hours * 60) + " دقيقة") };
}

function daily(P, now) {
    const ago = now - P.dailyAt;
    if (P.dailyAt && ago < C.DAILY_MS) return fail("استلمت مكافأتك. عد بعد " + dur(C.DAILY_MS - ago) + ".");
    P.streak = P.dailyAt && ago < C.STREAK_MS ? P.streak + 1 : 1;
    const mult = 1 + 0.2 * Math.min(P.streak - 1, 7);
    const reward = clampCoins((2000 + incomeAll(P) * 3) * mult);
    P.coins = clampCoins(P.coins + reward);
    const gem = 3 + Math.min(P.streak, 7);
    require("./resources").add(P, "crystal", gem);
    P.dailyAt = now;
    return { ok: true, reward, streak: P.streak, msg: "مكافأتك اليومية: " + fmt(reward) + " 🪙 + 🔷 " + gem + " بلورات\n🔥 أيام متتالية: " + P.streak };
}

// ---------------- الصيد ----------------
function hunt(P, zoneIdx, now, rng) {
    const Hunt = require("./hunting"), Res = require("./resources");
    const zone = D.ZONES[zoneIdx];
    const pet = getPet(P, P.main);
    if (!zone) return fail("منطقة غير معروفة.");
    if (!pet) return fail("اختر حيوانًا أساسيًا أولًا.");
    if (pet.cdHunt > now) return fail("حيوانك الأساسي يستريح. عد بعد " + dur(pet.cdHunt - now) + ".");
    pet.cdHunt = now + C.HUNT_CD;
    P.stats.hunts++;
    const c = Hunt.prepare(pet, zone, rng, 0);
    let eff = D.elementMult(pet.el, c.monEl);
    if (pet.el2) eff = Math.max(eff, D.elementMult(pet.el2, c.monEl));
    const roll = c.lo + (1.2 - c.lo) * rng();
    const mine = power(pet) * eff * c.mult * roll;
    const win = mine >= c.monPower;
    const res = { ok: true, win, monEl: c.monEl, eff, monPower: floor(c.monPower), mine: floor(mine), drops: [], notes: Hunt.notes(c), got: {}, elite: c.elite };
    const give = (id, n) => { const k = Res.add(P, id, n); if (k) res.got[id] = (res.got[id] || 0) + k; };
    if (win) {
        P.stats.wins++;
        const coins = clampCoins(zone.coins * (0.8 + 0.4 * rng()));
        P.coins = clampCoins(P.coins + coins);
        res.coins = coins;
        res.levels = givePct(pet, zone.xp);
        if (rng() < 0.08) {
            addEggToBag(P, zone.egg);
            res.drops.push(D.EGGS[zone.egg].e + " " + D.EGGS[zone.egg].n + " (في المحفظة)");
        }
        if (rng() < 0.75) give("crystal", 1 + floor(rng() * (1 + zoneIdx / 2)) + floor(zoneIdx / 4));
        if (rng() < 0.40) give("ess_" + c.monEl, 1 + floor(zoneIdx / 4));
        if (zoneIdx >= 3 && rng() < 0.03 + 0.005 * zoneIdx) give("dust", 1);
    } else {
        res.levels = givePct(pet, 0.01);
        if (rng() < 0.15) give("crystal", 1);
    }
    return res;
}

// ---------------- التزاوج ----------------
function breedCost(a, b) {
    const r = Math.max(spOf(a).r, spOf(b).r);
    return D.EGGS[r].price * 2;
}
function breedCheck(P, aId, bId, now) {
    const a = getPet(P, aId), b = getPet(P, bId);
    if (!a || !b) return fail("اختر حيوانين.");
    if (a.id === b.id) return fail("اختر حيوانين مختلفين.");
    for (const p of [a, b]) {
        if (p.lv < C.BREED_LV && p.st === 0) return fail(D.SPECIES[p.sp].n + " صغير. يجب أن يصل المستوى " + C.BREED_LV + ".");
        if (p.cdBreed > now) return fail(D.SPECIES[p.sp].n + " يستريح من التزاوج " + dur(p.cdBreed - now) + ".");
    }
    return { ok: true, a, b, cost: breedCost(a, b) };
}
function breed(P, aId, bId, now, rng) {
    const chk = breedCheck(P, aId, bId, now);
    if (!chk.ok) return chk;
    const { a, b, cost } = chk;
    if (P.coins < cost) return fail("تحتاج " + fmt(cost) + ".");
    P.coins -= cost;
    let spId = rng() < 0.5 ? a.sp : b.sp;
    let mutated = false;
    const r = D.SPECIES[spId].r;
    if (r < 6 && rng() < 0.12) { spId = pick(D.SPECIES_BY_RARITY[r + 1], rng); mutated = true; }
    let el = rng() < 0.88 ? (rng() < 0.5 ? a.el : b.el) : pick(D.EL_KEYS, rng);
    const q = Math.min(1.6, Math.max(0.8, Math.round(((a.q + b.q) / 2) * (0.98 + rng() * 0.12) * 1000) / 1000));
    const rr = D.SPECIES[spId].r;
    const gen = Math.max(a.gen || 0, b.gen || 0) + 1;
    addEggToBag(P, Math.min(6, rr), { pre: { sp: spId, el, q, gen }, bred: true });
    a.cdBreed = b.cdBreed = now + C.BREED_CD;
    P.stats.bred++;
    return { ok: true, mutated, cost, msg: "بيضة جديدة 🎒 في محفظتك" + (mutated ? " ✨ (طفرة نادرة!)" : "") + ". ضعها في الحضانة لتفقس." };
}

// ---------------- المبارزة ----------------
function duelPower(pet, enemy) { return power(pet) * D.elementMult(pet.el, enemy.el); }
function duelCheck(A, B, bet, now) {
    const a = getPet(A, A.main), b = getPet(B, B.main);
    if (!a) return fail("ليس عندك حيوان أساسي.");
    if (!b) return fail("خصمك لا يملك حيوانًا أساسيًا.");
    if (a.cdDuel > now) return fail("حيوانك يستريح " + dur(a.cdDuel - now) + ".");
    if (b.cdDuel > now) return fail("حيوان خصمك يستريح.");
    if (hungerNow(a, now) < 10) return fail("حيوانك جائع.");
    if (hungerNow(b, now) < 10) return fail("حيوان خصمك جائع.");
    if (A.coins < bet) return fail("رصيدك لا يكفي للرهان.");
    if (B.coins < bet) return fail("رصيد خصمك لا يكفي للرهان.");
    return { ok: true, a, b };
}
function duel(A, B, bet, now, rng) {
    const chk = duelCheck(A, B, bet, now);
    if (!chk.ok) return chk;
    const { a, b } = chk;
    const pa = duelPower(a, b), pb = duelPower(b, a);
    const aWins = rng() < pa / (pa + pb);
    for (const p of [a, b]) { setHunger(p, hungerNow(p, now) - 10, now); p.cdDuel = now + C.DUEL_CD; }
    A.stats.duels++; B.stats.duels++;
    const [W, L, wp, lp] = aWins ? [A, B, a, b] : [B, A, b, a];
    W.stats.duelWins++;
    if (bet > 0) { L.coins -= bet; W.coins = clampCoins(W.coins + bet); }
    givePct(wp, 0.03); givePct(lp, 0.01);
    return { ok: true, aWins, winner: W, loser: L, wp, lp, chance: Math.round((aWins ? pa : pb) / (pa + pb) * 100), bet };
}

// ---------------- تسمية وتبديل ----------------
function setMain(P, petId) { const p = getPet(P, petId); if (!p) return fail("غير موجود."); P.main = p.id; return { ok: true, msg: "صار حيوانك الأساسي." }; }
function release(P, petId) {
    const p = getPet(P, petId);
    if (!p) return fail("غير موجود.");
    if (P.pets.length <= 1) return fail("لا يمكنك التخلي عن آخر حيوان.");
    const back = clampCoins(D.EGGS[Math.min(6, spOf(p).r)].price * 0.1 * (1 + p.st));
    P.pets.splice(P.pets.indexOf(p), 1);
    P.coins = clampCoins(P.coins + back);
    if (P.main === p.id) P.main = P.pets[0].id;
    return { ok: true, back, msg: "تخليت عنه وحصلت على " + fmt(back) + " 🪙" };
}

module.exports = {
    fmt, dur, newPlayer, getPet, spOf, hungerNow, xpNeed, power, incomePerHour, grade, totalPower, incomeAll,
    hungerFactor, addXp, makePet, buyEgg, hatch, buyFood, slotPrice, hatchPrice, expandSlots, expandHatch,
    train, play, feed, starCost, upgrade, collect, daily, hunt, breedCost, breedCheck, breed,
    duelPower, duelCheck, duel, setMain, release, clampCoins,
    givePct, setHunger, pick, rollRarity, bag, addEggToBag, eggMs, placeEgg, placeAll, hatchAll
};
