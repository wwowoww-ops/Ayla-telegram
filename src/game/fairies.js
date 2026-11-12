// نظام الجنيات: رفقاء يمنحون بَفّات تعمل في كل اللعبة (أرباح، خبرة، فقس، صيد، تزاوج، ضرائب، متجر، البوس...).
// كل نوع يُجمع بالاستدعاء، وتتكرر النسخ لترفع "رتبته"، ويُرقّى "مستواه" بالغبار ✨، ثم يُجهَّز في خانات محدودة.
// يُركَّب على اللعبة بدون تعديل ملفاتها: install() يغلّف دوال engine وغيرها وقت التشغيل (listeners/07-fairies.js).
const D = require("./data");
const E = require("./engine");

// ---------- الإعدادات (عدّل من هنا) ----------
const MAX_RANK = 4;                         // أعلى رتبة (0..4)
const MAX_LV = 20;                          // أعلى مستوى
const COPIES = [2, 3, 4, 6];                // نسخ مكررة لازمة للانتقال من الرتبة r إلى r+1
const SUMMON_BASE = 20e9, SUMMON_GROW = 2.5, SUMMON_CAP = 10;   // سعر الاستدعاء = BASE × GROW^عدد الاستدعاءات
const DUP_DUST = 25;                        // غبار عند استدعاء نسخة زائدة بعد أعلى رتبة
const SLOT_START = 2, SLOT_PRICES = [200e9, 20e12, 2e15];       // خانات التجهيز: تبدأ بـ 2، وتوسيع حتى 5
const RANK_SCALE = 0.25, LV_SCALE = 0.04;   // معامل الرتبة والمستوى: (1+0.25×رتبة) × (1+0.04×(مستوى-1))
const CAP = 0.6;                            // سقف أي بَف نسبي

const TYPES = [
    { id: "gold",  n: "جنية الذهب",   e: "💰", w: 1,    fx: { gold: 0.08 } },
    { id: "wis",   n: "جنية الحكمة",  e: "📚", w: 1,    fx: { wis: 0.10 } },
    { id: "sat",   n: "جنية الشبع",   e: "🍯", w: 1,    fx: { sat: 0.10 } },
    { id: "hatch", n: "جنية الفقس",   e: "🥚", w: 1,    fx: { hatch: 0.06, tier: 0.005 } },
    { id: "war",   n: "جنية الحرب",   e: "⚔️", w: 1,    fx: { war: 0.05, warBoss: 0.08 } },
    { id: "luck",  n: "جنية الحظ",    e: "🍀", w: 1,    fx: { luck: 0.05 } },
    { id: "guard", n: "جنية الدرع",   e: "🛡️", w: 1,    fx: { tax: 0.08, dr: 0.06 } },
    { id: "trade", n: "جنية التجارة", e: "🛒", w: 1,    fx: { trade: 0.04 } },
    { id: "heal",  n: "جنية الشفاء",  e: "💚", w: 1,    fx: { heal: 0.10, hp: 0.04 } },
    { id: "breed", n: "جنية الأمومة", e: "🧬", w: 1,    fx: { breed: 0.06, breedCd: 0.06 } },
    { id: "time",  n: "جنية الزمن",   e: "⏳", w: 1,    fx: { time: 0.04 } },
    { id: "dawn",  n: "جنية الفجر",   e: "🌅", w: 0.25, fx: { gold: 0.03, wis: 0.03, luck: 0.03, trade: 0.015, war: 0.02, warBoss: 0.03 }, mythic: true }
];
const byId = id => TYPES.find(t => t.id === id) || null;
const RANKS = ["عادية", "نادرة", "ملحمية", "أسطورية", "خرافية"];
const RANK_E = ["⚪", "🔵", "🟣", "🟠", "🔴"];

