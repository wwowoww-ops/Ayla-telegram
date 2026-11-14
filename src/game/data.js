// بيانات اللعبة: عناصر، ندرات، أنواع، بيض، أطعمة، مناطق صيد

const ELEMENTS = {
    fire:    { n: "نار",   e: "🔥" },
    water:   { n: "ماء",   e: "💧" },
    plant:   { n: "نبات",  e: "🌿" },
    earth:   { n: "أرض",   e: "🪨" },
    thunder: { n: "برق",   e: "⚡" },
    light:   { n: "نور",   e: "✨" },
    dark:    { n: "ظلام",  e: "🌑" }
};
const EL_KEYS = Object.keys(ELEMENTS);
// دائرة التفوق: النار تغلب النبات، النبات الأرض، الأرض البرق، البرق الماء، الماء النار. والنور والظلام يتفوق كل منهما على الآخر
const BEATS = { fire: "plant", plant: "earth", earth: "thunder", thunder: "water", water: "fire", light: "dark", dark: "light" };
function elementMult(att, def) {
    if (BEATS[att] === def) return 1.5;
    if (BEATS[def] === att) return 0.75;
    return 1;
}

// الندرات: الاسم، الرمز، قوة الأساس، الدخل في الساعة (مستوى 1)
const RARITIES = [
    { n: "شائع",     e: "⚪", pow: 10,    inc: 20 },
    { n: "غير شائع", e: "🟢", pow: 30,    inc: 800 },
    { n: "نادر",     e: "🔵", pow: 100,   inc: 32e3 },
    { n: "ملحمي",    e: "🟣", pow: 350,   inc: 1.3e6 },
    { n: "أسطوري",   e: "🟠", pow: 1300,  inc: 51e6 },
    { n: "خرافي",    e: "🔴", pow: 5000,  inc: 2e9 },
    { n: "سماوي",    e: "🌈", pow: 20000, inc: 80e9 }
];

// الأنواع: [رقم ثابت، الاسم، الرمز، الندرة، معامل القوة، العناصر الممكنة]
// الرقم الثابت هو اسم ملف الصورة: images/<id>.jpg
const RAW = [
    [1, "قطة", "🐱", 0, 1.0, ["earth", "light"]], [2, "كلب", "🐶", 0, 1.1, ["earth", "fire"]],
    [3, "أرنب", "🐰", 0, 0.9, ["plant", "earth"]], [4, "هامستر", "🐹", 0, 0.8, ["earth", "plant"]],
    [5, "سنجاب", "🐿️", 0, 1.0, ["plant", "earth"]], [6, "فراشة", "🦋", 0, 0.7, ["plant", "light"]],
    [7, "حلزون", "🐌", 0, 0.6, ["earth", "water"]], [8, "سمكة", "🐟", 0, 0.8, ["water"]],
    [38, "قنفذ", "🦔", 0, 1.3, ["earth", "plant"]],
    [9, "ثعلب", "🦊", 1, 1.0, ["fire", "earth"]], [10, "باندا", "🐼", 1, 1.15, ["plant", "earth"]],
    [11, "ببغاء", "🦜", 1, 1.05, ["thunder", "plant"]], [12, "سلحفاة", "🐢", 1, 0.95, ["water", "earth"]],
    [13, "بطريق", "🐧", 1, 0.9, ["water"]], [14, "كوالا", "🐨", 1, 0.95, ["plant"]],
    [15, "غراب", "🐦‍⬛", 1, 1.2, ["dark", "thunder"]],
    [16, "ذئب", "🐺", 2, 1.0, ["dark", "earth"]], [17, "حصان", "🐴", 2, 1.1, ["earth", "thunder"]],
    [18, "نمر", "🐯", 2, 1.15, ["fire", "thunder"]], [19, "أسد", "🦁", 2, 1.25, ["fire", "light"]],
    [20, "دب", "🐻", 2, 1.3, ["earth", "plant"]],
    [21, "غزال", "🦌", 3, 0.9, ["plant", "light"]], [22, "نسر", "🦅", 3, 1.1, ["thunder", "light"]],
    [23, "بومة", "🦉", 3, 1.0, ["dark", "light"]], [24, "غوريلا", "🦍", 3, 1.25, ["earth"]],
    [25, "فهد", "🐆", 3, 1.2, ["thunder", "dark"]], [26, "تمساح", "🐊", 3, 1.15, ["water", "earth"]],
    [27, "قرش", "🦈", 3, 1.2, ["water", "dark"]], [28, "حوت", "🐋", 3, 1.35, ["water", "light"]],
    [29, "زرافة", "🦒", 3, 0.95, ["plant", "earth"]], [30, "شمبانزي", "🐒", 3, 0.9, ["plant", "thunder"]],
    [31, "وحيد القرن", "🦏", 4, 1.0, ["earth"]], [32, "فيل", "🐘", 4, 1.15, ["earth", "water"]],
    [33, "صقر", "🦅", 4, 0.9, ["thunder", "light"]], [34, "وحش أسطوري", "👹", 4, 1.4, ["dark", "fire"]],
    [36, "يونيكورن", "🦄", 5, 1.0, ["light"]], [37, "كراكن", "🐙", 5, 1.2, ["water", "dark"]],
    [40, "ماموث خرافي", "🦣", 5, 1.3, ["earth", "water"]],
    [35, "تنين", "🐉", 6, 1.0, ["fire", "thunder"]], [39, "عنقاء", "🐦‍🔥", 6, 1.2, ["fire", "light"]]
];
const SPECIES = {};
RAW.forEach(([id, n, e, r, v, els]) => { SPECIES[id] = { id, n, e, r, v, els }; });
const SPECIES_BY_RARITY = RARITIES.map((_, r) => RAW.filter(x => x[3] === r).map(x => x[0]));

