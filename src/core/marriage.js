
/**
 * ╔══════════════════════════════════════╗
 * ║          AYLA MARRIAGE CORE          ║
 * ║                 v2.0                 ║
 * ╚══════════════════════════════════════╝
 *
 * - تسجيل الجنس
 * - طلبات الزواج والموافقة والرفض
 * - المهر والتحويلات المالية
 * - الطلاق والخلع
 * - سجل الزيجات
 * - توافق الأسماء
 * - PostgreSQL persistence
 * - Atomic financial transactions
 * - Serialized marriage operations
 */

const crypto = require("crypto");
const store = require("./store");
const ui = require("../game/ui");
const { hash } = require("../lib/util");

const TABLE = "ayla_marriage";
const REQUEST_TTL = 7 * 24 * 60 * 60 * 1000;

const state = {
    profiles: {},
    requests: {},
    marriages: {},
    history: []
};

let initialized = false;
let saveTimer = null;
let operationQueue = Promise.resolve();

const id = value => String(value);

function requireInit() {
    if (!initialized) {
        throw new Error("نظام الزواج لم يتم تحميله بعد.");
    }
}

function makeId() {
    return crypto.randomUUID();
}

function clone(value) {
    return JSON.parse(JSON.stringify(value));
}

function replaceState(next) {
    state.profiles = next.profiles;
    state.requests = next.requests;
    state.marriages = next.marriages;
    state.history = next.history;
}

function snapshot() {
    return {
        profiles: state.profiles,
        requests: state.requests,
        marriages: state.marriages,
        history: state.history
    };
}

function enqueue(callback) {
    const operation = operationQueue.then(callback);

    operationQueue = operation.catch(error => {
        console.error("[AYLA MARRIAGE QUEUE]", error.message);
    });

    return operation;
}

function findMarriage(userId, source = state) {
    const key = id(userId);

    return Object.values(source.marriages).find(m =>
        m.status === "married" &&
        (m.husband === key || m.wife === key)
    ) || null;
}

function getProfile(userId) {
    return state.profiles[id(userId)] || null;
}

function getRequest(requestId) {
    return state.requests[String(requestId)] || null;
}

function isExpired(request) {
    const created = new Date(request.createdAt).getTime();

    return !Number.isFinite(created) ||
        Date.now() - created > REQUEST_TTL;
}

function cleanExpiredRequests(source) {
    let changed = false;

    for (const request of Object.values(source.requests)) {
        if (
            request.status === "pending" &&
            isExpired(request)
        ) {
            request.status = "expired";
            request.expiredAt = new Date().toISOString();
            changed = true;
        }
    }

    return changed;
}

// ==================================================
// DATABASE INITIALIZATION
// ==================================================

async function init() {
    if (initialized) return;

    await store.query(`
        CREATE TABLE IF NOT EXISTS ${TABLE} (
            id SMALLINT PRIMARY KEY,
            data JSONB NOT NULL,
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    `);

    const result = await store.query(
        `SELECT data FROM ${TABLE} WHERE id = 1`
    );

    if (result.rows.length) {
        const saved = result.rows[0].data;
        const parsed = typeof saved === "string"
            ? JSON.parse(saved)
            : saved;

        state.profiles = parsed.profiles || {};
        state.requests = parsed.requests || {};
        state.marriages = parsed.marriages || {};
        state.history = parsed.history || [];
    }

    initialized = true;

    const changed = cleanExpiredRequests(state);

    if (changed) {
        await saveNow();
    }

    console.log(
        `[AYLA MARRIAGE] تم تحميل ${Object.keys(state.marriages).length} سجل زواج`
    );
}

// ==================================================
// PERSISTENCE
// ==================================================

async function writeState(client, data) {
    await client.query(`
        INSERT INTO ${TABLE} (id, data, updated_at)
        VALUES (1, $1::jsonb, NOW())
        ON CONFLICT (id)
        DO UPDATE SET
            data = EXCLUDED.data,
            updated_at = NOW()
    `, [JSON.stringify(data)]);
}

