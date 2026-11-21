"use strict";
// عرض الحظيرة (المنظر العلوي) وزيارة اللاعبين: بيانات عامة فقط، بلا عملات ولا بيانات حساسة.
// تخطيط العالم المحفوظ (مباني، حظائر، شخصية، مواضع الحيوانات، خصوصية القوة) يأتي من world.js.
const D = require("../game/data");
const E = require("../game/engine");
const Po = require("../game/posts");
const store = require("../core/store");
const World = require("./world");

const MAX_PETS = 90, MAX_EGGS = 12, LIST_N = 25, CACHE_MS = 60 * 1000;

function farmOf(T, now, viewerIsOwner) {
    const w = World.get(T), hide = !viewerIsOwner && !!w.hidePow;
    const post = {};
    Po.POST_IDS.forEach(id => { post[id] = Po.st(T)[id].slice(); });
    const postOfPet = {};
    Object.entries(post).forEach(([id, ids]) => ids.forEach(pid => { postOfPet[pid] = id; }));
    const pets = T.pets.map(p => {
        const sp = D.SPECIES[p.sp], el = D.ELEMENTS[p.el];
        return {
            id: p.id, pen: p.pen || 0, sp: sp.id, emoji: sp.e, name: p.nick || sp.n, rar: sp.r, rarEmoji: D.RARITIES[sp.r].e, rarName: D.RARITIES[sp.r].n,
            el: p.el, elEmoji: el.e, elName: el.n, lv: p.lv, st: p.st || 0, main: p.id === T.main, post: postOfPet[p.id] || null,
            pw: hide ? null : E.power(p)
        };
    }).sort((a, b) => (b.main - a.main) || (hide ? (b.rar - a.rar) || (b.lv - a.lv) : (b.pw - a.pw))).slice(0, MAX_PETS);
    const eggs = T.eggs.slice(0, MAX_EGGS).map(e => ({ tier: e.tier, emoji: D.EGGS[e.tier] ? D.EGGS[e.tier].e : "🥚", ready: e.readyAt <= now }));
    return {
        uid: String(T.id), name: T.name, power: hide ? null : E.totalPower(T), hidePow: hide,
        world: { b: w.b || {}, pens: w.pens || {}, av: w.av || {}, pos: w.pos || {}, biome: w.biome || {}, deco: Array.isArray(w.deco) ? w.deco : [] },
        pens: [{ id: 0, name: "الحظيرة الكبرى" }].concat((T.pens || []).map(x => ({ id: x.id, name: x.name }))),
        count: T.pets.length, pets, eggs, post,
        posts: Po.POST_IDS.map(id => ({ id, e: Po.POSTS[id].e, n: Po.POSTS[id].n })),
        visitors: (T.vis || []).length
    };
}

let cache = { t: 0, rows: [] };
function rows(now) {
    if (now - cache.t < CACHE_MS) return cache.rows;
    const r = store.all().filter(p => p && p.pets && p.pets.length)
        .map(p => { const m = p.pets.find(x => x.id === p.main) || p.pets[0]; return { uid: String(p.id), name: p.name || "لاعب", power: (World.get(p).hidePow ? null : E.totalPower(p)), pets: p.pets.length, emoji: D.SPECIES[m.sp].e }; })
        .sort((a, b) => (b.power || 0) - (a.power || 0));
    cache = { t: now, rows: r };
    return r;
}

function visitList(P, a, now) {
    const q = String((a && a.q) || "").trim().slice(0, 20).toLowerCase();
    let list = rows(now).filter(r => r.uid !== String(P.id));
    if (q) list = list.filter(r => r.name.toLowerCase().includes(q));
    return { ok: true, list: list.slice(0, LIST_N) };
}

function farmView(P, a, now) {
    const uid = a && a.uid != null ? String(a.uid).slice(0, 20) : "";
    if (!uid || uid === String(P.id)) return { ok: true, farm: farmOf(P, now, true), self: true, log: (P.vis || []).slice(0, 10) };
    const T = store.get(uid);
    if (!T || !T.pets || !T.pets.length) return { ok: false, msg: "لا توجد حظيرة لهذا اللاعب." };
    // سجل الزائرين: آخر 10 زوّار (زائر واحد = سطر واحد)، دون أي تأثير على الموارد
    T.vis = (T.vis || []).filter(v => v.id !== String(P.id));
    T.vis.unshift({ id: String(P.id), n: String(P.name || "لاعب").slice(0, 24), t: now });
    T.vis = T.vis.slice(0, 10);
    store.touch(T.id);
    return { ok: true, farm: farmOf(T, now, false), self: false };
}

module.exports = { farmOf, visitList, farmView };
