// وظائف الحيوانات: كل حيوان (غير الأساسي) يُعيَّن في وظيفة فيعطي اللاعب بفًا ثابتًا طالما هو فيها.
// الوظائف: 🪺 حضانة (دجاجة وأمثالها)، 🛡️ حرس الزعيم (مقعدان)، 🏹 مرافق صيد، 🧪 مختبر تزاوج، 🍖 راعٍ، 🏺 حارس الخزينة، 🏋️ مدرّب.
// الحيوان الموظَّف لا يقاتل في الزعيم ولا يُدوَّر جماعيًا. البفات تُدمج في fairies.buffs فتعمل كل الخطّافات الموجودة (ذهب، خبرة، صيد، تزاوج، زعيم…)،
// وثلاثة بفات خاصة تُقرأ مباشرة: warmMax وwarmCd (الحضانة) وmut (فرصة الطفرة العنصرية في التزاوج).
// بيانات اللاعب في حقل منفصل P.posts = { <post>: [petId, …] } ولا يلمس أي حقل آخر.
const D = require("./data");
const E = require("./engine");

// ---------- الإعدادات (عدّل من هنا) ----------
const RMP = [1, 1.3, 1.7, 2.2, 2.8, 3.5, 4.4, 5.5, 7];   // مضاعف الندرة
const LV_STEP = 0.02;                                     // كل مستوى +2%
const ST_STEP = 0.10;                                     // كل نجمة +10%
const FIT = 1.5;                                          // نوع مناسب للوظيفة
const HEN = 2.5;                                          // الدجاجة في الحضانة

const POSTS = {
    hatch: { n: "الحضانة",        e: "🪺", slots: 1, tag: "brood",    d: "حاضن يزيد قوة العسل ويقصّر انتظار التدفئة، والأنواع الحاضنة تزيد عدد التدفئات" },
    boss:  { n: "حرس الزعيم",     e: "🛡️", slots: 2, tag: null,       d: "مساندون لا يقاتلون: يرفعون ضرر الفريق أو علاجه أو حياته أو دفاعه حسب عنصرهم" },
    hunt:  { n: "مرافق الصيد",    e: "🏹", slots: 1, tag: "hunter",   d: "يزيد ذهب الصيد وخبرته ويُضعف الوحوش وتزيد الغنائم" },
    lab:   { n: "مختبر التزاوج",  e: "🧪", slots: 1, tag: "breeder",  d: "يخفض تكلفة التزاوج وانتظاره ويرفع فرصة الطفرة العنصرية" },
    farm:  { n: "الراعي",         e: "🍖", slots: 1, tag: "feeder",   d: "يطيل الشبع ويزيد خبرة الطعام" },
    vault: { n: "حارس الخزينة",   e: "🏺", slots: 1, tag: "treasure", d: "يزيد أرباح جمع الأرباح والمكافأة اليومية" },
    gym:   { n: "المدرّب",        e: "🏋️", slots: 1, tag: "trainer",  d: "يزيد خبرة التدريب ويقلّل انتظار التدريب واللعب والصيد" }
};
const POST_IDS = Object.keys(POSTS);

// أنواع الحيوانات المناسبة لكل وسم (رقم النوع)
const TAGS = {
    brood:    [58, 42, 13, 11, 15, 22, 23, 33, 12, 26, 48, 51, 39, 52, 57, 35, 54],
    striker:  [16, 18, 19, 25, 27, 22, 33, 35, 48, 54, 34, 47, 50, 15, 9, 2, 57],
    tank:     [20, 24, 31, 32, 40, 45, 46, 49, 12, 28, 38, 17, 56, 26, 7],
    healer:   [10, 14, 21, 36, 55, 6, 43, 29, 52, 58],
    hunter:   [2, 16, 18, 19, 25, 9, 22, 33, 23, 44, 15, 1, 37, 47, 27, 50],
    breeder:  [3, 4, 1, 5, 8, 41, 43, 30, 23, 6, 58],
    feeder:   [14, 10, 45, 43, 5, 3, 29, 32, 46, 7, 58, 4],
    treasure: [15, 5, 35, 54, 38, 11, 4, 52, 44, 57, 53],
    trainer:  [30, 24, 17, 20, 13, 11, 23, 9, 56, 19]
};
const TAGSET = {};
Object.entries(TAGS).forEach(([t, ids]) => ids.forEach(id => { (TAGSET[id] = TAGSET[id] || new Set()).add(t); }));
const hasTag = (spId, tag) => !!(TAGSET[spId] && TAGSET[spId].has(tag));

