
const IMGS = (() => { try { return new Set(require("fs").readdirSync(require("path").join(__dirname, "..", "..", "images")).map(f => parseInt(f, 10)).filter(Boolean)); } catch (e) { return new Set(); } })();   // الأنواع التي لها رسمة
// يحوّل بيانات اللاعب إلى شكل مناسب للواجهة (أرقام جاهزة بلا منطق في الصفحة)
const D = require("../game/data");
const E = require("../game/engine");
const F = require("../game/feeders");
const Res = require("../game/resources");
const Fy = require("../game/fairies");
const X = require("../game/extras");
const Se = require("../game/season");
const Po = require("../game/posts");
const World = require("./world");

function petView(P, pet, now) {
    const sp = D.SPECIES[pet.sp], r = D.RARITIES[sp.r], el = D.ELEMENTS[pet.el];
    return {
        id: pet.id, cs: pet.cs || null, boss: E.isBoss(pet) ? (() => { const k = pet.brk || 0, q = E.BOSS_RANK_REQ[k], eid = "ess_" + (pet.el || sp.els[0]), Rs = require("../game/resources"); return { brk: k, name: E.BOSS_RANKS[k][0], e: E.BOSS_RANKS[k][1], max: !q, req: q ? { cry: [q.cry, Rs.have(P, "crystal")], lv: [q.lv, pet.lv], kills: [q.kills, pet.bk || 0], ess: [q.ess, Rs.have(P, eid), D.RES[eid].e + " " + D.RES[eid].n], wait: Math.max(0, (pet.brkAt || 0) + q.wait * 3600e3 - now) } : null }; })() : null, sp: sp.id, name: pet.nick || sp.n, species: sp.n, emoji: sp.e,
        rar: sp.r, rarName: E.isBoss(pet) ? "زعيم · " + E.BOSS_RANKS[pet.brk || 0][0] : r.n, rarEmoji: E.isBoss(pet) ? E.BOSS_RANKS[pet.brk || 0][1] : r.e,
        el: pet.el, elName: el.n, elEmoji: el.e,
        lv: pet.lv, xp: Math.floor(pet.xp), xpNeed: E.xpNeed(pet.lv), st: pet.st,
        q: pet.q, grade: E.grade(pet.q), gen: pet.gen || 0,
        elb: pet.elb || null, elbEmoji: pet.elb ? D.ELEMENTS[pet.elb].e : "", elbName: pet.elb ? D.ELEMENTS[pet.elb].n : "",
        rv: X.recycleValue(P, pet), prot: X.protectedPet(P, pet), post: Po.postOf(P, pet.id), fit: Po.fitList(pet),
        el2: pet.el2 || null, el2Emoji: pet.el2 ? D.ELEMENTS[pet.el2].e : "", el2Name: pet.el2 ? D.ELEMENTS[pet.el2].n : "",
        elite: E.isElite(pet), pol: pet.pol || 0, polMax: E.POL_MAX, polCost: E.polishCost(pet), evoCost: E.evoCost(pet),
        hunger: Math.round(E.hungerNow(pet, now)),
        power: E.power(pet), income: E.incomePerHour(pet),
        main: pet.id === P.main,
        par: (pet.par || []).map(x => { const q = D.SPECIES[x.sp]; return q ? { emoji: q.e, name: x.n || q.n, el: D.ELEMENTS[x.el] ? D.ELEMENTS[x.el].e : "", mine: x.own === String(P.id) && P.pets.some(z => z.id === x.id) } : null; }).filter(Boolean),
        kids: P.pets.filter(c => c.par && c.par.some(x => x.id === pet.id && x.own === String(P.id))).slice(0, 12).map(c => { const q = D.SPECIES[c.sp]; return { emoji: q.e, name: c.nick || q.n }; }),
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

function eggView(egg, now, P) {   // warm/warmWait: تدفئة البيض
    const d = D.EGGS[egg.tier];
    return { id: egg.id, tier: egg.tier, name: d.n, emoji: d.e, readyIn: Math.max(0, egg.readyAt - now), bred: !!egg.bred, warm: egg.warm || 0, warmWait: Math.max(0, (egg.warmAt || 0) + (P ? X.warmCd(P) : X.WARM_CD) - now) };
}

// معلومات ثابتة تقريبًا (كتالوجات المتجر والمناطق)
function meta(P) {
    return {
        elements: D.ELEMENTS, beats: D.BEATS, beatsAll: D.BEATS_ALL,
        species: Object.values(D.SPECIES).map(x => ({ id: x.id, n: x.n, e: x.e, r: x.r, els: x.els, img: IMGS.has(x.id) ? 1 : 0 })),
        rarities: D.RARITIES.map(r => ({ n: r.n, e: r.e })),
        novItems: Object.entries(X.ITEMS).map(([id, it]) => ({ id, n: it.n, e: it.e, price: it.price, d: it.d })), warmMax: X.warmMax(P),
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
        posts: Po.POST_IDS.map(id => ({ id, n: Po.POSTS[id].n, e: Po.POSTS[id].e, slots: Po.POSTS[id].slots, d: Po.POSTS[id].d, names: Po.eligibleNames(id) })),
        penMax: 8, slotPrice: E.slotPrice(P), hatchPrice: P.hatchSlots < 10 ? E.hatchPrice(P) : 0,
        bowlPrice: F.price(P), bowlMax: F.MAX_BOWLS, bowlCap: F.CAP, bowlFoods: F.FOODS,
        breedLv: D.C.BREED_LV, lvCap: D.C.LV_CAP, maxStars: D.C.MAX_STARS
    };
}

function seasonView(P, now) {
    const id = Se.idAt(now), rows = Se.ranking(id), pos = rows.findIndex(r => r.id === String(P.id)) + 1;
    return {
        n: Se.numOf(id), leftMs: Math.max(0, Se.endOf(id) - now), pts: Se.pointsOf(P, id), pos, total: rows.length,
        top: rows.slice(0, 10), minPts: Se.MIN_PTS,
        rules: Se.POINTS.map(([, w, n]) => ({ n, w })),
        prizes: Se.PRIZES.concat([Se.TOP10, Se.PART]).map(p => ({ crystal: p.res.crystal || 0, dust: p.res.dust || 0, ess: p.essN || 0, egg: p.egg != null ? D.EGGS[p.egg].e + " " + D.EGGS[p.egg].n : "", fairy: p.fairy != null })),
        old: Se.hist().slice().reverse().map(s => ({ n: Se.numOf(s.id), total: s.total, top: s.rows.slice(0, 3) })),
        won: (P.seasonWon || []).slice(-5).reverse().map(w => ({ n: Se.numOf(w.id), rank: w.rank, pts: w.pts }))
    };
}

function postsView(P) {
    const s = Po.st(P);
    return {
        total: Po.fxText(Po.total(P)),
        list: Object.fromEntries(Po.POST_IDS.map(id => [id, s[id].map(pid => E.getPet(P, pid)).filter(Boolean).map(p => ({ id: p.id, fx: Po.fxText(Po.petFx(p, id)), apt: Po.aptitude(p, id) }))]))
    };
}

function buildState(P, now, quests) {
    const hours = Math.min(D.C.COLLECT_CAP_H, (now - P.collectAt) / 3600000);
    let pending = 0;
    for (const p of P.pets) pending += E.incomePerHour(p) * E.incomeMult(P, p) * hours * E.hungerFactor(E.hungerNow(p, now));

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
        eggs: P.eggs.map(e => eggView(e, now, P)),
        eggBag: (P.eggBag || []).map(e => ({ id: e.id, tier: e.tier, name: D.EGGS[e.tier].n, emoji: D.EGGS[e.tier].e, bred: !!e.bred })),
        res: Object.fromEntries(Object.keys(P.res || {}).filter(k => P.res[k] > 0).map(k => [k, P.res[k]])),
        fairies: Fy.st(P).fairies.map(f => {
            const sp = Fy.sp(f);
            return { id: f.id, sp: sp.id, name: f.nick || sp.n, species: sp.n, emoji: sp.e, rar: sp.r, rarName: Fy.RARITIES[sp.r], rankEmoji: Fy.RANK_E[sp.r], fam: sp.fam,
                lv: Fy.lvOf(f, now), hab: f.hab || null, equipped: P.fequip.includes(f.id), nextMs: Fy.nextLvMs(f, now), buff: Fy.buffTxt(Fy.buffOf(f, now)) };
        }),
        fslots: P.fslots, fslotPrice: Fy.slotPrice(P),
        fshop: Fy.shop(P, now).map((o, i) => { const sp = Fy.SPECIES[o.sp]; return { idx: i, sp: sp.id, name: sp.n, emoji: sp.e, rar: sp.r, rankEmoji: Fy.RANK_E[sp.r], rarName: Fy.RARITIES[sp.r], fam: sp.fam, buff: Fy.famTxt(sp, sp.r, 1), price: o.price, sold: !!o.sold }; }),
        bossMods: Fy.bossMods(P),
        fairyBuffs: Fy.buffTxt(Fy.buffs(P, now)),
        items: Object.keys(P.items).filter(id => P.items[id] > 0 && D.FOODS[id]).map(id => ({ id, count: P.items[id] })),
        nov: Object.fromEntries(Object.keys(X.ITEMS).map(id => [id, X.have(P, id)])),
        season: seasonView(P, now),
        posts: postsView(P),
        world: Object.assign({ b: {}, pens: {}, av: {}, pos: {}, biome: {}, hidePow: false }, P.world || {}),
        avMode: P.avMode || "pet", looks: World.LOOKS, cos: require("./cosmetics").tag(P),
        exp: require("./expedition").view(P, now), expZones: require("./expedition").ZONES, expBusy: [...require("./expedition").busyIds(P)],
        tower: require("./tower").view(P, now),
        costumes: require("./costumes").view(P),
        ability: (() => { const a = require("../game/bossAbility").get(P); return a ? { n: a.n, d: a.d, v: require("../game/bossAbility").pct(a.v) } : null; })(),
        tame: require("./taming").view(P, now),
        fish: require("./fishing").view(P, now),
        event: require("./events").current(now),
        tradeDisc: (() => { try { return Fy.buffs(P).trade || 0; } catch (e) { return 0; } })(),
        meta: meta(P)
    };
    if (quests) state.quests = quests(P, now);
    return state;
}

module.exports = { buildState, petView, eggView };
