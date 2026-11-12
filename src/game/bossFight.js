// محاكاة قتال البوس: تُنفَّذ كلها بضغطة واحدة وتُرجع تقريرًا مفصلًا.
// دالة نقية (لا تلمس اللاعبين ولا الحالة): تأخذ المشاركين والزعيم وتُرجع النتيجة.
const D = require("./data");
const E = require("./engine");
const S = require("./bossSkills");
const Fair = require("./fairies");

// ---------- الإعدادات (عدّل من هنا) ----------
const ROUNDS = 15;        // أقصى عدد جولات
const HP_MULT = 10;       // حياة الحيوان في القتال = قوته × هذا الرقم
const BOSS_HPK = 2.2;     // حياة الزعيم = مجموع قوى المشاركين × الجولات × هذا الرقم (أصغر = أسهل)
const BOSS_HIT = 0.40;    // ضربة الزعيم الفردية = هذه النسبة من متوسط حياة الحيوانات
const BOSS_AOE = 0.07;    // ضربته الجماعية (كل 3 جولات)
const RAGE_AT = 0.5;      // يغضب إذا نزلت حياته عن هذه النسبة
const RAGE_MULT = 1.35;
const CRIT = 0.10;
const GROW_HIT = 1.08;    // يقوى هجومه 8% لكل مستوى
const GROW_HP = 1.25;     // وتزيد حياته 25% لكل مستوى

const floor = Math.floor;