// البيض: الاسم، السعر، مدة الفقس (دقائق)، أوزان الندرات السبع
const EGGS = [
    { n: "بيضة عادية",   e: "🥚", price: 2e3,   min: 5,    w: [88, 11, 1, 0, 0, 0, 0] },
    { n: "بيضة برونزية", e: "🥚", price: 80e3,  min: 30,   w: [20, 70, 9, 1, 0, 0, 0] },
    { n: "بيضة فضية",    e: "🪺", price: 3.2e6, min: 120,  w: [0, 25, 65, 9, 1, 0, 0] },
    { n: "بيضة ذهبية",   e: "🪺", price: 130e6, min: 240,  w: [0, 0, 25, 65, 9, 1, 0] },
    { n: "بيضة ملكية",   e: "👑", price: 5e9,   min: 480,  w: [0, 0, 0, 28, 62, 9.5, 0.5] },
    { n: "بيضة كونية",   e: "🔮", price: 200e9, min: 720,  w: [0, 0, 0, 0, 30, 62, 8] },
    { n: "بيضة العدم",   e: "🕳️", price: 8e12,  min: 1440, w: [0, 0, 0, 0, 0, 55, 45] }
];

// الأطعمة: جوع (يضاف)، xp نسبة من المستوى الحالي (1 = مستوى كامل)
const FOODS = {
    date:    { n: "تمرة",         e: "🌴", price: 30,     hg: 8,   xp: 0 },
    meat:    { n: "لحم",          e: "🍖", price: 250,    hg: 30,  xp: 0 },
    feast:   { n: "وليمة",        e: "🍗", price: 3e3,    hg: 60,  xp: 0.05 },
    cake:    { n: "كعكة",         e: "🍰", price: 60e3,   hg: 30,  xp: 0.2 },
    potion:  { n: "جرعة النمو",   e: "🧪", price: 3e6,    hg: 10,  xp: 0.6 },
    elixir:  { n: "إكسير الحياة", e: "🔮", price: 200e6,  hg: 20,  xp: 2 },
    tear:    { n: "دمعة العنقاء", e: "💧", price: 20e9,   hg: 100, xp: 6 }
};
const FRUITS = {
    fire:    { n: "فلفل ناري",    e: "🌶️" }, water: { n: "توت مائي", e: "🫐" },
    plant:   { n: "ورق ذهبي",     e: "🍃" }, earth: { n: "جذر الأرض", e: "🥔" },
    thunder: { n: "ليمون كهربائي", e: "🍋" }, light: { n: "عنب نوراني", e: "🍇" },
    dark:    { n: "باذنجان مظلم", e: "🍆" }
};
const FRUIT_PRICE = 2e6;
Object.keys(FRUITS).forEach(el => {
    FOODS["fruit_" + el] = { n: FRUITS[el].n, e: FRUITS[el].e, price: FRUIT_PRICE, hg: 20, xp: 0.1, el };
});
const GENERAL_FOODS = ["date", "meat", "feast", "cake", "potion", "elixir", "tear"];
const FRUIT_FOODS = Object.keys(FRUITS).map(el => "fruit_" + el);

