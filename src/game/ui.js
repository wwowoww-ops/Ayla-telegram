// شاشات لعبة الحيوان (النصوص والأزرار) وموجّه الضغطات
const fs = require("fs");
const path = require("path");
const { InlineKeyboard } = require("grammy");
const D = require("./data");
const E = require("./engine");
const store = require("../core/store");
const { esc, nameOf } = require("../lib/util");

const fmt = E.fmt;
const now = () => Date.now();
const rng = Math.random;
const bar = (pct, n = 10) => {
    const f = Math.max(0, Math.min(n, Math.round(pct / 100 * n)));
    return "█".repeat(f) + "░".repeat(n - f);
};
const starsTxt = n => (n ? "⭐".repeat(n) : "");
const elTxt = el => D.ELEMENTS[el].e + " " + D.ELEMENTS[el].n;
const rarOf = pet => D.RARITIES[E.spOf(pet).r];
const clean = s => String(s).replace(/[<>&]/g, "").trim().slice(0, 16);
const nameP = pet => E.spOf(pet).e + " " + esc(pet.nick || E.spOf(pet).n);
const eggTxt = e => D.EGGS[e.tier].e + " " + D.EGGS[e.tier].n;
const IMG_DIR = path.join(__dirname, "..", "..", "images");
const fileIds = {};

// ==================================================
// AYLA PETS — HEADER & FOOTER
// ==================================================

const HEADER = "🌸 ═══ 𝐀𝐘𝐋𝐀 〢 𝐏𝐄𝐓𝐒 ═══ 🌸";
const FOOTER = "╰┈➤ 𝐀𝐘𝐋𝐀 • 𝐏𝐄𝐓 𝐒𝐘𝐒𝐓𝐄𝐌 🌸";

function frame(text) {
    return `${HEADER}\n\n${text}\n\n${FOOTER}`;
}

function framedScreen(fn) {
    return (...args) => {
        const scr = fn(...args);
        return { ...scr, text: frame(scr.text) };
    };
}

// ==================================================
// IMAGES
// ==================================================

function imageFile(spId) {
    for (const ext of ["jpg", "jpeg", "png", "webp"]) {
        const f = path.join(IMG_DIR, spId + "." + ext);
        try {
            if (fs.existsSync(f)) return f;
        } catch (e) {
            /* لا شيء */
        }
    }
    return null;
}

// ---------------- اللاعب ----------------

function ensure(from) {
    let P = store.get(from.id);

    if (!P) {
        P = E.newPlayer(from.id, nameOf(from), now());
        store.set(from.id, P);
    } else if (P.name !== nameOf(from)) {
        P.name = nameOf(from);
        store.touch(P.id);
    }

    return P;
}

// ---------------- الشاشات ----------------

const cb = (uid, ...parts) => "g:" + uid + ":" + parts.join(":");

function kbBuilder(uid) {
    const kb = new InlineKeyboard();

    const api = {
        kb,

        btn(label, ...parts) {
            kb.text(label, cb(uid, ...parts));
            return api;
        },

        row() {
            if (kb.inline_keyboard[kb.inline_keyboard.length - 1].length) {
                kb.row();
            }
            return api;
        },

        back(to = "home", label = "🔙 رجوع") {
            api.row();
            kb.text(label, cb(uid, to));
            return api;
        }
    };

    return api;
}

const note = n => (n ? "\n\n" + n : "");

function screenHome(P, note_) {
    const main = E.getPet(P, P.main);
    const t = now();
    const hours = Math.min(
        D.C.COLLECT_CAP_H,
        (t - P.collectAt) / 3600000
    );

    const text =
        `🐾 <b>عالم الحيوانات</b> — ${esc(P.name)}\n\n` +
        `🪙 رصيدك: <b>${fmt(P.coins)}</b>\n` +
        `🐾 الحظيرة: ${P.pets.length}/${P.slots}   🥚 الحضانة: ${P.eggs.length}/${P.hatchSlots}\n` +
        `⚔️ القوة الكلية: ${fmt(E.totalPower(P))}\n` +
        `💰 الدخل: ${fmt(E.incomeAll(P))}/ساعة (متراكم: ${hours.toFixed(1)} ساعة)\n` +
        (main
            ? `⭐ الأساسي: ${nameP(main)} Lv.${main.lv} ${starsTxt(main.st)}`
            : "⭐ لا حيوان أساسي بعد: افقس بيضتك من 🥚 الحضانة") +
        note(note_);

    const b = kbBuilder(P.id);

b.btn("🐾 حيواناتي", "pets", 0).row();
b.kb.text("🧚 الجنيات", `fy:${P.id}:main`).row();
    .btn("🥚 الحضانة", "eggs").btn("🛒 المتجر", "shop").row()
    .btn("💰 جمع الأرباح", "collect").btn("⚔️ صيد", "hunt").row()
    .btn("🧬 تزاوج", "bra", 0).btn("🎁 يومي", "daily").row()
    .btn("🏆 ترتيب", "top").btn("🧿 العناصر", "elems").row()
    .btn("📚 المزيد من القوائم", "more");
    return { text, kb: b.kb };
}

