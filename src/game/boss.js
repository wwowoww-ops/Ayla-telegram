// البوس الجماعي: زعيم ضخم في كل مجموعة يهاجمه الجميع بأقوى حيواناتهم خلال وقت محدد.
// يتجدد حياته تدريجيًا، ويزداد قوة بعد كل هزيمة. المكافآت بحسب الضرر، وصاحب أكبر ضرر يأخذ إطارًا حصريًا.
// الحالة تُحفظ مع إعدادات المجموعة (store.setGroup) فلا تضيع عند إعادة التشغيل.
const D = require("./data");
const E = require("./engine");
const store = require("../core/store");

// ---------- الإعدادات (عدّل من هنا) ----------
const HOUR = 3600e3;
const DURATION = 12 * HOUR;      // مدة بقاء الزعيم
const COOLDOWN = 8 * HOUR;       // الانتظار بعد نهايته قبل زعيم جديد
const ATTACK_CD = 40 * 60e3;     // انتظار اللاعب بين هجمتين
const TEAM = 3;                  // عدد الحيوانات في الهجمة
const HUNGER_COST = 12;          // جوع كل حيوان مهاجم
const REGEN_PER_H = 0.03;        // تجدد الزعيم من حياته القصوى كل ساعة
const HP_FACTOR = 70;            // حياة الزعيم = (متوسط أقوى 5 لاعبين) × هذا الرقم
const HP_GROWTH = 1.25;          // يزداد كل زعيم بعد هزيمة
const CRIT = 0.12;               // احتمال ضربة قاضية (ضرر ×2)
const PART_MIN = 0.03;           // أقل ضرر (من حياة الزعيم) لنيل إطار المشاركة

const KINDS = [
    { id: "fire",    n: "التنين القرمزي",     e: "🐲", el: "fire" },
    { id: "water",   n: "ليفياثان العميق",    e: "🌊", el: "water" },
    { id: "plant",   n: "عملاق الغابة",       e: "🌳", el: "plant" },
    { id: "earth",   n: "جبل الحجر الحي",     e: "⛰️", el: "earth" },
    { id: "thunder", n: "سيّد العواصف",       e: "⛈️", el: "thunder" },
    { id: "light",   n: "حارس الفجر",         e: "🌟", el: "light" },
    { id: "dark",    n: "ملك الظلام",         e: "👁️", el: "dark" }
];
const kindOf = b => KINDS.find(k => k.id === b.kind) || KINDS[0];

const fail = msg => ({ ok: false, msg });
const chats = new Set();                // مجموعات فيها زعيم نشط (للمؤقت)

// ---------- الحالة ----------
const get = chatId => store.getGroup(chatId).boss || null;
const save = (chatId, boss, extra) => store.setGroup(chatId, Object.assign({ boss }, extra || {}));

// أقوى فريق للاعب: أفضل TEAM حيوانات بحسب القوة
function team(P) {
    return [...P.pets].sort((a, b) => E.power(b) - E.power(a)).slice(0, TEAM);
}
const teamPower = P => team(P).reduce((s, p) => s + E.power(p), 0);

// متوسط قوة أقوى 5 فرق في اللعبة (مقياس لحياة الزعيم)
function reference() {
    const top = store.all().map(teamPower).filter(x => x > 0).sort((a, b) => b - a).slice(0, 5);
    return top.length ? top.reduce((a, b) => a + b, 0) / top.length : 1000;
}

// يجدد حياة الزعيم بحسب الوقت المنقضي
function regen(b, now) {
    if (b.hp <= 0 || b.done) return;
    const h = (Math.min(now, b.endAt) - b.regenAt) / HOUR;
    if (h <= 0) return;
    b.hp = Math.min(b.maxHp, b.hp + b.maxHp * REGEN_PER_H * h);
    b.regenAt = Math.min(now, b.endAt);
}

// ---------- الاستدعاء ----------
function spawn(chatId, now) {
    const G = store.getGroup(chatId);
    const old = G.boss;
    if (old && !old.done) return fail("هناك زعيم نشط بالفعل.");
    if (G.bossNextAt && now < G.bossNextAt) return fail("الزعيم القادم يظهر بعد " + E.dur(G.bossNextAt - now) + ".");
    const kills = G.bossKills || 0, level = G.bossLevel || 0;
    const kind = KINDS[kills % KINDS.length];
    const maxHp = Math.max(5000, Math.floor(reference() * HP_FACTOR * Math.pow(HP_GROWTH, level)));
    const boss = {
        id: (old ? old.id : 0) + 1, kind: kind.id, level, maxHp, hp: maxHp,
        startAt: now, endAt: now + DURATION, regenAt: now, dmg: {}, cd: {}, done: false
    };
    save(chatId, boss);
    chats.add(String(chatId));
    return { ok: true, boss };
}