// بفات الحرس بحسب العنصر (لكل وحدة قوة) والوسم الذي يضاعفها
const BOSS_FX = {
    fire: { warBoss: 0.014 }, thunder: { warBoss: 0.014 }, poison: { warBoss: 0.012 }, dark: { warBoss: 0.012 },
    wind: { warBoss: 0.010, dr: 0.006 }, light: { heal: 0.015, warBoss: 0.006 }, water: { heal: 0.020 },
    plant: { heal: 0.012, hp: 0.012 }, earth: { hp: 0.020, dr: 0.008 }, metal: { dr: 0.014, hp: 0.010 }, ice: { dr: 0.016 }
};
const BOSS_KEY_TAG = { warBoss: "striker", heal: "healer", hp: "tank", dr: "tank" };

// بفات الوظائف الأخرى لكل وحدة قوة
const FX = {
    hatch: { warm: 0.05, warmCd: 0.06 },
    hunt:  { huntG: 0.012, huntXp: 0.012, war: 0.006, luck: 0.002 },
    lab:   { breedCd: 0.012, breed: 0.010, mut: 0.004 },
    farm:  { sat: 0.012, feedXp: 0.012 },
    vault: { collectG: 0.006, dailyG: 0.006 },
    gym:   { trainXp: 0.012, wis: 0.006, time: 0.006 }
};
// سقف مجموع كل بَف من الوظائف
const CAPS = {
    warBoss: 0.25, heal: 0.25, hp: 0.25, dr: 0.20, huntG: 0.20, huntXp: 0.20, war: 0.12, luck: 0.06,
    breedCd: 0.20, breed: 0.20, mut: 0.10, sat: 0.20, feedXp: 0.20, collectG: 0.15, dailyG: 0.15,
    trainXp: 0.20, wis: 0.10, time: 0.12, warm: 0.50, warmCd: 0.50, warmMax: 2
};
const EXTRA = ["warmMax", "warmCd", "mut"];   // تُقرأ مباشرة ولا تُدمج في بفات الجنيات

const pc = (v, d = 0) => (v * 100).toFixed(d).replace(/\.0+$/, "") + "%";
const TXT = {
    warBoss: v => `+${pc(v, 1)} ضرر الفريق في الزعيم`, heal: v => `+${pc(v, 1)} علاج في الزعيم`, hp: v => `+${pc(v, 1)} حياة في الزعيم`, dr: v => `-${pc(v, 1)} ضرر الزعيم`,
    huntG: v => `+${pc(v, 1)} ذهب الصيد`, huntXp: v => `+${pc(v, 1)} خبرة الصيد`, war: v => `وحوش أضعف ${pc(v, 1)}`, luck: v => `+${pc(v, 1)} غنائم وحظ`,
    breedCd: v => `-${pc(v, 1)} انتظار التزاوج`, breed: v => `-${pc(v, 1)} تكلفة التزاوج`, mut: v => `+${pc(v, 1)} فرصة الطفرة العنصرية`,
    sat: v => `${pc(v, 1)} أقل جوعًا وطعام أشبع`, feedXp: v => `+${pc(v, 1)} خبرة الطعام`, collectG: v => `+${pc(v, 1)} أرباح الجمع`, dailyG: v => `+${pc(v, 1)} المكافأة اليومية`,
    trainXp: v => `+${pc(v, 1)} خبرة التدريب`, wis: v => `+${pc(v, 1)} خبرة عامة`, time: v => `-${pc(v, 1)} انتظار التدريب واللعب والصيد`,
    warm: v => `+${pc(v, 1)} قوة العسل`, warmCd: v => `-${pc(v, 1)} انتظار التدفئة`, warmMax: v => `+${v} تدفئة لكل بيضة`
};
const fxText = o => Object.entries(o).filter(([, v]) => v > 0).map(([k, v]) => TXT[k](v)).join(" · ");

// ---------- الحالة ----------
function st(P) {
    if (!P.posts || typeof P.posts !== "object" || Array.isArray(P.posts)) P.posts = {};
    const seen = new Set();
    POST_IDS.forEach(id => {
        const a = Array.isArray(P.posts[id]) ? P.posts[id] : [];
        P.posts[id] = a.filter(pid => {
            const ok = !seen.has(pid) && pid !== P.main && P.pets.some(p => p.id === pid);
            if (ok) seen.add(pid);
            return ok;
        }).slice(0, POSTS[id].slots);
    });
    return P.posts;
}
const postOf = (P, petId) => POST_IDS.find(id => st(P)[id].includes(Number(petId))) || null;
const isPosted = (P, petId) => !!postOf(P, petId);
const peek = P => (P.posts ? st(P) : null);

