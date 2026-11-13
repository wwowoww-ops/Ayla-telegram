// البوس الجماعي (v3): تسجيل (يدوي/أوتو لكل لاعب) ثم قتال: أوتو فوري أو مباشر جولة بجولة (bossLive.js) ← نتائج وتفاصيل.
// المراحل: reg ← live (إن وُجد لاعب يدوي) ← done.
// الحالة تُحفظ مع إعدادات المجموعة (store.setGroup) فلا تضيع عند إعادة التشغيل.
const D = require("./data");
const E = require("./engine");
const store = require("../core/store");
const Fight = require("./bossFight");

// ---------- الإعدادات (عدّل من هنا) ----------
const MIN = 60e3, HOUR = 3600e3;
const REG_TIME = 15 * MIN;       // مهلة التسجيل
const COOLDOWN = 8 * HOUR;       // الانتظار بعد القتال قبل زعيم جديد
const TEAM = 3;                  // عدد الحيوانات لكل لاعب
const MIN_AUTO = 2;              // أقل عدد لاعبين ليبدأ القتال تلقائيًا عند استعداد الجميع
const HUNGER_COST = 12;          // جوع كل حيوان بعد القتال
const PART_MIN = 0.03;           // أقل ضرر+علاج (من حياة الزعيم) لنيل إطار المشاركة

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
const chats = new Set();                // مجموعات فيها تسجيل مفتوح (للمؤقت)

const get = chatId => store.getGroup(chatId).boss || null;
const save = (chatId, boss, extra) => store.setGroup(chatId, Object.assign({ boss }, extra || {}));
const open = b => !!(b && !b.done && b.phase === "reg");

const ranked = P => [...P.pets].sort((a, b) => E.power(b) - E.power(a));
const defaultTeam = P => ranked(P).slice(0, TEAM).map(p => p.id);

// ---------- الاستدعاء والتسجيل ----------
function spawn(chatId, now, uid, name) {
    const G = store.getGroup(chatId);
    const old = G.boss;
    if (open(old)) return fail("هناك تسجيل مفتوح بالفعل.");
    if (old && !old.done && old.phase === "live") return fail("القتال جارٍ الآن.");
    if (G.bossNextAt && now < G.bossNextAt) return fail("الزعيم القادم يظهر بعد " + E.dur(G.bossNextAt - now) + ".");
    const kills = G.bossKills || 0, level = G.bossLevel || 0;
    const kind = KINDS[kills % KINDS.length];
    const boss = {
        id: (old ? old.id : 0) + 1, kind: kind.id, level, phase: "reg", by: String(uid || ""), byName: name || "",
        startAt: now, regEnd: now + REG_TIME, reg: {}, done: false
    };
    save(chatId, boss);
    chats.add(String(chatId));
    return { ok: true, boss };
}

function join(chatId, P, name, now) {
    const b = get(chatId);
    if (!open(b)) return fail("لا يوجد تسجيل مفتوح.");
    if (now >= b.regEnd) return fail("انتهت مهلة التسجيل.");
    if (!P.pets.length) return fail("لا تملك حيوانات.");
    const r = b.reg[P.id] || (b.reg[P.id] = { n: name, pets: defaultTeam(P), ready: false, mode: "auto" });
    r.n = name;
    save(chatId, b);
    return { ok: true, boss: b, entry: r };
}

function toggle(chatId, P, petId) {
    const b = get(chatId), r = open(b) && b.reg[P.id];
    if (!r) return fail("سجّل أولًا.");
    if (r.ready) return fail("أنت جاهز. ألغِ الجاهزية لتعديل الاختيار.");
    const id = Number(petId);
    if (!P.pets.some(p => p.id === id)) return fail("حيوان غير موجود.");
    const i = r.pets.indexOf(id);
    if (i >= 0) r.pets.splice(i, 1);
    else { if (r.pets.length >= TEAM) return fail("الحد الأقصى " + TEAM + " حيوانات."); r.pets.push(id); }
    save(chatId, b);
    return { ok: true, boss: b, entry: r };
}

function setMode(chatId, uid, mode) {
    const b = get(chatId), r = open(b) && b.reg[uid];
    if (!r) return fail("سجّل أولًا.");
    if (r.ready) return fail("أنت جاهز. ألغِ الجاهزية أولًا.");
    r.mode = mode === "manual" ? "manual" : "auto";
    save(chatId, b);
    return { ok: true, boss: b, entry: r };
}

function setReady(chatId, uid, on) {
    const b = get(chatId), r = open(b) && b.reg[uid];
    if (!r) return fail("سجّل أولًا.");
    if (on && !r.pets.length) return fail("اختر حيوانًا واحدًا على الأقل.");
    r.ready = !!on;
    save(chatId, b);
    const list = Object.values(b.reg);
    return { ok: true, boss: b, entry: r, all: list.length >= MIN_AUTO && list.every(x => x.ready) };
}

function leave(chatId, uid) {
    const b = get(chatId);
    if (!open(b) || !b.reg[uid]) return fail("غير مسجّل.");
    delete b.reg[uid];
    save(chatId, b);
    return { ok: true, boss: b };
}

// ---------- القتال والنتائج ----------
const liveOpen = b => !!(b && !b.done && (b.phase === "reg" || b.phase === "live"));

