
/**
 * ╔══════════════════════════════════════╗
 * ║            AYLA MARRIAGE             ║
 * ║                 v1.0                 ║
 * ╚══════════════════════════════════════╝
 */

const store = require("./store");
const ui = require("../game/ui");

const TABLE = "ayla_marriage";
const SAVE_DELAY = 3000;

let data = {
    profiles: {},
    requests: {},
    marriages: {},
    history: []
};

let initialized = false;
let saveTimer = null;
let saving = Promise.resolve();

const idOf = id => String(id);

function profile(id) {
    return data.profiles[idOf(id)] || null;
}

function marriageOf(id) {
    const key = idOf(id);

    return Object.values(data.marriages).find(m =>
        m.status === "married" &&
        (m.husband === key || m.wife === key)
    ) || null;
}

function clone(value) {
    return JSON.parse(JSON.stringify(value));
}

async function init() {
    if (initialized) return;

    await store.query(`
        CREATE TABLE IF NOT EXISTS ${TABLE} (
            id SMALLINT PRIMARY KEY,
            data JSONB NOT NULL,
            updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
    `);

    const result = await store.query(
        `SELECT data FROM ${TABLE} WHERE id = 1`
    );

    if (result.rows.length) {
        const saved = result.rows[0].data;

        data = typeof saved === "string"
            ? JSON.parse(saved)
            : saved;
    }

    data.profiles ||= {};
    data.requests ||= {};
    data.marriages ||= {};
    data.history ||= [];

    initialized = true;

    console.log(
        `[MARRIAGE] تم تحميل ${Object.keys(data.marriages).length} سجل زواج`
    );
}

async function saveNow() {
    if (!initialized) throw new Error("Marriage not initialized");

    const snapshot = JSON.stringify(data);

    const run = saving.then(() =>
        store.query(`
            INSERT INTO ${TABLE} (id, data, updated_at)
            VALUES (1, $1::jsonb, now())
            ON CONFLICT (id)
            DO UPDATE SET
                data = EXCLUDED.data,
                updated_at = now()
        `, [snapshot])
    );

    saving = run.catch(() => {});
    return run;
}

function scheduleSave() {
    if (saveTimer) clearTimeout(saveTimer);

    saveTimer = setTimeout(() => {
        saveNow().catch(error =>
            console.error("[MARRIAGE SAVE]", error.message)
        );
    }, SAVE_DELAY);

    if (saveTimer.unref) saveTimer.unref();
}

async function saveImmediately() {
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = null;
    await saveNow();
}

function setGender(id, gender) {
    if (!["male", "female"].includes(gender)) {
        throw new Error("الجنس غير صالح.");
    }

    const key = idOf(id);
    const current = profile(key);

    if (marriageOf(key)) {
        throw new Error("لا يمكن تغيير الجنس أثناء وجود زواج قائم.");
    }

    if (current && current.gender && current.gender !== gender) {
        throw new Error("لا يمكن تغيير الجنس بعد تسجيله.");
    }

    data.profiles[key] = {
        ...(current || {}),
        gender,
        registeredAt: current?.registeredAt || new Date().toISOString()
    };

    scheduleSave();

    return data.profiles[key];
}

function getGender(id) {
    return profile(id)?.gender || null;
}

function getPlayer(id, telegramUser) {
    return ui.ensure(telegramUser);
}

function createRequest(from, to, amount, chatId) {
    const husbandId = idOf(from.id);
    const wifeId = idOf(to.id);

    if (husbandId === wifeId) {
        throw new Error("لا يمكنك الزواج من نفسك 😂");
    }

    if (from.is_bot || to.is_bot) {
        throw new Error("لا يمكن الزواج من حساب بوت.");
    }

    if (getGender(husbandId) !== "male") {
        throw new Error("يجب أن يكون صاحب طلب الزواج مسجلًا كذكر.");
    }

    if (getGender(wifeId) !== "female") {
        throw new Error("الشخص الآخر يجب أن يكون مسجلًا كأنثى.");
    }

    if (marriageOf(husbandId) || marriageOf(wifeId)) {
        throw new Error("أحد الطرفين متزوج بالفعل.");
    }

    if (!Number.isSafeInteger(amount) || amount < 0) {
        throw new Error("قيمة المهر غير صحيحة.");
    }

    const pending = Object.values(data.requests).find(r =>
        r.status === "pending" &&
        r.husband === husbandId &&
        r.wife === wifeId
    );

    if (pending) {
        throw new Error("لديك طلب زواج معلّق لهذا الشخص.");
    }

    const requestId =
        Date.now().toString(36) +
        Math.random().toString(36).slice(2, 7);

    data.requests[requestId] = {
        id: requestId,
        husband: husbandId,
        wife: wifeId,
        husbandName: from.first_name || "العريس",
        wifeName: to.first_name || "العروس",
        dowry: amount,
        chatId: idOf(chatId),
        status: "pending",
        createdAt: new Date().toISOString()
    };

    scheduleSave();

    return data.requests[requestId];
}