async function save() {
    requireInit();

    const data = JSON.stringify(snapshot());

    await store.query(`
        INSERT INTO ${TABLE} (id, data, updated_at)
        VALUES (1, $1::jsonb, NOW())
        ON CONFLICT (id)
        DO UPDATE SET
            data = EXCLUDED.data,
            updated_at = NOW()
    `, [data]);
}

function scheduleSave() {
    if (saveTimer) clearTimeout(saveTimer);

    saveTimer = setTimeout(() => {
        saveTimer = null;

        enqueue(() => save()).catch(error => {
            console.error("[AYLA MARRIAGE SAVE]", error.message);
        });
    }, 3000);

    if (saveTimer.unref) saveTimer.unref();
}

async function saveNow() {
    requireInit();

    if (saveTimer) {
        clearTimeout(saveTimer);
        saveTimer = null;
    }

    return enqueue(() => save());
}

/**
 * حفظ سجل الزواج وأرصدة اللاعبين داخل معاملة واحدة.
 * لا يتم تعديل الحالة المعتمدة في الذاكرة إلا بعد COMMIT.
 */
async function commitFinancialChange(nextState, playerUpdates) {
    await store.transaction(async client => {
        for (const update of playerUpdates) {
            await client.query(`
                INSERT INTO players (id, data, updated_at)
                VALUES ($1, $2::jsonb, NOW())
                ON CONFLICT (id)
                DO UPDATE SET
                    data = EXCLUDED.data,
                    updated_at = NOW()
            `, [
                update.id,
                JSON.stringify(update.data)
            ]);
        }

        await writeState(client, nextState);
    });

    // بعد نجاح COMMIT فقط
    for (const update of playerUpdates) {
        store.set(update.id, update.data);
    }

    replaceState(nextState);
}

// ==================================================
// GENDER
// ==================================================

function setGender(userId, gender) {
    requireInit();

    const key = id(userId);

    if (!["male", "female"].includes(gender)) {
        throw new Error("اختيار الجنس غير صالح.");
    }

    if (findMarriage(key)) {
        throw new Error("لا يمكن تغيير الجنس أثناء وجود زواج قائم.");
    }

    const old = getProfile(key);

    if (old?.gender && old.gender !== gender) {
        throw new Error("تم تسجيل الجنس مسبقًا ولا يمكن تغييره.");
    }

    state.profiles[key] = {
        gender,
        registeredAt: old?.registeredAt || new Date().toISOString()
    };

    scheduleSave();

    return state.profiles[key];
}

function getGender(userId) {
    return getProfile(userId)?.gender || null;
}

// ==================================================
// PLAYER BALANCE
// ==================================================

function getPlayer(user) {
    if (!user || user.is_bot) {
        throw new Error("الحساب غير صالح.");
    }

    return ui.ensure(user);
}

function getBalance(user) {
    const balance = Number(getPlayer(user).coins || 0);

    if (!Number.isSafeInteger(balance) || balance < 0) {
        throw new Error("رصيد اللاعب غير صالح.");
    }

    return balance;
}

function getStoredPlayer(userId) {
    const player = store.get(userId);

    if (!player) {
        throw new Error("تعذر تحميل بيانات أحد الطرفين.");
    }

    const balance = Number(player.coins || 0);

    if (!Number.isSafeInteger(balance) || balance < 0) {
        throw new Error("رصيد اللاعب غير صالح.");
    }

    return {
        ...player,
        coins: balance
    };
}

// ==================================================
// MARRIAGE REQUESTS
// ==================================================