// وصف كل بَف
const FX_TXT = {
    gold: v => `+${pc(v)} أرباح وجمع ومكافأة يومية`, wis: v => `+${pc(v)} خبرة (تدريب/لعب/طعام/صيد)`, sat: v => `${pc(v)} أقل جوعًا في الأنشطة وطعام أشبع`,
    hatch: v => `-${pc(v)} وقت الفقس`, tier: v => `${pc(v, 1)} فرصة بيضة أعلى فئة`, war: v => `وحوش الصيد أضعف ${pc(v)}`, warBoss: v => `+${pc(v)} ضرر على البوس`,
    luck: v => `+${pc(v)} غنائم صيد إضافية وغبار`, tax: v => `-${pc(v)} ضريبة الثروة`, dr: v => `-${pc(v)} ضرر البوس عليك`, trade: v => `-${pc(v)} أسعار البيض والطعام والتوسعة`,
    heal: v => `+${pc(v)} علاج في البوس`, hp: v => `+${pc(v)} حياة في البوس`, breed: v => `-${pc(v)} تكلفة التزاوج`, breedCd: v => `-${pc(v)} انتظار التزاوج`, time: v => `-${pc(v)} انتظار التدريب واللعب والصيد`
};
function pc(v, d = 0) { return (v * 100).toFixed(d).replace(/\.0+$/, "") + "%"; }

// ---------- حالة اللاعب ----------
function st(P) {
    if (!P.fairies) P.fairies = {};
    if (!P.fequip) P.fequip = [];
    if (!P.fslots) P.fslots = SLOT_START;
    if (!P.dust) P.dust = 0;
    if (!P.fsum) P.fsum = 0;
    return P;
}
const owned = P => { st(P); return Object.keys(P.fairies).map(id => ({ t: byId(id), f: P.fairies[id], id })).filter(x => x.t); };
const scale = f => (1 + RANK_SCALE * f.rank) * (1 + LV_SCALE * (f.lv - 1));

// مجموع البفات من الجنيات المجهزة
function buffs(P) {
    st(P);
    const b = {};
    P.fequip.forEach(id => {
        const t = byId(id), f = P.fairies[id];
        if (!t || !f) return;
        const s = scale(f);
        Object.entries(t.fx).forEach(([k, v]) => { b[k] = (b[k] || 0) + v * s; });
    });
    Object.keys(b).forEach(k => { b[k] = Math.min(k === "tier" ? 0.05 : CAP, b[k]); });
    return b;
}
const buffOf = (t, f) => { const s = scale(f), o = {}; Object.entries(t.fx).forEach(([k, v]) => { o[k] = Math.min(k === "tier" ? 0.05 : CAP, v * s); }); return o; };
const buffTxt = o => Object.entries(o).map(([k, v]) => FX_TXT[k](v)).join(" · ");

// ---------- الاستدعاء والترقية والتجهيز ----------
const summonCost = P => Math.floor(SUMMON_BASE * Math.pow(SUMMON_GROW, Math.min(SUMMON_CAP, st(P).fsum)));
const upDust = f => 8 * f.lv;
const slotPrice = P => SLOT_PRICES[st(P).fslots - SLOT_START] || 0;

function summon(P, rng = Math.random) {
    st(P);
    const cost = summonCost(P);
    if (P.coins < cost) return { ok: false, msg: "تحتاج " + E.fmt(cost) + " 🪙 للاستدعاء." };
    P.coins -= cost; P.fsum++;
    const tot = TYPES.reduce((s, t) => s + t.w, 0);
    let x = rng() * tot, t = TYPES[0];
    for (const c of TYPES) { x -= c.w; if (x <= 0) { t = c; break; } }
    const f = P.fairies[t.id];
    if (!f) {
        P.fairies[t.id] = { rank: 0, lv: 1, copies: 0 };
        return { ok: true, t, isNew: true, msg: `✨ استدعيت ${t.e} <b>${t.n}</b> لأول مرة!` };
    }
    if (f.rank >= MAX_RANK) { P.dust += DUP_DUST; return { ok: true, t, dup: true, msg: `${t.e} ${t.n} بأعلى رتبة: تحوّلت النسخة إلى ${DUP_DUST} ✨ غبار.` }; }
    f.copies++;
    if (f.copies >= COPIES[f.rank]) { f.copies -= COPIES[f.rank]; f.rank++; return { ok: true, t, rankUp: true, msg: `🌟 ارتقت ${t.e} <b>${t.n}</b> إلى رتبة ${RANK_E[f.rank]} ${RANKS[f.rank]}!` }; }
    return { ok: true, t, dup: true, msg: `${t.e} ${t.n}: نسخة مكررة (${f.copies}/${COPIES[f.rank]} للرتبة التالية).` };
}

