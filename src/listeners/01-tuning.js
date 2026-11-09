// يطبّق ضبط الأسعار والسرعة عند تشغيل البوت (قبل تحميل الأوامر)
const tuning = require("../game/tuning");

module.exports = function () {
    tuning.apply();
};