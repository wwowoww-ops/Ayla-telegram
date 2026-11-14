// محرك قتال البوس (v3): يعمل جولة بجولة (step) ليدعم القتال اليدوي، ومنه simulate() للقتال التلقائي الكامل.
// كل حيوان: هجوم عادي + 3 مهارات (مع كولداون) + سلبية. اللاعب اليدوي يختار لكل حيوان، والأوتو يختار الذكاء الاصطناعي.
const D = require("../data");
const E = require("../engine");
const S = require("./skills");
const Fair = require("../fairies");

// ---------- الإعدادات (عدّل من هنا) ----------
const ROUNDS = 15;        // أقصى عدد جولات
const HP_MULT = 10;       // حياة الحيوان في القتال = قوته × هذا الرقم
const BOSS_HPK = 2.3;     // حياة الزعيم = مجموع قوى المشاركين × الجولات × هذا الرقم (أصغر = أسهل)
const BOSS_HIT = 0.40;    // ضربة الزعيم الفردية = هذه النسبة من متوسط حياة الحيوانات
const BOSS_AOE = 0.07;    // ضربته الجماعية (كل 3 جولات)
const RAGE_AT = 0.5;      // يغضب إذا نزلت حياته عن هذه النسبة
const RAGE_MULT = 1.35;
const CRIT = 0.10;
const GROW_HIT = 1.05;    // يقوى هجومه 5% لكل مستوى
const GROW_HP = 1.12;     // وتزيد حياته 12% لكل مستوى

const floor = Math.floor;

function create(parts, boss, now, rng = Math.random) {
    const kind = require("./index").kindOf(boss);
    const units = [];
    parts.forEach(p => p.pets.forEach(pet => {
        const fm = (p.P && Fair.bossMods(p.P)) || { atk: 0, heal: 0, hp: 0, dr: 0 };
        const pw0 = E.power(pet) * E.hungerFactor(E.hungerNow(pet, now));
        const pw = pw0 * (1 + fm.atk);
        const maxHp = Math.max(1, floor(E.power(pet) * HP_MULT * (1 + fm.hp)));
        units.push({
            id: units.length, uid: String(p.uid), owner: p.name, pet, e: D.SPECIES[pet.sp].e, el: pet.el, m: S.rm(pet),
            pw, pw0, healM: fm.heal, dr: fm.dr, maxHp, hp: maxHp, shield: 0, taunt: 0, hot: { n: 0, p: 0 },
            cd: [0, 1, 3], cdMax: [0, 1, 2].map(i => S.cdOf(pet, i)),
            st: { dmg: 0, heal: 0, healN: 0, taken: 0, casts: 0, deaths: 0, rev: 0, hits: 0 }
        });
    }));
    const sumPw = units.reduce((s, u) => s + u.pw0, 0);
    const level = boss.level || 0;
    const maxHp = Math.max(1000, floor(sumPw * ROUNDS * BOSS_HPK * Math.pow(GROW_HP, level)));
    const avgHp = units.reduce((s, u) => s + u.maxHp, 0) / Math.max(1, units.length);
    return {
        kind, level, units, maxHp, hp: maxHp, rng, round: 0, done: false, killed: false, raged: false,
        hitBase: avgHp * BOSS_HIT * Math.pow(GROW_HIT, level),
        aoeBase: avgHp * BOSS_AOE * Math.pow(GROW_HIT, level),
        stun: 0, curse: { n: 0, m: 0 }, burn: { n: 0, d: 0 }, wall: { n: 0, m: 0 }, buff: { n: 0, m: 0 },
        events: []
    };
}

const aliveOf = st => st.units.filter(u => u.hp > 0);
const ready = (u, i) => u.cd[i] <= 0;

