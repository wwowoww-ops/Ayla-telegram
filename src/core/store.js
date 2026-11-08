// تخزين اللاعبين: كل شيء يعمل في الذاكرة (سريع)، والحفظ في PostgreSQL دوريًا وعند الإغلاق.
// السبب: قاعدة Neon المجانية لها ساعات حوسبة محدودة وتنام عند الخمول،
// فنوقظها كل بضع دقائق فقط بدل كل رسالة.
const { Pool } = require("pg");

const FLUSH_MS = Number(process.env.FLUSH_MINUTES || 20) * 60 * 1000;
const players = new Map();   // id -> كائن اللاعب
const dirty = new Set();     // من تغيّرت بياناته ولم يُحفظ بعد
let pool = null;
let timer = null;
let flushing = Promise.resolve();

function connect(rawUrl) {
    let url = String(rawUrl || "");
    // channel_binding يسبب فشل الاتصال أحيانًا، فنحذفه
    url = url.replace(/([?&])channel_binding=[^&]*&?/, "$1").replace(/[?&]$/, "");
    const local = /@(localhost|127\.0\.0\.1)/.test(url);
    pool = new Pool({
        connectionString: url,
        ssl: local ? false : { rejectUnauthorized: false },
        max: 2,
        idleTimeoutMillis: 5000,
        connectionTimeoutMillis: 30000   // يتسع لاستيقاظ القاعدة من النوم
    });
    pool.on("error", e => console.error("[DB] اتصال خامل انقطع:", e.message));
}

async function retry(fn, tries = 3) {
    for (let i = 0; ; i++) {
        try { return await fn(); }
        catch (e) {
            if (i >= tries - 1) throw e;
            await new Promise(r => setTimeout(r, 1500 * (i + 1)));
        }
    }
}

// تحميل كل اللاعبين مرة واحدة عند التشغيل
async function init(url) {
    connect(url);
    await retry(() => pool.query(`
        CREATE TABLE IF NOT EXISTS players (
            id BIGINT PRIMARY KEY,
            data JSONB NOT NULL,
            updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )`));
    const { rows } = await retry(() => pool.query("SELECT id, data FROM players"));
    players.clear(); dirty.clear();
    for (const r of rows) players.set(String(r.id), typeof r.data === "string" ? JSON.parse(r.data) : r.data);
    console.log("✅ [DB] تم تحميل " + players.size + " لاعب");
    timer = setInterval(() => { flush().catch(() => {}); }, FLUSH_MS);
    if (timer.unref) timer.unref();
    return players.size;
}

const get = id => players.get(String(id)) || null;
const set = (id, p) => { players.set(String(id), p); dirty.add(String(id)); };
const touch = id => { dirty.add(String(id)); };
const all = () => [...players.values()];

// حفظ كل من تغيّر. عند الفشل نعيدهم لقائمة المنتظرين ولا نفقد شيئًا.
async function doFlush() {
    if (!pool || !dirty.size) return 0;
    const ids = [...dirty];
    dirty.clear();
    let done = 0;
    try {
        for (let i = 0; i < ids.length; i += 200) {
            const part = ids.slice(i, i + 200);
            const objs = part.map(id => JSON.stringify(players.get(id)));
            await retry(() => pool.query(
                `INSERT INTO players (id, data, updated_at)
                 SELECT x, y::jsonb, now() FROM unnest($1::bigint[], $2::text[]) AS t(x, y)
                 ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = now()`,
                [part, objs]));
            done += part.length;
        }
        return done;
    } catch (e) {
        ids.slice(done).forEach(id => dirty.add(id)); // ما لم يُحفظ يرجع للقائمة
        console.error("[DB] فشل الحفظ (سيعاد):", e.message);
        throw e;
    }
}
// تسلسل: لا يعمل حفظان معًا، وفشل واحد لا يوقف ما بعده
function flush() {
    const run = flushing.then(doFlush);
    flushing = run.catch(() => {});
    return run;
}

// عند إغلاق البوت: احفظ ثم أغلق الاتصال
async function shutdown() {
    if (timer) clearInterval(timer);
    try { const n = await Promise.race([flush(), new Promise((_, rej) => setTimeout(() => rej(new Error("timeout")), 8000))]); console.log("💾 [DB] حُفظ " + n + " لاعب قبل الإغلاق"); }
    catch (e) { console.error("[DB] لم يكتمل الحفظ عند الإغلاق:", e.message); }
    try { await pool.end(); } catch (e) { /* لا شيء */ }
}

const stats = () => ({ players: players.size, dirty: dirty.size });
module.exports = { init, get, set, touch, all, flush, shutdown, stats };