function createRequest(husband, wife, dowry, chatId) {
    requireInit();

    if (!husband || !wife || husband.is_bot || wife.is_bot) {
        throw new Error("لا يمكن إرسال طلب لهذا الحساب.");
    }

    const husbandId = id(husband.id);
    const wifeId = id(wife.id);

    if (husbandId === wifeId) {
        throw new Error("لا يمكنك الزواج من نفسك.");
    }

    if (getGender(husbandId) !== "male") {
        throw new Error("يجب أن يكون صاحب الطلب مسجلًا كذكر.");
    }

    if (getGender(wifeId) !== "female") {
        throw new Error("يجب أن يكون الطرف الآخر مسجلًا كأنثى.");
    }

    if (findMarriage(husbandId) || findMarriage(wifeId)) {
        throw new Error("أحد الطرفين متزوج بالفعل.");
    }

    if (!Number.isSafeInteger(dowry) || dowry < 0) {
        throw new Error("المهر غير صالح.");
    }

    if (getBalance(husband) < dowry) {
        throw new Error("رصيدك لا يكفي لدفع هذا المهر.");
    }

    cleanExpiredRequests(state);

    const pending = Object.values(state.requests).some(request =>
        request.status === "pending" &&
        (
            request.husband === husbandId ||
            request.wife === husbandId ||
            request.husband === wifeId ||
            request.wife === wifeId
        )
    );

    if (pending) {
        scheduleSave();
        throw new Error("لدى أحد الطرفين طلب زواج معلّق بالفعل.");
    }

    const requestId = makeId();

    const request = {
        id: requestId,
        husband: husbandId,
        wife: wifeId,
        husbandName: husband.first_name || "العريس",
        wifeName: wife.first_name || "العروس",
        dowry,
        chatId: id(chatId),
        status: "pending",
        createdAt: new Date().toISOString()
    };

    state.requests[requestId] = request;
    scheduleSave();

    return request;
}

// ==================================================
// ACCEPT REQUEST
// ==================================================

async function acceptRequest(requestId, user) {
    requireInit();

    if (!user || user.is_bot) {
        throw new Error("الحساب غير صالح.");
    }

    return enqueue(async () => {
        const request = getRequest(requestId);

        if (!request || request.status !== "pending") {
            throw new Error("طلب الزواج غير موجود أو انتهت صلاحيته.");
        }

        if (id(user.id) !== request.wife) {
            throw new Error("هذا الطلب ليس موجهًا إليك.");
        }

        if (isExpired(request)) {
            request.status = "expired";
            request.expiredAt = new Date().toISOString();
            await save();
            throw new Error("انتهت صلاحية طلب الزواج.");
        }

        const next = clone(snapshot());

        const nextRequest = next.requests[requestId];

        if (
            findMarriage(request.husband, next) ||
            findMarriage(request.wife, next)
        ) {
            nextRequest.status = "cancelled";
            await writeStateOnly(next);
            replaceState(next);

            throw new Error("أحد الطرفين أصبح متزوجًا.");
        }

        const husband = getStoredPlayer(request.husband);
        const wife = getStoredPlayer(request.wife);

        if (husband.coins < request.dowry) {
            nextRequest.status = "cancelled";
            await writeStateOnly(next);
            replaceState(next);

            throw new Error("رصيد العريس لم يعد يكفي للمهر.");
        }

        if (wife.coins + request.dowry > Number.MAX_SAFE_INTEGER) {
            throw new Error("رصيد الزوجة سيتجاوز الحد المسموح.");
        }

        husband.coins -= request.dowry;
        wife.coins += request.dowry;

        const marriage = {
            id: request.id,
            husband: request.husband,
            wife: request.wife,
            husbandName: request.husbandName,
            wifeName: request.wifeName,
            dowry: request.dowry,
            chatId: request.chatId,
            status: "married",
            createdAt: new Date().toISOString()
        };

        next.marriages[marriage.id] = marriage;

        nextRequest.status = "accepted";
        nextRequest.acceptedAt = new Date().toISOString();

        await commitFinancialChange(next, [
            { id: request.husband, data: husband },
            { id: request.wife, data: wife }
        ]);

        return marriage;
    });
}

async function writeStateOnly(data) {
    await store.transaction(async client => {
        await writeState(client, data);
    });
}

// ==================================================
// REJECT REQUEST
// ==================================================

async function rejectRequest(requestId, user) {
    requireInit();

    if (!user || user.is_bot) {
        throw new Error("الحساب غير صالح.");
    }

    return enqueue(async () => {
        const request = getRequest(requestId);

        if (!request || request.status !== "pending") {
            throw new Error("طلب الزواج غير موجود أو انتهت صلاحيته.");
        }

        if (id(user.id) !== request.wife) {
            throw new Error("لا يمكنك رفض طلب غير موجه إليك.");
        }

        const next = clone(snapshot());
        const target = next.requests[requestId];

        target.status = "rejected";
        target.rejectedAt = new Date().toISOString();

        await writeStateOnly(next);
        replaceState(next);

        return target;
    });
}

