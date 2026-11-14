
// يحوّل بيانات اللاعب إلى شكل مناسب للواجهة (أرقام جاهزة بلا منطق في الصفحة)
const D = require("../game/data");
const E = require("../game/engine");
const F = require("../game/feeders");
const Res = require("../game/resources");
const Fy = require("../game/fairies");

function petView(P, pet, now) {
    const sp = D.SPECIES[pet.sp], r = D.RARITIES[sp.r], el = D.ELEMENTS[pet.el];
    return {
        id: pet.id, sp: sp.id, name: pet.nick || sp.n, species: sp.n, emoji: sp.e,
        rar: sp.r, rarName: r.n, rarEmoji: r.e,
        el: pet.el, elName: el.n, elEmoji: el.e,
        lv: pet.lv, xp: Math.floor(pet.xp), xpNeed: E.xpNeed(pet.lv), st: pet.st,
        q: pet.q, grade: E.grade(pet.q), gen: pet.gen || 0,
        el2: pet.el2 || null, el2Emoji: pet.el2 ? D.ELEMENTS[pet.el2].e : "", el2Name: pet.el2 ? D.ELEMENTS[pet.el2].n : "",
        elite: E.isElite(pet), pol: pet.pol || 0, polMax: E.POL_MAX, polCost: E.polishCost(pet), evoCost: E.evoCost(pet),
        hunger: Math.round(E.hungerNow(pet, now)),
        power: E.power(pet), income: E.incomePerHour(pet),
        main: pet.id === P.main,
        pen: pet.pen || 0, fx: Number.isFinite(pet.fx) ? pet.fx : null, fy: Number.isFinite(pet.fy) ? pet.fy : null,
        cd: {
            train: Math.max(0, pet.cdTrain - now), play: Math.max(0, pet.cdPlay - now),
            hunt: Math.max(0, pet.cdHunt - now), breed: Math.max(0, pet.cdBreed - now)
        },
        starCost: pet.lv >= D.C.LV_CAP && pet.st < D.C.MAX_STARS ? E.starCost(pet) : 0,
        canPolish: (pet.pol || 0) < E.POL_MAX && pet.q < E.QCAP,
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
        elements: D.ELEMENTS, beats: D.BEATS, beatsAll: D.BEATS_ALL,
        species: Object.values(D.SPECIES).map(x => ({ id: x.id, n: x.n, e: x.e, r: x.r, els: x.els })),
        rarities: D.RARITIES.map(r => ({ n: r.n, e: r.e })),
        zones: D.ZONES.map((z, i) => ({ i, name: z.n, power: z.power, coins: z.coins, els: z.els, elite: z.elite || 0 })),
        bossKinds: require("../game/boss").KINDS.map(k => ({ id: k.id, n: k.n, e: k.e, el: k.el })),
        eggs: D.EGGS.map((e, tier) => ({ tier, name: e.n, emoji: e.e, price: e.price, min: e.min, w: e.w })),
        foods: Object.keys(D.FOODS).map(id => {
            const f = D.FOODS[id];
            return { id, name: f.n, emoji: f.e, price: f.price, hg: f.hg, xp: f.xp, el: f.el || null };
        }),
        resources: Object.keys(D.RES).map(id => ({ id, name: D.RES[id].n, emoji: D.RES[id].e, desc: D.RES[id].d || "", el: D.RES[id].el || null, price: Res.priceOf(P, id) })),
        habitats: Object.keys(Fy.HABITATS).map(id => ({ id, ...Fy.HABITATS[id] })),
        fairyFam: Object.fromEntries(Object.keys(Fy.FAM).map(k => [k, Fy.FAM[k].n])),
        fairyRates: Fy.ratesTxt(), fairyOwnCap: Fy.OWN_CAP, fairyMaxLv: Fy.MAX_LV,
        penMax: 8, slotPrice: E.slotPrice(P), hatchPrice: P.hatchSlots < 10 ? E.hatchPrice(P) : 0,
        bowlPrice: F.price(P), bowlMax: F.MAX_BOWLS, bowlCap: F.CAP, bowlFoods: F.FOODS,
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
        bowls: F.bowls(P).map(b => ({
            id: b.id, pen: b.pen, food: b.food, qty: b.qty
        })),
        eggs: P.eggs.map(e => eggView(e, now)),
        eggBag: (P.eggBag || []).map(e => ({ id: e.id, tier: e.tier, name: D.EGGS[e.tier].n, emoji: D.EGGS[e.tier].e, bred: !!e.bred })),
        res: Object.fromEntries(Object.keys(P.res || {}).filter(k => P.res[k] > 0).map(k => [k, P.res[k]])),
        fairies: Fy.st(P).fairies.map(f => {
            const sp = Fy.sp(f);
            return { id: f.id, sp: sp.id, name: f.nick || sp.n, species: sp.n, emoji: sp.e, rar: sp.r, rarName: Fy.RARITIES[sp.r], rankEmoji: Fy.RANK_E[sp.r], fam: sp.fam,
                lv: Fy.lvOf(f, now), hab: f.hab || null, equipped: P.fequip.includes(f.id), nextMs: Fy.nextLvMs(f, now), buff: Fy.buffTxt(Fy.buffOf(f, now)) };
        }),
        fslots: P.fslots, fslotPrice: Fy.slotPrice(P),
        fshop: Fy.shop(P, now).map((o, i) => { const sp = Fy.SPECIES[o.sp]; return { idx: i, sp: sp.id, name: sp.n, emoji: sp.e, rar: sp.r, rankEmoji: Fy.RANK_E[sp.r], rarName: Fy.RARITIES[sp.r], fam: sp.fam, price: o.price, sold: !!o.sold }; }),
        bossMods: Fy.bossMods(P),
        items: Object.keys(P.items).filter(id => P.items[id] > 0 && D.FOODS[id]).map(id => ({ id, count: P.items[id] })),
        meta: meta(P)
    };
    if (quests) state.quests = quests(P, now);
    return state;
}

module.exports = { buildState, petView, eggView };
