
// خادم التطبيق المصغّر: يخدم الصفحة ويستقبل أوامر اللعبة ويطبّقها بنفس منطق البوت (engine.js)
const http = require("http");
const fs = require("fs");
const path = require("path");
const D = require("../game/data");
const E = require("../game/engine");
const store = require("../core/store");
const F = require("../game/feeders");
const Res = require("../game/resources");
const Fy = require("../game/fairies");
const Mk = require("../game/market");
const X = require("../game/extras");
const Se = require("../game/season");
const Po = require("../game/posts");
const { nameOf } = require("../lib/util");
const { validateInitData } = require("./auth");
const { buildState, petView } = require("./state");
const Farm = require("./farm");
const World = require("./world");
const Map_ = require("./map");
const Raid = require("./raid");
require("./perks");
const Cos = require("./cosmetics");
const Exp = require("./expedition");
const Dex = require("./dex");
const Decor = require("./decor");
const Ev = require("./events");

// المهام والإنجازات اختيارية: إن لم يوجد الملف تعمل اللعبة بدونها
let Q = null;
try { Q = require("../game/quests"); } catch (e) { /* غير موجودة */ }

const PUBLIC = path.join(__dirname, "public");
const IMG_DIR = path.join(__dirname, "..", "..", "images");
const STATIC = new Set(fs.readdirSync(PUBLIC));
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
    try { if (Res.migrate(P)) store.touch(P.id); } catch (e) { /* لا شيء */ }
    // صورة تيليجرام تُحفظ ليراها غيرك في بروفايلك (رابط عام فقط)
    const ph = typeof user.photo_url === "string" && user.photo_url.length < 300 && /^https:\/\/[a-z0-9.-]+\/[\w\-./%]+$/i.test(user.photo_url) ? user.photo_url : null;
    if (ph && P.tgPhoto !== ph) { P.tgPhoto = ph; store.touch(P.id); }
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
    breed: (P, a, now) => E.breed(P, int(a.a), int(a.b), now, rng, !!a.stone),
    // ----- متجر النوادر والتدفئة والتدوير -----
    warm: (P, a, now) => X.warm(P, int(a.id), now),
    nBuy: (P, a) => X.buy(P, String(a.id), int(a.qty) || 1),
    nOpen: P => X.openBox(P, rng),
    recycle: (P, a) => (Array.isArray(a.ids) && a.ids.length <= 60 ? X.recycle(P, a.ids.map(int).filter(Number.isInteger)) : { ok: false, msg: "اختيار غير صالح." }),
    recycleBulk: (P, a) => (Number.isInteger(a.r) && a.r >= 0 && a.r <= 3 ? X.recycleBulk(P, a.r, 25) : { ok: false, msg: "اختيار غير صالح." }),
    // ----- وظائف الحيوانات -----
    postSet: (P, a) => Po.assign(P, String(a.post), int(a.id)),
    postClear: (P, a) => Po.unassign(P, int(a.id)),
    hunt(P, a, now) {
        const zone = D.ZONES[int(a.zone)];
        const pet = E.getPet(P, P.main);
        if (!zone || !pet) return { ok: false, msg: "اختر منطقة وحيوانًا أساسيًا." };
        const before = petView(P, pet, now);
        const r = E.hunt(P, int(a.zone), now, rng);
        if (!r.ok) return r;
        return { ok: true, battle: { win: r.win, monEl: r.monEl, eff: r.eff, monPower: r.monPower, mine: r.mine, coins: r.coins || 0, levels: r.levels || 0, drops: r.drops, got: r.got || {}, notes: (r.notes || []).concat(r.fnotes || []), elite: !!r.elite, pet: before, zone: int(a.zone) } };
    },

    // ----- الموارد والصقل والتطور -----
    buyRes: (P, a) => (D.RES[a.id] ? Res.buy(P, a.id, int(a.qty)) : { ok: false, msg: "مورد غير معروف." }),
    crystal: (P, a) => Res.useCrystals(P, int(a.id), int(a.n)),
    polish: (P, a) => E.polish(P, int(a.id)),
    evolve: (P, a) => E.evolve(P, int(a.id), String(a.el)),

    // ----- محفظة البيض -----
    placeEgg: (P, a, now) => E.placeEgg(P, int(a.id), now),
    placeAll: (P, a, now) => E.placeAll(P, now),
    hatchAll(P, a, now) {
        const r = E.hatchAll(P, now, rng);
        return r.ok ? { ok: true, msg: r.msg, reveals: r.pets.map(p => petView(P, p, now)) } : r;
    },

    // ----- الجنيات -----
    fToggle: (P, a) => Fy.toggle(P, int(a.id)),
    fHab: (P, a, now) => Fy.setHabitat(P, int(a.id), String(a.hab), now),
    fUnhab: (P, a, now) => Fy.removeHabitat(P, int(a.id), now),
    fDust: (P, a, now) => Fy.useDust(P, int(a.id), int(a.n), now),
    fName: (P, a) => Fy.rename(P, int(a.id), String(a.name || "")),
    fRelease: (P, a) => Fy.release(P, int(a.id)),
    fMerge: (P, a, now) => Fy.merge(P, (Array.isArray(a.ids) ? a.ids.slice(0, 3) : []).map(int), now),
    fSlot: P => Fy.buySlot(P),
    fBuy: (P, a, now) => Fy.buy(P, int(a.idx), now),

    // ----- سوق اللاعبين -----
    mList(P, a, now) {
        return { ok: true, market: Mk.all(now).map(l => ({ id: l.id, by: l.sname, mine: String(l.seller) === String(P.id), kind: Mk.kindOf(l), desc: Mk.describe(l), price: l.price, left: Math.max(0, l.at + Mk.TTL - now) })), tax: Mk.TAX };
    },
    mSell(P, a, now) {
        const k = String(a.kind);
        if (!["f", "e", "r"].includes(k)) return { ok: false, msg: "نوع غير صالح." };
        const ref = k === "r" ? String(a.ref) : int(a.ref), qty = k === "r" ? int(a.qty) : 1;
        if (k === "r" && !(qty >= 1)) return { ok: false, msg: "كمية غير صالحة." };
        const price = Number(a.price) > 0 ? Number(a.price) : Mk.suggest(P, k, ref, qty);
        return Mk.sell(P, P.name, k, ref, qty, price, now);
    },
    mCancel: (P, a, now) => Mk.cancel(P, int(a.id), now),
    mBuy: (P, a, now) => Mk.buy(P, int(a.id), now),

    // ----- أوعية الطعام -----
    buyBowl: P => F.buy(P),
    placeBowls: (P, a) => F.placeMany(
        P,
        int(a.count),
        int(a.pen),
        String(a.food),
        int(a.qty)
    ),
    refillBowl: (P, a) => F.refill(P, int(a.id), int(a.qty)),
    removeBowl: (P, a) => F.remove(P, int(a.id)),

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
        if (id === E.BOSS_PEN) return { ok: false, msg: "حظيرة الزعماء لا تُحذف." };
        if (!(P.pens || []).some(x => x.id === id)) return { ok: false, msg: "حظيرة غير موجودة." };
        P.pens = P.pens.filter(x => x.id !== id);
        P.pets.forEach(p => { if (p.pen === id) { p.pen = 0; delete p.fx; delete p.fy; } });
        return { ok: true, msg: "تم حذف الحظيرة." };
    },
    movePet(P, a) {
        const pet = E.getPet(P, int(a.id)), to = int(a.pen);
        if (!pet || !validPen(P, to)) return { ok: false, msg: "نقل غير صالح." };
        if (E.isBoss(pet) !== (to === E.BOSS_PEN)) return { ok: false, msg: "حظيرة الزعماء للزعماء المروَّضين فقط، وهم لا يغادرونها." };
        pet.pen = to; delete pet.fx; delete pet.fy;
        return { ok: true, msg: "تم النقل." };
    },
    movePets(P, a) {
        const from = int(a.from), to = int(a.to);
        if (!validPen(P, to) || !(from === -1 || validPen(P, from))) return { ok: false, msg: "نقل غير صالح." };
        let n = 0;
        if (to === E.BOSS_PEN) return { ok: false, msg: "حظيرة الزعماء للزعماء المروَّضين فقط." };
        P.pets.forEach(p => { if (!E.isBoss(p) && (from === -1 || (p.pen || 0) === from) && (p.pen || 0) !== to) { p.pen = to; delete p.fx; delete p.fy; n++; } });
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
    worldSave: (P, a) => World.save(P, a && a.world),
    raid: (P, a, now) => Raid.raid(P, a, now),
    allyDonate: (P, a) => Map_.allyDonate(P, a),
    profileOf: (P, a, now) => require("./profile").of(P, a, now),
    gardenCare(P, a, now) {
        const Fy = require("../game/fairies"), f = Fy.get(P, Number(a.id)); if (!f) return { ok: false, msg: "جنية غير موجودة." };
        P.gcare = P.gcare || {}; const last = P.gcare[f.id] || 0, GAP = 3 * 3600e3;
        if (now - last < GAP) return { ok: false, msg: "🧚 ما زالت مسرورة من آخر مداعبة. عد بعد " + E.dur(GAP - (now - last)) + "." };
        const n = 1 + Math.floor(Fy.sp(f).r / 2); P.gcare[f.id] = now;
        require("../game/resources").add(P, "dust", n);
        return { ok: true, msg: "💗 داعبت " + (f.nick || Fy.sp(f).n) + " فنثرت لك ✨ " + n + " غبار!" };
    },
    bossRank(P, a) {
        const pet = E.getPet(P, int(a.id)); if (!pet || !E.isBoss(pet)) return { ok: false, msg: "ليس زعيمًا مروَّضًا." };
        const k = pet.brk || 0, cost = E.BOSS_RANK_COST[k];
        if (cost == null) return { ok: false, msg: "بلغ أعلى رتبة ♾️." };
        if (!require("../game/resources").take(P, "crystal", cost)) return { ok: false, msg: "تحتاج 🔷 " + cost + " بلورة." };
        pet.brk = k + 1;
        return { ok: true, msg: "ارتقى " + (pet.nick || E.spOf(pet).n) + " إلى رتبة " + E.BOSS_RANKS[pet.brk][1] + " " + E.BOSS_RANKS[pet.brk][0] + "! (+35% قوة ودخل)" };
    },
    cosBuy: (P, a) => require("./costumes").buy(P, String(a.id)),
    cosWear: (P, a) => require("./costumes").wear(P, a.pet, String(a.id)),
    fishCast: (P, a, now) => require("./fishing").cast(P, now, rng),
    fishBook: (P, a, now) => ({ ok: true, book: require("./fishing").book(P, now) }),
    fishClaim: (P, a, now) => require("./fishing").claim(P, a, now),
    towerClimb: (P, a, now) => require("./tower").climb(P, now, rng),
    towerWeek: (P, a, now) => require("./tower").claimWeek(P, now),
    towerTop() {
        const all = store.all();
        const rows = all.filter(p => p.tower && p.tower.f > 1).map(p => ({ uid: String(p.id), name: p.name, tg: Cos.tag(p), v: p.tower.f - 1 })).sort((a, b) => b.v - a.v).slice(0, 10);
        return { ok: true, rows };
    },
    expStart: (P, a, now) => Exp.start(P, a, now),
    expClaim: (P, a, now) => Exp.claim(P, a, now),
    dexView: P => Dex.view(P),
    dexClaim: (P, a) => Dex.claim(P, a),
    decoShop: P => Decor.shop(P),
    decoBuy: (P, a) => Decor.buy(P, a),
    decoSave: (P, a) => Decor.save(P, a),
    mapView: (P, a, now) => Map_.mapView(P, a, now),
    mapMove: (P, a, now) => Map_.mapMove(P, a, now),
    allyCreate: (P, a, now) => Map_.allyCreate(P, a, now),
    allyInvite: (P, a, now) => Map_.allyInvite(P, a, now),
    allyAccept: (P, a, now) => Map_.allyAccept(P, a, now),
    allyDecline: (P, a) => Map_.allyDecline(P, a),
    allyLeave: P => Map_.allyLeave(P),
    allyKick: (P, a) => Map_.allyKick(P, a),
    visitList: (P, a, now) => Farm.visitList(P, a, now),
    farmView: (P, a, now) => Farm.farmView(P, a, now),
    cosView: P => require("./cosmetics").view(P),
    avatarSet: (P, a) => {
        const m = a && a.mode;
        if (m === "photo") {
            const d = a.data;
            if (typeof d !== "string" || d.length > 80000 || d.length < 200 || !/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(d)) return { ok: false, msg: "الصورة غير صالحة أو كبيرة." };
            P.avPhoto = d; P.avMode = "photo";
        } else if (m === "tg" || m === "pet") P.avMode = m;
        else return { ok: false, msg: "خيار غير معروف." };
        return { ok: true, msg: "✅ تم تغيير الصورة." };
    },
    avatarGet: P => ({ ok: true, mode: P.avMode || "pet", data: P.avPhoto || null }),
    cosSet: (P, a) => require("./cosmetics").set(P, a),
    frameList: P => require("./cosmetics").frameList(P),
    frameAnim: (P, a) => require("./cosmetics").frameAnim(P, a),
    frameSet: (P, a) => require("./cosmetics").frameSet(P, a),
    frameBuy: (P, a) => require("./cosmetics").frameBuy(P, a),
    top() {
        const all = store.all();
        const power = all.filter(p => p.pets.length).map(p => ({ uid: String(p.id), name: p.name, tg: Cos.tag(p), v: E.totalPower(p) })).sort((a, b) => b.v - a.v).slice(0, 10);
        const rich = all.map(p => ({ uid: String(p.id), name: p.name, tg: Cos.tag(p), v: p.coins })).sort((a, b) => b.v - a.v).slice(0, 10);
        return { ok: true, top: { power, rich } };
    }
};

