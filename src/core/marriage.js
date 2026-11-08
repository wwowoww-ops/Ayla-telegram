
/**
 * ╔══════════════════════════════════════╗
 * ║           AYLA MARRIAGE CORE          ║
 * ║                 v1.0                 ║
 * ╚══════════════════════════════════════╝
 *
 * نظام الزواج:
 * - تسجيل الجنس
 * - طلبات الزواج
 * - الموافقة والرفض
 * - المهر
 * - الطلاق والخلع
 * - سجل الزيجات
 * - نسبة توافق الأسماء
 * - الحفظ الدائم في PostgreSQL
 */

const crypto = require("crypto");
const store = require("./store");
const ui = require("../game/ui");
const { hash } = require("../lib/util");

const TABLE = "ayla_marriage";

const state = {
    profiles: {},
    requests: {},
    marriages: {},
    history: []
};

let initialized = false;
let saveQueue = Promise.resolve();
let saveTimer = null;

const id = value => String(value);

function requireInit() {
    if (!initialized) {
        throw new Error("نظام الزواج لم يتم تحميله بعد.");
    }
}

function findMarriage(userId) {
    const key = id(userId);

    return Object.values(state.marriages).find(m =>
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

function makeId() {
    return crypto.randomUUID();
}

// ==================================================
// INITIALIZATION
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

    console.log(
        `[AYLA MARRIAGE] تم تحميل ${Object.keys(state.marriages).length} سجل زواج`
    );
}

// ==================================================
// SAVE
// ==================================================

async function save() {
    requireInit();

    const snapshot = JSON.stringify({
        profiles: state.profiles,
        requests: state.requests,
        marriages: state.marriages,
        history: state.history
    });

    const operation = saveQueue.then(() =>
        store.query(`
            INSERT INTO ${TABLE} (id, data, updated_at)
            VALUES (1, $1::jsonb, NOW())
            ON CONFLICT (id)
            DO UPDATE SET
                data = EXCLUDED.data,
                updated_at = NOW()
        `, [snapshot])
    );

    saveQueue = operation.catch(error => {
        console.error("[AYLA MARRIAGE SAVE]", error.message);
    });

    return operation;
}

function scheduleSave() {
    if (saveTimer) clearTimeout(saveTimer);

    saveTimer = setTimeout(() => {
        saveTimer = null;
        save().catch(error => {
            console.error("[AYLA MARRIAGE]", error.message);
        });
    }, 3000);

    if (saveTimer.unref) saveTimer.unref();
}

async function saveNow() {
    if (saveTimer) {
        clearTimeout(saveTimer);
        saveTimer = null;
    }

    await save();
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
    return Number(getPlayer(user).coins || 0);
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
        throw new Error("لا يمكنك الزواج من نفسك 😂");
    }

    if (getGender(husbandId) !== "male") {
        throw new Error("يجب أن يكون صاحب الطلب مسجلًا كذكر.");
    }

    if (getGender(wifeId) !== "female") {
        throw new Error("يجب أن تكون الطرف الآخر مسجلة كأنثى.");
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

    const pending = Object.values(state.requests).some(r =>
        r.status === "pending" &&
        (r.husband === husbandId || r.wife === husbandId ||
         r.husband === wifeId || r.wife === wifeId)
    );

    if (pending) {
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
// ACCEPT / REJECT
// ==================================================

async function acceptRequest(requestId, user) {
    requireInit();

    const request = getRequest(requestId);

    if (!request || request.status !== "pending") {
        throw new Error("طلب الزواج غير موجود أو انتهت صلاحيته.");
    }

    if (id(user.id) !== request.wife) {
        throw new Error("هذا الطلب ليس موجهًا إليك.");
    }

    if (findMarriage(request.husband) || findMarriage(request.wife)) {
        request.status = "cancelled";
        await saveNow();
        throw new Error("أحد الطرفين أصبح متزوجًا.");
    }

    const husband = store.get(request.husband);
    const wife = store.get(request.wife);

    if (!husband || !wife) {
        throw new Error("تعذر تحميل بيانات أحد الطرفين.");
    }

    const balance = Number(husband.coins || 0);

    if (balance < request.dowry) {
        request.status = "cancelled";
        await saveNow();
        throw new Error("رصيد العريس لم يعد يكفي للمهر.");
    }

    const wifeBalance = Number(wife.coins || 0);

    if (wifeBalance + request.dowry > Number.MAX_SAFE_INTEGER) {
        throw new Error("رصيد الزوجة سيتجاوز الحد المسموح.");
    }

    // تحديث رصيد الطرفين
    husband.coins = balance - request.dowry;
    wife.coins = wifeBalance + request.dowry;

    store.touch(request.husband);
    store.touch(request.wife);

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

    state.marriages[marriage.id] = marriage;

    request.status = "accepted";
    request.acceptedAt = new Date().toISOString();

    await saveNow();

    return marriage;
}

async function rejectRequest(requestId, user) {
    requireInit();

    const request = getRequest(requestId);

    if (!request || request.status !== "pending") {
        throw new Error("طلب الزواج غير موجود أو انتهت صلاحيته.");
    }

    if (id(user.id) !== request.wife) {
        throw new Error("لا يمكنك رفض طلب غير موجه إليك.");
    }

    request.status = "rejected";
    request.rejectedAt = new Date().toISOString();

    await saveNow();

    return request;
}

// ==================================================
// DIVORCE / KHULA
// ==================================================

async function endMarriage(userId, type, compensation = 0) {
    requireInit();

    const key = id(userId);
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

    if (!["divorce", "khula"].includes(type)) {
        throw new Error("نوع العملية غير صالح.");
    }

    if (!Number.isSafeInteger(compensation) || compensation < 0) {
        throw new Error("قيمة التعويض غير صالحة.");
    }

    if (type === "divorce" && compensation !== 0) {
        throw new Error("لا يوجد تعويض في عملية الطلاق.");
    }

    if (type === "khula") {
        if (compensation > marriage.dowry) {
            throw new Error("التعويض لا يمكن أن يتجاوز المهر.");
        }

        const wife = store.get(marriage.wife);
        const husband = store.get(marriage.husband);

        if (!wife || !husband) {
            throw new Error("تعذر تحميل بيانات الطرفين.");
        }

        const wifeBalance = Number(wife.coins || 0);
        const husbandBalance = Number(husband.coins || 0);

        if (wifeBalance < compensation) {
            throw new Error("رصيد الزوجة لا يكفي للتعويض.");
        }

        if (husbandBalance + compensation > Number.MAX_SAFE_INTEGER) {
            throw new Error("رصيد الزوج سيتجاوز الحد المسموح.");
        }

        wife.coins = wifeBalance - compensation;
        husband.coins = husbandBalance + compensation;

        store.touch(marriage.wife);
        store.touch(marriage.husband);
    }

    marriage.status = type === "divorce" ? "divorced" : "khula";
    marriage.endedAt = new Date().toISOString();
    marriage.compensation = compensation;

    state.history.push({
        marriageId: marriage.id,
        husband: marriage.husband,
        wife: marriage.wife,
        type,
        compensation,
        endedAt: marriage.endedAt
    });

    await saveNow();

    return marriage;
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

    return Object.values(state.requests).filter(r =>
        r.status === "pending" &&
        (r.husband === key || r.wife === key)
    );
}

function groupMarriages(chatId) {
    requireInit();

    const key = id(chatId);

    return Object.values(state.marriages).filter(m =>
        m.status === "married" && m.chatId === key
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