// ==================================================
// القوائم الإضافية
// ==================================================

function screenMore(P) {
    const uid = P.id;

    const kb = new InlineKeyboard()
        .text("🎯 المهام اليومية", `q:${uid}:quests`)
        .text("🏅 الإنجازات", `q:${uid}:ach`)
        .row()
        .text("👤 ملفي الشخصي", `q:${uid}:profile`)
        .text("🎒 المخزن", `q:${uid}:bag`)
        .row()
        .text("🖼️ إطارات الصورة", `f:${uid}:main`)
        .text("📖 دليل اللعبة", `q:${uid}:guide`)
        .row()
        .text("🏠 القائمة الرئيسية", `g:${uid}:home`);

    return {
        text: "📚 <b>القوائم الإضافية</b>\n\nاختر القائمة التي تريد فتحها:",
        kb
    };
}

function sortedPets(P) {
    return [...P.pets].sort(
        (a, b) =>
            (b.id === P.main) - (a.id === P.main) ||
            E.power(b) - E.power(a)
    );
}

function screenPets(P, page, note_) {
    const per = 6;
    const list = sortedPets(P);
    const pages = Math.max(1, Math.ceil(list.length / per));

    page = Math.max(0, Math.min(page, pages - 1));

    const text =
        `🐾 <b>حيواناتي</b> (${P.pets.length}/${P.slots}) — صفحة ${page + 1}/${pages}` +
        note(note_);

    const b = kbBuilder(P.id);

    list.slice(page * per, page * per + per).forEach(p => {
        b.btn(
            (p.id === P.main ? "⭐ " : "") +
            E.spOf(p).e + " " +
            (p.nick || E.spOf(p).n) +
            " Lv." + p.lv +
            (p.st ? " " + "★".repeat(p.st) : "") +
            " " + D.ELEMENTS[p.el].e,
            "pet",
            p.id
        ).row();
    });

    if (pages > 1) {
        if (page > 0) b.btn("◀️", "pets", page - 1);
        if (page < pages - 1) b.btn("▶️", "pets", page + 1);
    }

    b.back();

    return { text, kb: b.kb };
}

function cdTxt(until, t) {
    return until > t ? "⏳ " + E.dur(until - t) : "✅ جاهز";
}

function cardText(P, pet) {
    const t = now();
    const s = E.spOf(pet);
    const r = rarOf(pet);
    const need = E.xpNeed(pet.lv);
    const h = E.hungerNow(pet, t);

    return (
        `${s.e} <b>${esc(pet.nick || s.n)}</b>${pet.nick ? " (" + s.n + ")" : ""} — ${r.e} ${r.n}${pet.id === P.main ? "  ⭐ الأساسي" : ""}\n` +
        `🧿 العنصر: ${elTxt(pet.el)}\n` +
        `🎖 الجودة: ${E.grade(pet.q)} (${pet.q.toFixed(2)})${pet.gen ? " · الجيل " + pet.gen : ""}\n` +
        `📈 المستوى: ${pet.lv}/${D.C.LV_CAP} ${starsTxt(pet.st)}\n` +
        (pet.lv < D.C.LV_CAP
            ? `▫️ الخبرة: ${bar(pet.xp / need * 100)} ${Math.floor(pet.xp / need * 100)}%\n`
            : "▫️ وصل الحد الأقصى" +
              (pet.st < D.C.MAX_STARS ? " — جاهز للترقية ⭐" : " 🏆") + "\n") +
        `🍖 الجوع: ${bar(h)} ${Math.floor(h)}%\n` +
        `⚔️ القوة: <b>${fmt(E.power(pet))}</b>   💰 الدخل: ${fmt(E.incomePerHour(pet))}/ساعة\n` +
        `🏋️ التدريب: ${cdTxt(pet.cdTrain, t)}   🎮 اللعب: ${cdTxt(pet.cdPlay, t)}\n` +
        `🆔 النوع #${s.id}`
    );
}