// يجهّز المشاركين من التسجيل (أو يُلغي إن لم يوجد أحد)
function prepare(chatId, now) {
    const G = store.getGroup(chatId), b = G.boss;
    if (!liveOpen(b)) return fail("لا يوجد تسجيل مفتوح.");
    const parts = [];
    Object.entries(b.reg || {}).forEach(([uid, r]) => {
        const P = store.get(uid);
        if (!P) return;
        const pets = r.pets.map(id => P.pets.find(p => p.id === id)).filter(Boolean);
        if (pets.length) parts.push({ uid, name: r.n, pets, P, mode: r.mode === "manual" ? "manual" : "auto" });
    });
    if (!parts.length) {
        b.done = true; b.phase = "done"; b.canceled = true;
        store.setGroup(chatId, { boss: b });
        chats.delete(String(chatId));
        return { ok: true, canceled: true, boss: b, results: [] };
    }
    return { ok: true, boss: b, parts };
}

// يوزّع المكافآت ويحفظ التقرير (مشترك بين القتال الفوري والمباشر)
function finalize(chatId, parts, rep, now) {
    const G = store.getGroup(chatId), b = G.boss;
    const kind = kindOf(b), killed = rep.killed;
    const by = {};
    rep.units.forEach(u => {
        const x = by[u.uid] || (by[u.uid] = { id: u.uid, n: (b.reg[u.uid] || {}).n || "لاعب", mode: (b.reg[u.uid] || {}).mode, dmg: 0, heal: 0, healN: 0, taken: 0, deaths: 0, casts: 0 });
        x.dmg += u.dmg; x.heal += u.heal; x.healN += u.healN; x.taken += u.taken; x.deaths += u.deaths; x.casts += u.casts;
    });
    const rank = Object.values(by).map(x => Object.assign(x, { score: x.dmg + x.heal * 1.5 })).sort((a, c) => c.score - a.score);
    const top = rank[0] ? Math.max(1, rank[0].score) : 1;

    rank.forEach((r, i) => {
        const part = parts.find(p => p.uid === r.id);
        const P = part.P;
        P.fown = P.fown || {};
        part.pets.forEach(pet => { pet.hg = Math.max(0, E.hungerNow(pet, now) - HUNGER_COST); pet.hgAt = now; });
        const share = 0.5 + 0.5 * (r.score / top);
        const coins = Math.floor(E.incomeAll(P) * (killed ? 6 : 1.5) * share);
        P.coins = E.clampCoins(P.coins + coins);
        P.stats.bossDmg = (P.stats.bossDmg || 0) + r.dmg;
        P.stats.bossHeal = (P.stats.bossHeal || 0) + r.heal;
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
            if (r.score >= rep.bossMax * PART_MIN && !P.fown["b_" + kind.id + "_part"]) {
                P.fown["b_" + kind.id + "_part"] = true; got.push("🖼️ إطار صيّاد " + kind.n);
            }
        }
        store.touch(P.id);
        r.coins = coins; r.got = got; r.rank = i + 1;
    });

    b.done = true; b.phase = "done"; b.killed = killed; b.endedAt = now;
    b.report = Object.assign(rep, { players: rank });
    delete b.reg;
    const upd = { boss: b, bossNextAt: now + COOLDOWN };
    if (killed) { upd.bossKills = (G.bossKills || 0) + 1; upd.bossLevel = (G.bossLevel || 0) + 1; }
    store.setGroup(chatId, upd);
    chats.delete(String(chatId));
    return { ok: true, boss: b, killed, report: b.report, results: rank };
}

// قتال تلقائي فوري (الجميع أوتو، أو احتياطًا إن ضاعت الجلسة المباشرة)
function start(chatId, now, rng = Math.random) {
    const pre = prepare(chatId, now);
    if (!pre.ok || pre.canceled) return pre;
    const rep = Fight.simulate(pre.parts, pre.boss, now, rng);
    return module.exports.finalize(chatId, pre.parts, rep, now);
}

// يبدأ القتال: أوتو فوري إن لم يوجد لاعب يدوي، وإلا يُرجع {live:true, parts} ليبدأ المباشر (bossLive)
function begin(chatId, now, rng = Math.random) {
    const pre = prepare(chatId, now);
    if (!pre.ok || pre.canceled) return pre;
    if (!pre.parts.some(p => p.mode === "manual")) {
        const rep = Fight.simulate(pre.parts, pre.boss, now, rng);
        return module.exports.finalize(chatId, pre.parts, rep, now);
    }
    pre.boss.phase = "live";
    store.setGroup(chatId, { boss: pre.boss });
    return { ok: true, live: true, boss: pre.boss, parts: pre.parts };
}

// ---------- مؤقت: بدء القتال تلقائيًا عند انتهاء مهلة التسجيل ----------
async function loadActive() {
    try {
        const r = await store.query("SELECT id FROM group_settings");
        r.rows.forEach(x => { const b = get(x.id); if (liveOpen(b)) chats.add(String(x.id)); });
    } catch (e) { /* قد لا تتصل القاعدة بعد */ }
}
async function tickAll(now, announce, hasLive) {
    for (const id of [...chats]) {
        const b = get(id);
        if (!liveOpen(b)) { chats.delete(id); continue; }
        if (b.phase === "live") {
            // جلسة مباشرة ضاعت (إعادة تشغيل): نُنهي القتال تلقائيًا
            if (!(hasLive && hasLive(id))) {
                const res = start(id, now);
                if (res && res.ok && announce) await announce(id, res).catch(() => {});
            }
            continue;
        }
        if (now >= b.regEnd) {
            const res = begin(id, now);
            if (res && res.ok && announce) await announce(id, res).catch(() => {});
        }
    }
}

module.exports = {
    KINDS, REG_TIME, COOLDOWN, TEAM, MIN_AUTO, kindOf, open, ranked, defaultTeam,
    get, spawn, join, toggle, setMode, setReady, leave, prepare, finalize, start, begin, liveOpen, chats, loadActive, tickAll
};