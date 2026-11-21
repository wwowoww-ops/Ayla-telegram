"use strict";
// حدث أسبوعي: عنصر الأسبوع تحصل حيواناته على +50% دخل. يتبدّل كل أسبوع تلقائيًا.
const D = require("../game/data");
const WEEK = 7 * 24 * 3600 * 1000, BONUS = 0.5;
const EL = Object.keys(D.ELEMENTS);
function current(now) {
    const w = Math.floor((now - 3 * 24 * 3600 * 1000) / WEEK);          // الأسبوع يبدأ الاثنين تقريبًا
    const el = EL[((w % EL.length) + EL.length) % EL.length];
    return { el, emoji: D.ELEMENTS[el].e, name: "أسبوع " + D.ELEMENTS[el].n, bonus: BONUS, left: (w + 1) * WEEK + 3 * 24 * 3600 * 1000 - now };
}
module.exports = { current };