// ---------- الحساب ----------
const scale = pet => RMP[Math.min(RMP.length - 1, E.spOf(pet).r)] * (1 + LV_STEP * (Math.min(pet.lv, D.C.LV_CAP) - 1)) * (1 + ST_STEP * (pet.st || 0));
function aptitude(pet, postId) {
    const tag = POSTS[postId].tag;
    if (postId === "hatch" && pet.sp === 58) return HEN;
    return tag && hasTag(pet.sp, tag) ? FIT : 1;
}
// بفات حيوان واحد في وظيفة (قبل السقف)
function petFx(pet, postId) {
    const o = {}, s = scale(pet);
    if (postId === "boss") {
        Object.entries(BOSS_FX[pet.el] || {}).forEach(([k, v]) => { o[k] = v * s * (hasTag(pet.sp, BOSS_KEY_TAG[k]) ? FIT : 1); });
        if (pet.elb) Object.entries(BOSS_FX[pet.elb] || {}).forEach(([k, v]) => { o[k] = (o[k] || 0) + v * s * 0.5 * (hasTag(pet.sp, BOSS_KEY_TAG[k]) ? FIT : 1); });
        return o;
    }
    const a = aptitude(pet, postId), u = s * a;
    Object.entries(FX[postId] || {}).forEach(([k, v]) => { o[k] = v * u; });
    if (postId === "hatch") o.warmMax = (a > 1 ? 1 : 0) + (u >= 12 ? 1 : 0);
    return o;
}
// مجموع كل الوظائف بعد السقوف
function total(P) {
    const p = peek(P), sum = {};
    if (!p) return sum;
    POST_IDS.forEach(id => p[id].forEach(pid => {
        const pet = E.getPet(P, pid);
        if (pet) Object.entries(petFx(pet, id)).forEach(([k, v]) => { sum[k] = (sum[k] || 0) + v; });
    }));
    Object.keys(sum).forEach(k => { sum[k] = Math.min(CAPS[k] || 0.2, sum[k]); if (!(sum[k] > 0)) delete sum[k]; });
    return sum;
}
const buffs = P => { const t = total(P), o = {}; Object.keys(t).forEach(k => { if (!EXTRA.includes(k)) o[k] = t[k]; }); return o; };
const extra = P => { const t = total(P); return { warmMax: Math.floor(t.warmMax || 0), warmCd: t.warmCd || 0, mut: t.mut || 0 }; };
const fitList = pet => POST_IDS.filter(id => aptitude(pet, id) > 1 || (id === "boss" && Object.keys(BOSS_FX[pet.el] || {}).some(k => hasTag(pet.sp, BOSS_KEY_TAG[k]))));

// ---------- التعيين ----------
const fail = msg => ({ ok: false, msg });
function assign(P, postId, petId) {
    const def = POSTS[postId], pet = E.getPet(P, petId);
    if (!def) return fail("وظيفة غير معروفة.");
    if (!pet) return fail("الحيوان غير موجود.");
    if (pet.id === P.main) return fail("لا يمكن تعيين حيوانك الأساسي في وظيفة.");
    const s = st(P), cur = postOf(P, pet.id);
    if (cur === postId) return fail("هو في هذه الوظيفة بالفعل.");
    if (s[postId].length >= def.slots) return fail("وظيفة " + def.n + " ممتلئة (" + def.slots + "). أزل حيوانًا منها أولًا.");
    if (cur) s[cur] = s[cur].filter(id => id !== pet.id);
    s[postId].push(pet.id);
    const fx = petFx(pet, postId), a = aptitude(pet, postId);
    return ok2(def.e + " عُيِّن " + E.spOf(pet).e + " " + (pet.nick || E.spOf(pet).n) + " في " + def.n + (a > 1 ? " (مناسب جدًا ×" + a + ")" : "") + (Object.keys(fx).length ? "\n↳ " + fxText(fx) : ""));
}
const ok2 = msg => ({ ok: true, msg });
function unassign(P, petId) {
    const cur = postOf(P, petId);
    if (!cur) return fail("ليس في وظيفة.");
    const s = st(P);
    s[cur] = s[cur].filter(id => id !== Number(petId));
    return ok2("أُعيد إلى الراحة.");
}
// مرشّحون لوظيفة: الأنسب أولًا ثم الأقوى أثرًا
function candidates(P, postId) {
    const s = st(P), here = s[postId] || [];
    return P.pets.filter(p => p.id !== P.main && !here.includes(p.id))
        .map(p => ({ p, a: postId === "boss" ? (fitList(p).includes("boss") ? FIT : 1) : aptitude(p, postId), sc: scale(p) }))
        .sort((x, y) => y.a * y.sc - x.a * x.sc).map(x => x.p);
}

module.exports = { POSTS, POST_IDS, TAGS, CAPS, st, postOf, isPosted, aptitude, petFx, total, buffs, extra, fitList, assign, unassign, candidates, fxText, scale, hasTag };
