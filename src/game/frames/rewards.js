"use strict";
// إطارات جوائز الميزات الجديدة (استكشاف، غارات، تحالف، كتاب المجموعة، مواظبة). تُفتح بشروط تُحسب من حالة اللاعب.
const { compose } = require("./more");
const { WIN } = require("./ornate");
const cnt = (P, k) => ((P.cnt || {})[k] || 0);
const lv = P => { try { return require("../../web/map").perk(P).lvl || 0; } catch (e) { return 0; } };
const dex = P => { try { const v = require("../../web/dex").view(P); return { full: v.have >= v.total, groups: v.groups.filter(g => g.have === g.total).length }; } catch (e) { return { full: false, groups: 0 }; } };
const L = [
    ["explorer", "المستكشف", "🧭", "أكمل 3 رحلات استكشاف", P => cnt(P, "exp") >= 3, { pal: "green", metal: "wood", top: "leaves", side: "vines", fx: "leaves" }],
    ["voyager", "الرحّالة", "🌋", "أكمل 25 رحلة استكشاف", P => cnt(P, "exp") >= 25, { pal: "fire", metal: "obsidian", top: "flames", side: "runes", fx: "embers" }],
    ["pirate", "القرصان", "🏴‍☠️", "انجح في 5 غارات", P => cnt(P, "raid") >= 5, { pal: "bone", metal: "steel", top: "skull", side: "chains", fx: "mist" }],
    ["pirate2", "ملك القراصنة", "☠️", "انجح في 25 غارة", P => cnt(P, "raid") >= 25, { pal: "dark", metal: "obsidian", top: "skull", side: "chains", bottom: "fangs", fx: "mist" }],
    ["ally", "الحليف", "🤝", "انضم إلى تحالف", P => !!P.alliance, { pal: "blue", metal: "silver", top: "halo", side: "tendril", fx: "sparkle" }],
    ["ally2", "إمبراطور التحالف", "🏛️", "ارفع تحالفك إلى المستوى 8", P => lv(P) >= 8, { pal: "gold", metal: "gold", top: "crown", side: "chains", fx: "sparkle" }],
    ["dex", "عالم الأنواع", "📚", "أكمل ندرتين في كتاب المجموعة", P => dex(P).groups >= 2, { pal: "purple", metal: "silver", top: "gemrow", n: 5, side: "runes", fx: "stars" }],
    ["dex2", "الموسوعة", "🌈", "اكتشف كل الأنواع", P => dex(P).full, { pal: "gold", metal: "silver", top: "gemrow", n: 5, side: "tendril", fx: "sparkle", hue: 1 }],
    ["angler", "الصيّاد", "🎣", "اصطد 100 مرة من البحر", P => cnt(P, "fish") >= 100, { pal: "blue", metal: "silver", top: "halo", side: "tendril", fx: "sparkle" }],
    ["seaking", "ملك البحار", "🔱", "اجمع كل أنواع الأسماك", P => { try { return require("../../web/fishing").haveCount(P) >= require("../../web/fishing").SPECIES_COUNT; } catch (e) { return false; } }, { pal: "gold", metal: "gold", top: "crown", side: "tendril", fx: "stars" }],
    ["streak", "الوفيّ", "🔥", "14 يومًا متتاليًا", P => (P.streak || 0) >= 14, { pal: "rose", metal: "rose", top: "hearts", side: "tendril", fx: "petals" }]
];
const REWARDS = L.map(([id, name, e, text, unlock, spec]) => ({ id: "rw_" + id, name: "إطار " + name, e, cat: "reward", price: null, ach: null, text, unlock, frames: 16, square: true, win: WIN, draw: compose(spec) }));
module.exports = { REWARDS };
