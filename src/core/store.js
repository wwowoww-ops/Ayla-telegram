
/**
 * ╔══════════════════════════════════════╗
 * ║              AYLA STORE               ║
 * ║                 v2.0                 ║
 * ╚══════════════════════════════════════╝
 *
 * اللاعبين وإعدادات المجموعات:
 * - العمل في الذاكرة.
 * - الحفظ الدوري في PostgreSQL.
 * - الحفظ عند إغلاق البوت.
 * - لا توجد استعلامات مع كل رسالة.
 */

const { Pool } = require("pg");

const FLUSH_MS = Number(process.env.FLUSH_MINUTES || 20) * 60 * 1000;

// ==================================================
// PLAYERS
// ==================================================

const players = new Map();
const dirty = new Set();

// ==================================================
// GROUP SETTINGS
// ==================================================

const groupSettings = new Map();
const dirtyGroups = new Set();

// ==================================================
// DATABASE
// ==================================================

let pool = null;
let timer = null;
let flushing = Promise.resolve();

function connect(rawUrl) {
    let url = String(rawUrl || "");

    url = url
        .replace(/([?&])channel_binding=[^&]*&?/, "$1")
        .replace(/[?&]$/, "");

    const local = /@(localhost|127\.0\.0\.1)/.test(url);

    pool = new Pool({
        connectionString: url,
        ssl: local ? false : { rejectUnauthorized: false },
        max: 2,
        idleTimeoutMillis: 5000,
        connectionTimeoutMillis: 30000
    });

    pool.on("error", e =>
        console.error("[DB] اتصال خامل انقطع:", e.message)
    );
}

async function retry(fn, tries = 3) {
    for (let i = 0; ; i++) {
        try {
            return await fn();
        } catch (e) {
            if (i >= tries - 1) throw e;

            await new Promise(r =>
                setTimeout(r, 1500 * (i + 1))
            );
        }
    }
}

// ==================================================
// INITIALIZATION
// ==================================================

async function init(url) {
    connect(url);

    // جدول اللاعبين
    await retry(() => pool.query(`
        CREATE TABLE IF NOT EXISTS players (
            id BIGINT PRIMARY KEY,
            data JSONB NOT NULL,
            updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
    `));

    // جدول إعدادات المجموعات
    await retry(() => pool.query(`
        CREATE TABLE IF NOT EXISTS group_settings (
            id BIGINT PRIMARY KEY,
            data JSONB NOT NULL,
            updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
    `));

    // تحميل اللاعبين
    const playerResult = await retry(() =>
        pool.query("SELECT id, data FROM players")
    );

    players.clear();
    dirty.clear();

    for (const r of playerResult.rows) {
        players.set(
            String(r.id),
            typeof r.data === "string"
                ? JSON.parse(r.data)
                : r.data
        );
    }

    // تحميل إعدادات المجموعات
    const groupResult = await retry(() =>
        pool.query("SELECT id, data FROM group_settings")
    );

    groupSettings.clear();
    dirtyGroups.clear();

    for (const r of groupResult.rows) {
        groupSettings.set(
            String(r.id),
            typeof r.data === "string"
                ? JSON.parse(r.data)
                : r.data
        );
    }

    console.log(
        "✅ [DB] تم تحميل " +
        players.size + " لاعب و " +
        groupSettings.size + " مجموعة"
    );

    // حفظ دوري واحد للنظامين
    timer = setInterval(() => {
        flush().catch(() => {});
    }, FLUSH_MS);

    if (timer.unref) timer.unref();

    return players.size;
}

// ==================================================
// PLAYER API
// ==================================================

const get = id =>
    players.get(String(id)) || null;

const set = (id, p) => {
    players.set(String(id), p);
    dirty.add(String(id));
};

const touch = id =>
    dirty.add(String(id));

const all = () =>
    [...players.values()];

// ==================================================
// GROUP SETTINGS API
// ==================================================

const getGroup = id =>
    groupSettings.get(String(id)) || {};