function screenPet(P, petId, note_) {
    const pet = E.getPet(P, petId);

    if (!pet) {
        return screenPets(P, 0, "هذا الحيوان لم يعد موجودًا.");
    }

    const b = kbBuilder(P.id);

    b.btn("🍖 إطعام", "feed", pet.id)
        .btn("🏋️ تدريب", "train", pet.id)
        .btn("🎮 لعب", "play", pet.id)
        .row();

    if (pet.lv >= D.C.LV_CAP && pet.st < D.C.MAX_STARS) {
        b.btn("⭐ ترقية (" + fmt(E.starCost(pet)) + ")", "up", pet.id).row();
    }

    if (pet.id !== P.main) {
        b.btn("📌 اجعله أساسيًا", "main", pet.id);
    }

    b.btn("🖼️ صورة", "img", pet.id).row();
    b.btn("🗑️ تخلٍّ", "rel", pet.id).row();
    b.back("pets:0", "🔙 حيواناتي");

    return {
        text: cardText(P, pet) + note(note_),
        kb: b.kb
    };
}

function screenFeed(P, petId, note_) {
    const pet = E.getPet(P, petId);
    if (!pet) return screenPets(P, 0);

    const owned = Object.keys(P.items).filter(
        id => P.items[id] > 0 && D.FOODS[id]
    );

    const b = kbBuilder(P.id);

    owned.forEach(id => {
        const f = D.FOODS[id];

        b.btn(
            f.e + " " + f.n + " ×" + P.items[id] +
            (f.el && f.el === pet.el ? " ✨" : ""),
            "eat",
            pet.id,
            id
        ).row();
    });

    b.btn("🛒 اشتر طعامًا", "shopfood").row();
    b.back("pet:" + pet.id, "🔙 البطاقة");

    const text =
        `🍖 <b>إطعام ${nameP(pet)}</b>\nالجوع: ${bar(E.hungerNow(pet, now()))} ${Math.floor(E.hungerNow(pet, now()))}%\n` +
        (owned.length ? "اختر ما تطعمه:" : "لا تملك طعامًا! اشتر من المتجر.") +
        note(note_);

    return { text, kb: b.kb };
}

function screenRelease(P, petId) {
    const pet = E.getPet(P, petId);
    if (!pet) return screenPets(P, 0);

    const back = E.clampCoins(
        D.EGGS[Math.min(6, E.spOf(pet).r)].price * 0.1 * (1 + pet.st)
    );

    const b = kbBuilder(P.id);

    b.btn("✅ نعم، تخلَّ", "relok", pet.id)
        .btn("❌ لا", "pet", pet.id);

    return {
        text: `⚠️ هل تتخلى عن ${nameP(pet)} Lv.${pet.lv}؟\nستحصل على ${fmt(back)} 🪙 ولا يمكن التراجع.`,
        kb: b.kb
    };
}

function eggChances(w) {
    const tot = w.reduce((a, b) => a + b, 0);

    return w.map((x, i) =>
        x ? D.RARITIES[i].e + Math.round(x / tot * 1000) / 10 + "%" : ""
    ).filter(Boolean).join(" ");
}

function screenEggs(P, note_) {
    const t = now();
    const b = kbBuilder(P.id);

    let text = `🥚 <b>الحضانة</b> (${P.eggs.length}/${P.hatchSlots})\n\n`;

    if (!P.eggs.length) {
        text += "لا بيض الآن. اشترِ من المتجر 🛒 أو زاوج حيوانين 🧬\n";
    }

    P.eggs.forEach(e => {
        const ready = e.readyAt <= t;

        text += `${eggTxt(e)}${e.bred ? " (من التزاوج)" : ""}: ${ready ? "🐣 جاهزة!" : "⏳ " + E.dur(e.readyAt - t)}\n`;

        if (ready) {
            b.btn("🐣 افقس " + eggTxt(e), "hatch", e.id).row();
        }
    });

    b.btn("🛒 اشتر بيضًا", "shopeggs").row().back();

    return {
        text: text + note(note_),
        kb: b.kb
    };
}

