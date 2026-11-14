// نظام الجنيات (v2): كائنات تُصطاد أو تُشترى، لكل نوع منها بَف خاص، ويزداد مستواها مع الوقت فقط.
// - الأنواع: 24 نوعًا في 5 ندرات، لكل نوع عائلة بَف (ذهب، خبرة، شبع، فقس، حرب، حظ، درع، تجارة، شفاء، أمومة، زمن، فجر).
// - الحصول: صيد (فرصة صغيرة جدًا عند الفوز) أو شراء من "متجر الجنيات" (3 عروض تتجدد يوميًا وأسعارها ضخمة) أو جائزة البوس.
// - المستوى: يزيد بمرور الوقت منذ الحصول عليها (لا يتأثر بالأكل ولا التدريب). الأندر تنمو أبطأ.
// - التجهيز: خانات قليلة (تبدأ بواحدة) تُوسَّع بالعملات. تعمل البفات وهي مجهزة فقط.
// يُركَّب على اللعبة بدون تعديل ملفاتها: install() يغلّف دوال engine وغيرها وقت التشغيل (listeners/07-fairies.js).
const D = require("../data");
const E = require("../engine");

// ---------- الإعدادات (عدّل من هنا) ----------
const MAX_LV = 20;
const HOURS_PER_LV = [12, 18, 24, 36, 48];        // ساعات كل مستوى بحسب الندرة (كلما ندر نما أبطأ)
const RM = [1, 1.7, 2.6, 3.8, 5.5];               // مضاعف الندرة
const LV_SCALE = 0.06;                            // كل مستوى +6% من البف
const CAP = 0.6;                                  // سقف أي بَف نسبي
const OWN_CAP = 20;                               // أقصى عدد جنيات تملكها
const SLOT_START = 1, SLOT_PRICES = [50e9, 5e12, 500e12, 50e15];   // خانات التجهيز: 1 → 5
const SHOP_BASE = [5e9, 80e9, 1.5e12, 40e12, 1e15];               // سعر الشراء بحسب الندرة
const SHOP_GROW = 1.6, SHOP_GROW_CAP = 8;                         // ×1.6 لكل جنية تملكها (حتى 8)
const SHOP_W = [60, 28, 9, 2.5, 0.5];                             // أوزان الندرة في المتجر
const CATCH_BASE = 0.012, CATCH_ZONE = 0.0012;                    // فرصة اصطياد جنية عند الفوز في الصيد (+ لكل منطقة)
const CATCH_W = [[80, 18, 2, 0, 0], [40, 40, 16, 4, 0], [10, 30, 35, 20, 5], [0, 10, 35, 35, 20]];  // أوزان الندرة بحسب المنطقة
const BOSS_FAIRY_CHANCE = 0.25;                                   // فرصة جنية ملحمية+ لصاحب أعلى ضرر عند هزيمة البوس
const RARITIES = ["شائعة", "نادرة", "ملحمية", "أسطورية", "خرافية"];
const RANK_E = ["⚪", "🔵", "🟣", "🟠", "🔴"];