const setGroup = (id, settings) => {
    const key = String(id);

    groupSettings.set(key, {
        ...getGroup(key),
        ...settings
    });

    dirtyGroups.add(key);

    return groupSettings.get(key);
};

const getGroupPrefix = id => {
    const settings = getGroup(id);

    return settings.prefix === undefined
        ? "!"
        : settings.prefix;
};

const setGroupPrefix = (id, prefix) =>
    setGroup(id, { prefix: String(prefix) });

// ==================================================
// SAVE PLAYERS
// ==================================================

async function savePlayers() {
    if (!pool || !dirty.size) return 0;

    const ids = [...dirty];
    dirty.clear();

    let done = 0;

    try {
        for (let i = 0; i < ids.length; i += 200) {
            const part = ids.slice(i, i + 200);

            const objs = part.map(id =>
                JSON.stringify(players.get(id))
            );

            await retry(() => pool.query(
                `INSERT INTO players (id, data, updated_at)
                 SELECT x, y::jsonb, now()
                 FROM unnest($1::bigint[], $2::text[]) AS t(x, y)
                 ON CONFLICT (id)
                 DO UPDATE SET
                    data = EXCLUDED.data,
                    updated_at = now()`,
                [part, objs]
            ));

            done += part.length;
        }

        return done;

    } catch (e) {
        ids.slice(done).forEach(id => dirty.add(id));

        console.error(
            "[DB] فشل حفظ اللاعبين:",
            e.message
        );

        throw e;
    }
}

// ==================================================
// SAVE GROUP SETTINGS
// ==================================================

async function saveGroups() {
    if (!pool || !dirtyGroups.size) return 0;

    const ids = [...dirtyGroups];
    dirtyGroups.clear();

    let done = 0;

    try {
        for (let i = 0; i < ids.length; i += 200) {
            const part = ids.slice(i, i + 200);

            const objs = part.map(id =>
                JSON.stringify(groupSettings.get(id))
            );

            await retry(() => pool.query(
                `INSERT INTO group_settings (id, data, updated_at)
                 SELECT x, y::jsonb, now()
                 FROM unnest($1::bigint[], $2::text[]) AS t(x, y)
                 ON CONFLICT (id)
                 DO UPDATE SET
                    data = EXCLUDED.data,
                    updated_at = now()`,
                [part, objs]
            ));

            done += part.length;
        }

        return done;

    } catch (e) {
        ids.slice(done).forEach(id =>
            dirtyGroups.add(id)
        );

        console.error(
            "[DB] فشل حفظ إعدادات المجموعات:",
            e.message
        );

        throw e;
    }
}

// ==================================================
// FLUSH
// ==================================================

async function doFlush() {
    const [playerCount, groupCount] = await Promise.all([
        savePlayers(),
        saveGroups()
    ]);

    return {
        players: playerCount,
        groups: groupCount
    };
}

function flush() {
    const run = flushing.then(doFlush);

    flushing = run.catch(() => {});

    return run;
}

// ==================================================
// SHUTDOWN
// ==================================================

async function shutdown() {
    if (timer) clearInterval(timer);

    try {
        const result = await Promise.race([
            flush(),
            new Promise((_, reject) =>
                setTimeout(
                    () => reject(new Error("timeout")),
                    8000
                )
            )
        ]);

        console.log(
            "💾 [DB] حُفظ " +
            result.players + " لاعب و " +
            result.groups + " مجموعة"
        );

    } catch (e) {
        console.error(
            "[DB] لم يكتمل الحفظ عند الإغلاق:",
            e.message
        );
    }

    try {
        if (pool) await pool.end();
    } catch (e) {}
}

// ==================================================
// STATS
// ==================================================

const stats = () => ({
    players: players.size,
    dirty: dirty.size,
    groups: groupSettings.size,
    dirtyGroups: dirtyGroups.size
});

// ==================================================
// EXPORTS
// ==================================================

module.exports = {
    init,

    // Players
    get,
    set,
    touch,
    all,

    // Groups
    getGroup,
    setGroup,
    getGroupPrefix,
    setGroupPrefix,

    // Database
    flush,
    shutdown,
    stats
};