// ---------- اختيار الأوتو ----------
function useful(st, u, i) {
    const al = aliveOf(st), need = al.some(x => x.hp < x.maxHp * 0.7), dead = st.units.some(x => x.hp <= 0);
    switch (u.el + i) {
        case "water0": case "light0": return need;
        case "water1": return need;
        case "water2": return need || true;
        case "light1": return dead || need;
        case "light2": return dead || need || true;
        case "fire1": return st.burn.n <= 0;
        case "thunder1": case "thunder2": return st.stun <= 0 || i === 2;
        case "dark1": return st.curse.n <= 1;
        case "earth1": return !al.some(x => x.taunt > 0);
        case "earth2": return st.wall.n <= 0;
        case "plant2": return !al.some(x => x.hot.n > 0);
        default: return true;
    }
}
function autoPick(st, u) {
    for (const i of [2, 1, 0]) if (ready(u, i) && useful(st, u, i)) return i + 1;
    return 0;
}

// ---------- جولة واحدة ----------
// cmds: { [unitId]: 0 هجوم | 1..3 مهارة }  (غير الموجود أو غير الصالح ← أوتو)
function step(st, cmds = {}) {
    const rng = st.rng, kind = st.kind, lines = [], r = ++st.round;
    const log = t => { lines.push(t); if (st.events.length < 90) st.events.push(`ج${r}: ${t}`); };
    const lowest = () => aliveOf(st).sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0];
    let crit = false;

    function heal(u, t, amount) {
        if (!t || t.hp <= 0 || amount <= 0) return 0;
        amount *= 1 + (u.healM || 0);
        const got = Math.max(0, Math.min(t.maxHp - t.hp, amount));
        if (got <= 0) return 0;
        t.hp += got; u.st.heal += got; u.st.healN++;
        return got;
    }
    function hitBoss(u, mult) {
        const el = D.elementMult(u.el, kind.el);
        let dmg = u.pw * mult * el * (0.9 + 0.2 * rng());
        const aura = Math.min(0.8, aliveOf(st).filter(x => x.el === "light").reduce((s, x) => s + 0.04 * x.m, 0));
        dmg *= 1 + aura;
        if (u.el === "fire") dmg *= 1 + 0.10 * u.m;
        if (st.curse.n > 0) dmg *= 1 + st.curse.m;
        if (st.buff.n > 0) dmg *= 1 + st.buff.m;
        crit = false;
        if (rng() < CRIT) { dmg *= 2; crit = true; }
        let total = dmg;
        if (u.el === "thunder" && rng() < Math.min(0.6, 0.12 * u.m)) total += dmg * 0.9;
        total = floor(total);
        st.hp = Math.max(0, st.hp - total);
        u.st.dmg += total; u.st.hits++;
        if (u.el === "dark") heal(u, u, total * Math.min(0.6, 0.12 * u.m));
        return total;
    }
    const revive = (u, d, frac) => { d.hp = Math.max(1, floor(d.maxHp * frac)); d.shield = 0; d.st.rev++; u.st.heal += d.hp; u.st.healN++; };

    // تنفيذ مهارة i (0..2) لحيوان u
    function cast(u, i) {
        const m = u.m, sk = S.SKILLS[u.el][i], tag = `${u.e}${u.owner} ${sk.e} ${sk.n}`;
        const al = aliveOf(st);
        switch (u.el + i) {
            case "fire0": { const d = hitBoss(u, 1.8 + 0.1 * m); log(`${tag} ${E.fmt(d)}${crit ? " 💥" : ""}`); break; }
            case "fire1": { const d = hitBoss(u, 1.0); st.burn = { n: 3, d: u.pw * (0.5 + 0.05 * m) * D.elementMult(u.el, kind.el) }; log(`${tag} ${E.fmt(d)} + حرق`); break; }
            case "fire2": { const d = hitBoss(u, 4.2 + 0.25 * m); log(`${tag} ${E.fmt(d)}${crit ? " 💥" : ""}`); break; }
            case "water0": { const t = lowest(); const g = heal(u, t, t.maxHp * 0.12 * m); log(`${tag} ← ${t.e}${t.owner} (+${E.fmt(g)})`); break; }
            case "water1": { let tot = 0; al.forEach(x => { tot += heal(u, x, x.maxHp * 0.10 * m); }); log(`${tag} للفريق (+${E.fmt(tot)})`); break; }
            case "water2": { let tot = 0; al.forEach(x => { tot += heal(u, x, x.maxHp * 0.18 * m); }); const d = hitBoss(u, 2.0); log(`${tag} (+${E.fmt(tot)}) وضرب ${E.fmt(d)}`); break; }
            case "plant0": { const d = hitBoss(u, 1.6 + 0.1 * m); heal(u, u, u.maxHp * 0.05 * m); log(`${tag} ${E.fmt(d)}`); break; }
            case "plant1": { al.forEach(x => { x.shield += x.maxHp * 0.06 * m; }); log(`${tag} درع للفريق`); break; }
            case "plant2": { al.forEach(x => { x.hot = { n: 3, p: 0.06 * m }; x.shield += x.maxHp * 0.04 * m; }); log(`${tag} شفاء مستمر للفريق`); break; }
            case "earth0": { const d = hitBoss(u, 1.7 + 0.1 * m); log(`${tag} ${E.fmt(d)}`); break; }
            case "earth1": { u.taunt = 2; log(`${tag} يجذب هجمات الزعيم`); break; }
            case "earth2": { st.wall = { n: 2, m: Math.min(0.6, 0.30 + 0.04 * m) }; u.taunt = 2; const d = hitBoss(u, 1.5); log(`${tag} حماية للفريق + ${E.fmt(d)}`); break; }
            case "thunder0": { const d = hitBoss(u, 1.7 + 0.1 * m); log(`${tag} ${E.fmt(d)}${crit ? " 💥" : ""}`); break; }
            case "thunder1": { const d = hitBoss(u, 1.8 + 0.1 * m); st.stun = Math.max(st.stun, 1); log(`${tag} ${E.fmt(d)} وشلّ الزعيم`); break; }
            case "thunder2": { let d = 0; for (let k = 0; k < 3 && st.hp > 0; k++) d += hitBoss(u, 1.3 + 0.05 * m); st.stun = Math.max(st.stun, 1); log(`${tag} ${E.fmt(d)} وشلّ الزعيم`); break; }
            case "light0": { const t = lowest(); const g = heal(u, t, t.maxHp * 0.15 * m); log(`${tag} ← ${t.e}${t.owner} (+${E.fmt(g)})`); break; }
            case "light1": {
                const d = st.units.find(x => x.hp <= 0);
                if (d) { revive(u, d, Math.min(0.9, 0.25 + 0.06 * m)); log(`${tag} أحيا ${d.e}${d.owner}`); }
                else { const t = lowest(); const g = heal(u, t, t.maxHp * 0.28 * m); log(`${tag} ← ${t.e}${t.owner} (+${E.fmt(g)})`); }
                break;
            }
            case "light2": {
                let n = 0; st.units.filter(x => x.hp <= 0).forEach(d => { revive(u, d, 0.30); n++; });
                let tot = 0; aliveOf(st).forEach(x => { tot += heal(u, x, x.maxHp * 0.10 * m); });
                st.buff = { n: 3, m: 0.25 };
                log(`${tag} ${n ? "أحيا " + n + " و" : ""}عالج الفريق ورفع ضررهم`);
                break;
            }
            case "dark0": { const d = hitBoss(u, 1.6 + 0.1 * m); heal(u, u, d * 0.4); log(`${tag} ${E.fmt(d)}`); break; }
            case "dark1": { st.curse = { n: 3, m: Math.max(st.curse.m, Math.min(0.8, 0.2 + 0.03 * m)) }; log(`${tag} لعنة على الزعيم`); break; }
            case "dark2": { const d = hitBoss(u, 3.2 + 0.2 * m); heal(u, u, d * 0.3); st.curse = { n: 4, m: Math.max(st.curse.m, Math.min(0.8, 0.3 + 0.03 * m)) }; log(`${tag} ${E.fmt(d)} + لعنة`); break; }
        }
        u.st.casts++; u.cd[i] = u.cdMax[i];
    }

    // 1) سلبيات وتأثيرات بداية الجولة
    for (const u of aliveOf(st)) {
        if (u.el === "plant") heal(u, u, u.maxHp * 0.03 * u.m);
        if (u.el === "water") { const t = lowest(); if (t && t.hp < t.maxHp) heal(u, t, t.maxHp * 0.03 * u.m); }
        if (u.hot.n > 0) { heal(u, u, u.maxHp * u.hot.p); u.hot.n--; }
    }
    if (st.burn.n > 0) { const d = floor(st.burn.d); st.hp = Math.max(0, st.hp - d); st.burn.n--; log(`♨️ الحرق يصيب الزعيم (${E.fmt(d)})`); }

    // 2) أفعال الحيوانات
    let basic = 0;
    for (const u of aliveOf(st)) {
        if (st.hp <= 0) break;
        let act = cmds[u.id];
        if (!(act >= 1 && act <= 3 && ready(u, act - 1))) act = act === 0 ? 0 : autoPick(st, u);
        if (act >= 1) cast(u, act - 1);
        else basic += hitBoss(u, 1);
    }
    if (basic) log(`⚔️ الهجمات العادية: ${E.fmt(basic)}`);
    if (st.hp <= 0) { log(`☠️ سقط ${kind.n}!`); st.done = true; st.killed = true; return lines; }

    // 3) الزعيم
    const rage = st.hp < st.maxHp * RAGE_AT, k = rage ? RAGE_MULT : 1;
    if (rage && !st.raged) { st.raged = true; log(`😡 ${kind.n} غضب!`); }
    const hurt = (u, base) => {
        let d = base * k * (0.9 + 0.2 * rng()) * (1 - Math.min(0.6, u.dr || 0));
        if (u.el === "earth") d *= 1 - Math.min(0.6, 0.08 * u.m);
        if (u.taunt > 0) d *= 1 - Math.min(0.7, 0.35 + 0.05 * u.m);
        if (st.wall.n > 0) d *= 1 - st.wall.m;
        if (u.shield > 0) { const a = Math.min(u.shield, d); u.shield -= a; d -= a; }
        d = floor(d);
        u.hp -= d; u.st.taken += d;
        if (u.hp <= 0) { u.hp = 0; u.st.deaths++; log(`💀 سقط ${u.e}${u.owner}`); }
    };
    if (st.stun > 0) { st.stun--; log("😵 الزعيم مشلول ويفوّت هجومه"); }
    else {
        const live = aliveOf(st);
        if (live.length) { const tank = live.find(x => x.taunt > 0); hurt(tank || live[floor(rng() * live.length)], st.hitBase); }
    }
    if (r % 3 === 0 && aliveOf(st).length) { log(`🌋 هجوم جماعي من الزعيم`); aliveOf(st).forEach(u => hurt(u, st.aoeBase)); }

    // 4) نهاية الجولة: كولداون وتأثيرات
    st.units.forEach(u => { for (let i = 0; i < 3; i++) if (u.cd[i] > 0) u.cd[i]--; if (u.taunt > 0) u.taunt--; });
    if (st.curse.n > 0 && !--st.curse.n) st.curse.m = 0;
    if (st.wall.n > 0) st.wall.n--;
    if (st.buff.n > 0) st.buff.n--;
    if (!aliveOf(st).length || r >= ROUNDS) { st.done = true; if (!aliveOf(st).length) log("💀 سقط كل الفريق"); }
    return lines;
}

function report(st) {
    return {
        killed: st.killed, rounds: st.round, bossMax: st.maxHp, bossLeft: Math.ceil(st.hp), kind: st.kind.id, events: st.events,
        units: st.units.map(u => ({
            uid: u.uid, owner: u.owner, pid: u.pet.id, e: u.e, el: u.el, r: S.rarityOf(u.pet), lv: u.pet.lv,
            maxHp: u.maxHp, alive: u.hp > 0, dmg: floor(u.st.dmg), heal: floor(u.st.heal), healN: u.st.healN,
            taken: u.st.taken, casts: u.st.casts, deaths: u.st.deaths, rev: u.st.rev, hits: u.st.hits
        }))
    };
}

// قتال تلقائي كامل (الجميع أوتو)
function simulate(parts, boss, now, rng = Math.random) {
    const st = create(parts, boss, now, rng);
    while (!st.done) step(st, {});
    return report(st);
}

module.exports = { create, step, report, simulate, autoPick, ready, aliveOf, ROUNDS, HP_MULT, BOSS_HPK, GROW_HP };