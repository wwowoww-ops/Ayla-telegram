// ضبط سرعة اللعبة وأسعارها في مكان واحد.
// يعدّل القيم في data.js أثناء التشغيل، فلا حاجة لتغيير ملفات اللعبة نفسها.
// غيّر الأرقام هنا فقط (1 = بدون تغيير).
const D = require("./data");

const TUNING = {
    eggPrice: 0.25,       // أسعار البيض
    foodPrice: 0.3,       // أسعار الطعام والفواكه
    hatchTime: 0.4,       // مدة الفقس
    income: 2,            // دخل الحيوانات في الساعة
    zoneCoins: 2,         // مكافأة الذهب في الصيد
    zoneXp: 2,            // خبرة الصيد
    cooldown: 0.4,        // التدريب واللعب والصيد والتزاوج والمبارزة
    hunger: 0.6,          // سرعة الجوع (أقل = يجوع أبطأ)
    dailyHours: 12,       // ساعات انتظار المكافأة اليومية
    collectCapHours: 24,  // أقصى ساعات تتراكم فيها الأرباح
    breedLevel: 5         // أقل مستوى للتزاوج
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
    Object.values(D.FOODS).forEach(f => { f.price = round(f.price * T.foodPrice); });
    D.RARITIES.forEach(r => { r.inc = r.inc * T.income; });
    D.ZONES.forEach(z => {
        z.coins = round(z.coins * T.zoneCoins);
        z.xp = Math.min(0.5, z.xp * T.zoneXp);
    });

    const C = D.C;
    ["TRAIN_CD", "PLAY_CD", "HUNT_CD", "BREED_CD", "DUEL_CD"].forEach(k => { C[k] = Math.round(C[k] * T.cooldown); });
    C.HUNGER_MS = Math.round(C.HUNGER_MS / T.hunger);
    C.DAILY_MS = T.dailyHours * 3600 * 1000;
    C.COLLECT_CAP_H = T.collectCapHours;
    C.BREED_LV = T.breedLevel;
}

module.exports = { TUNING, apply };