function simulate(parts, boss, now, rng = Math.random) {
    const kind = require("./boss").kindOf(boss);
    const units = [];
            // بفات الجنيات (إن وُجدت): هجوم، حياة، علاج، تقليل ضرر
        const fm = (p.P && Fair.bossMods(p.P)) || { atk: 0, heal: 0, hp: 0, dr: 0 };
        const pw0 = E.power(pet) * E.hungerFactor(E.hungerNow(pet, now));
        const pw = pw0 * (1 + fm.atk);
        const maxHp = Math.max(1, floor(E.power(pet) * HP_MULT * (1 + fm.hp)));
        units.push({
            uid: String(p.uid), owner: p.name, pet, e: D.SPECIES[pet.sp].e, el: pet.el, m: S.rm(pet),
            pw, pw0, healM: fm.heal, dr: fm.dr, maxHp, hp: maxHp, shield: 0, cd: 1, cdMax: S.cdOf(pet), revived: false, taunt: 0,
            st: { dmg: 0, heal: 0, healN: 0, taken: 0, casts: 0, deaths: 0, rev: 0, hits: 0 }
        });
    }));
        const sumPw = units.reduce((s, u) => s + u.pw0, 0);
    const level = boss.level || 0;
    const maxHp = Math.max(1000, floor(sumPw * ROUNDS * BOSS_HPK * Math.pow(GROW_HP, level)));
    let hp = maxHp;
    const avgHp = units.reduce((s, u) => s + u.maxHp, 0) / Math.max(1, units.length);
    const hitBase = avgHp * BOSS_HIT * Math.pow(GROW_HIT, level);
    const aoeBase = avgHp * BOSS_AOE * Math.pow(GROW_HIT, level);

    const events = [];
    const ev = (r, t) => { if (events.length < 70) events.push(`ج${r}: ${t}`); };
    let stun = 0, curse = 0, curseM = 0, rounds = 0;
    const alive = () => units.filter(u => u.hp > 0);
    const lowest = () => alive().sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0];

    function heal(u, target, amount, r) {
        if (!target || target.hp <= 0 || amount <= 0) return 0;
           amount *= 1 + (u.healM || 0);
        const got = Math.max(0, Math.min(target.maxHp - target.hp, amount));
        if (got <= 0) return 0;
        target.hp += got; u.st.heal += got; u.st.healN++;
        return got;
    }
    function hitBoss(u, mult, r, label) {
        const el = D.elementMult(u.el, kind.el);
        let dmg = u.pw * mult * el * (0.9 + 0.2 * rng());
        const aura = Math.min(0.8, alive().filter(x => x.el === "light").reduce((s, x) => s + 0.04 * x.m, 0));
        dmg *= 1 + aura;
        if (u.el === "fire") dmg *= 1 + 0.10 * u.m;
        if (curse > 0) dmg *= 1 + curseM;
        if (rng() < CRIT) { dmg *= 2; label = (label || "") + " 💥"; }
        let total = dmg;
        if (u.el === "thunder" && rng() < Math.min(0.6, 0.12 * u.m)) total += dmg * 0.9;
        total = floor(total);
        hp = Math.max(0, hp - total);
        u.st.dmg += total; u.st.hits++;
        if (u.el === "dark") heal(u, u, total * Math.min(0.6, 0.12 * u.m), r);
        return total;
    }

    for (let r = 1; r <= ROUNDS && hp > 0 && alive().length; r++) {
        rounds = r;
        // 1) سلبيات بداية الجولة
        for (const u of alive()) {
            if (u.el === "plant") heal(u, u, u.maxHp * 0.03 * u.m, r);
            if (u.el === "water") { const t = lowest(); if (t && t.hp < t.maxHp) heal(u, t, t.maxHp * 0.03 * u.m, r); }
        }
        // 2) أفعال الحيوانات
        for (const u of alive()) {
            if (hp <= 0) break;
            u.cd--; if (u.taunt > 0) u.taunt--;
            let used = false;
            if (u.cd <= 0) {
                const need = alive().some(x => x.hp < x.maxHp * 0.7);
                const dead = units.some(x => x.hp <= 0);
                switch (u.el) {
                    case "fire": { const d = hitBoss(u, 2.2 + 0.15 * u.m, r); ev(r, `${u.e}${u.owner} 💥 انفجار ${E.fmt(d)}`); used = true; break; }
                    case "thunder": { const d = hitBoss(u, 1.6 + 0.1 * u.m, r); stun = Math.max(stun, 1); ev(r, `${u.e}${u.owner} 🌩️ صعق ${E.fmt(d)} وشلّ الزعيم`); used = true; break; }
                    case "dark": { curse = 3; curseM = Math.max(curseM, Math.min(0.8, 0.2 + 0.03 * u.m)); ev(r, `${u.e}${u.owner} ☠️ لعنة على الزعيم`); used = true; break; }
                    case "earth": { u.taunt = 2; ev(r, `${u.e}${u.owner} 😤 استفزّ الزعيم`); used = true; break; }
                    case "plant": { alive().forEach(x => { x.shield += x.maxHp * 0.06 * u.m; }); ev(r, `${u.e}${u.owner} 🛡️ درع للفريق`); used = true; break; }
                    case "water": if (need) { let t = 0; alive().forEach(x => { t += heal(u, x, x.maxHp * 0.10 * u.m, r); }); ev(r, `${u.e}${u.owner} 🌊 شفاء جماعي (${E.fmt(t)})`); used = true; } break;
                    case "light": {
                        const d = units.filter(x => x.hp <= 0)[0];
                        if (d) { d.hp = Math.max(1, floor(d.maxHp * Math.min(0.9, 0.25 + 0.06 * u.m))); d.shield = 0; d.st.rev++; u.st.heal += d.hp; u.st.healN++; ev(r, `${u.e}${u.owner} 💫 أحيا ${d.e}${d.owner}`); used = true; }
                        else if (need) { const t = lowest(); const g = heal(u, t, t.maxHp * 0.28 * u.m, r); ev(r, `${u.e}${u.owner} 💫 ترميم ${t.e} (${E.fmt(g)})`); used = true; }
                        break;
                    }
                }
                if (used) { u.st.casts++; u.cd = u.cdMax; }
            }
            if (!used) hitBoss(u, 1, r);
        }
        if (hp <= 0) { ev(r, `☠️ سقط ${kind.n}!`); break; }
        // 3) الزعيم
        const rage = hp < maxHp * RAGE_AT;
        const k = rage ? RAGE_MULT : 1;
        if (rage && !events.some(x => x.includes("غضب"))) ev(r, `😡 ${kind.n} غضب!`);
        const hurt = (u, base, r) => {
                        let d = base * k * (0.9 + 0.2 * rng()) * (1 - Math.min(0.6, u.dr || 0));
            if (u.el === "earth") d *= 1 - Math.min(0.6, 0.08 * u.m);
            if (u.taunt > 0) d *= 1 - Math.min(0.7, 0.35 + 0.05 * u.m);
            if (u.shield > 0) { const a = Math.min(u.shield, d); u.shield -= a; d -= a; }
            d = floor(d);
            u.hp -= d; u.st.taken += d;
            if (u.hp <= 0) { u.hp = 0; u.st.deaths++; ev(r, `💀 سقط ${u.e}${u.owner}`); }
        };
        if (stun > 0) { stun--; ev(r, "الزعيم مشلول ويفوّت هجومه"); }
        else {
            const live = alive();
            if (live.length) {
                const tank = live.find(x => x.taunt > 0);
                const t = tank || live[floor(rng() * live.length)];
                hurt(t, hitBase, r);
            }
        }
        if (r % 3 === 0) alive().forEach(u => hurt(u, aoeBase, r));
        if (curse > 0) { curse--; if (!curse) curseM = 0; }
    }

    const killed = hp <= 0;
    const rep = {
        killed, rounds, bossMax: maxHp, bossLeft: Math.ceil(hp), kind: kind.id, events,
        units: units.map(u => ({
            uid: u.uid, owner: u.owner, pid: u.pet.id, e: u.e, el: u.el, r: S.rarityOf(u.pet), lv: u.pet.lv,
            maxHp: u.maxHp, alive: u.hp > 0, dmg: floor(u.st.dmg), heal: floor(u.st.heal), healN: u.st.healN,
            taken: u.st.taken, casts: u.st.casts, deaths: u.st.deaths, rev: u.st.rev, hits: u.st.hits
        }))
    };
    return rep;
}

module.exports = { simulate, ROUNDS, HP_MULT, BOSS_HPK, GROW_HP };