// عائلات البَف (قيمة المستوى 1 للندرة الشائعة)
const FAM = {
    gold:  { n: "ذهب",   fx: { gold: 0.03 } },
    wis:   { n: "حكمة",  fx: { wis: 0.04 } },
    sat:   { n: "شبع",   fx: { sat: 0.04 } },
    hatch: { n: "فقس",   fx: { hatch: 0.03, tier: 0.002 } },
    war:   { n: "حرب",   fx: { war: 0.02, warBoss: 0.03 } },
    luck:  { n: "حظ",    fx: { luck: 0.03 } },
    guard: { n: "درع",   fx: { tax: 0.03, dr: 0.02 } },
    trade: { n: "تجارة", fx: { trade: 0.02 } },
    heal:  { n: "شفاء",  fx: { heal: 0.04, hp: 0.02 } },
    breed: { n: "أمومة", fx: { breed: 0.03, breedCd: 0.03 } },
    time:  { n: "زمن",   fx: { time: 0.02 } },
    dawn:  { n: "فجر",   fx: { gold: 0.012, wis: 0.012, luck: 0.012, trade: 0.008, war: 0.008, warBoss: 0.012, time: 0.008 } }
};
// الأنواع: [المعرّف، الاسم، الرمز، الندرة، العائلة]
const RAW = [
    [1, "فراشة الذهب", "🦋", 0, "gold"], [2, "جنية الزهرة", "🌼", 0, "wis"], [3, "جنية الندى", "💧", 0, "sat"],
    [4, "جنية البيضة", "🥚", 0, "hatch"], [5, "جنية الورقة", "🍃", 0, "luck"], [6, "جنية الجرس", "🔔", 0, "time"],
    [7, "جنية العملة", "🪙", 1, "trade"], [8, "جنية الشرارة", "✨", 1, "war"], [9, "جنية الحجر", "🪨", 1, "guard"],
    [10, "جنية الدفء", "🕯️", 1, "heal"], [11, "جنية العش", "🪺", 1, "breed"], [12, "جنية القمر", "🌙", 1, "gold"],
    [13, "جنية الريح", "🌬️", 2, "time"], [14, "جنية الكتب", "📖", 2, "wis"], [15, "جنية الصدفة", "🐚", 2, "luck"],
    [16, "جنية الضباب", "🌫️", 2, "guard"], [17, "جنية اللهب", "🔥", 2, "war"],
    [18, "جنية الفجر", "🌅", 3, "dawn"], [19, "جنية الغابة", "🌳", 3, "heal"], [20, "جنية الكنز", "💎", 3, "gold"], [21, "جنية الساعة", "⌛", 3, "time"],
    [22, "جنية النجوم", "🌟", 4, "dawn"], [23, "جنية الأبدية", "♾️", 4, "trade"], [24, "جنية العرش", "👑", 4, "gold"]
];
const SPECIES = {};
RAW.forEach(([id, n, e, r, fam]) => { SPECIES[id] = { id, n, e, r, fam }; });
const BY_RARITY = RARITIES.map((_, r) => RAW.filter(x => x[3] === r).map(x => x[0]));

// وصف كل بَف
const FX_TXT = {
    gold: v => `+${pc(v)} أرباح وجمع ومكافأة يومية وغنائم`, wis: v => `+${pc(v)} خبرة (تدريب/لعب/طعام/صيد)`, sat: v => `${pc(v)} أقل جوعًا في الأنشطة وطعام أشبع`,
    hatch: v => `-${pc(v)} وقت الفقس`, tier: v => `${pc(v, 1)} فرصة بيضة أعلى فئة`, war: v => `وحوش الصيد أضعف ${pc(v)}`, warBoss: v => `+${pc(v)} ضرر على البوس`,
    luck: v => `+${pc(v)} غنائم صيد وفرصة جنيات`, tax: v => `-${pc(v)} ضريبة الثروة`, dr: v => `-${pc(v)} ضرر البوس عليك`, trade: v => `-${pc(v)} أسعار البيض والطعام والتوسعة`,
    heal: v => `+${pc(v)} علاج في البوس`, hp: v => `+${pc(v)} حياة في البوس`, breed: v => `-${pc(v)} تكلفة التزاوج`, breedCd: v => `-${pc(v)} انتظار التزاوج`, time: v => `-${pc(v)} انتظار التدريب واللعب والصيد`
};
function pc(v, d = 0) { return (v * 100).toFixed(d).replace(/\.0+$/, "") + "%"; }

