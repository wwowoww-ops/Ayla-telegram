// ضريبة الثروة اليومية: تُخصم نسبة من العملات الزائدة عن حدود معينة، فلا تتكدس الأرصدة بلا نهاية.
// تُحسب عند أول نشاط للاعب بعد مرور الأيام (بدون تأثر بالغياب لأكثر من 30 يومًا)، وأول مرة تبدأ من الآن بلا أثر رجعي.
// عدّل الشرائح من هنا فقط: [الحد الأدنى للشريحة, النسبة اليومية]
const BRACKETS = [
    [1e12, 0.01],    // ما فوق 1T: 1% يوميًا
    [1e14, 0.03],    // ما فوق 100T: 3%
    [1e15, 0.06]     // ما فوق 1Qa: 6%
];
const DAY = 24 * 3600 * 1000, MAX_DAYS = 30;

// ضريبة يوم واحد على رصيد معين
function dayTax(coins) {
    let tax = 0;
    for (let i = 0; i < BRACKETS.length; i++) {
        const lo = BRACKETS[i][0], hi = i + 1 < BRACKETS.length ? BRACKETS[i + 1][0] : Infinity;
        if (coins > lo) tax += (Math.min(coins, hi) - lo) * BRACKETS[i][1];
    }
    return tax;
}

// يخصم الضريبة المستحقة ويرجع المبلغ المخصوم (0 إن لم يكن هناك شيء)
function apply(P, now) {
    if (!P || typeof P.coins !== "number") return 0;
    if (!P.taxAt) { P.taxAt = now; return 0; }
    const days = Math.min(MAX_DAYS, Math.floor((now - P.taxAt) / DAY));
    if (days < 1) return 0;
    P.taxAt += days * DAY;
    if ((now - P.taxAt) > DAY) P.taxAt = now;      // بعد غياب طويل لا نتراكم أكثر من الحد
    let paid = 0;
    for (let i = 0; i < days; i++) {
        const t = dayTax(P.coins);
        if (t <= 0) break;
        P.coins -= t; paid += t;
    }
    P.coins = Math.max(0, Math.floor(P.coins));
    return Math.floor(paid);
}

module.exports = { BRACKETS, dayTax, apply };