"use strict";
// العالم المشترك: خريطة شبكية، لكل لاعب خانة. الانتقال بجانب لاعب آخر له حدود إلا بين أعضاء تحالف واحد.
//   • غير الحلفاء: يجب أن يبقى بينك وبينهم خانة فارغة على الأقل (لا تلاصق).
//   • الحلفاء (نفس التحالف): يجوز التلاصق، ومدى القفزة أطول.
//   • مدى القفزة محدود، وبعد كل انتقال تبريد.
// التحالف يُخزَّن في سجل القائد: P.alliance = {name, members:[uid], at}، وعضوه يحمل P.allyOf = uid القائد. الدعوات: P.allyInv.
const D = require("../game/data");
const store = require("../core/store");
const World = require("./world");

const RADIUS = 6, HOP = 8, HOP_ALLY = 30, COOLDOWN = 6 * 3600 * 1000, MAX_ALLY = 8, INV_TTL = 3 * 24 * 3600 * 1000, GRID = 60;
const key = (x, y) => x + "," + y;
const cheb = (a, b) => Math.max(Math.abs(a[0] - b[0]), Math.abs(a[1] - b[1]));
const clean = (s, n) => String(s || "").replace(/[<>&]/g, "").trim().slice(0, n);

function leaderOf(P) {
    if (P.alliance) return P;
    if (P.allyOf) { const L = store.get(P.allyOf); if (L && L.alliance && L.alliance.members.includes(String(P.id))) return L; delete P.allyOf; }
    return null;
}
const allyId = P => { const L = leaderOf(P); return L ? String(L.id) : null; };
const sameAlly = (A, B) => { const a = allyId(A); return !!a && a === allyId(B); };

function occupied(exceptId) {
    const m = new Map();
    store.all().forEach(p => { const l = p && p.world && p.world.loc; if (l && String(p.id) !== String(exceptId)) m.set(key(l[0], l[1]), p); });
    return m;
}
function okCell(P, x, y, occ) {
    if (Math.abs(x) > GRID || Math.abs(y) > GRID) return false;
    if (occ.has(key(x, y))) return false;
    for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) {
        const o = occ.get(key(x + dx, y + dy));
        if (o && !sameAlly(P, o)) return false;                    // لا تلاصق إلا مع الحلفاء
    }
    return true;
}
function nearestFree(P, tx, ty, occ, from, hop) {
    for (let r = 0; r <= 12; r++) for (let dx = -r; dx <= r; dx++) for (let dy = -r; dy <= r; dy++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
        const x = tx + dx, y = ty + dy;
        if (cheb([x, y], from) <= hop && okCell(P, x, y, occ)) return [x, y];
    }
    return null;
}
function ensureLoc(P) {
    const w = World.get(P);
    if (w.loc) return w.loc;
    const occ = occupied(P.id);
    let spot = null;
    for (let r = 0; r <= GRID && !spot; r += 2) for (let dx = -r; dx <= r && !spot; dx += 2) for (let dy = -r; dy <= r && !spot; dy += 2) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
        if (okCell(P, dx, dy, occ)) spot = [dx, dy];
    }
    P.world = Object.assign({}, w, { loc: spot || [0, 0] });
    return P.world.loc;
}
const iconOf = p => { const m = (p.pets || []).find(x => x.id === p.main) || (p.pets || [])[0]; return m ? D.SPECIES[m.sp].e : "🏡"; };

function allyInfo(P, now) {
    const L = leaderOf(P);
    P.allyInv = (P.allyInv || []).filter(i => now - i.t < INV_TTL && store.get(i.from));
    const members = L ? L.alliance.members.map(id => store.get(id)).filter(Boolean).map(m => ({ uid: String(m.id), name: m.name, leader: String(m.id) === String(L.id) })) : [];
    return { name: L ? L.alliance.name : null, leader: !!L && String(L.id) === String(P.id), members, max: MAX_ALLY, invites: P.allyInv.map(i => ({ from: i.from, name: i.name, ally: i.ally })) };
}

function mapView(P, a, now) {
    const loc = ensureLoc(P);
    const cx = Number.isInteger(a && a.cx) ? a.cx : loc[0], cy = Number.isInteger(a && a.cy) ? a.cy : loc[1];
    const players = [];
    store.all().forEach(p => {
        const l = p && p.world && p.world.loc; if (!l || !p.pets || !p.pets.length) return;
        if (Math.abs(l[0] - cx) <= RADIUS && Math.abs(l[1] - cy) <= RADIUS) players.push({ uid: String(p.id), name: p.name || "لاعب", x: l[0], y: l[1], emoji: iconOf(p), me: String(p.id) === String(P.id), ally: sameAlly(P, p) });
    });
    const wait = Math.max(0, ((World.get(P).movedAt || 0) + COOLDOWN) - now);
    return { ok: true, loc, center: [cx, cy], radius: RADIUS, players, wait, hop: HOP, hopAlly: HOP_ALLY, alliance: allyInfo(P, now) };
}