// ---------- الهجوم ----------
function attack(chatId, P, name, now, rng = Math.random) {
    const b = get(chatId);
    if (!b || b.done) return fail("لا يوجد زعيم نشط الآن.");
    if (now >= b.endAt) return fail("انتهى وقت الزعيم.");
    regen(b, now);
    const wait = (b.cd[P.id] || 0) + ATTACK_CD - now;
    if (wait > 0) return fail("حيواناتك متعبة! عد بعد " + E.dur(wait) + ".");
    const crew = team(P);
    if (!crew.length) return fail("لا تملك حيوانات تهاجم بها.");
    const kind = kindOf(b);
    let total = 0, crit = false;
    const lines = [];
    for (const pet of crew) {
        const h = E.hungerNow(pet, now);
        const eff = D.elementMult(pet.el, kind.el);
        const hit = E.power(pet) * eff * E.hungerFactor(h) * (0.85 + 0.3 * rng());
        total += hit;
        pet.hg = Math.max(0, h - HUNGER_COST); pet.hgAt = now;
        lines.push({ e: D.SPECIES[pet.sp].e, eff, hit });
    }
    if (rng() < CRIT) { total *= 2; crit = true; }
    total = Math.floor(total);
    b.hp = Math.max(0, b.hp - total);
    b.cd[P.id] = now;
    const rec = b.dmg[P.id] || (b.dmg[P.id] = { n: name, d: 0, hits: 0 });
    rec.n = name; rec.d += total; rec.hits++;
    P.stats.bossDmg = (P.stats.bossDmg || 0) + total;
    const killed = b.hp <= 0;
    save(chatId, b);
    return { ok: true, dmg: total, crit, lines, killed, boss: b };
}

// ---------- الإنهاء والمكافآت ----------
function ranking(b) {
    return Object.entries(b.dmg).map(([id, r]) => ({ id, n: r.n, d: r.d, hits: r.hits })).sort((x, y) => y.d - x.d);
}

function finish(chatId, now, killed) {
    const G = store.getGroup(chatId);
    const b = G.boss;
    if (!b || b.done) return null;
    b.done = true; b.killed = killed; b.endedAt = now;
    const rank = ranking(b), top = rank[0] ? rank[0].d : 1, kind = kindOf(b);
    const out = [];
    rank.forEach((r, i) => {
        const P = store.get(r.id);
        if (!P) return;
        P.fown = P.fown || {};
        const share = 0.5 + 0.5 * (r.d / top);
        const coins = Math.floor(E.incomeAll(P) * (killed ? 6 : 1.5) * share);
        P.coins = E.clampCoins(P.coins + coins);
        const got = [];
        if (killed) {
            P.stats.bossKills = (P.stats.bossKills || 0) + 1;
            P.items.elixir = (P.items.elixir || 0) + (i < 3 ? 2 : 1);
            if (i < 3 && P.eggs.length < P.hatchSlots) {
                P.eggs.push({ id: ++P.eggSeq, tier: 5, readyAt: now + D.EGGS[5].min * 60000 });
                got.push(D.EGGS[5].e + " " + D.EGGS[5].n);
            }
            if (i === 0) {
                P.stats.bossTop = (P.stats.bossTop || 0) + 1;
                if (!P.fown["b_" + kind.id + "_top"]) { P.fown["b_" + kind.id + "_top"] = true; got.push("🖼️ إطار " + kind.n + " الذهبي"); }
            }
            if (r.d >= b.maxHp * PART_MIN && !P.fown["b_" + kind.id + "_part"]) {
                P.fown["b_" + kind.id + "_part"] = true; got.push("🖼️ إطار صيّاد " + kind.n);
            }
        }
        store.touch(P.id);
        out.push({ id: r.id, n: r.n, d: r.d, coins, got, rank: i + 1 });
    });
    const upd = { boss: b, bossNextAt: now + COOLDOWN };
    if (killed) { upd.bossKills = (G.bossKills || 0) + 1; upd.bossLevel = (G.bossLevel || 0) + 1; }
    store.setGroup(chatId, upd);
    chats.delete(String(chatId));
    return { boss: b, killed, results: out };
}

// ---------- مؤقت: إنهاء الزعماء المنتهية مهلتهم وإرسال النتيجة ----------
async function loadActive() {
    try {
        const r = await store.query("SELECT id FROM group_settings");
        r.rows.forEach(x => { const b = get(x.id); if (b && !b.done) chats.add(String(x.id)); });
    } catch (e) { /* قد لا تتصل القاعدة بعد */ }
}
async function tickAll(now, announce) {
    for (const id of [...chats]) {
        const b = get(id);
        if (!b || b.done) { chats.delete(id); continue; }
        if (now >= b.endAt && b.hp > 0) {
            const res = finish(id, now, false);
            if (res && announce) await announce(id, res).catch(() => {});
        }
    }
}

module.exports = {
    KINDS, DURATION, COOLDOWN, ATTACK_CD, TEAM, REGEN_PER_H, CRIT, kindOf,
    get, spawn, attack, regen, ranking, finish, team, teamPower, chats, loadActive, tickAll
};