async function acceptRequest(requestId, user) {
    const request = data.requests[requestId];

    if (!request || request.status !== "pending") {
        throw new Error("هذا الطلب لم يعد متاحًا.");
    }

    if (idOf(user.id) !== request.wife) {
        throw new Error("هذا الطلب مخصص للطرف الآخر.");
    }

    if (marriageOf(request.husband) || marriageOf(request.wife)) {
        request.status = "cancelled";
        await saveImmediately();
        throw new Error("تعذر إتمام الزواج لأن أحد الطرفين متزوج.");
    }

    const husband = store.get(request.husband);
    const wife = store.get(request.wife);

    if (!husband || !wife) {
        throw new Error("تعذر العثور على بيانات أحد الطرفين.");
    }

    if ((husband.coins || 0) < request.dowry) {
        request.status = "cancelled";
        await saveImmediately();
        throw new Error("رصيد العريس لم يعد يكفي للمهر.");
    }

    // خصم المهر وإضافته إلى رصيد الزوجة
    husband.coins -= request.dowry;
    wife.coins = Math.min(
        Number.MAX_SAFE_INTEGER,
        (wife.coins || 0) + request.dowry
    );

    store.touch(request.husband);
    store.touch(request.wife);

    const marriageId = request.id;

    data.marriages[marriageId] = {
        id: marriageId,
        husband: request.husband,
        wife: request.wife,
        husbandName: request.husbandName,
        wifeName: request.wifeName,
        dowry: request.dowry,
        status: "married",
        groupId: request.chatId,
        createdAt: new Date().toISOString()
    };

    request.status = "accepted";
    request.acceptedAt = new Date().toISOString();

    await saveImmediately();

    return data.marriages[marriageId];
}

async function rejectRequest(requestId, user) {
    const request = data.requests[requestId];

    if (!request || request.status !== "pending") {
        throw new Error("هذا الطلب لم يعد متاحًا.");
    }

    if (idOf(user.id) !== request.wife) {
        throw new Error("لا يمكنك رفض طلب ليس موجهًا إليك.");
    }

    request.status = "rejected";
    request.rejectedAt = new Date().toISOString();

    await saveImmediately();

    return request;
}

function requestsFor(id) {
    const key = idOf(id);

    return Object.values(data.requests).filter(r =>
        r.status === "pending" &&
        (r.husband === key || r.wife === key)
    );
}

function groupMarriages(chatId) {
    const key = idOf(chatId);

    return Object.values(data.marriages).filter(m =>
        m.status === "married" &&
        m.groupId === key
    );
}

function endMarriage(id, reason, compensation = 0) {
    const key = idOf(id);
    const marriage = marriageOf(key);

    if (!marriage) {
        throw new Error("لا يوجد زواج قائم لديك.");
    }

    if (reason === "divorce" && marriage.husband !== key) {
        throw new Error("أمر الطلاق متاح للزوج فقط. استخدم الزوجة أمر الخلع.");
    }

    if (reason === "khula" && marriage.wife !== key) {
        throw new Error("أمر الخلع متاح للزوجة فقط.");
    }

    if (!Number.isSafeInteger(compensation) || compensation < 0) {
        throw new Error("قيمة التعويض غير صحيحة.");
    }

    if (reason === "khula") {
        if (compensation > marriage.dowry) {
            throw new Error("التعويض لا يمكن أن يتجاوز المهر المسجل.");
        }

        const wife = store.get(marriage.wife);
        const husband = store.get(marriage.husband);

        if (!wife || !husband) {
            throw new Error("تعذر العثور على بيانات الطرفين.");
        }

        if ((wife.coins || 0) < compensation) {
            throw new Error("رصيد الزوجة لا يكفي للتعويض.");
        }

        wife.coins -= compensation;
        husband.coins = Math.min(
            Number.MAX_SAFE_INTEGER,
            (husband.coins || 0) + compensation
        );

        store.touch(marriage.wife);
        store.touch(marriage.husband);
    }

    marriage.status = reason === "divorce" ? "divorced" : "khula";
    marriage.endedAt = new Date().toISOString();
    marriage.compensation = compensation;

    data.history.push({
        marriageId: marriage.id,
        husband: marriage.husband,
        wife: marriage.wife,
        reason,
        compensation,
        endedAt: marriage.endedAt
    });

    saveImmediately().catch(error =>
        console.error("[MARRIAGE END SAVE]", error.message)
    );

    return marriage;
}

function compatibility(name1, name2) {
    const { hash } = require("../lib/util");

    const names = [
        String(name1).trim().toLowerCase(),
        String(name2).trim().toLowerCase()
    ].sort();

    const value = hash(names.join("|"));

    return 40 + (value % 61);
}

function historyForGroup(chatId) {
    const key = idOf(chatId);

    return data.history.filter(item => {
        const marriage = data.marriages[item.marriageId];
        return marriage && marriage.groupId === key;
    });
}

module.exports = {
    init,
    saveImmediately,

    setGender,
    getGender,
    profile,

    createRequest,
    acceptRequest,
    rejectRequest,
    requestsFor,

    marriageOf,
    groupMarriages,
    historyForGroup,
    endMarriage,

    compatibility
};