function screenShop(P, note_) {
    const b = kbBuilder(P.id);

    b.btn("🥚 البيض", "shopeggs")
        .btn("🍖 الطعام", "shopfood")
        .row()
        .btn("🍇 فواكه العناصر", "shopfruit")
        .btn("🏠 التوسعات", "shopup")
        .row()
        .back();

    return {
        text: `🛒 <b>المتجر</b>\n🪙 رصيدك: <b>${fmt(P.coins)}</b>` + note(note_),
        kb: b.kb
    };
}

function screenShopEggs(P, note_) {
    const b = kbBuilder(P.id);
    let text = `🥚 <b>سوق البيض</b> — 🪙 ${fmt(P.coins)}\n\n`;

    D.EGGS.forEach((e, i) => {
        text += `${e.e} <b>${e.n}</b> — ${fmt(e.price)} 🪙 · ${E.dur(e.min * 60000)}\n   ${eggChances(e.w)}\n`;
        b.btn(e.e + " " + e.n + " (" + fmt(e.price) + ")", "buyegg", i).row();
    });

    b.back("shop");

    return {
        text: text + note(note_),
        kb: b.kb
    };
}

function screenShopFood(P, fruit, note_) {
    const b = kbBuilder(P.id);
    const list = fruit ? D.FRUIT_FOODS : D.GENERAL_FOODS;

    let text = (fruit ? "🍇 <b>فواكه العناصر</b>" : "🍖 <b>سوق الطعام</b>") +
        ` — 🪙 ${fmt(P.coins)}\n`;

    text += fruit
        ? "الفاكهة تعطي 40% خبرة لحيوان من عنصرها (و10% لغيره).\n\n"
        : "\n";

    list.forEach(id => {
        const f = D.FOODS[id];

        text += `${f.e} <b>${f.n}</b> — ${fmt(f.price)} 🪙 · جوع +${f.hg}${f.xp && !f.el ? " · خبرة +" + Math.round(f.xp * 100) + "%" : ""}${f.el ? " · " + elTxt(f.el) : ""} (عندك: ${P.items[id] || 0})\n`;

        b.btn(f.e + " ×1", "buyfood", id, 1)
            .btn("×5", "buyfood", id, 5)
            .btn("×25", "buyfood", id, 25)
            .row();
    });

    b.back("shop");

    return {
        text: text + note(note_),
        kb: b.kb
    };
}

function screenShopUp(P, note_) {
    const b = kbBuilder(P.id);

    b.btn("🏠 +3 أماكن حظيرة (" + fmt(E.slotPrice(P)) + ")", "buyslot").row();

    if (P.hatchSlots < 10) {
        b.btn("🥚 +1 مكان حضانة (" + fmt(E.hatchPrice(P)) + ")", "buyhatch").row();
    }

    b.back("shop");

    return {
        text: `🏠 <b>التوسعات</b> — 🪙 ${fmt(P.coins)}\n\nالحظيرة: ${P.pets.length}/${P.slots}\nالحضانة: ${P.eggs.length}/${P.hatchSlots}` + note(note_),
        kb: b.kb
    };
}

function screenHunt(P, note_) {
    const main = E.getPet(P, P.main);
    const pw = main ? E.power(main) : 0;
    const b = kbBuilder(P.id);

    let text =
        `⚔️ <b>مناطق الصيد</b>\n` +
        (main
            ? `حيوانك: ${nameP(main)} · ⚔️ ${fmt(pw)} · ${elTxt(main.el)}\n🏹 ${cdTxt(main.cdHunt, now())}`
            : "لا حيوان أساسي") +
        "\n\n";

    D.ZONES.forEach((z, i) => {
        const ratio = pw / z.power;
        const mark = ratio >= 1.2 ? "🟢" : ratio >= 0.8 ? "🟡" : "🔴";

        text += `${mark} <b>${i + 1}. ${z.n}</b> — قوة ${fmt(z.power)} · 🪙 ${fmt(z.coins)}\n`;

        b.btn(mark + " " + (i + 1) + ". " + z.n, "go", i);

        if (i % 2 === 1) b.row();
    });

    b.row().back();

    return {
        text: text + note(note_),
        kb: b.kb
    };
}

