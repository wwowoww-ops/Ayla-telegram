// يستبدل رسم الإطارات القديمة بتصاميم جديدة (نفس المعرّفات وشروط الفتح، فلا يفقد أحد إطاره).
const { WIN } = require("./framesOrnate");

const MAP = {};
const add = (mod, ids) => { try { const m = require(mod); Object.entries(ids).forEach(([id, fn]) => { if (m[fn]) MAP[id] = m[fn]; }); } catch (e) { console.error("[FRAMES NEW]", mod, e.message); } };

add("./framesA1", { a_cat: "cat", a_bunny: "bunny", a_fox: "fox", a_wolf: "wolf", a_lion: "lion", a_bear: "bear", a_owl: "owl", a_unicorn: "unicorn", a_dragon: "dragonA", a_phoenix: "phoenixA" });
add("./framesA2", { el_fire: "fire", el_water: "water", el_plant: "plant", el_earth: "earth", el_thunder: "thunder", el_light: "light", el_dark: "dark" });
add("./framesB1", { ra_0: "common", ra_1: "uncommon", ra_2: "rare", ra_3: "epicR", ra_4: "legendary", ra_5: "mythic", ra_6: "celestial" });
add("./framesB2", { s_ramadan: "ramadan", s_fanous: "fanous", s_eid: "eid", s_king: "king", s_crystal: "crystal", s_skull: "skull", s_sakura: "sakura", s_galaxy: "galaxy", s_rainbow: "rainbow", s_snow: "snow", s_cyber: "cyberS", s_love: "love" });

add("./framesC1", { b_fire_top:"fireTop", b_fire_part:"firePart", b_water_top:"waterTop", b_water_part:"waterPart", b_plant_top:"plantTop", b_plant_part:"plantPart", b_earth_top:"earthTop", b_earth_part:"earthPart", b_thunder_top:"thunderTop", b_thunder_part:"thunderPart", b_light_top:"lightTop", b_light_part:"lightPart", b_dark_top:"darkTop", b_dark_part:"darkPart" });
add("./framesC2", { l_collector:"collector", l_star5:"star5", l_perfect:"perfect", l_slayer:"slayer", l_mvp:"mvp", l_frames:"frames", l_taxes:"taxes", l_master:"master", classic:"classic", ice:"ice", sakura:"sakura", fire:"fire", neon:"neon", thunder:"thunder", gold:"gold", galaxy:"galaxy", o_violet:"violet", o_azure:"azure", o_emerald:"emerald", o_crimson:"crimson", o_solar:"solar", o_void:"voidF" });
function apply(frames) {
    frames.forEach(fr => {
        const d = MAP[fr.id];
        if (d) { fr.draw = d; fr.frames = 16; fr.square = true; fr.win = WIN; }
    });
}
module.exports = { apply, MAP };
