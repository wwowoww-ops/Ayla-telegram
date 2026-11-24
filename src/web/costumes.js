"use strict";
// أزياء الحيوانات: قطع تزيّن حيوانك (رأس/وجه/عنق/ظهر). تُشترى بغبار الجنيات أو البلورات، وبعضها هدايا لا تُشترى.
// الشراء مرة واحدة ويمكن لبسه على أكثر من حيوان. للزينة فقط ولا تغيّر القوة.
const Res = require("../game/resources");
const SLOTS = { head: "الرأس", face: "الوجه", neck: "العنق", back: "الظهر" };
// [id, اسم, رمز, خانة, مورد الثمن (null = هدية فقط), الثمن]
const L = [
    ["bow", "فيونكة", "🎀", "head", "dust", 15], ["cap", "قبعة رياضية", "🧢", "head", "dust", 25], ["hat", "قبعة ساحر", "🎩", "head", "dust", 60],
    ["flower", "تاج زهور", "🌸", "head", "dust", 80], ["helmet", "خوذة محارب", "🪖", "head", "crystal", 60], ["crown", "تاج ملكي", "👑", "head", "crystal", 250],
    ["halo", "هالة الملائكة", "😇", "head", "crystal", 150], ["horns", "قرون الشيطان", "😈", "head", null, 0],
    ["shades", "نظارة شمسية", "🕶️", "face", "dust", 30], ["goggles", "نظارة غوص", "🥽", "face", "dust", 45], ["mask", "قناع نينجا", "🥷", "face", null, 0],
    ["scarf", "وشاح شتوي", "🧣", "neck", "dust", 20], ["beads", "قلادة لؤلؤ", "📿", "neck", "crystal", 40], ["medal", "ميدالية الشجاعة", "🏅", "neck", null, 0],
    ["bfly", "أجنحة فراشة", "🦋", "back", "dust", 100], ["angel", "أجنحة الملائكة", "🪽", "back", "crystal", 200], ["cape", "عباءة البطل", "🦸", "back", null, 0]
];
const BY = Object.fromEntries(L.map(x => [x[0], { id: x[0], n: x[1], e: x[2], slot: x[3], res: x[4], price: x[5] }]));
const own = P => (P.costumes = P.costumes || {});
const catalog = () => L.map(x => ({ id: x[0], n: x[1], e: x[2], slot: x[3], res: x[4], price: x[5] }));

function buy(P, id) {
    const c = BY[id]; if (!c) return { ok: false, msg: "قطعة غير معروفة." };
    if (own(P)[id]) return { ok: false, msg: "تملكها بالفعل." };
    if (!c.res) return { ok: false, msg: "هذه القطعة هدية فقط (من الزعماء أو المكافأة الأسبوعية)." };
    if (!Res.take(P, c.res, c.price)) return { ok: false, msg: "لا يكفيك " + Res.label(c.res) + " (" + c.price + ")." };
    own(P)[id] = true;
    return { ok: true, msg: "اشتريت " + c.e + " " + c.n + "." };
}
// يلبس/ينزع قطعة: نفس القطعة مرة ثانية = نزع
function wear(P, petId, id) {
    const pet = P.pets.find(p => p.id === Number(petId)); if (!pet) return { ok: false, msg: "حيوان غير موجود." };
    if (id === "none") { pet.cs = {}; return { ok: true, msg: "نُزعت كل الأزياء." }; }
    const c = BY[id]; if (!c || !own(P)[id]) return { ok: false, msg: "لا تملك هذه القطعة." };
    pet.cs = pet.cs || {};
    if (pet.cs[c.slot] === id) { delete pet.cs[c.slot]; return { ok: true, msg: "نُزعت " + c.e + "." }; }
    pet.cs[c.slot] = id;
    return { ok: true, msg: "لبس حيوانك " + c.e + " " + c.n + "." };
}
// هدية عشوائية من القطع التي لا تملكها (تُعاد القطعة أو null إن امتلك الكل)
function give(P, rng = Math.random, giftOnly) {
    const pool = L.filter(x => !own(P)[x[0]] && (!giftOnly || !x[4]));
    const list = pool.length ? pool : L.filter(x => !own(P)[x[0]]);
    if (!list.length) return null;
    const x = list[Math.floor(rng() * list.length)]; own(P)[x[0]] = true;
    return BY[x[0]];
}
const view = P => ({ cat: catalog(), own: Object.keys(own(P)) });
module.exports = { SLOTS, catalog, buy, wear, give, view, BY };