// a: {x,y} خانة محددة، أو {near: uid} للانتقال بجانب لاعب
function mapMove(P, a, now) {
    const w = World.get(P), loc = ensureLoc(P), left = (w.movedAt || 0) + COOLDOWN - now;
    if (left > 0) return { ok: false, msg: "⏳ يمكنك نقل مزرعتك بعد " + Math.ceil(left / 3600000) + " ساعة." };
    const occ = occupied(P.id);
    let target = null, T = null;
    if (a && a.near != null) {
        T = store.get(String(a.near));
        const tl = T && T.world && T.world.loc;
        if (!T || !tl || String(T.id) === String(P.id)) return { ok: false, msg: "لاعب غير موجود على الخريطة." };
        const ally = sameAlly(P, T), hop = ally ? HOP_ALLY : HOP;
        target = nearestFree(P, tl[0], tl[1], occ, loc, hop);
        if (!target) return { ok: false, msg: ally ? "لا مكان قريب منه ضمن مدى الانتقال." : "تبعد عنه أكثر من " + HOP + " خانات أو لا توجد خانة تحترم المسافة. بين غير الحلفاء لا بد من خانة فارغة بينكما، والتحالف يسمح بالتلاصق ومدى أبعد." };
    } else {
        const x = a && a.x, y = a && a.y;
        if (!Number.isInteger(x) || !Number.isInteger(y)) return { ok: false, msg: "خانة غير صالحة." };
        if (cheb([x, y], loc) > HOP) return { ok: false, msg: "الحد الأقصى لقفزة الانتقال " + HOP + " خانات." };
        if (!okCell(P, x, y, occ)) return { ok: false, msg: "الخانة مشغولة أو قريبة من لاعب غير حليف (اترك خانة فارغة بينكما)." };
        target = [x, y];
    }
    P.world = Object.assign({}, w, { loc: target, movedAt: now });
    return { ok: true, msg: "🗺️ انتقلت مزرعتك" + (T ? " بجانب " + T.name : "") + ".", loc: target };
}

// ---------- التحالفات ----------
function allyCreate(P, a, now) {
    if (leaderOf(P)) return { ok: false, msg: "أنت في تحالف بالفعل." };
    const name = clean(a && a.name, 16);
    if (!name) return { ok: false, msg: "اكتب اسمًا للتحالف." };
    if (store.all().some(p => p && p.alliance && p.alliance.name === name)) return { ok: false, msg: "هذا الاسم مستخدم." };
    P.alliance = { name, members: [String(P.id)], at: now };
    return { ok: true, msg: "🤝 تأسس تحالف «" + name + "»." };
}
function allyInvite(P, a, now) {
    const L = leaderOf(P);
    if (!L || String(L.id) !== String(P.id)) return { ok: false, msg: "القائد وحده يدعو." };
    if (L.alliance.members.length >= MAX_ALLY) return { ok: false, msg: "التحالف ممتلئ." };
    const T = store.get(String((a && a.uid) || ""));
    if (!T || String(T.id) === String(P.id)) return { ok: false, msg: "لاعب غير موجود." };
    if (leaderOf(T)) return { ok: false, msg: "هذا اللاعب في تحالف." };
    T.allyInv = (T.allyInv || []).filter(i => i.from !== String(P.id));
    T.allyInv.unshift({ from: String(P.id), name: P.name || "لاعب", ally: L.alliance.name, t: now });
    T.allyInv = T.allyInv.slice(0, 5);
    store.touch(T.id);
    return { ok: true, msg: "📨 أُرسلت الدعوة إلى " + T.name + "." };
}
function allyAccept(P, a, now) {
    if (leaderOf(P)) return { ok: false, msg: "غادر تحالفك الحالي أولًا." };
    const inv = (P.allyInv || []).find(i => i.from === String((a && a.from) || "") && now - i.t < INV_TTL);
    const L = inv && store.get(inv.from);
    if (!L || !L.alliance) return { ok: false, msg: "الدعوة لم تعد صالحة." };
    if (L.alliance.members.length >= MAX_ALLY) return { ok: false, msg: "التحالف ممتلئ." };
    L.alliance.members.push(String(P.id)); P.allyOf = String(L.id); P.allyInv = [];
    store.touch(L.id);
    return { ok: true, msg: "🤝 انضممت إلى «" + L.alliance.name + "»." };
}
function allyDecline(P, a) { P.allyInv = (P.allyInv || []).filter(i => i.from !== String((a && a.from) || "")); return { ok: true }; }
function allyLeave(P) {
    const L = leaderOf(P);
    if (!L) return { ok: false, msg: "لست في تحالف." };
    if (String(L.id) === String(P.id)) {                          // القائد يحلّ التحالف
        L.alliance.members.forEach(id => { const m = store.get(id); if (m && String(m.id) !== String(P.id)) { delete m.allyOf; store.touch(m.id); } });
        delete P.alliance;
        return { ok: true, msg: "تم حلّ التحالف." };
    }
    L.alliance.members = L.alliance.members.filter(id => id !== String(P.id)); delete P.allyOf; store.touch(L.id);
    return { ok: true, msg: "غادرت التحالف." };
}
function allyKick(P, a) {
    const L = leaderOf(P);
    if (!L || String(L.id) !== String(P.id)) return { ok: false, msg: "القائد وحده يطرد." };
    const id = String((a && a.uid) || ""), m = store.get(id);
    if (!m || id === String(P.id) || !L.alliance.members.includes(id)) return { ok: false, msg: "عضو غير موجود." };
    L.alliance.members = L.alliance.members.filter(x => x !== id); delete m.allyOf; store.touch(m.id);
    return { ok: true, msg: "تم طرد " + m.name + "." };
}

module.exports = { mapView, mapMove, allyCreate, allyInvite, allyAccept, allyDecline, allyLeave, allyKick, sameAlly };
