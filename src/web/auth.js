// التحقق من بيانات الدخول التي يرسلها تيليجرام للتطبيق المصغّر (initData)
// https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
const crypto = require("crypto");

const MAX_AGE_SECONDS = 48 * 3600;

// يرجع كائن المستخدم إن كانت البيانات صحيحة، وإلا null
function validateInitData(initData, botToken) {
    if (!initData || typeof initData !== "string" || initData.length > 4096) return null;
    const params = new URLSearchParams(initData);
    const hash = params.get("hash");
    if (!hash) return null;
    params.delete("hash");

    const check = [...params.entries()]
        .sort(([a], [b]) => (a < b ? -1 : 1))
        .map(([k, v]) => k + "=" + v)
        .join("\n");
    const secret = crypto.createHmac("sha256", "WebAppData").update(botToken).digest();
    const expected = crypto.createHmac("sha256", secret).update(check).digest("hex");

    const a = Buffer.from(expected), b = Buffer.from(hash);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

    const age = Date.now() / 1000 - Number(params.get("auth_date") || 0);
    if (!(age >= 0 && age < MAX_AGE_SECONDS) && !(age < 0 && age > -300)) return null;

    try {
        const user = JSON.parse(params.get("user"));
        return user && user.id ? user : null;
    } catch (e) {
        return null;
    }
}

module.exports = { validateInitData };