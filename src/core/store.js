
/**
 * ╔══════════════════════════════════════╗
 * ║              AYLA STORE               ║
 * ║                 v2.3                 ║
 * ╚══════════════════════════════════════╝
 *
 * تخزين اقتصادي لـ PostgreSQL / Neon
 * اللاعبون: كل 20 دقيقة عند وجود تغييرات.
 * المجموعات: كل 5 دقائق عند وجود تغييرات.
 * الزواج: يُحفظ مباشرة عند إجراء تغيير.
 * النسخ الاحتياطي: تصدير واستيراد JSON.
 * الإغلاق: محاولة حفظ كل البيانات المعلّقة.
 */

const { Pool } = require("pg");

// ==================================================
// SETTINGS
// ==================================================

const PLAYER_FLUSH_MS =
    Number(process.env.FLUSH_MINUTES || 20) * 60 * 1000;

const GROUP_FLUSH_MS = 5 * 60 * 1000;
const BATCH_SIZE = 200;

// ==================================================
// MEMORY
// ==================================================

const players = new Map();
const dirty = new Set();

const groupSettings = new Map();
const dirtyGroups = new Set();

// ==================================================
// DATABASE
// ==================================================

let pool = null;
let playerTimer = null;
let groupTimer = null;

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

    pool.on("error", e => {
        console.error("[DB] اتصال خامل انقطع:", e.message);
    });
}

async function retry(fn, tries = 3) {
    for (let i = 0; ; i++) {
        try {
            return await fn();
        } catch (e) {
            if (i >= tries - 1) throw e;

            await new Promise(resolve =>
                setTimeout(resolve, 1500 * (i + 1))
            );
        }
    }
}

function query(sql, params = []) {
    if (!pool) {
        throw new Error("قاعدة البيانات غير متصلة.");
    }

    return retry(() => pool.query(sql, params));
}

// ==================================================
// INITIALIZATION
// ==================================================

async function init(url) {
    connect(url);

    await retry(() => pool.query(`
        CREATE TABLE IF NOT EXISTS players (
            id BIGINT PRIMARY KEY,
            data JSONB NOT NULL,
            updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
    `));

    await retry(() => pool.query(`
        CREATE TABLE IF NOT EXISTS group_settings (
            id BIGINT PRIMARY KEY,
            data JSONB NOT NULL,
            updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
    `));

    // تحميل اللاعبين مرة واحدة
    const playerResult = await retry(() =>
        pool.query("SELECT id, data FROM players")
    );

    players.clear();
    dirty.clear();

    for (const row of playerResult.rows) {
        players.set(
            String(row.id),
            typeof row.data === "string"
                ? JSON.parse(row.data)
                : row.data
        );
    }

    // تحميل إعدادات المجموعات مرة واحدة
    const groupResult = await retry(() =>
        pool.query("SELECT id, data FROM group_settings")
    );

    groupSettings.clear();
    dirtyGroups.clear();

    for (const row of groupResult.rows) {
        groupSettings.set(
            String(row.id),
            typeof row.data === "string"
                ? JSON.parse(row.data)
                : row.data
        );
    }

    console.log(
        `✅ [DB] ${players.size} لاعب | ${groupSettings.size} مجموعة`
    );

    playerTimer = setInterval(() => {
        flushPlayers().catch(() => {});
    }, PLAYER_FLUSH_MS);

    groupTimer = setInterval(() => {
        flushGroups().catch(() => {});
    }, GROUP_FLUSH_MS);

    if (playerTimer.unref) playerTimer.unref();
    if (groupTimer.unref) groupTimer.unref();

    return players.size;
}

// ==================================================
// PLAYERS API
// ==================================================

const get = id =>
    players.get(String(id)) || null;

const set = (id, data) => {
    const key = String(id);
    players.set(key, data);
    dirty.add(key);
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
        for (let i = 0; i < ids.length; i += BATCH_SIZE) {
            const part = ids.slice(i, i + BATCH_SIZE);

            const data = part.map(id =>
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
                [part, data]
            ));

            done += part.length;
        }

        return done;

    } catch (e) {
        ids.slice(done).forEach(id => dirty.add(id));

        console.error("[DB] فشل حفظ اللاعبين:", e.message);
        throw e;
    }
}

// ==================================================
// SAVE GROUPS
// ==================================================

async function saveGroups() {
    if (!pool || !dirtyGroups.size) return 0;

    const ids = [...dirtyGroups];
    dirtyGroups.clear();

    let done = 0;

    try {
        for (let i = 0; i < ids.length; i += BATCH_SIZE) {
            const part = ids.slice(i, i + BATCH_SIZE);

            const data = part.map(id =>
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
                [part, data]
            ));

            done += part.length;
        }

        return done;

    } catch (e) {
        ids.slice(done).forEach(id => dirtyGroups.add(id));

        console.error("[DB] فشل حفظ المجموعات:", e.message);
        throw e;
    }
}

// ==================================================
// SERIALIZED FLUSH
// ==================================================

function queueFlush(fn) {
    const run = flushing.then(fn);

    flushing = run.catch(() => {});

    return run;
}

const flushPlayers = () =>
    queueFlush(savePlayers);

const flushGroups = () =>
    queueFlush(saveGroups);

