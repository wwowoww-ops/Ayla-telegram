// ضبط سرعة اللعبة وأسعارها في مكان واحد.
// يعدّل القيم في data.js أثناء التشغيل، فلا حاجة لتغيير ملفات اللعبة نفسها.
// غيّر الأرقام هنا فقط (1 = بدون تغيير).
const D = require("./data");

// الإعداد الحالي: وضع "صعب جدًا" (1 = قيم data.js الأصلية)
const TUNING = {
    eggPrice: 4,          // أسعار البيض
    foodPrice: 2,         // أسعار الطعام الأساسي (تمر، لحم، وليمة)
    growthFoodPrice: 150, // أسعار أطعمة الخبرة (كعكة، جرعة، إكسير، دمعة، فواكه): هي ثمن رفع المستوى
    hatchTime: 2,         // مدة الفقس
    income: 0.12,         // دخل الحيوانات في الساعة
    zoneCoins: 0.1,       // مكافأة الذهب في الصيد
    zonePower: 3,         // قوة وحوش الصيد (أكبر = أصعب)
    zoneXp: 0.7,          // خبرة الصيد
    cooldown: 1.5,        // التدريب واللعب والصيد والتزاوج والمبارزة
    hunger: 1.5,          // سرعة الجوع (أكبر = يجوع أسرع)
    dailyHours: 24,       // ساعات انتظار المكافأة اليومية
    collectCapHours: 8,   // أقصى ساعات تتراكم فيها الأرباح
    breedLevel: 20        // أقل مستوى للتزاوج
};

let applied = false;

function apply() {
    if (applied) return;   // مرة واحدة فقط
    applied = true;
    const T = TUNING;
    const round = n => Math.max(1, Math.round(n));

    D.EGGS.forEach(e => {
        e.price = round(e.price * T.eggPrice);
        e.min = Math.max(1, Math.round(e.min * T.hatchTime));
    });
    Object.values(D.FOODS).forEach(f => { f.price = round(f.price * (f.xp > 0 ? T.growthFoodPrice : T.foodPrice)); });
    D.RARITIES.forEach(r => { r.inc = r.inc * T.income; });
    D.ZONES.forEach(z => {
        z.coins = round(z.coins * T.zoneCoins);
        z.power = round(z.power * T.zonePower);
        z.xp = Math.min(0.5, z.xp * T.zoneXp);
    });

    const C = D.C;
    ["TRAIN_CD", "PLAY_CD", "HUNT_CD", "BREED_CD", "DUEL_CD"].forEach(k => { C[k] = Math.round(C[k] * T.cooldown); });
    C.HUNGER_MS = Math.round(C.HUNGER_MS / T.hunger);
    C.HUNGER_MS = Math.max(C.HUNGER_MS, 60 * 1000);
    C.DAILY_MS = T.dailyHours * 3600 * 1000;
    C.COLLECT_CAP_H = T.collectCapHours;
    C.BREED_LV = T.breedLevel;
}

module.exports = { TUNING, apply };