// ==================================================
// DIVORCE / KHULA
// ==================================================

async function endMarriage(userId, type, compensation = 0) {
    requireInit();

    const key = id(userId);

    if (!["divorce", "khula"].includes(type)) {
        throw new Error("نوع العملية غير صالح.");
    }

    if (!Number.isSafeInteger(compensation) || compensation < 0) {
        throw new Error("قيمة التعويض غير صالحة.");
    }

    if (type === "divorce" && compensation !== 0) {
        throw new Error("لا يوجد تعويض في عملية الطلاق.");
    }

    return enqueue(async () => {
        const marriage = findMarriage(key);

        if (!marriage) {
            throw new Error("لا يوجد زواج قائم لديك.");
        }

        if (type === "divorce" && marriage.husband !== key) {
            throw new Error("الطلاق متاح للزوج فقط.");
        }

        if (type === "khula" && marriage.wife !== key) {
            throw new Error("الخلع متاح للزوجة فقط.");
        }

        if (type === "khula" && compensation > marriage.dowry) {
            throw new Error("التعويض لا يمكن أن يتجاوز المهر.");
        }

        const next = clone(snapshot());
        const nextMarriage = next.marriages[marriage.id];

        const updates = [];

        if (type === "khula") {
            const wife = getStoredPlayer(marriage.wife);
            const husband = getStoredPlayer(marriage.husband);

            if (wife.coins < compensation) {
                throw new Error("رصيد الزوجة لا يكفي للتعويض.");
            }

            if (husband.coins + compensation > Number.MAX_SAFE_INTEGER) {
                throw new Error("رصيد الزوج سيتجاوز الحد المسموح.");
            }

            wife.coins -= compensation;
            husband.coins += compensation;

            updates.push(
                { id: marriage.wife, data: wife },
                { id: marriage.husband, data: husband }
            );
        }

        const endedAt = new Date().toISOString();

        nextMarriage.status =
            type === "divorce" ? "divorced" : "khula";

        nextMarriage.endedAt = endedAt;
        nextMarriage.compensation = compensation;

        next.history.push({
            marriageId: marriage.id,
            husband: marriage.husband,
            wife: marriage.wife,
            type,
            compensation,
            endedAt
        });

        if (updates.length) {
            await commitFinancialChange(next, updates);
        } else {
            await writeStateOnly(next);
            replaceState(next);
        }

        return nextMarriage;
    });
}

// ==================================================
// QUERIES
// ==================================================

function marriageOf(userId) {
    requireInit();
    return findMarriage(userId);
}

function requestsFor(userId) {
    requireInit();

    const key = id(userId);
    const changed = cleanExpiredRequests(state);

    if (changed) scheduleSave();

    return Object.values(state.requests).filter(request =>
        request.status === "pending" &&
        (
            request.husband === key ||
            request.wife === key
        )
    );
}

function groupMarriages(chatId) {
    requireInit();

    const key = id(chatId);

    return Object.values(state.marriages).filter(marriage =>
        marriage.status === "married" &&
        marriage.chatId === key
    );
}

function groupHistory(chatId) {
    requireInit();

    const key = id(chatId);

    return state.history.filter(item => {
        const marriage = state.marriages[item.marriageId];

        return marriage && marriage.chatId === key;
    });
}

// ==================================================
// LOVE COMPATIBILITY
// ==================================================

function compatibility(name1, name2) {
    const a = String(name1 || "").trim().toLowerCase();
    const b = String(name2 || "").trim().toLowerCase();

    if (!a || !b) {
        throw new Error("يجب كتابة الاسمين.");
    }

    if (a.length > 60 || b.length > 60) {
        throw new Error("الاسم طويل جدًا.");
    }

    const names = [a, b].sort();

    return 40 + (hash(names.join("|")) % 61);
}

// ==================================================
// EXPORTS
// ==================================================

module.exports = {
    init,
    saveNow,

    setGender,
    getGender,
    getProfile,

    createRequest,
    acceptRequest,
    rejectRequest,

    endMarriage,

    marriageOf,
    requestsFor,
    groupMarriages,
    groupHistory,

    compatibility
};