function huntText(res, zone, pet) {
    const mon = elTxt(res.monEl);
    const effTxt = res.eff > 1
        ? "⬆️ تفوق العنصر!"
        : res.eff < 1
            ? "⬇️ العنصر ضدك"
            : "";

    if (res.win) {
        return `🏆 <b>انتصار</b> في ${zone.n}!\n👾 وحش ${mon} (${fmt(res.monPower)}) ${effTxt}\n🪙 +${fmt(res.coins)}` +
            (res.levels ? `\n⬆️ ارتقى ${nameP(pet)} إلى المستوى ${pet.lv}` : "") +
            (res.drops.length ? "\n🎁 غنيمة: " + res.drops.join("، ") : "");
    }

    return `💀 <b>خسارة</b> في ${zone.n}\n👾 وحش ${mon} (${fmt(res.monPower)}) ${effTxt}\nقوتك الفعلية ${fmt(res.mine)}. قوِّ حيوانك أو جرّب منطقة أسهل.`;
}

// التزاوج: اختر الأول، ثم الثاني، ثم تأكيد

function eligible(P, t) {
    return sortedPets(P).filter(
        p => (p.lv >= D.C.BREED_LV || p.st > 0) && p.cdBreed <= t
    );
}

function screenBreedA(P, page) {
    const t = now();
    const list = eligible(P, t);
    const per = 6;
    const pages = Math.max(1, Math.ceil(list.length / per));

    page = Math.max(0, Math.min(page, pages - 1));

    const b = kbBuilder(P.id);

    list.slice(page * per, page * per + per).forEach(p =>
        b.btn(
            E.spOf(p).e + " " + (p.nick || E.spOf(p).n) +
            " Lv." + p.lv + " " + D.ELEMENTS[p.el].e + " " + E.grade(p.q),
            "brb",
            p.id,
            0
        ).row()
    );

    if (pages > 1) {
        if (page > 0) b.btn("◀️", "bra", page - 1);
        if (page < pages - 1) b.btn("▶️", "bra", page + 1);
    }

    b.back();

    return {
        text: `🧬 <b>التزاوج</b>\nيشترط المستوى ${D.C.BREED_LV} وراحة ${E.dur(D.C.BREED_CD)} بعد كل مرة.\nالنتيجة بيضة تحمل جودة أبويها، وقد تحدث طفرة ✨\n\nاختر الحيوان الأول:` +
            (list.length ? "" : "\n\n(لا حيوان مؤهل الآن)"),
        kb: b.kb
    };
}

function screenBreedB(P, aId, page) {
    const a = E.getPet(P, aId);
    if (!a) return screenBreedA(P, 0);

    const t = now();
    const list = eligible(P, t).filter(p => p.id !== a.id);
    const per = 6;
    const pages = Math.max(1, Math.ceil(list.length / per));

    page = Math.max(0, Math.min(page, pages - 1));

    const b = kbBuilder(P.id);

    list.slice(page * per, page * per + per).forEach(p =>
        b.btn(
            E.spOf(p).e + " " + (p.nick || E.spOf(p).n) +
            " Lv." + p.lv + " " + D.ELEMENTS[p.el].e + " " + E.grade(p.q),
            "brc",
            a.id,
            p.id
        ).row()
    );

    if (pages > 1) {
        if (page > 0) b.btn("◀️", "brb", a.id, page - 1);
        if (page < pages - 1) b.btn("▶️", "brb", a.id, page + 1);
    }

    b.back("bra:0");

    return {
        text: `🧬 الأول: ${nameP(a)} ${elTxt(a.el)}\nاختر الحيوان الثاني:` +
            (list.length ? "" : "\n\n(لا حيوان مؤهل آخر)"),
        kb: b.kb
    };
}

