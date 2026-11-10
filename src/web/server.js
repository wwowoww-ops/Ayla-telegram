// خادم التطبيق المصغّر: يخدم الصفحة ويستقبل أوامر اللعبة ويطبّقها بنفس منطق البوت (engine.js)
const http = require("http");
const fs = require("fs");
const path = require("path");
const D = require("../game/data");
const E = require("../game/engine");
const store = require("../core/store");
const { nameOf } = require("../lib/util");
const { validateInitData } = require("./auth");
const { buildState, petView } = require("./state");

// المهام والإنجازات اختيارية: إن لم يوجد الملف تعمل اللعبة بدونها
let Q = null;
try { Q = require("../game/quests"); } catch (e) { /* غير موجودة */ }

const PUBLIC = path.join(__dirname, "public");
const IMG_DIR = path.join(__dirname, "..", "..", "images");
const STATIC = new Set(fs.readdirSync(PUBLIC));   // كل ملفات مجلد public (js/css/html)
const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8" };
const IMG_TYPES = { jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp" };
const rng = Math.random;

// ---------- ملخص المهام والإنجازات ----------
function questsView(P, now) {
    if (!Q) return null;
    const M = Q.ensureMissions(P, now);
    return {
        missions: M.list.map(m => ({ text: Q.missionText(m), cur: Q.missionProgress(P, m), target: m.target, done: !!M.done[m.id] })),
        bonus: M.bonus,
        achievements: Q.CATEGORIES.map(c => {
            const done = c.tiers.filter((_, i) => (P.ach || {})[c.id + ":" + i]).length;
            const next = done < c.tiers.length ? c.tiers[done] : null;
            const v = c.value(P);
            return { name: c.name, done, total: c.tiers.length, cur: Math.min(v, next || v), next, label: c.label ? c.label(v) : null };
        })
    };
}

// ---------- اللاعب ----------
function ensurePlayer(user, now) {
    let P = store.get(user.id);
    if (!P) { P = E.newPlayer(user.id, nameOf(user), now); store.set(user.id, P); }
    else if (P.name !== nameOf(user)) { P.name = nameOf(user); store.touch(P.id); }
    return P;
}

const int = v => (Number.isInteger(v) ? v : NaN);
const foodIds = () => new Set(Object.keys(D.FOODS));
const cleanName = (v, n) => String(v || "").replace(/[<>&]/g, "").trim().slice(0, n);
const validPen = (P, id) => id === 0 || (P.pens || []).some(x => x.id === id);

// ---------- الأوامر ----------
// كل أمر يرجع { ok, msg, ...إضافات }
const ACTIONS = {
    state: () => ({ ok: true }),
    hatch(P, a, now) {
        const r = E.hatch(P, int(a.id), now, rng);
        return r.ok ? { ok: true, reveal: petView(P, r.pet, now) } : r;
    },
    buyEgg: (P, a, now) => E.buyEgg(P, int(a.tier), now),
    buyFood: (P, a) => (foodIds().has(a.id) ? E.buyFood(P, a.id, int(a.qty)) : { ok: false, msg: "طعام غير معروف." }),
    feed: (P, a, now) => (foodIds().has(a.food) ? E.feed(P, int(a.id), a.food, now) : { ok: false, msg: "طعام غير معروف." }),
    train: (P, a, now) => E.train(P, int(a.id), now),
    play: (P, a, now) => E.play(P, int(a.id), now),
    upgrade: (P, a) => E.upgrade(P, int(a.id)),
    main: (P, a) => E.setMain(P, int(a.id)),
    release: (P, a) => E.release(P, int(a.id)),
    collect: (P, a, now) => E.collect(P, now),
    daily: (P, a, now) => E.daily(P, now),
    expandSlots: P => E.expandSlots(P),
    expandHatch: P => E.expandHatch(P),
    breed: (P, a, now) => E.breed(P, int(a.a), int(a.b), now, rng),
    hunt(P, a, now) {
        const zone = D.ZONES[int(a.zone)];
        const pet = E.getPet(P, P.main);
        if (!zone || !pet) return { ok: false, msg: "اختر منطقة وحيوانًا أساسيًا." };
        const before = petView(P, pet, now);
        const r = E.hunt(P, int(a.zone), now, rng);
        if (!r.ok) return r;
        return { ok: true, battle: { win: r.win, monEl: r.monEl, eff: r.eff, monPower: r.monPower, mine: r.mine, coins: r.coins || 0, levels: r.levels || 0, drops: r.drops, pet: before, zone: int(a.zone) } };
    },
    // ----- الحظائر -----
    newPen(P, a) {
        P.pens = P.pens || [];
        const name = cleanName(a.name, 14);
        if (P.pens.length >= 8) return { ok: false, msg: "وصلت أقصى عدد من الحظائر." };
        if (!name) return { ok: false, msg: "اكتب اسمًا للحظيرة." };
        P.penSeq = (P.penSeq || 0) + 1;
        P.pens.push({ id: P.penSeq, name });
        return { ok: true, msg: "🏡 تم إنشاء الحظيرة." };
    },
    renamePen(P, a) {
        const pen = (P.pens || []).find(x => x.id === int(a.id)), name = cleanName(a.name, 14);
        if (!pen || !name) return { ok: false, msg: "اسم غير صالح." };
        pen.name = name;
        return { ok: true, msg: "تم تغيير الاسم." };
    },
    delPen(P, a) {
        const id = int(a.id);
        if (!(P.pens || []).some(x => x.id === id)) return { ok: false, msg: "حظيرة غير موجودة." };
        P.pens = P.pens.filter(x => x.id !== id);
        P.pets.forEach(p => { if (p.pen === id) { p.pen = 0; delete p.fx; delete p.fy; } });
        return { ok: true, msg: "تم حذف الحظيرة." };
    },
    movePet(P, a) {
        const pet = E.getPet(P, int(a.id)), to = int(a.pen);
        if (!pet || !validPen(P, to)) return { ok: false, msg: "نقل غير صالح." };
        pet.pen = to; delete pet.fx; delete pet.fy;
        return { ok: true, msg: "تم النقل." };
    },
    movePets(P, a) {
        const from = int(a.from), to = int(a.to);
        if (!validPen(P, to) || !(from === -1 || validPen(P, from))) return { ok: false, msg: "نقل غير صالح." };
        let n = 0;
        P.pets.forEach(p => { if ((from === -1 || (p.pen || 0) === from) && (p.pen || 0) !== to) { p.pen = to; delete p.fx; delete p.fy; n++; } });
        return n ? { ok: true, msg: "تم نقل " + n + " حيوان." } : { ok: false, msg: "لا حيوانات لنقلها." };
    },
    place(P, a) {
        const pet = E.getPet(P, int(a.id));
        const ok = v => typeof v === "number" && Number.isFinite(v) && v >= 0 && v <= 1;
        if (!pet || !ok(a.fx) || !ok(a.fy)) return { ok: false, msg: "مكان غير صالح." };
        pet.fx = a.fx; pet.fy = a.fy;
        return { ok: true };
    },
    unpin(P, a) {
        const pet = E.getPet(P, int(a.id));
        if (!pet) return { ok: false, msg: "حيوان غير موجود." };
        delete pet.fx; delete pet.fy;
        return { ok: true, msg: "سيتجول بحرية." };
    },
    nick(P, a) {
        const pet = E.getPet(P, int(a.id));
        const name = String(a.name || "").replace(/[<>&]/g, "").trim().slice(0, 16);
        if (!pet || !name) return { ok: false, msg: "اسم غير صالح." };
        pet.nick = name;
        return { ok: true, msg: "تم تغيير الاسم." };
    },
    top() {
        const all = store.all();
        const power = all.filter(p => p.pets.length).map(p => ({ name: p.name, v: E.totalPower(p) })).sort((a, b) => b.v - a.v).slice(0, 10);
        const rich = all.map(p => ({ name: p.name, v: p.coins })).sort((a, b) => b.v - a.v).slice(0, 10);
        return { ok: true, top: { power, rich } };
    }
};

// ---------- الطلبات ----------
const hits = new Map();   // تحديد المعدل لكل لاعب
function tooMany(id) {
    const now = Date.now();
    const h = hits.get(id) || { n: 0, t: now };
    if (now - h.t > 5000) { h.n = 0; h.t = now; }
    h.n++;
    hits.set(id, h);
    if (hits.size > 5000) hits.clear();
    return h.n > 25;
}

function send(res, code, body, type) {
    res.writeHead(code, { "Content-Type": type || "application/json; charset=utf-8", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" });
    res.end(typeof body === "string" || Buffer.isBuffer(body) ? body : JSON.stringify(body));
}

function readBody(req) {
    return new Promise((resolve, reject) => {
        let size = 0; const chunks = [];
        req.on("data", c => { size += c.length; if (size > 4096) { reject(new Error("big")); req.destroy(); } else chunks.push(c); });
        req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
        req.on("error", reject);
    });
}

function serveFile(res, file) {
    fs.readFile(file, (err, data) => {
        if (err) return send(res, 404, "not found", "text/plain");
        send(res, 200, data, TYPES[path.extname(file)] || "application/octet-stream");
    });
}

function createServer(botToken, opts = {}) {
    const validate = opts.validate || validateInitData;

    return http.createServer(async (req, res) => {
        try {
            const url = req.url.split("?")[0];

            if (req.method === "GET") {
                if (url === "/health") return send(res, 200, "ok", "text/plain");
                if (url === "/" || url === "/index.html") return serveFile(res, path.join(PUBLIC, "index.html"));
                const name = url.slice(1);
                if (STATIC.has(name) && /\.(js|css)$/.test(name)) return serveFile(res, path.join(PUBLIC, name));
                const m = url.match(/^\/img\/(\d{1,3})$/);
                if (m) {
                    for (const ext of Object.keys(IMG_TYPES)) {
                        const f = path.join(IMG_DIR, m[1] + "." + ext);
                        if (fs.existsSync(f)) return send(res, 200, fs.readFileSync(f), IMG_TYPES[ext]);
                    }
                }
                return send(res, 404, "not found", "text/plain");
            }

            if (req.method === "POST" && url === "/api/act") {
                const user = validate(req.headers["x-init-data"], botToken);
                if (!user) return send(res, 401, { ok: false, msg: "انتهت الجلسة. أغلق اللعبة وافتحها من جديد." });
                if (tooMany(user.id)) return send(res, 429, { ok: false, msg: "تمهّل قليلًا." });

                let body;
                try { body = JSON.parse((await readBody(req)) || "{}"); } catch (e) { return send(res, 400, { ok: false, msg: "طلب غير صالح." }); }
                const action = ACTIONS[body.type];
                if (!action || typeof body.type !== "string") return send(res, 400, { ok: false, msg: "أمر غير معروف." });

                const now = Date.now();
                const P = ensurePlayer(user, now);
                if (Q) Q.ensureMissions(P, now);   // نقطة بداية المهام قبل التنفيذ

                const result = action(P, body.args || {}, now) || { ok: false, msg: "فشل." };
                store.touch(P.id);

                // منح المهام والإنجازات تلقائيًا
                let notes = [];
                if (Q) {
                    const s = Q.settle(P, now);
                    if (s.any) {
                        s.missions.forEach(m => notes.push("✅ " + m.text));
                        if (s.bonus) notes.push("🎉 أنهيت كل مهام اليوم!");
                        s.achievements.forEach(a => notes.push("🏅 " + a.name));
                    }
                }
                return send(res, 200, { ...result, notes, state: buildState(P, Date.now(), Q ? questsView : null) });
            }
            return send(res, 404, { ok: false, msg: "غير موجود" });
        } catch (e) {
            console.error("[WEBAPP]", e && (e.stack || e.message));
            send(res, 500, { ok: false, msg: "خطأ مؤقت في الخادم." });
        }
    });
}

module.exports = { createServer, ACTIONS };