function levelUp(P, id) {
    st(P);
    const f = P.fairies[id], t = byId(id);
    if (!f || !t) return { ok: false, msg: "لا تملك هذه الجنية." };
    if (f.lv >= MAX_LV) return { ok: false, msg: "وصلت أعلى مستوى." };
    const c = upDust(f);
    if (P.dust < c) return { ok: false, msg: "تحتاج " + c + " ✨ غبار (لديك " + P.dust + ")." };
    P.dust -= c; f.lv++;
    return { ok: true, msg: `⬆️ ${t.e} ${t.n} صارت مستوى ${f.lv}.` };
}

function toggle(P, id) {
    st(P);
    if (!P.fairies[id]) return { ok: false, msg: "لا تملكها." };
    const i = P.fequip.indexOf(id);
    if (i >= 0) { P.fequip.splice(i, 1); return { ok: true, msg: "أُزيلت من التجهيز." }; }
    if (P.fequip.length >= P.fslots) return { ok: false, msg: "الخانات ممتلئة (" + P.fslots + "). أزل جنية أو وسّع الخانات." };
    P.fequip.push(id);
    return { ok: true, msg: "جُهّزت." };
}

function buySlot(P) {
    st(P);
    const c = slotPrice(P);
    if (!c) return { ok: false, msg: "وصلت أقصى عدد خانات." };
    if (P.coins < c) return { ok: false, msg: "تحتاج " + E.fmt(c) + " 🪙." };
    P.coins -= c; P.fslots++;
    return { ok: true, msg: "صارت الخانات " + P.fslots + "." };
}
const addDust = (P, n) => { st(P); P.dust += Math.floor(n); };

// بفات البوس (تُستخدم في bossFight.js)
function bossMods(P) {
    const b = buffs(P);
    return { atk: b.warBoss || 0, heal: b.heal || 0, hp: b.hp || 0, dr: b.dr || 0 };
}

