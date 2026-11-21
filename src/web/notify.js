"use strict";
// إرسال رسائل تيليجرام للاعب من الخادم (مثل تنبيه الغارات). يُربط بالبوت عند التشغيل.
let api = null;
module.exports = {
    set(a) { api = a; },
    send(P, text) {
        try { if (api && P && P.notify !== false) api.sendMessage(P.id, text).catch(() => {}); } catch (e) { /* لا شيء */ }
    }
};