const flush = () =>
    queueFlush(async () => {
        const playerCount = await savePlayers();
        const groupCount = await saveGroups();

        return {
            players: playerCount,
            groups: groupCount
        };
    });

// ==================================================
// BACKUP / RESTORE
// ==================================================

function exportData() {
    const clone = value =>
        JSON.parse(JSON.stringify(value));

    return {
        format: "AYLA_BACKUP",
        version: 1,
        createdAt: new Date().toISOString(),

        players: [...players.entries()].map(([id, data]) => [
            id,
            clone(data)
        ]),

        groups: [...groupSettings.entries()].map(([id, data]) => [
            id,
            clone(data)
        ])
    };
}

function importData(backup, options = {}) {
    const overwrite = options.overwrite === true;

    if (!backup || typeof backup !== "object") {
        throw new Error("ملف النسخة غير صالح.");
    }

    if (
        backup.format !== "AYLA_BACKUP" ||
        backup.version !== 1
    ) {
        throw new Error("صيغة النسخة أو إصدارها غير مدعوم.");
    }

    if (
        !Array.isArray(backup.players) ||
        !Array.isArray(backup.groups)
    ) {
        throw new Error("بيانات اللاعبين أو المجموعات غير موجودة.");
    }

    const validId = id =>
        typeof id === "string" &&
        /^-?\d+$/.test(id);

    const validEntries = (entries, label) => {
        const seen = new Set();

        for (const entry of entries) {
            if (
                !Array.isArray(entry) ||
                entry.length !== 2 ||
                !validId(entry[0]) ||
                !entry[1] ||
                typeof entry[1] !== "object" ||
                Array.isArray(entry[1])
            ) {
                throw new Error(
                    `توجد بيانات غير صالحة في ${label}.`
                );
            }

            if (seen.has(entry[0])) {
                throw new Error(
                    `يوجد معرف مكرر في ${label}.`
                );
            }

            seen.add(entry[0]);
            JSON.stringify(entry[1]);
        }
    };

    validEntries(backup.players, "اللاعبين");
    validEntries(backup.groups, "المجموعات");

    let playersImported = 0;
    let groupsImported = 0;
    let playersSkipped = 0;
    let groupsSkipped = 0;

    for (const [id, data] of backup.players) {
        if (players.has(id) && !overwrite) {
            playersSkipped++;
            continue;
        }

        players.set(id, data);
        dirty.add(id);
        playersImported++;
    }

    for (const [id, data] of backup.groups) {
        if (groupSettings.has(id) && !overwrite) {
            groupsSkipped++;
            continue;
        }

        groupSettings.set(id, data);
        dirtyGroups.add(id);
        groupsImported++;
    }

    return {
        playersImported,
        groupsImported,
        playersSkipped,
        groupsSkipped
    };
}

// ==================================================
// DATABASE INFORMATION
// ==================================================

async function databaseInfo() {
    if (!pool) throw new Error("قاعدة البيانات غير متصلة");

    const result = await retry(() => pool.query(`
        SELECT
            current_database() AS database_name,

            pg_database_size(current_database())::bigint
                AS database_bytes,

            pg_size_pretty(
                pg_database_size(current_database())
            ) AS database_size,

            (
                SELECT count(*)
                FROM pg_stat_activity
                WHERE datname = current_database()
            )::integer AS connections,

            (
                SELECT COALESCE(sum(n_live_tup), 0)
                FROM pg_stat_user_tables
            )::bigint AS estimated_rows,

            (
                SELECT COALESCE(sum(heap_blks_hit), 0)
                FROM pg_statio_user_tables
            )::bigint AS cache_hits,

            (
                SELECT COALESCE(sum(heap_blks_read), 0)
                FROM pg_statio_user_tables
            )::bigint AS disk_reads,

            (
                SELECT COALESCE(sum(pg_total_relation_size(relid)), 0)
                FROM pg_stat_user_tables
            )::bigint AS tables_bytes
    `));

    const row = result.rows[0];

    const hits = Number(row.cache_hits || 0);
    const reads = Number(row.disk_reads || 0);
    const total = hits + reads;

    return {
        name: row.database_name,
        size: row.database_size,
        bytes: Number(row.database_bytes || 0),
        tablesBytes: Number(row.tables_bytes || 0),
        connections: Number(row.connections || 0),
        estimatedRows: Number(row.estimated_rows || 0),
        cacheHitRate: total
            ? ((hits / total) * 100).toFixed(1)
            : null
    };
}

// ==================================================
// SHUTDOWN
// ==================================================

async function shutdown() {
    if (playerTimer) clearInterval(playerTimer);
    if (groupTimer) clearInterval(groupTimer);

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
            `[DB] حفظ ${result.players} لاعب و${result.groups} مجموعة`
        );

    } catch (e) {
        console.error("[DB] تعذّر إكمال الحفظ:", e.message);
    }

    try {
        if (pool) await pool.end();
    } catch (e) {}
}

// ==================================================
// LOCAL STATISTICS
// ==================================================

const stats = () => ({
    players: players.size,
    dirtyPlayers: dirty.size,

    groups: groupSettings.size,
    dirtyGroups: dirtyGroups.size,

    connected: !!pool
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
    query,

    // Backup / Restore
    exportData,
    importData,

    // Flush
    flush,
    flushPlayers,
    flushGroups,

    // Information
    databaseInfo,
    shutdown,
    stats
};
