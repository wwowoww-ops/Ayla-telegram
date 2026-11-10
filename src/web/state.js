// يحوّل بيانات اللاعب إلى شكل مناسب للواجهة (أرقام جاهزة بلا منطق في الصفحة)
const D = require("../game/data");
const E = require("../game/engine");

function petView(P, pet, now) {
    const sp = D.SPECIES[pet.sp], r = D.RARITIES[sp.r], el = D.ELEMENTS[pet.el];
    return {
        id: pet.id, sp: sp.id, name: pet.nick || sp.n, species: sp.n, emoji: sp.e,
        rar: sp.r, rarName: r.n, rarEmoji: r.e,
        el: pet.el, elName: el.n, elEmoji: el.e,
        lv: pet.lv, xp: Math.floor(pet.xp), xpNeed: E.xpNeed(pet.lv), st: pet.st,
        q: pet.q, grade: E.grade(pet.q), gen: pet.gen || 0,
        hunger: Math.round(E.hungerNow(pet, now)),
        power: E.power(pet), income: E.incomePerHour(pet),
        main: pet.id === P.main,
        pen: pet.pen || 0, fx: Number.isFinite(pet.fx) ? pet.fx : null, fy: Number.isFinite(pet.fy) ? pet.fy : null,
        cd: {
            train: Math.max(0, pet.cdTrain - now), play: Math.max(0, pet.cdPlay - now),
            hunt: Math.max(0, pet.cdHunt - now), breed: Math.max(0, pet.cdBreed - now)
        },
        starCost: pet.lv >= D.C.LV_CAP && pet.st < D.C.MAX_STARS ? E.starCost(pet) : 0,
        canBreed: (pet.lv >= D.C.BREED_LV || pet.st > 0) && pet.cdBreed <= now
    };
}

function eggView(egg, now) {
    const d = D.EGGS[egg.tier];
    return { id: egg.id, tier: egg.tier, name: d.n, emoji: d.e, readyIn: Math.max(0, egg.readyAt - now), bred: !!egg.bred };
}

// معلومات ثابتة تقريبًا (كتالوجات المتجر والمناطق)
function meta(P) {
    return {
        elements: D.ELEMENTS, beats: D.BEATS,
        species: Object.values(D.SPECIES).map(x => ({ id: x.id, n: x.n, e: x.e, r: x.r, els: x.els })),
        rarities: D.RARITIES.map(r => ({ n: r.n, e: r.e })),
        zones: D.ZONES.map((z, i) => ({ i, name: z.n, power: z.power, coins: z.coins, els: z.els })),
        eggs: D.EGGS.map((e, tier) => ({ tier, name: e.n, emoji: e.e, price: e.price, min: e.min, w: e.w })),
        foods: Object.keys(D.FOODS).map(id => {
            const f = D.FOODS[id];
            return { id, name: f.n, emoji: f.e, price: f.price, hg: f.hg, xp: f.xp, el: f.el || null };
        }),
        penMax: 8, slotPrice: E.slotPrice(P), hatchPrice: P.hatchSlots < 10 ? E.hatchPrice(P) : 0,
        breedLv: D.C.BREED_LV, lvCap: D.C.LV_CAP, maxStars: D.C.MAX_STARS
    };
}

function buildState(P, now, quests) {
    const hours = Math.min(D.C.COLLECT_CAP_H, (now - P.collectAt) / 3600000);
    let pending = 0;
    for (const p of P.pets) pending += E.incomePerHour(p) * hours * E.hungerFactor(E.hungerNow(p, now));

    const state = {
        player: {
            id: P.id, name: P.name, coins: P.coins, slots: P.slots, hatchSlots: P.hatchSlots,
            power: E.totalPower(P), income: E.incomeAll(P), pending: Math.floor(pending),
            streak: P.streak || 0, dailyIn: Math.max(0, P.dailyAt + D.C.DAILY_MS - now),
            stats: P.stats, main: P.main
        },
        pets: P.pets.map(p => petView(P, p, now)),
        pens: (P.pens || []).map(x => ({ id: x.id, name: x.name })),
        eggs: P.eggs.map(e => eggView(e, now)),
        items: Object.keys(P.items).filter(id => P.items[id] > 0 && D.FOODS[id]).map(id => ({ id, count: P.items[id] })),
        meta: meta(P)
    };
    if (quests) state.quests = quests(P, now);
    return state;
}

module.exports = { buildState, petView, eggView };