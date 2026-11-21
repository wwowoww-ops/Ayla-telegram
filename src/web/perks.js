"use strict";
// يربط مضاعِفات الدخل الخارجية بالمحرّك: مزايا التحالف + حدث الأسبوع.
const E = require("../game/engine");
const Map_ = require("./map");
const Ev = require("./events");
E.setIncomeHook((P, p) => {
    let m = 1 + Map_.perk(P).income;
    const ev = Ev.current(Date.now());
    if (p && p.el === ev.el) m += ev.bonus;
    return m;
});
module.exports = {};