// ---------- حالة اللاعب ----------
function st(P) {
    if (!Array.isArray(P.fairies)) P.fairies = [];     // (نسخة قديمة كانت كائنًا: تُهمل)
    if (!Array.isArray(P.fequip)) P.fequip = [];
    if (!P.fslots) P.fslots = SLOT_START;
    if (!P.fseq) P.fseq = P.fairies.reduce((m, f) => Math.max(m, f.id || 0), 0);
    if (P.stats) { P.stats.fcatch = P.stats.fcatch || 0; P.stats.fbuy = P.stats.fbuy || 0; }
    return P;
}
const get = (P, id) => st(P).fairies.find(f => f.id === Number(id)) || null;
const sp = f => SPECIES[f.sp];
const lvOf = (f, now = Date.now()) => Math.min(MAX_LV, 1 + Math.floor(Math.max(0, now - f.at) / (HOURS_PER_LV[sp(f).r] * 3600e3)));
const nextLvMs = (f, now = Date.now()) => {
    if (lvOf(f, now) >= MAX_LV) return 0;
    const per = HOURS_PER_LV[sp(f).r] * 3600e3;
    return per - ((now - f.at) % per);
};
const scale = (f, now) => RM[sp(f).r] * (1 + LV_SCALE * (lvOf(f, now) - 1));

function buffOf(f, now) {
    const s = scale(f, now), o = {};
    Object.entries(FAM[sp(f).fam].fx).forEach(([k, v]) => { o[k] = Math.min(k === "tier" ? 0.05 : CAP, v * s); });
    return o;
}
// مجموع بفات الجنيات المجهزة
function buffs(P, now = Date.now()) {
    st(P);
    const b = {};
    P.fequip.forEach(id => {
        const f = get(P, id);
        if (!f) return;
        Object.entries(buffOf(f, now)).forEach(([k, v]) => { b[k] = (b[k] || 0) + v; });
    });
    Object.keys(b).forEach(k => { b[k] = Math.min(k === "tier" ? 0.05 : CAP, b[k]); });
    return b;
}
const buffTxt = o => Object.entries(o).map(([k, v]) => FX_TXT[k](v)).join(" · ");
const famTxt = (fam, r, lv) => buffTxt(Object.fromEntries(Object.entries(FAM[fam].fx).map(([k, v]) => [k, Math.min(k === "tier" ? 0.05 : CAP, v * RM[r] * (1 + LV_SCALE * (lv - 1)))])));

// ---------- الإضافة والتجهيز والشراء ----------
function addFairy(P, spId, now = Date.now()) {
    st(P);
    if (P.fairies.length >= OWN_CAP) return null;
    const f = { id: ++P.fseq, sp: spId, at: now };
    P.fairies.push(f);
    return f;
}
const pickRarity = (w, rng) => { let x = rng() * w.reduce((a, b) => a + b, 0); for (let i = 0; i < w.length; i++) { x -= w[i]; if (x <= 0) return i; } return 0; };
const pickSpecies = (r, rng) => { const l = BY_RARITY[r]; return l[Math.floor(rng() * l.length) % l.length]; };
const label = f => `${sp(f).e} ${sp(f).n} ${RANK_E[sp(f).r]}`;

function toggle(P, id) {
    const f = get(P, id);
    if (!f) return { ok: false, msg: "لا تملكها." };
    const i = P.fequip.indexOf(f.id);
    if (i >= 0) { P.fequip.splice(i, 1); return { ok: true, msg: "أُزيلت من التجهيز." }; }
    if (P.fequip.length >= P.fslots) return { ok: false, msg: "الخانات ممتلئة (" + P.fslots + "). أزل جنية أو وسّع الخانات." };
    P.fequip.push(f.id);
    return { ok: true, msg: "جُهّزت." };
}
const slotPrice = P => SLOT_PRICES[st(P).fslots - SLOT_START] || 0;
function buySlot(P) {
    st(P);
    const c = slotPrice(P);
    if (!c) return { ok: false, msg: "وصلت أقصى عدد خانات." };
    if (P.coins < c) return { ok: false, msg: "تحتاج " + E.fmt(c) + " 🪙." };
    P.coins -= c; P.fslots++;
    return { ok: true, msg: "صارت الخانات " + P.fslots + "." };
}
function release(P, id) {
    const f = get(P, id);
    if (!f) return { ok: false, msg: "غير موجودة." };
    P.fairies.splice(P.fairies.indexOf(f), 1);
    P.fequip = P.fequip.filter(x => x !== f.id);
    return { ok: true, msg: `🕊️ أطلقت ${label(f)}.` };
}

