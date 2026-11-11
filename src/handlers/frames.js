
"use strict";

// معالج أزرار الإطارات
const store = require("../core/store");
const F = require("../game/frames");
const Q = require("../game/quests");
const E = require("../game/engine");
const { screenFrames } = require("../game/frameMenu");

module.exports = function (bot) {
    bot.callbackQuery(
        /^f:(\d+):(set|off|buy|cat|main)(?::([\w-]+))?$/,
        async ctx => {
            let answered = false;

            const answer = async (options = {}) => {
                if (answered) return;
                answered = true;
                await ctx.answerCallbackQuery(options).catch(() => {});
            };

            try {
                const uid = ctx.match[1];
                const action = ctx.match[2];
                const arg = ctx.match[3];

                // حماية الحساب
                if (String(ctx.from.id) !== uid) {
                    return answer({
                        text: "هذه القائمة ليست لك.",
                        show_alert: true
                    });
                }

                const P = store.get(uid);

                if (!P) {
                    return answer({
                        text: "اكتب حيواني أولًا لتبدأ اللعبة.",
                        show_alert: true
                    });
                }

                Q.settle(P, Date.now());

                let note = "";
                let cat = null;

                // فتح الصفحة الرئيسية
                if (action === "main") {
                    // لا نحتاج إلى تعديل البيانات
                }

                // فتح فئة
                else if (action === "cat") {
                    if (!arg || !F.CATS.some(c => c.id === arg)) {
                        return answer({ text: "الفئة غير موجودة." });
                    }

                    cat = arg;
                }

                // إزالة الإطار
                else if (action === "off") {
                    P.frame = null;
                    note = "🚫 أُزيل الإطار.";
                    store.touch(P.id);
                }

                // شراء إطار
                else if (action === "buy") {
                    const fr = F.byId(arg);

                    if (!fr || !fr.price) {
                        return answer({ text: "هذا الإطار لا يُشترى." });
                    }

                    if (F.isUnlocked(P, fr)) {
                        return answer({ text: "تملك هذا الإطار بالفعل." });
                    }

                    if (P.coins < fr.price) {
                        return answer({
                            text: "تحتاج " + E.fmt(fr.price) + " 🪙",
                            show_alert: true
                        });
                    }

                    P.coins -= fr.price;
                    P.fown = P.fown || {};
                    P.fown[fr.id] = true;
                    P.frame = fr.id;

                    note = `🛒 اشتريت إطار ${fr.name} وتم تفعيله.`;
                    cat = fr.cat;

                    store.touch(P.id);
                }

                // تفعيل إطار
                else if (action === "set") {
                    const fr = F.byId(arg);

                    if (!fr) {
                        return answer({ text: "الإطار غير معروف." });
                    }

                    if (!F.isUnlocked(P, fr)) {
                        return answer({
                            text: "🔒 " + (fr.text || "هذا الإطار مغلق."),
                            show_alert: true
                        });
                    }

                    P.frame = fr.id;
                    note = `✅ فُعّل إطار ${fr.name}.`;
                    cat = fr.cat;

                    store.touch(P.id);
                }

                const scr = screenFrames(P, note, cat);

                await answer({
                    text: note || "تم تحديث الإطارات."
                });

                await ctx.editMessageText(scr.text, {
                    parse_mode: "HTML",
                    reply_markup: scr.kb
                }).catch(error => {
                    const msg = String(
                        error.description || error.message || error
                    );

                    if (!/not modified/i.test(msg)) {
                        throw error;
                    }
                });

            } catch (error) {
                console.error(
                    "[FRAMES CALLBACK ERROR]",
                    error.stack || error.message || error
                );

                await answer({
                    text: "حدث خطأ أثناء تنفيذ العملية.",
                    show_alert: true
                });
            }
        }
    );
};