function screenBreedC(P, aId, bId) {
    const chk = E.breedCheck(P, aId, bId, now());

    if (!chk.ok) {
        return {
            text: "🧬 " + chk.msg,
            kb: kbBuilder(P.id).back("bra:0").kb
        };
    }

    const { a, b, cost } = chk;
    const kb = kbBuilder(P.id);

    kb.btn("✅ تزاوج (" + fmt(cost) + ")", "brgo", a.id, b.id)
        .row()
        .back("bra:0");

    return {
        text: `🧬 <b>تأكيد التزاوج</b>\n${nameP(a)} ${elTxt(a.el)} ${E.grade(a.q)}\n  ✖️\n${nameP(b)} ${elTxt(b.el)} ${E.grade(b.q)}\n\n` +
            `💰 التكلفة: <b>${fmt(cost)}</b> (رصيدك ${fmt(P.coins)})\n🥚 النوع: أحد الأبوين، والعنصر موروث غالبًا\n✨ احتمال طفرة (ندرة أعلى): 12%\n🎖 الجودة: متوسط الأبوين تقريبًا`,
        kb: kb.kb
    };
}

// ==================================================
// لوحة الترتيب
// ==================================================

function board(title, rows) {
    const med = ["🥇", "🥈", "🥉"];

    if (!rows.length) {
        return title + "\n\nلا توجد بيانات حتى الآن.";
    }

    return title + "\n\n" + rows.map((r, i) => {
        const rank = med[i] || `${i + 1}.`;
        const name = esc(String(r.name || "لاعب"));

        const pet = r.pet
            ? `${r.pet.emoji} ${esc(String(r.pet.name))}`
            : "🐾 لا يوجد حيوان أساسي";

        return `${rank}  ${name}\n    ${pet}\n    <code>${esc(String(r.val))}</code>`;
    }).join("\n\n");
}

function screenTop(P) {
    const players = store.all();

    const rows = players
        .filter(p => p.pets && p.pets.length)
        .map(p => {
            const main = E.getPet(p, p.main);
            const species = main ? E.spOf(main) : null;

            return {
                name: p.name,
                pet: main && species
                    ? {
                        emoji: species.e,
                        name: main.nick || species.n
                    }
                    : null,
                val: E.totalPower(p)
            };
        })
        .sort((a, b) => b.val - a.val)
        .slice(0, 10)
        .map(r => ({
            ...r,
            val: fmt(r.val) + " ⚔️"
        }));

    const rich = players
        .map(p => {
            const main = E.getPet(p, p.main);
            const species = main ? E.spOf(main) : null;

            return {
                name: p.name,
                pet: main && species
                    ? {
                        emoji: species.e,
                        name: main.nick || species.n
                    }
                    : null,
                val: p.coins
            };
        })
        .sort((a, b) => b.val - a.val)
        .slice(0, 10)
        .map(r => ({
            ...r,
            val: fmt(r.val) + " 🪙"
        }));

        const fairies = require("./fairies").topRows(players);

    return {
        text:
            board("🏆 <b>أقوى اللاعبين</b>", rows) +
            "\n\n" +
            board("💎 <b>أغنى اللاعبين</b>", rich) +
            (fairies.length ? "\n\n" + board("🧚 <b>أقوى الجنيات</b>", fairies) : ""),
        kb: kbBuilder(P.id).back().kb
    };
}

function screenElems(P) {
    let text = "🧿 <b>العناصر</b>\n\n";

    ["fire", "plant", "earth", "thunder", "water"].forEach(e => {
        text += `${elTxt(e)} ⟵ يتفوق على ${elTxt(D.BEATS[e])}\n`;
    });

    text += `${elTxt("light")} ↔ ${elTxt("dark")} يتفوق كل منهما على الآخر\n\n⬆️ التفوق: قوة ×1.5 · ⬇️ الضعف: ×0.75`;

    return {
        text,
        kb: kbBuilder(P.id).back().kb
    };
}

// ---------------- الموجّه ----------------