// ---------- التركيب على اللعبة (تغليف دوال موجودة) ----------
let installed = false;
function install() {
    if (installed) return;
    installed = true;
    const note = (res, txt) => { if (txt && res && typeof res.msg === "string") res.msg += "\n🧚 " + txt; };
    const wrap = (obj, name, make) => { const orig = obj[name]; if (typeof orig === "function") obj[name] = make(orig); };
    const shrink = (obj, key, now, t) => { if (obj && obj[key] > now && t > 0) obj[key] = now + Math.floor((obj[key] - now) * (1 - t)); };
    const bonusCoins = (P, base, pctv) => { const x = Math.floor(base * pctv); if (x > 0) P.coins = E.clampCoins(P.coins + x); return x; };

    // أرباح الجمع: بف الذهب
    wrap(E, "collect", orig => function (P, now) {
        const r = orig.call(this, P, now);
        if (r && r.ok) { const g = buffs(P).gold; if (g) { const x = bonusCoins(P, r.total, g); if (x) { r.total += x; note(r, `+${E.fmt(x)} 🪙 (ذهب)`); } } }
        return r;
    });
    // المكافأة اليومية: ذهب + غبار
    wrap(E, "daily", orig => function (P, now) {
        const r = orig.call(this, P, now);
        if (r && r.ok) {
            const b = buffs(P), x = b.gold ? bonusCoins(P, r.reward, b.gold) : 0;
            addDust(P, 2 + Math.min(5, r.streak || 0));
            note(r, `${x ? "+" + E.fmt(x) + " 🪙 · " : ""}+${2 + Math.min(5, r.streak || 0)} ✨ غبار`);
        }
        return r;
    });
    // التدريب واللعب: خبرة + شبع + وقت
    [["train", "cdTrain", 0.10, 8], ["play", "cdPlay", 0.04, 4]].forEach(([name, cd, pct, cost]) => {
        wrap(E, name, orig => function (P, petId, now) {
            const r = orig.call(this, P, petId, now);
            if (r && r.ok) {
                const b = buffs(P), pet = E.getPet(P, petId);
                if (pet) {
                    if (b.wis && pet.lv < D.C.LV_CAP) E.addXp(pet, E.xpNeed(pet.lv) * pct * b.wis);
                    if (b.sat) pet.hg = Math.min(100, pet.hg + cost * b.sat);
                    shrink(pet, cd, now, b.time || 0);
                }
                if (b.wis) note(r, `+${pc(b.wis)} خبرة`);
            }
            return r;
        });
    });
    // الطعام: شبع إضافي
    wrap(E, "feed", orig => function (P, petId, foodId, now) {
        const r = orig.call(this, P, petId, foodId, now);
        if (r && r.ok) {
            const b = buffs(P), pet = E.getPet(P, petId), f = D.FOODS[foodId];
            if (pet && f) {
                if (b.sat) pet.hg = Math.min(100, pet.hg + f.hg * b.sat);
                if (b.wis && f.xp && pet.lv < D.C.LV_CAP) {
                    const pct = f.el ? (f.el === pet.el ? 0.4 : 0.1) : f.xp;
                    E.addXp(pet, E.xpNeed(pet.lv) * pct * b.wis);
                }
            }
        }
        return r;
    });
    // الصيد: وحوش أضعف، ذهب وخبرة وغنائم وغبار
    wrap(E, "hunt", orig => function (P, zoneIdx, now, rng) {
        const b = buffs(P), z = D.ZONES[zoneIdx];
        const keep = z ? z.power : 0;
        if (z && b.war) z.power = Math.max(1, Math.round(z.power * (1 - b.war)));
        let r;
        try { r = orig.call(this, P, zoneIdx, now, rng); } finally { if (z) z.power = keep; }
        if (r && r.ok) {
            const pet = E.getPet(P, P.main), rn = rng || Math.random;
            if (pet) { if (b.sat) pet.hg = Math.min(100, pet.hg + 12 * b.sat); shrink(pet, "cdHunt", now, b.time || 0); }
            if (r.win) {
                const bits = [];
                if (b.gold && r.coins) { const x = bonusCoins(P, r.coins, b.gold); if (x) { r.coins += x; bits.push(`+${E.fmt(x)} 🪙`); } }
                if (b.wis && pet && pet.lv < D.C.LV_CAP) E.addXp(pet, E.xpNeed(pet.lv) * z.xp * b.wis);
                if (b.luck && rn() < b.luck) {
                    if (P.eggs.length < P.hatchSlots && rn() < 0.5) { P.eggs.push({ id: ++P.eggSeq, tier: z.egg, readyAt: now + D.EGGS[z.egg].min * 60000 }); bits.push(D.EGGS[z.egg].e + " " + D.EGGS[z.egg].n); (r.drops = r.drops || []).push(D.EGGS[z.egg].e + " " + D.EGGS[z.egg].n); }
                    else { P.items.feast = (P.items.feast || 0) + 1; bits.push("🍗 وليمة"); (r.drops = r.drops || []).push("🍗 وليمة"); }
                }
                if (rn() < 0.05 + (b.luck || 0) / 2) { addDust(P, 1); bits.push("+1 ✨"); }
                if (bits.length) note(r, bits.join(" · "));
            }
        }
        return r;
    });
    // الشراء: خصم التجارة
    ["buyEgg", "buyFood", "expandSlots", "expandHatch"].forEach(name => {
        wrap(E, name, orig => function (P, ...a) {
            const before = P.coins;
            const r = orig.call(this, P, ...a);
            if (r && r.ok) { const d = buffs(P).trade; if (d) { const x = bonusCoins(P, Math.max(0, before - P.coins), d); if (x) note(r, `خصم ${E.fmt(x)} 🪙`); } }
            return r;
        });
    });
    // الفقس: وقت أقصر + فرصة فئة أعلى
    wrap(E, "buyEgg", orig => function (P, tier, now) {
        const r = orig.call(this, P, tier, now);
        if (r && r.ok) {
            const h = buffs(P).hatch, egg = P.eggs[P.eggs.length - 1];
            if (h && egg) egg.readyAt = now + Math.floor((egg.readyAt - now) * (1 - h));
        }
        return r;
    });
    wrap(E, "hatch", orig => function (P, eggId, now, rng) {
        const egg = P.eggs.find(e => e.id === Number(eggId)), t = buffs(P).tier;
        let up = false;
        if (egg && !egg.pre && t && egg.tier < 6 && (rng || Math.random)() < t) { egg.tier++; up = true; }
        const r = orig.call(this, P, eggId, now, rng);
        if (up && r && r.ok) note(r, "ارتفعت فئة البيضة!");
        return r;
    });
    // التزاوج: تكلفة وانتظار أقل
    wrap(E, "breed", orig => function (P, aId, bId, now, rng) {
        const before = P.coins;
        const r = orig.call(this, P, aId, bId, now, rng);
        if (r && r.ok) {
            const b = buffs(P);
            if (b.breed) { const x = bonusCoins(P, Math.max(0, before - P.coins), b.breed); if (x) note(r, `خصم ${E.fmt(x)} 🪙`); }
            [aId, bId].forEach(id => shrink(E.getPet(P, id), "cdBreed", now, b.breedCd || 0));
        }
        return r;
    });
    // ضريبة الثروة: حماية
    try {
        const W = require("./wealth");
        wrap(W, "apply", orig => function (P, now) {
            const paid = orig.call(this, P, now);
            const g = paid > 0 ? buffs(P).tax : 0;
            if (g) { const back = Math.floor(paid * g); P.coins += back; if (P.stats) P.stats.taxPaid = Math.max(0, (P.stats.taxPaid || 0) - back); return paid - back; }
            return paid;
        });
    } catch (e) { /* ملف الضريبة غير موجود */ }
    // البوس: غبار للمشاركين (من الزر ومن المؤقت)
    try {
        const B = require("./boss");
        const grant = res => {
            if (!(res && res.ok && res.results)) return;
            res.results.forEach((r, i) => {
                const P = require("../core/store").get(r.id);
                if (!P) return;
                const n = res.killed ? (i < 3 ? 20 : 10) : 3;
                addDust(P, n);
                if (r.got) r.got.push("+" + n + " ✨");
            });
        };
        wrap(B, "start", orig => function (chatId, now, rng) { const res = orig.call(this, chatId, now, rng); grant(res); return res; });
        wrap(B, "tickAll", orig => function (now, announce) { return orig.call(this, now, (id, res) => { grant(res); return announce ? announce(id, res) : null; }); });
    } catch (e) { /* البوس غير موجود */ }
    // إنجازات الجنيات
    try {
        const Q = require("./quests");
        const cats = [
            { id: "fcol", name: "جامع الجنيات", unit: "نوعًا من الجنيات", tiers: [2, 5, 9, 12], value: P => owned(P).length },
            { id: "frank", name: "سيّد الجنيات", unit: "مجموع الرتب والمستويات", tiers: [10, 30, 70, 150], value: P => owned(P).reduce((s, x) => s + x.f.rank * 5 + x.f.lv, 0) }
        ];
        cats.forEach(c => { if (!Q.CATEGORIES.some(x => x.id === c.id)) Q.CATEGORIES.push(c); });
    } catch (e) { /* الإنجازات غير موجودة */ }
}

module.exports = {
    TYPES, RANKS, RANK_E, MAX_RANK, MAX_LV, COPIES, byId, st, owned, scale, buffs, buffOf, buffTxt, FX_TXT,
    summonCost, upDust, slotPrice, summon, levelUp, toggle, buySlot, addDust, bossMods, install
};