// المتجر: 3 عروض تتجدد يوميًا (ثابتة لنفس اللاعب في نفس اليوم)
function hashSeed(str) { let h = 2166136261; for (const c of str) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
function seeded(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const shopPrice = (P, r) => Math.floor(SHOP_BASE[r] * Math.pow(SHOP_GROW, Math.min(SHOP_GROW_CAP, st(P).fairies.length)));
function shop(P, now = Date.now()) {
    st(P);
    const day = Math.floor(now / 86400000);
    if (!P.fshop || P.fshop.day !== day) {
        const rng = seeded(hashSeed(P.id + ":" + day));
        const offers = [];
        for (let i = 0; i < 3; i++) offers.push({ sp: pickSpecies(pickRarity(SHOP_W, rng), rng), sold: false });
        P.fshop = { day, offers };
    }
    return P.fshop.offers.map(o => Object.assign({ price: shopPrice(P, SPECIES[o.sp].r) }, o));
}
function buy(P, idx, now = Date.now()) {
    const offers = shop(P, now), o = P.fshop.offers[Number(idx)];
    if (!o) return { ok: false, msg: "عرض غير موجود." };
    if (o.sold) return { ok: false, msg: "بيعت بالفعل." };
    if (P.fairies.length >= OWN_CAP) return { ok: false, msg: "حديقتك ممتلئة (" + OWN_CAP + "). أطلق جنية." };
    const price = offers[Number(idx)].price;
    if (P.coins < price) return { ok: false, msg: "تحتاج " + E.fmt(price) + " 🪙." };
    P.coins -= price; o.sold = true;
    const f = addFairy(P, o.sp, now);
    if (P.stats) P.stats.fbuy = (P.stats.fbuy || 0) + 1;
    return { ok: true, f, msg: `🛒 اشتريت ${label(f)}! ستنمو مع الوقت.` };
}

// اصطياد في الصيد
function tryCatch(P, zoneIdx, luck, now, rng = Math.random) {
    st(P);
    if (rng() >= (CATCH_BASE + CATCH_ZONE * zoneIdx) * (1 + (luck || 0))) return null;
    if (P.fairies.length >= OWN_CAP) return { full: true };
    const tier = zoneIdx <= 3 ? 0 : zoneIdx <= 7 ? 1 : zoneIdx <= 11 ? 2 : 3;
    const f = addFairy(P, pickSpecies(pickRarity(CATCH_W[tier], rng), rng), now);
    if (f && P.stats) P.stats.fcatch = (P.stats.fcatch || 0) + 1;
    return { f };
}

// ترتيب الجنيات (للوحة المتصدرين): مجموع (ندرة × مستوى)
const score = (P, now = Date.now()) => st(P).fairies.reduce((s, f) => s + Math.round(10 * RM[sp(f).r] * lvOf(f, now)), 0);
function topRows(players, now = Date.now(), n = 10) {
    return players.filter(p => Array.isArray(p.fairies) && p.fairies.length)
        .map(p => {
            const best = [...p.fairies].sort((a, b) => RM[sp(b).r] * lvOf(b, now) - RM[sp(a).r] * lvOf(a, now))[0];
            return { name: p.name, pet: { emoji: sp(best).e, name: sp(best).n }, val: score(p, now) };
        })
        .sort((a, b) => b.val - a.val).slice(0, n).map(r => Object.assign({}, r, { val: E.fmt(r.val) + " 🧚" }));
}

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
    // المكافأة اليومية: ذهب
    wrap(E, "daily", orig => function (P, now) {
        const r = orig.call(this, P, now);
        if (r && r.ok) { const g = buffs(P, now).gold, x = g ? bonusCoins(P, r.reward, g) : 0; if (x) { r.reward += x; note(r, `+${E.fmt(x)} 🪙`); } }
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
    // الصيد: وحوش أضعف، ذهب وخبرة وغنائم، واصطياد جنيات
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
                    if (rn() < 0.5) { E.addEggToBag(P, z.egg); bits.push(D.EGGS[z.egg].e + " " + D.EGGS[z.egg].n); (r.drops = r.drops || []).push(D.EGGS[z.egg].e + " " + D.EGGS[z.egg].n + " (في المحفظة)"); }
                    else { const k = 2 + Math.floor(zoneIdx / 2); require("../resources").add(P, "crystal", k); bits.push("🔷 ×" + k); }
                }
                const c = tryCatch(P, zoneIdx, b.luck, now, rn);
                if (c && c.f) { bits.push(`🎉 اصطدت جنية: ${label(c.f)}`); r.fairy = c.f; }
                else if (c && c.full) bits.push("ظهرت جنية لكن حديقتك ممتلئة!");
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
        const W = require("../wealth");
        wrap(W, "apply", orig => function (P, now) {
            const paid = orig.call(this, P, now);
            const g = paid > 0 ? buffs(P).tax : 0;
            if (g) { const back = Math.floor(paid * g); P.coins += back; if (P.stats) P.stats.taxPaid = Math.max(0, (P.stats.taxPaid || 0) - back); return paid - back; }
            return paid;
        });
    } catch (e) { /* ملف الضريبة غير موجود */ }
    // البوس: فرصة جنية ملحمية أو أعلى لصاحب أعلى ضرر عند الفوز (من الزر ومن المؤقت)
    try {
        const B = require("../boss");
        const grant = res => {
            if (!(res && res.ok && res.killed && res.results && res.results[0])) return;
            const r = res.results[0], P = require("../../core/store").get(r.id);
            if (!P || Math.random() >= BOSS_FAIRY_CHANCE) return;
            const f = addFairy(P, pickSpecies(pickRarity([0, 0, 60, 30, 10], Math.random), Math.random));
            if (f && r.got) r.got.push("🧚 " + label(f));
            if (f && P.stats) P.stats.fcatch = (P.stats.fcatch || 0) + 1;
        };
        wrap(B, "start", orig => function (chatId, now, rng) { const res = orig.call(this, chatId, now, rng); grant(res); return res; });
        wrap(B, "tickAll", orig => function (now, announce) { return orig.call(this, now, (id, res) => { grant(res); return announce ? announce(id, res) : null; }); });
    } catch (e) { /* البوس غير موجود */ }
    // إنجازات الجنيات
    try {
        const Q = require("../quests");
        const maxLv = P => st(P).fairies.reduce((m, f) => Math.max(m, lvOf(f)), 0);
        const maxR = P => st(P).fairies.reduce((m, f) => Math.max(m, sp(f).r + 1), 0);
        const cats = [
            { id: "fcol",   name: "جامع الجنيات",   unit: "نوعًا من الجنيات",    tiers: [3, 8, 16, 24],  value: P => new Set(st(P).fairies.map(f => f.sp)).size },
            { id: "fcatch", name: "صائد الجنيات",   unit: "جنية مصطادة",        tiers: [1, 5, 15, 40],  value: P => (P.stats && P.stats.fcatch) || 0 },
            { id: "fbuy",   name: "تاجر الجنيات",   unit: "جنية مشتراة",         tiers: [1, 5, 20, 60],  value: P => (P.stats && P.stats.fbuy) || 0 },
            { id: "frar",   name: "نادر الجنيات",   unit: "أعلى ندرة (1-5)",     tiers: [2, 3, 4, 5],    value: maxR },
            { id: "flv",    name: "الجنية المعمّرة", unit: "أعلى مستوى لجنية",    tiers: [5, 10, 15, 20], value: maxLv }
        ];
        cats.forEach(c => { if (!Q.CATEGORIES.some(x => x.id === c.id)) Q.CATEGORIES.push(c); });
    } catch (e) { /* الإنجازات غير موجودة */ }
}

module.exports = {
    SPECIES, FAM, RARITIES, RANK_E, RM, MAX_LV, OWN_CAP, HOURS_PER_LV, SLOT_PRICES, st, get, sp, label, lvOf, nextLvMs, scale,
    buffOf, buffs, buffTxt, famTxt, addFairy, toggle, buySlot, slotPrice, release, shop, buy, tryCatch, score, topRows, bossMods, install
};