// ---------- الطلبات ----------
const hits = new Map();
function tooMany(id) {
    const now = Date.now();
    const h = hits.get(id) || { n: 0, t: now };
    if (now - h.t > 5000) { h.n = 0; h.t = now; }
    h.n++;
    hits.set(id, h);
    if (hits.size > 5000) hits.clear();
    return h.n > 25;
}

const zlib = require("zlib");
function send(res, code, body, type, extra) {
    let buf = typeof body === "string" || Buffer.isBuffer(body) ? body : JSON.stringify(body);
    const h = Object.assign({ "Content-Type": type || "application/json; charset=utf-8", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" }, extra || {});
    const ae = (res.__req && res.__req.headers["accept-encoding"]) || "";
    if (/gzip/.test(ae) && buf.length > 1024 && !/image\//.test(h["Content-Type"])) { buf = zlib.gzipSync(buf, { level: 6 }); h["Content-Encoding"] = "gzip"; h["Vary"] = "Accept-Encoding"; }   // الحالة 68KB تصير ~9KB: مهم على الشبكات الضعيفة
    h["Content-Length"] = Buffer.byteLength(buf);
    res.writeHead(code, h);
    res.end(buf);
}

function readBody(req) {
    return new Promise((resolve, reject) => {
        let size = 0; const chunks = [];
        req.on("data", c => { size += c.length; if (size > 90000) { reject(new Error("big")); req.destroy(); } else chunks.push(c); });
        req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
        req.on("error", reject);
    });
}

// ملفات ثابتة: مضغوطة ومخزّنة مؤقتًا في المتصفح مع ETag حتى لا تُحمَّل 250KB في كل فتحة
function serveFile(res, file) {
    fs.stat(file, (e1, st) => {
        if (e1 || !st.isFile()) return send(res, 404, "not found", "text/plain");
        const etag = '"' + st.size.toString(36) + "-" + Math.floor(st.mtimeMs).toString(36) + '"';
        if (res.__req && res.__req.headers["if-none-match"] === etag) { res.writeHead(304, { ETag: etag, "Cache-Control": "no-cache" }); return res.end(); }
        fs.readFile(file, (err, data) => {
            if (err) return send(res, 404, "not found", "text/plain");
            send(res, 200, data, TYPES[path.extname(file)] || "application/octet-stream", { ETag: etag, "Cache-Control": "no-cache" });
        });
    });
}

function createServer(botToken, opts = {}) {
    const validate = opts.validate || validateInitData;

    return http.createServer(async (req, res) => {
        res.__req = req;
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
                if (Q) Q.ensureMissions(P, now);
                try { Se.ensure(P, now); } catch (e) { /* لا شيء */ }

                F.tick(P, now); // تشغيل التغذية التلقائية من الأوعية

                const result = action(P, body.args || {}, now) || { ok: false, msg: "فشل." };
                store.touch(P.id);

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