function route(P, parts, ctx) {
    const t = now();
    const [a, x, y] = parts;

    const act = (res, back) =>
        res.ok
            ? { screen: back(res.msg) }
            : { error: res.msg, screen: back() };

    switch (a) {
        case "home":
            return { screen: screenHome(P) };

        case "more":
            return { screen: screenMore(P) };

        case "pets":
            return { screen: screenPets(P, Number(x) || 0) };

        case "pet":
            return { screen: screenPet(P, x) };

        case "feed":
            return { screen: screenFeed(P, x) };

        case "eat":
            return act(E.feed(P, x, y, t), n => screenFeed(P, x, n));

        case "train":
            return act(E.train(P, x, t), n => screenPet(P, x, n));

        case "play":
            return act(E.play(P, x, t), n => screenPet(P, x, n));

        case "main":
            return act(E.setMain(P, x), n => screenPet(P, x, n));

        case "up":
            return act(E.upgrade(P, x), n => screenPet(P, x, n));

        case "rel":
            return { screen: screenRelease(P, x) };

        case "relok":
            return act(E.release(P, x), n => screenPets(P, 0, n));

        case "img": {
            const pet = E.getPet(P, x);
            if (!pet) return { screen: screenPets(P, 0) };

            const f = imageFile(E.spOf(pet).id);

            if (!f) {
                return {
                    error: "لا توجد صورة لهذا النوع بعد (النوع #" + E.spOf(pet).id + ").",
                    screen: screenPet(P, x)
                };
            }

            return {
                photo: {
                    file: f,
                    spId: E.spOf(pet).id,
                    caption: frame(cardText(P, pet))
                },
                screen: screenPet(P, x)
            };
        }

        case "eggs":
            return { screen: screenEggs(P) };

        case "hatch": {
            const r = E.hatch(P, x, t, rng);

            if (!r.ok) {
                return { error: r.msg, screen: screenEggs(P) };
            }

            const s = E.spOf(r.pet);
            const ra = rarOf(r.pet);

            return {
                screen: screenPet(
                    P,
                    r.pet.id,
                    `🎉 فقست! حصلت على ${s.e} <b>${s.n}</b> ${ra.e} ${ra.n}\n🧿 ${elTxt(r.pet.el)} · 🎖 جودة ${E.grade(r.pet.q)}`
                )
            };
        }

        case "shop":
            return { screen: screenShop(P) };

        case "shopeggs":
            return { screen: screenShopEggs(P) };

        case "buyegg":
            return act(E.buyEgg(P, Number(x), t), n => screenShopEggs(P, n));

        case "shopfood":
            return { screen: screenShopFood(P, false) };

        case "shopfruit":
            return { screen: screenShopFood(P, true) };

        case "buyfood":
            return act(
                E.buyFood(P, x, y),
                n => screenShopFood(P, /^fruit_/.test(x), n)
            );

        case "shopup":
            return { screen: screenShopUp(P) };

        case "buyslot":
            return act(E.expandSlots(P), n => screenShopUp(P, n));

        case "buyhatch":
            return act(E.expandHatch(P), n => screenShopUp(P, n));

        case "hunt":
            return { screen: screenHunt(P) };

        case "go": {
            const res = E.hunt(P, Number(x), t, rng);

            if (!res.ok) {
                return { error: res.msg, screen: screenHunt(P) };
            }

            return {
                screen: screenHunt(
                    P,
                    huntText(res, D.ZONES[Number(x)], E.getPet(P, P.main))
                )
            };
        }

        case "collect":
            return act(E.collect(P, t), n => screenHome(P, "💰 " + n));

        case "daily":
            return act(E.daily(P, t), n => screenHome(P, "🎁 " + n));

        case "bra":
            return { screen: screenBreedA(P, Number(x) || 0) };

        case "brb":
            return { screen: screenBreedB(P, x, Number(y) || 0) };

        case "brc":
            return { screen: screenBreedC(P, x, y) };

        case "brgo": {
            const r = E.breed(P, x, y, t, rng);

            if (!r.ok) {
                return { error: r.msg, screen: screenBreedC(P, x, y) };
            }

            return { screen: screenEggs(P, "🧬 " + r.msg) };
        }

        case "top":
            return { screen: screenTop(P) };

        case "elems":
            return { screen: screenElems(P) };

        default:
            return { screen: screenHome(P) };
    }
}

// ---------------- عرض الشاشات ----------------

async function show(ctx, scr) {
    try {
        await ctx.editMessageText(frame(scr.text), {
            parse_mode: "HTML",
            reply_markup: scr.kb
        });
    } catch (e) {
        if (!/not modified/i.test(String(e && (e.description || e.message)))) {
            throw e;
        }
    }
}

// ---------------- التصدير ----------------

module.exports = {
    fmt,
    now,
    rng,
    ensure,
    route,
    show,
    imageFile,
    fileIds,
    nameP,
    elTxt,
    clean,

    screenHome: framedScreen(screenHome),
    screenEggs: framedScreen(screenEggs),
    screenShop: framedScreen(screenShop),
    screenHunt: framedScreen(screenHunt),
    screenElems: framedScreen(screenElems),
    screenTop: framedScreen(screenTop)
};