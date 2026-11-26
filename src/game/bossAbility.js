"use strict";
// قدرة الزعيم المروَّض: لكل زعيم قدرة سلبية تعمل ما دام معك، وتقوى 50% مع كل رتبة.
const D = require("./data");
// kind: atk/heal/hp/dr = قتال الزعماء · luck = حظ الصيد · income = دخل الحيوانات · energy = تجدد طاقة البرج · dust = غبار المداعبة · egg = فرصة بيضة إضافية يوميًا
const ABIL = {
    fire:    { n: "غضب اللهب", kind: "atk", v: 0.10, d: "ضرر حيواناتك في قتال الزعماء" },
    water:   { n: "سيّد الأعماق", kind: "luck", v: 0.10, d: "حظ الصيد (أسماك أندر)" },
    plant:   { n: "بركة الغابة", kind: "heal", v: 0.15, d: "قوة العلاج في قتال الزعماء" },
    earth:   { n: "جلد الصخر", kind: "dr", v: 0.08, d: "تقليل الضرر الواقع على فريقك في قتال الزعماء" },
    thunder: { n: "شحنة العاصفة", kind: "energy", v: 0.25, d: "سرعة تجدد طاقة برج الخلود" },
    light:   { n: "نور الفجر", kind: "dust", v: 0.5, d: "غبار أكثر عند مداعبة الجنيات" },
    dark:    { n: "ظلّ الحظ", kind: "egg", v: 0.25, d: "فرصة بيضة إضافية مع مكافأتك اليومية" },
    ice:     { n: "درع الصقيع", kind: "dr", v: 0.10, d: "تقليل الضرر الواقع على فريقك في قتال الزعماء" },
    wind:    { n: "رياح الرخاء", kind: "income", v: 0.08, d: "دخل كل حيواناتك" },
    poison:  { n: "سمّ الأفعى", kind: "atk", v: 0.08, d: "ضرر حيواناتك في قتال الزعماء" },
    metal:   { n: "درع الفولاذ", kind: "hp", v: 0.15, d: "حياة حيواناتك في قتال الزعماء" }
};
const ofPet = pet => { const sp = D.SPECIES[pet.sp]; return sp && sp.boss ? ABIL[sp.els[0]] : null; };
// القدرة الفعلية للاعب: { kind, v, n, d } أو null
function get(P) {
    const pet = (P.pets || []).find(p => { const s = D.SPECIES[p.sp]; return s && s.boss; });
    const a = pet && ofPet(pet); if (!a) return null;
    return { kind: a.kind, v: a.v * (1 + 0.5 * (pet.brk || 0)), n: a.n, d: a.d };
}
const val = (P, kind) => { const a = get(P); return a && a.kind === kind ? a.v : 0; };
const pct = v => Math.round(v * 100) + "%";
module.exports = { ABIL, get, val, ofPet, pct };
