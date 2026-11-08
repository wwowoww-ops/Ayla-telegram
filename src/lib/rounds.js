// حالة الجولات الجارية (في الذاكرة فقط). تنتهي عند إعادة تشغيل البوت وهذا مقصود.
const TTL = 15 * 60 * 1000;

const guess = new Map();   // chatId -> { n, tries, at }
const riddle = new Map();  // chatId -> { q, answers, at }

// يرجع الجولة إن كانت ما تزال صالحة، وإلا يحذفها
function alive(map, id) {
    const round = map.get(id);
    if (round && Date.now() - round.at > TTL) { map.delete(id); return null; }
    return round || null;
}

module.exports = { guess, riddle, alive };