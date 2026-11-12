// يركّب نظام الجنيات على اللعبة عند التشغيل (يغلّف دوال الأرباح والصيد والفقس... ويضيف الإنجازات)
module.exports = function () {
    require("../game/fairies").install();
};