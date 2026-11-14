// ترتيب أزرار الرسائل تلقائيًا: لا نضغط أزرارًا طويلة في سطر واحد (يطبَّق على كل رسالة يرسلها البوت)
const LIMIT = 30;       // أقصى "عرض" للسطر (حروف تقريبًا)
const MAX_LONG = 3;     // أقصى عدد أزرار بسطر عند وجود نصوص طويلة
const MAX_SHORT = 6;    // أقصى عدد بسطر لأزرار قصيرة (رموز/أرقام)

const width = b => Array.from(String(b.text || "")).length + 3;
const short = b => Array.from(String(b.text || "")).length <= 5;

function fitRow(row) {
    const out = [];
    let cur = [], sum = 0;
    const allShort = row.every(short);
    const maxN = allShort ? MAX_SHORT : MAX_LONG;
    for (const b of row) {
        const w = width(b);
        if (cur.length && (cur.length >= maxN || sum + w > LIMIT)) { out.push(cur); cur = []; sum = 0; }
        cur.push(b); sum += w;
    }
    if (cur.length) out.push(cur);
    return out;
}

function fit(markup) {
    if (!markup) return markup;
    const kb = markup.inline_keyboard || (markup.toJSON && markup.toJSON().inline_keyboard);
    if (!Array.isArray(kb)) return markup;
    const rows = [];
    kb.forEach(r => fitRow(r).forEach(x => rows.push(x)));
    return { inline_keyboard: rows };
}

// محوّل grammY: يعالج reply_markup في كل الطلبات
function transformer(prev, method, payload, signal) {
    if (payload && payload.reply_markup && payload.reply_markup.inline_keyboard) {
        payload = Object.assign({}, payload, { reply_markup: fit(payload.reply_markup) });
    }
    return prev(method, payload, signal);
}

module.exports = { fit, fitRow, transformer };
