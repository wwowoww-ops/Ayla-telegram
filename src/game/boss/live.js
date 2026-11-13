// القتال المباشر (جولة بجولة) لمن اختاروا "يدوي". الجلسات تُحفظ في الذاكرة فقط؛
// لو أُعيد تشغيل البوت أثناء القتال يُكمَل تلقائيًا (انظر boss.tickAll).
const Fight = require("./fight");

const ROUND_TIME = 30 * 1000;   // مهلة اختيار كل جولة
const AFK_LIMIT = 2;            // بعد كم جولة بلا تأكيد يتحول اللاعب إلى أوتو

const sessions = new Map();
const get = chatId => sessions.get(String(chatId)) || null;
const has = chatId => sessions.has(String(chatId));

function begin(chatId, parts, boss, now, rng = Math.random) {
    const st = Fight.create(parts, boss, now, rng);
    const modes = {};
    parts.forEach(p => { modes[String(p.uid)] = p.mode; });
    const s = {
        chatId: String(chatId), parts, boss, st, modes, cmds: {}, confirmed: new Set(), afk: {},
        deadline: now + ROUND_TIME, msg: 0, panels: {}, busy: false, last: []
    };
    sessions.set(String(chatId), s);
    return s;
}

const manualUids = s => Object.keys(s.modes).filter(u => s.modes[u] === "manual");
const unitsOf = (s, uid) => s.st.units.filter(u => u.uid === String(uid));

// اختيار لاعب لحيوان: act 0 هجوم، 1..3 مهارة
function setCmd(s, uid, unitId, act) {
    if (s.modes[String(uid)] !== "manual") return { ok: false, msg: "لست في القتال اليدوي." };
    const u = s.st.units[unitId];
    if (!u || u.uid !== String(uid)) return { ok: false, msg: "ليس حيوانك." };
    if (u.hp <= 0) return { ok: false, msg: "هذا الحيوان ساقط." };
    if (act < 0 || act > 3) return { ok: false, msg: "خيار غير صالح." };
    if (act > 0 && u.cd[act - 1] > 0) return { ok: false, msg: "المهارة في الانتظار " + u.cd[act - 1] + " جولات." };
    s.cmds[unitId] = act;
    s.confirmed.delete(String(uid));
    return { ok: true };
}

function confirm(s, uid) {
    if (s.modes[String(uid)] !== "manual") return { ok: false, msg: "لست في القتال اليدوي." };
    s.confirmed.add(String(uid));
    return { ok: true, all: allConfirmed(s) };
}
const allConfirmed = s => manualUids(s).every(u => s.confirmed.has(u));
const due = (s, now) => now >= s.deadline;
const dueChats = now => [...sessions.values()].filter(s => !s.busy && due(s, now)).map(s => s.chatId);

// ينفّذ جولة واحدة (أو يكمل بقية القتال فورًا إن لم يبق لاعب يدوي)
function run(s, now) {
    const note = [];
    // من لم يؤكد جولته يُحسب غائبًا
    manualUids(s).forEach(uid => {
        if (s.confirmed.has(uid)) s.afk[uid] = 0;
        else {
            s.afk[uid] = (s.afk[uid] || 0) + 1;
            if (s.afk[uid] >= AFK_LIMIT) { s.modes[uid] = "auto"; note.push(`🤖 تحوّل ${(s.parts.find(p => String(p.uid) === uid) || {}).name} إلى الأوتو لغيابه`); }
        }
    });
    const manual = new Set(manualUids(s));
    // أوامر اللاعبين اليدويين فقط (غيرهم أوتو)
    const cmds = {};
    s.st.units.forEach(u => { if (manual.has(u.uid) && s.cmds[u.id] !== undefined) cmds[u.id] = s.cmds[u.id]; });
    const lines = Fight.step(s.st, cmds);
    s.cmds = {}; s.confirmed = new Set(); s.last = note.concat(lines);
    s.deadline = now + ROUND_TIME;
    // لم يبق يدوي: أكمل الباقي فورًا
    if (!s.st.done && !manualUids(s).length) {
        while (!s.st.done) lines.push(...Fight.step(s.st, {}));
        s.last = note.concat(["⏩ لم يبق لاعب يدوي، أُكمل القتال تلقائيًا."], lines);
    }
    return { done: s.st.done, lines: s.last };
}

const end = chatId => sessions.delete(String(chatId));

module.exports = { ROUND_TIME, begin, get, has, setCmd, confirm, allConfirmed, due, dueChats, run, end, manualUids, unitsOf };