// مناطق الصيد (14 مرحلة): القوة المطلوبة تقريبًا، مكافأة الذهب، نسبة xp، عناصر الوحوش، فئة البيض الساقط
// المراحل الأخيرة فيها وحوش نخبة (elite) بقدرات خاصة. آخر مرحلة يتجاوزها حيوان خرافي ⭐5 أو سماوي قوي بمهاراته.
const ZONES = [
    { n: "غابة الظلال",     power: 8,      coins: 150,     xp: 0.06, els: ["plant", "dark"],  egg: 0 },
    { n: "الكهوف القديمة",  power: 40,     coins: 3e3,     xp: 0.06, els: ["earth", "dark"],  egg: 0 },
    { n: "صحراء السراب",    power: 200,    coins: 60e3,    xp: 0.07, els: ["fire", "earth"],  egg: 1 },
    { n: "المستنقع السام",  power: 500,    coins: 400e3,   xp: 0.07, els: ["plant", "dark", "water"], egg: 1 },
    { n: "جبال الجليد",     power: 1.2e3,  coins: 2.5e6,   xp: 0.07, els: ["water", "light"], egg: 2 },
    { n: "فوهة البركان",    power: 4e3,    coins: 40e6,    xp: 0.08, els: ["fire", "thunder"], egg: 2 },
    { n: "الغابة المسحورة", power: 10e3,   coins: 250e6,   xp: 0.08, els: ["plant", "light", "earth"], egg: 3 },
    { n: "قلعة العواصف",    power: 25e3,   coins: 1.5e9,   xp: 0.08, els: ["thunder", "water"], egg: 3 },
    { n: "هاوية الأرواح",   power: 60e3,   coins: 20e9,    xp: 0.09, els: ["dark", "fire"],   egg: 4, elite: 1 },
    { n: "المدينة الغارقة", power: 130e3,  coins: 120e9,   xp: 0.09, els: ["water", "dark", "earth"], egg: 4, elite: 1 },
    { n: "جزر السماء",      power: 270e3,  coins: 600e9,   xp: 0.09, els: ["light", "thunder"], egg: 5, elite: 2 },
    { n: "قلب الكون",       power: 520e3,  coins: 8e12,    xp: 0.10, els: ["light", "dark"],  egg: 5, elite: 2 },
    { n: "بوابة الأبعاد",   power: 850e3,  coins: 40e12,   xp: 0.10, els: ["fire", "water", "thunder", "dark", "light"], egg: 6, elite: 3 },
    { n: "عرش الآلهة",      power: 1.3e6,  coins: 300e12,  xp: 0.12, els: ["fire", "water", "plant", "earth", "thunder", "light", "dark"], egg: 6, elite: 3 }
];

// الموارد: تُصطاد وتُستخدم في الترقية السريعة والتطور والتعزيزات (حلّت محل الطعام)
const RES = {
    crystal:      { n: "بلورة",         e: "🔷", d: "تمنح حيوانك خبرة، وتُستخدم في تعزيزات الزعيم" },
    dust:         { n: "غبار الجنيات",  e: "✨", d: "لتدريب الجنيات وتسريع التطور" },
    ess_fire:     { n: "جوهر النار",    e: "🔥", el: "fire" },
    ess_water:    { n: "جوهر الماء",    e: "💧", el: "water" },
    ess_plant:    { n: "جوهر النبات",   e: "🌿", el: "plant" },
    ess_earth:    { n: "جوهر الأرض",    e: "🪨", el: "earth" },
    ess_thunder:  { n: "جوهر البرق",    e: "⚡", el: "thunder" },
    ess_light:    { n: "جوهر النور",    e: "✨", el: "light" },
    ess_dark:     { n: "جوهر الظلام",   e: "🌑", el: "dark" }
};
const RES_KEYS = Object.keys(RES);

const C = {
    LV_CAP: 50,
    MAX_STARS: 5,
    MAX_COINS: 9e15,
    HUNGER_MS: 6 * 60 * 1000,       // نقطة جوع كل 6 دقائق
    BASE_SLOTS: 12, BASE_HATCH: 2,
    TRAIN_CD: 15 * 60 * 1000, PLAY_CD: 10 * 60 * 1000, HUNT_CD: 10 * 60 * 1000,
    BREED_CD: 6 * 3600 * 1000, BREED_LV: 10, DUEL_CD: 5 * 60 * 1000,
    COLLECT_CAP_H: 12, DAILY_MS: 20 * 3600 * 1000, STREAK_MS: 48 * 3600 * 1000
};

module.exports = { RES, RES_KEYS, ELEMENTS, EL_KEYS, BEATS, elementMult, RARITIES, SPECIES, SPECIES_BY_RARITY, EGGS, FOODS, GENERAL_FOODS, FRUIT_FOODS, ZONES, C };
