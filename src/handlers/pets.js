// أزرار قوائم لعبة الحيوان (كل الشاشات تُحرَّر في مكانها)
const { InputFile } = require("grammy");
const store = require("../core/store");
const ui = require("../game/ui");

module.exports = function (bot) {
    bot.callbackQuery(/^g:(\d+):(.*)$/, async ctx => {
        try {
            // القائمة لصاحبها فقط
            if (String(ctx.from.id) !== ctx.match[1]) {
                return await ctx.answerCallbackQuery({ text: "هذه القائمة ليست لك. اكتب: حيواني" });
            }
            const P = store.get(ctx.match[1]);
            if (!P) return await ctx.answerCallbackQuery({ text: "اكتب: حيواني لتبدأ" });

            const r = ui.route(P, ctx.match[2].split(":"), ctx);
            store.touch(P.id);
            await ctx.answerCallbackQuery(r.error ? { text: r.error.replace(/<[^>]+>/g, ""), show_alert: false } : {});

            if (r.photo) {
                // نخزن file_id بعد أول إرسال حتى لا نرفع الصورة كل مرة
                const a = r.photo.art;
                let key = r.photo.spId, src;
                if (a) {
                    const art = require("../art");
                    key = ["art", a.sp, art.stageOf(a.lv), a.rarity, (a.els || []).filter(Boolean).join("+")].join("_");
                    try { src = ui.fileIds[key] || new InputFile(await art.render(a), "pet.jpg"); } catch (e) { src = null; }
                }
                if (!src) { key = r.photo.spId; src = ui.fileIds[key] || (r.photo.file && new InputFile(r.photo.file)); }
                if (!src) return await ctx.reply("لا توجد صورة بعد.");
                const m = await ctx.replyWithPhoto(src, { caption: r.photo.caption, parse_mode: "HTML" });
                if (m && m.photo && m.photo.length) ui.fileIds[key] = m.photo[m.photo.length - 1].file_id;
                return;
            }
            await ui.show(ctx, r.screen);
        } catch (e) {
            console.error("[PETS CALLBACK ERROR]", e && (e.stack || e.message));
            await ctx.answerCallbackQuery({ text: "حدث خطأ مؤقت" }).catch(() => {});
        }
    });
};