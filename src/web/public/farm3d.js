"use strict";
// ======================================================
// الحظيرة = عالم بمنظر علوي ثلاثي الأبعاد (three.js) هو الشاشة الرئيسية للعبة.
//   • مبانٍ للوظائف وبوابات لأقسام اللعبة، كلها قابلة للنقل بحرية (وضع التعديل ✏️).
//   • لكل حظيرة شكل سياج حر مع باب، وتتجول حيواناتها داخله؛ ويمكن سحب أي حيوان وتثبيته.
//   • شخصيتك تتجول في العالم، وراعٍ يتجول ويطعم الحيوانات.
//   • زيارة حظائر الآخرين، مع خيار إخفاء قوة حيواناتك عن الزوّار.
// إن تعذّر three.js أو WebGL يُرسم العالم نفسه ثنائي الأبعاد بدل شاشة فارغة.
// المنطق (التخطيط، الحركة، اللمس، الحفظ) مشترك بين الرسمين.
// ======================================================
const THREE_URL = "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js";
const FARM_COL = { post: ["#c9a35a", "#7d8fa3", "#5aa66b", "#b86bd1", "#d98b4c", "#d4b83e", "#d65f5f"], svc: ["#4f7cc9", "#c9744f", "#4fb59a", "#a655c9", "#c9b04f", "#5f6fd6"] };
let fm = null;            // المشهد الحالي
let threeState = "idle";  // idle | loading | ok | fail
let farmBusy = false;
const WLIM = 150, PLIM = 45;       // حدود الإحداثيات (توافق world.js)

// أقسام اللعبة: [المعرّف، الرمز، الاسم، [تبويب، قسم فرعي]]. الحضانة والصيد والزعماء تُفتح أيضًا من مباني وظائفها.
const SERVICES = [
  ["market", "🏪", "السوق", ["more", "market"]], ["shop", "🛒", "المتجر", ["shop"]], ["nov", "🛍️", "النوادر", ["more", "shop"]],
  ["hatch", "🥚", "الحضانة", ["hatch"]], ["hunt", "⚔️", "الصيد", ["hunt"]], ["breed", "🧬", "التزاوج", ["more", "breed"]],
  ["boss", "👑", "الزعماء", ["more", "boss"]], ["season", "🏆", "الموسم", ["more", "season"]], ["fairies", "🧚", "الجنيات", ["more", "fairies"]],
  ["recycle", "♻️", "التدوير", ["more", "recycle"]], ["quests", "🎯", "المهام", ["more", "quests"]], ["top", "🥇", "الترتيب", ["more", "top"]],
  ["visit", "👥", "زيارة", null], ["map", "🗺️", "الخريطة", null], ["bag", "🎒", "المخزن", ["more", "bag"]], ["more", "☰", "المزيد", ["more"]]
];
const POST_SVC = new Set(["hatch", "hunt", "boss"]);                       // لها مبانٍ وظيفية بالمعرّف نفسه
const WORLD_SVC = SERVICES.filter(s => !POST_SVC.has(s[0]));              // بوابات مستقلة في الحلقة الخارجية
function svcOpen(id) {
  const s = SERVICES.find(x => x[0] === id);
  if (!s) return;
  if (id === "visit") return farmVisitList("");
  if (id === "map") return farmMap();
  go(s[3][0], s[3][1]);
  if (s[3][1]) window.__fromWorld = true;        // زر الرجوع في القسم الفرعي يعود إلى الحظيرة لا إلى قائمة المزيد
}

function loadThree() {
  if (window.THREE) return Promise.resolve(true);
  if (threeState === "fail") return Promise.resolve(false);
  return new Promise(res => {
    threeState = "loading";
    const s = document.createElement("script");
    const t = setTimeout(() => { threeState = "fail"; res(false); }, 9000);
    s.src = THREE_URL;
    s.onload = () => { clearTimeout(t); threeState = window.THREE ? "ok" : "fail"; res(!!window.THREE); };
    s.onerror = () => { clearTimeout(t); threeState = "fail"; res(false); };
    document.head.appendChild(s);
  });
}

// ---------- أدوات ----------
function hashSeed(str) { let h = 2166136261; for (const c of String(str)) { h ^= c.codePointAt(0); h = Math.imul(h, 16777619) >>> 0; } return h >>> 0; }
function mulberry(a) { return function () { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const clampN = (v, lim) => Math.max(-lim, Math.min(lim, v));
const r2 = v => Math.round(v * 100) / 100;
const cloneW = w => ({ b: Object.assign({}, w.b), pens: JSON.parse(JSON.stringify(w.pens || {})), av: Object.assign({}, w.av), pos: Object.assign({}, w.pos), hidePow: !!w.hidePow });
function circlePts(r, n) { const o = []; for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2; o.push([Math.cos(a) * r, Math.sin(a) * r]); } return o; }
function inPoly(x, z, poly) {
  let ins = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i][0], zi = poly[i][1], xj = poly[j][0], zj = poly[j][1];
    if ((zi > z) !== (zj > z) && x < (xj - xi) * (z - zi) / (zj - zi) + xi) ins = !ins;
  }
  return ins;
}
function centroid(poly) { let x = 0, z = 0; poly.forEach(p => { x += p[0]; z += p[1]; }); return [x / poly.length, z / poly.length]; }
function samplePoly(poly) {
  let minx = 1e9, maxx = -1e9, minz = 1e9, maxz = -1e9;
  poly.forEach(p => { minx = Math.min(minx, p[0]); maxx = Math.max(maxx, p[0]); minz = Math.min(minz, p[1]); maxz = Math.max(maxz, p[1]); });
  const c = centroid(poly);
  for (let i = 0; i < 30; i++) {
    const x = minx + Math.random() * (maxx - minx), z = minz + Math.random() * (maxz - minz);
    if (inPoly(x, z, poly)) return [c[0] + (x - c[0]) * 0.9, c[1] + (z - c[1]) * 0.9];
  }
  return c;
}
function segDist(px, pz, a, b) {
  const dx = b[0] - a[0], dz = b[1] - a[1], l2 = dx * dx + dz * dz || 1;
  const t = Math.max(0, Math.min(1, ((px - a[0]) * dx + (pz - a[1]) * dz) / l2));
  return { d: Math.hypot(px - (a[0] + t * dx), pz - (a[1] + t * dz)), t };
}

// ---------- التخطيط (بيانات خالصة) ----------
// x يمين، z نحو الكاميرا. الساحة الافتراضية دائرة حول (0,0)، المباني على حلقتين، والماء شرقًا.
// W = تخطيط اللاعب المحفوظ: b مواضع المباني، pens أشكال الحظائر، av الشخصية، pos مواضع الحيوانات المثبّتة.
const SLOT0 = -Math.PI / 2, SLOT_STEP = Math.PI / 4;
function farmLayout(f, W) {
  W = W || { b: {}, pens: {}, av: {}, pos: {} };
  const rnd = mulberry(hashSeed(f.uid + "|" + f.seed));
  const inPost = new Set([].concat(...Object.values(f.post)));
  const roam = f.pets.filter(p => !inPost.has(p.id)).length;
  const Y = Math.max(8, Math.min(26, 6.5 + Math.sqrt(roam) * 1.55));
  const ring = Y + 6;
  const slot = k => [Math.cos(SLOT0 + k * SLOT_STEP) * ring, Math.sin(SLOT0 + k * SLOT_STEP) * ring];
  const buildings = [];
  f.posts.forEach((p, i) => {
    const s = slot(i % 7), o = W.b[p.id];
    buildings.push({ key: p.id, type: "post", id: p.id, e: p.e, n: p.n, x: o ? o[0] : s[0], z: o ? o[1] : s[1], w: 4.2, d: 3.2, h: 2.6, color: FARM_COL.post[i % FARM_COL.post.length], ids: f.post[p.id] || [], svc: POST_SVC.has(p.id) ? p.id : null });
  });
  const svcs = f.services || [], R2 = ring + 9;
  svcs.forEach((s, i) => {
    const a = SLOT0 + (i + 0.5) * Math.PI * 2 / svcs.length, o = W.b[s[0]];
    buildings.push({ key: s[0], type: "svc", id: s[0], e: s[1], n: s[2], x: o ? o[0] : Math.cos(a) * R2, z: o ? o[1] : Math.sin(a) * R2, w: 3.6, d: 2.6, h: 2.2, color: FARM_COL.svc[i % FARM_COL.svc.length] });
  });
  const bmap = {}; buildings.forEach(b => { bmap[b.key] = b; });
  const outer = svcs.length ? R2 : ring;
  const seaX = outer + 10;
  const trees = [];
  for (let i = 0; i < 90 && trees.length < 32; i++) {
    const x = -outer - 22 + rnd() * (outer + 20 + seaX - 4), z = -outer - 18 + rnd() * (2 * outer + 36);
    if (!(Math.hypot(x, z) < outer + 5 || x > seaX - 3)) trees.push({ x, z, s: 0.8 + rnd() * 0.8 });
  }
  const rocks = [];
  for (let i = 0; i < 60 && rocks.length < 22; i++) {
    const x = -outer - 20 + rnd() * (2 * outer + 36), z = -outer - 16 + rnd() * (2 * outer + 32);
    if (Math.hypot(x, z) > Y + 1.8 && x < seaX - 1) rocks.push({ x, z, s: 0.25 + rnd() * 0.5 });
  }
  // الحظائر (السياج): شكل مخصّص لكل حظيرة أو الدائرة الافتراضية للكبرى
  const regions = {};
  Object.keys(W.pens || {}).forEach(id => {
    const s = W.pens[id];
    regions[id] = { id, custom: true, c: s.c, gate: s.gate || 0, poly: s.pts.map(p => [s.c[0] + p[0], s.c[1] + p[1]]) };
  });
  const def = { id: "def", def: true, c: [0, 0], gate: 6, poly: circlePts(Y + 0.9, 24) };
  if (!regions["0"]) regions["0"] = def;
  const fences = Object.values(regions);
  const regionOf = pen => regions[String(pen)] || regions["0"];
  const hatchB = bmap.hatch;
  const eggs = f.eggs.map((e, i) => ({ emoji: e.emoji, ready: e.ready, ox: 3 + (i % 4) * 0.9, oz: 2.6 + Math.floor(i / 4) * 0.9 }));
  const L = { Y, ring, outer, seaX, buildings, bmap, trees, rocks, regions, fences, regionOf, eggs, hatchB, W, pets: [], actors: [] };
  L.pets = f.pets.map(p => {
    const anchor = W.pos && W.pos[p.id];
    const home = !anchor && f.post && p.post ? bmap[p.post] : null;
    const reg = regionOf(p.pen), sp = samplePoly(reg.poly);
    return Object.assign({}, p, {
      anchor: anchor ? { x: anchor[0], z: anchor[1] } : null, home: home || null,
      x: anchor ? anchor[0] : home ? home.x + (rnd() - 0.5) * 3 : sp[0],
      z: anchor ? anchor[1] : home ? home.z + home.d / 2 + 1.2 + rnd() * 1.4 : sp[1],
      tx: 0, tz: 0, wait: rnd() * 3, speed: 0.6 + rnd() * 0.7
    });
  });
  const av = W.av || {};
  L.me = { kind: "me", emoji: av.look || "🧑‍🌾", name: f.name, x: av.x != null ? av.x : 0, z: av.z != null ? av.z : Y + 4, tx: 0, tz: 0, walking: false, after: null, size: 2.6, base: 1.5 };
  L.npc = { kind: "npc", emoji: "🧓", name: "الراعي", x: 3, z: 2, tx: 0, tz: 0, wait: 1, size: 2.4, base: 1.4 };
  L.actors = [L.me, L.npc];
  return L;
}

// حركة الحيوانات والشخصيات
function stepPets(L, dt) {
  L.pets.forEach(p => {
    if (p.dragging) return;
    if (p.wait > 0) { p.wait -= dt; p.moving = false; return; }
    if (!p.tx && !p.tz) pickTarget(L, p);
    const dx = p.tx - p.x, dz = p.tz - p.z, d = Math.hypot(dx, dz);
    if (d < 0.15) { p.wait = 1.5 + Math.random() * 5; p.tx = p.tz = 0; p.moving = false; return; }
    const v = Math.min(d, p.speed * dt);
    p.x += dx / d * v; p.z += dz / d * v; p.moving = true;
  });
  const ps = L.pets;                                   // تباعد بسيط كي لا تتراكم الحيوانات فوق بعضها
  for (let i = 0; i < ps.length; i++) for (let j = i + 1; j < ps.length; j++) {
    const a = ps[i], b = ps[j]; if (a.dragging || b.dragging) continue;
    const dx = b.x - a.x, dz = b.z - a.z, d = Math.hypot(dx, dz), m = 1.25;
    if (d < m && d > 0.001) { const k = (m - d) / d * 0.5 * Math.min(1, dt * 6); a.x -= dx * k; a.z -= dz * k; b.x += dx * k; b.z += dz * k; }
  }
  const me = L.me;
  if (me.walking) {
    const dx = me.tx - me.x, dz = me.tz - me.z, d = Math.hypot(dx, dz), v = 10 * dt;
    if (d <= v) { me.x = me.tx; me.z = me.tz; me.walking = false; me.moving = false; const cb = me.after; me.after = null; if (cb) cb(); }
    else { me.x += dx / d * v; me.z += dz / d * v; me.moving = true; }
  }
  const n = L.npc;
  if (n.wait > 0) { n.wait -= dt; n.moving = false; }
  else {
    if (!n.tx && !n.tz) { const s = samplePoly(L.regionOf(0).poly); n.tx = s[0]; n.tz = s[1]; }
    const dx = n.tx - n.x, dz = n.tz - n.z, d = Math.hypot(dx, dz);
    if (d < 0.2) { n.wait = 2 + Math.random() * 4; n.tx = n.tz = 0; n.moving = false; }
    else { const v = Math.min(d, 1.3 * dt); n.x += dx / d * v; n.z += dz / d * v; n.moving = true; }
  }
}
function pickTarget(L, p) {
  if (p.anchor) { p.tx = p.anchor.x + (Math.random() - 0.5) * 1.8; p.tz = p.anchor.z + (Math.random() - 0.5) * 1.8; return; }
  if (p.home) { p.tx = p.home.x + (Math.random() - 0.5) * 3.4; p.tz = p.home.z + p.home.d / 2 + 1 + Math.random() * 1.8; return; }
  const s = samplePoly(L.regionOf(p.pen).poly); p.tx = s[0]; p.tz = s[1];
}
const doorOf = b => [b.x, b.z + b.d / 2 + 1.4];

// ---------- بيانات حظيرتي من حالة اللعبة (بلا طلب إضافي للخادم) ----------
function ownFarm() {
  const pets = S.pets.filter(p => penSel === "all" || penOf(p) === penSel);
  const ids = new Set(pets.map(p => p.id));
  const post = {};
  (S.meta.posts || []).forEach(m => { post[m.id] = (((S.posts || {}).list || {})[m.id] || []).map(x => x.id).filter(id => ids.has(id)); });
  const seed = penSel === "all" ? "all" : String(penSel);
  return {
    uid: S.player.id, name: S.player.name, seed, power: S.player.power, count: pets.length,
    pets: pets.map(p => ({ id: p.id, pen: penOf(p), sp: p.sp, emoji: p.emoji, name: p.name, rar: p.rar, rarEmoji: p.rarEmoji, rarName: p.rarName, el: p.el, elEmoji: p.elEmoji, elName: p.elName, lv: p.lv, st: p.st, main: p.main, post: p.post, pw: p.power }))
      .sort((a, b) => (b.main - a.main) || (b.pw - a.pw)),
    eggs: S.eggs.slice(0, 12).map(e => ({ tier: e.tier, emoji: e.emoji, ready: e.readyIn <= 0 })),
    post, posts: (S.meta.posts || []).map(m => ({ id: m.id, e: m.e, n: m.n })), services: WORLD_SVC
  };
}
const farmSig = f => f.seed + "|" + f.pets.map(p => p.id + ":" + (p.post || "") + ":" + p.pen + (p.main ? "m" : "")).join(",") + "|" + f.eggs.map(e => e.tier + (e.ready ? "r" : "")).join(",");

// ---------- الحفظ (مجمَّع ومؤجَّل) ----------
function saveWorld(F, patch) {
  if (!F.own) return;
  const q = F.pending || (F.pending = { b: {}, pens: {}, pos: {}, av: {} });
  if (patch.b) Object.assign(q.b, patch.b);
  if (patch.pens) Object.assign(q.pens, patch.pens);
  if (patch.pos) Object.assign(q.pos, patch.pos);
  if (patch.av) Object.assign(q.av, patch.av);
  if (typeof patch.hidePow === "boolean") q.hidePow = patch.hidePow;
  if (patch.reset) { q.reset = true; q.b = {}; q.pens = {}; }
  clearTimeout(F.saveT);
  F.saveT = setTimeout(() => flushWorld(F), 600);
}
async function flushWorld(F) {
  const q = F.pending; if (!q) return;
  F.pending = null; clearTimeout(F.saveT);
  const w = {};
  if (q.reset) w.reset = true;
  if (Object.keys(q.b).length) w.b = q.b;
  if (Object.keys(q.pens).length) w.pens = q.pens;
  if (Object.keys(q.pos).length) w.pos = q.pos;
  if (Object.keys(q.av).length) w.av = q.av;
  if (typeof q.hidePow === "boolean") w.hidePow = q.hidePow;
  if (!Object.keys(w).length) return;
  try { const j = await act("worldSave", { world: w }); if (j && j.ok && j.world) S.world = j.world; else if (j && j.msg) toast(j.msg, true); }
  catch (e) { toast("تعذّر حفظ التخطيط", true); }
}

// ======================================================
// الشاشة الرئيسية (حظيرتي)
// ======================================================
VIEWS.pen = () => {
  if (penSel !== "all" && penSel !== 0 && !S.pens.find(p => p.id === penSel)) penSel = "all";
  if (farmBusy) return;
  if (fm && fm.own && fm.canvas && document.body.contains(fm.canvas) && fm.r) {      // تحديث في مكانه دون إعادة بناء الشاشة
    penBar(); farmPenTabs();
    const f = ownFarm(), sig = farmSig(f);
    if (sig !== fm.sig) { fm.sig = sig; fm.f = f; fm.L = farmLayout(f, fm.W); fm.r.setLayout(fm.L); }
    return;
  }
  mountOwn();
};

async function mountOwn() {
  farmBusy = true;
  try {
    farmStop();
    const f = ownFarm();
    view.innerHTML = `
      <div class="seg" id="penTabs"></div>
      <style>.pen-bar{overflow-x:auto}.pen-bar .btn{flex:none;white-space:nowrap;min-height:0;height:auto;padding:9px 14px}</style><div class="pen-bar"><button class="btn" id="bCollect"></button><button class="btn sec" id="bDaily"></button><button class="btn sec" id="bFeed">🍖</button><button class="btn sec" id="bBowl">🥣</button><button class="btn sec" id="bFollow" title="تتبّع شخصيتي">🎯</button><button class="btn sec" id="bEdit">✏️</button></div>
      <canvas id="farm"></canvas>
      <div id="fEdit" class="card hidden" style="margin-top:8px"></div>
      <div id="fInfo" class="card dim" style="margin-top:8px;min-height:44px">اسحب للتحرك، وإصبعان للتكبير. اضغط على الأرض لتمشي شخصيتك، وعلى مبنى لدخوله، وعلى حيوان لإدارته، واضغط مطولًا على حيوان لسحبه.</div>
      <div class="dock" id="fDock"></div>
      <div class="dim" id="fMode" style="font-size:11px;margin-top:2px"></div>`;
    $("#bCollect").onclick = () => { buzz("medium"); run("collect"); };
    $("#bDaily").onclick = () => { buzz("medium"); run("daily"); };
    $("#bFeed").onclick = feedAll;
    $("#bBowl").onclick = () => { buzz(); openBowls(); };
    $("#bFollow").onclick = () => { buzz(); if (fm) { fm.follow = !fm.follow; $("#bFollow").classList.toggle("sec", !fm.follow); } };
    $("#bEdit").onclick = () => { buzz(); if (fm) editToggle(fm); };
    farmPenTabs(); penBar(); farmDock();
    await sceneStart(f, true, cloneW(S.world || {}));
  } finally { farmBusy = false; }
  if (!S.pets.length) toast("لا حيوانات بعد. افقس بيضتك الأولى 🥚");
}

function farmPenTabs() {
  const el = $("#penTabs");
  if (!el) return;
  const cnt = id => S.pets.filter(p => penOf(p) === id).length;
  const tabs = [["all", "🌍 الكل " + S.pets.length], [0, "🏡 الكبرى " + cnt(0)]].concat(S.pens.map(p => [p.id, esc(p.name) + " " + cnt(p.id)]));
  el.innerHTML = tabs.map(t => `<button data-p="${t[0]}" class="${t[0] === penSel ? "on" : ""}">${t[1]}</button>`).join("") + `<button data-p="cfg">⚙️ الحظائر</button>`;
  el.querySelectorAll("button").forEach(b => b.onclick = () => {
    buzz();
    if (b.dataset.p === "cfg") return openPens();
    penSel = b.dataset.p === "all" ? "all" : Number(b.dataset.p);
    VIEWS.pen();
  });
}

function farmDock() {
  const el = $("#fDock");
  if (!el) return;
  el.innerHTML = SERVICES.map(s => `<button data-s="${s[0]}"><span>${s[1]}</span>${s[2]}</button>`).join("");
  el.querySelectorAll("button").forEach(b => b.onclick = () => { buzz(); svcOpen(b.dataset.s); });
}

// ---------- تشغيل المشهد (مشترك بين حظيرتي وحظائر الآخرين) ----------
async function sceneStart(f, own, W) {
  let canvas = $("#farm");
  const L = farmLayout(f, W);
  const F = fm = { canvas, L, f, W, own, sig: farmSig(f), cam: { tx: 0, tz: 2, d: 40 }, raf: 0, last: 0, mode: "2d", edit: null, follow: false };
  const ok = await loadThree();
  if (fm !== F || !document.body.contains(canvas)) return;       // غادر المستخدم الشاشة أثناء التحميل
  let r = null;
  if (ok) { try { r = farm3dInit(F); F.mode = "3d"; } catch (e) { console.warn("farm3d", e); r = null; } }
  if (!r) {
    // لوحة حصلت على سياق WebGL لا تقبل 2d: نستبدلها بلوحة جديدة
    const nc = document.createElement("canvas"); nc.id = "farm"; canvas.replaceWith(nc); canvas = nc; F.canvas = nc;
    r = farm2dInit(F); F.mode = "2d";
  }
  F.r = r;
  const m = $("#fMode"); if (m) m.textContent = F.mode === "3d" ? "" : "عرض مبسّط (تعذّر تحميل الثلاثي الأبعاد)";
  farmInput(F);
  const loop = t => {
    if (fm !== F || !document.body.contains(F.canvas)) { farmDispose(F); if (fm === F) fm = null; return; }
    const dt = Math.min(0.1, ((t - F.last) / 1000) || 0.016); F.last = t;
    if (!document.hidden) {
      stepPets(F.L, dt);
      if (F.follow) { F.cam.tx += (F.L.me.x - F.cam.tx) * Math.min(1, dt * 3); F.cam.tz += (F.L.me.z - F.cam.tz) * Math.min(1, dt * 3); }
      F.r.draw(t / 1000);
    }
    F.raf = requestAnimationFrame(loop);
  };
  F.raf = requestAnimationFrame(loop);
}
function farmDispose(F) {
  if (!F || F.dead) return;
  F.dead = true;
  cancelAnimationFrame(F.raf);
  if (F.pending) { clearTimeout(F.saveT); flushWorld(F); }          // لا نضيّع آخر تعديل عند المغادرة
  try { if (F.r && F.r.dispose) F.r.dispose(); } catch (e) { /* لا شيء */ }
  if (F.onResize) window.removeEventListener("resize", F.onResize);
}
function farmStop() { farmDispose(fm); fm = null; }

// ======================================================
// وضع التعديل: نقل المباني، رسم الحظائر وأبوابها، الخصوصية، شكل الشخصية
// ======================================================
function editToggle(F) {
  if (F.edit) { editClose(F); return; }
  F.edit = { tool: "move", pen: penSel === "all" ? 0 : penSel, draft: [] };
  $("#bEdit").classList.remove("sec");
  editPanel(F);
  farmRedraw(F);
}
function editClose(F) {
  F.edit = null;
  const b = $("#bEdit"); if (b) b.classList.add("sec");
  const el = $("#fEdit"); if (el) el.classList.add("hidden");
  farmRedraw(F);
  flushWorld(F);
}
function farmRedraw(F) { if (F.r && F.r.refreshFences) F.r.refreshFences(); }
function penName(id) { return id === 0 ? "الحظيرة الكبرى" : ((S.pens.find(p => p.id === id) || {}).name || "حظيرة"); }
function editPanel(F) {
  const E = F.edit, el = $("#fEdit"); if (!el || !E) return;
  const tools = [["move", "🖐️ نقل"], ["draw", "✏️ رسم حظيرة"], ["gate", "🚪 باب"], ["clear", "🗑️ مسح الشكل"]];
  const pensOpts = [0].concat(S.pens.map(p => p.id)).map(id => `<option value="${id}" ${id === E.pen ? "selected" : ""}>${esc(penName(id))}</option>`).join("");
  el.classList.remove("hidden");
  el.innerHTML = `
    <div class="seg" style="margin-bottom:8px">${tools.map(t => `<button data-t="${t[0]}" class="${E.tool === t[0] ? "on" : ""}">${t[1]}</button>`).join("")}</div>
    <div class="dim" style="font-size:12px;margin-bottom:8px">${{
      move: "اسحب أي مبنى أو نقطة في السياج لتحريكه. اضغط مطولًا على حيوان لتثبيته في مكان.",
      draw: "اختر الحظيرة ثم اضغط على الأرض لوضع نقاط السياج (3 إلى 14 نقطة)، ثم «إغلاق».",
      gate: "اضغط على جزء من سياج حظيرة لجعله الباب (باب واحد لكل حظيرة).",
      clear: "اضغط داخل حظيرة أو على سياجها لحذف شكلها المخصّص."
    }[E.tool]}</div>
    ${E.tool === "draw" ? `<div class="row" style="gap:6px;margin-bottom:8px"><select id="eaPen" class="grow" style="padding:8px;border-radius:10px;background:var(--card2);color:inherit;border:1px solid var(--line)">${pensOpts}</select><button class="btn sm" id="eaUndo">↩️ تراجع</button><button class="btn sm" id="eaClose" ${E.draft.length < 3 ? "disabled" : ""}>⭕ إغلاق (${E.draft.length})</button></div>` : ""}
    <div class="row" style="gap:6px;flex-wrap:wrap">
      <button class="btn sec sm" id="eaPow">${F.W.hidePow ? "🔒 قوة الحيوانات مخفية عن الزوّار" : "👁️ قوة الحيوانات ظاهرة للزوّار"}</button>
      <button class="btn sec sm" id="eaUnpin">🔓 فكّ تثبيت الحيوانات</button>
      <button class="btn sec sm" id="eaReset">↺ التخطيط الافتراضي</button>
      <button class="btn sm" id="eaDone">✔️ تم</button>
    </div>`;
  el.querySelectorAll("[data-t]").forEach(b => b.onclick = () => { buzz(); E.tool = b.dataset.t; E.draft = []; editPanel(F); farmRedraw(F); });
  const sel = $("#eaPen"); if (sel) sel.onchange = () => { E.pen = Number(sel.value); };
  const un = $("#eaUndo"); if (un) un.onclick = () => { E.draft.pop(); editPanel(F); farmRedraw(F); };
  const cl = $("#eaClose"); if (cl) cl.onclick = () => editCommitDraft(F);
  $("#eaPow").onclick = () => { F.W.hidePow = !F.W.hidePow; saveWorld(F, { hidePow: F.W.hidePow }); buzz(); editPanel(F); toast(F.W.hidePow ? "🔒 لن يرى الزوّار قوة حيواناتك" : "👁️ سيرى الزوّار قوة حيواناتك"); };
  $("#eaUnpin").onclick = () => {
    const ids = Object.keys(F.W.pos); if (!ids.length) return toast("لا حيوانات مثبّتة");
    const patch = {}; ids.forEach(id => { patch[id] = null; }); F.W.pos = {}; F.L.pets.forEach(p => { p.anchor = null; p.tx = p.tz = 0; });
    saveWorld(F, { pos: patch }); buzz(); toast("🔓 عادت الحيوانات للتجوال الحر");
  };
  $("#eaReset").onclick = () => {
    if (!confirmReset()) return;
    F.W.b = {}; F.W.pens = {}; saveWorld(F, { reset: true });
    F.L = farmLayout(F.f, F.W); F.r.setLayout(F.L); buzz(); toast("↺ عاد التخطيط الافتراضي");
  };
  $("#eaDone").onclick = () => { buzz(); editClose(F); };
}
function confirmReset() { try { return window.tg && tg.showConfirm ? true : confirm("إعادة المباني والأسوار إلى وضعها الافتراضي؟"); } catch (e) { return true; } }
function applyPens(F) { F.L = farmLayout(F.f, F.W); F.r.setLayout(F.L); }
function editCommitDraft(F) {
  const E = F.edit; if (!E || E.draft.length < 3) return;
  const pts = E.draft.slice(0, 14), c = centroid(pts);
  const rel = pts.map(p => [r2(clampN(p[0] - c[0], PLIM)), r2(clampN(p[1] - c[1], PLIM))]);
  const shape = { c: [r2(clampN(c[0], WLIM)), r2(clampN(c[1], WLIM))], pts: rel, gate: 0 };
  F.W.pens[String(E.pen)] = shape; saveWorld(F, { pens: { [String(E.pen)]: shape } });
  E.draft = []; applyPens(F); editPanel(F); buzz("medium"); toast("✅ تم رسم " + penName(E.pen));
}
function editTap(F, wx, wz) {
  const E = F.edit, L = F.L;
  if (E.tool === "draw") {
    if (E.draft.length >= 14) return toast("الحد الأقصى 14 نقطة");
    E.draft.push([r2(clampN(wx, WLIM)), r2(clampN(wz, WLIM))]); editPanel(F); farmRedraw(F); return;
  }
  const regs = L.fences.filter(r => r.custom);
  if (E.tool === "gate") {
    let best = null;
    regs.forEach(r => r.poly.forEach((a, i) => { const s = segDist(wx, wz, a, r.poly[(i + 1) % r.poly.length]); if (s.d < 2.2 && (!best || s.d < best.d)) best = { d: s.d, r, i }; }));
    if (!best) return toast("اضغط على سياج حظيرة مرسومة");
    const shape = F.W.pens[best.r.id]; shape.gate = best.i; saveWorld(F, { pens: { [best.r.id]: shape } });
    applyPens(F); farmRedraw(F); buzz(); toast("🚪 تم تحديد الباب"); return;
  }
  if (E.tool === "clear") {
    let hit = regs.find(r => inPoly(wx, wz, r.poly));
    if (!hit) regs.forEach(r => r.poly.forEach((a, i) => { if (!hit && segDist(wx, wz, a, r.poly[(i + 1) % r.poly.length]).d < 2) hit = r; }));
    if (!hit) return toast("اضغط داخل حظيرة مرسومة");
    delete F.W.pens[hit.id]; saveWorld(F, { pens: { [hit.id]: null } }); applyPens(F); farmRedraw(F); buzz(); toast("🗑️ حُذف شكل الحظيرة");
  }
}

// ======================================================
// زيارة حظائر الآخرين
// ======================================================
SUBS.farm = () => go("pen");
SUBS.visit = () => { if ($("#fList")) return; farmVisitList(""); };

async function farmOpen(uid) {
  if (farmBusy) return;
  farmBusy = true;
  try {
    farmStop();
    view.innerHTML = `<button class="btn sec sm" id="fBack" style="margin-bottom:8px">↩️ رجوع</button><div class="dim">جارٍ تحضير الحظيرة…</div>`;
    $("#fBack").onclick = () => farmVisitList("");
    const j = await act("farmView", { uid });
    if (!j || !j.ok) { toast((j && j.msg) || "تعذر فتح الحظيرة", true); farmBusy = false; return farmVisitList(""); }
    const f = Object.assign({ seed: "v", services: [] }, j.farm);
    view.innerHTML = `
      <div class="pen-bar">
        <button class="btn sec sm" id="fBack" style="flex:none">↩️</button>
        <div class="grow" style="align-self:center;font-weight:700">👀 ${esc(f.name)} <span class="dim" style="font-weight:400">${f.hidePow ? "🔒" : "⚔️ " + fmt(f.power)} · 🐾 ${f.count}</span></div>
        <button class="btn sm" id="fMine" style="flex:none">🏠 حظيرتي</button>
      </div>
      <canvas id="farm"></canvas>
      <div id="fInfo" class="card dim" style="margin-top:8px;min-height:44px">اضغط على حيوان أو مبنى لترى بياناته.</div>
      <div class="dim" id="fMode" style="font-size:11px;margin-top:4px"></div>`;
    $("#fBack").onclick = () => farmVisitList("");
    $("#fMine").onclick = () => { buzz(); go("pen"); };
    await sceneStart(f, false, cloneW(f.world || {}));
  } finally { farmBusy = false; }
}

async function farmVisitList(q) {
  farmStop();
  sub = "visit";
  view.innerHTML = `<button class="btn sec sm" id="fBack" style="margin-bottom:8px">↩️ رجوع</button><h2>👥 زيارة حظائر اللاعبين</h2>
    <div class="row" style="gap:6px;margin-bottom:8px"><input id="fQ" class="grow" placeholder="ابحث باسم لاعب" value="${esc(q || "")}" style="padding:9px;border-radius:10px;background:var(--card2);border:1px solid var(--line);color:inherit"><button class="btn sm" id="fGo">بحث</button></div>
    <div id="fList"><div class="dim">جارٍ التحميل…</div></div>`;
  $("#fBack").onclick = () => { buzz(); go("pen"); };
  const load = async () => {
    const j = await act("visitList", { q: $("#fQ").value });
    if (!j || !j.ok) return;
    $("#fList").innerHTML = j.list.length ? j.list.map(r => `<div class="card row"><div style="font-size:30px">${r.emoji}</div><div class="grow"><b>${esc(r.name)}</b><div class="dim">${r.power === null ? "🔒" : "⚔️ " + fmt(r.power)} · 🐾 ${r.pets}</div></div><button class="btn sm" data-u="${esc(r.uid)}">زيارة</button></div>`).join("") : `<div class="dim">لا يوجد لاعبون مطابقون.</div>`;
    $("#fList").querySelectorAll("[data-u]").forEach(b => b.onclick = () => { buzz(); farmOpen(b.dataset.u); });
  };
  $("#fGo").onclick = load;
  $("#fQ").onkeydown = e => { if (e.key === "Enter") load(); };
  load();
}

// ======================================================
// التحكم باللمس (مشترك): تحريك الكاميرا، تكبير، نقر، ضغط مطوّل لسحب حيوان، سحب مبنى أو نقطة سياج
// ======================================================
function farmInput(F) {
  const c = F.canvas, ptr = new Map();
  let startT = 0, moved = 0, pinch = 0, hold = 0;
  const clampCam = () => { const cam = F.cam, lim = F.L.outer + 12; cam.d = Math.max(14, Math.min(F.L.outer * 5 + 30, cam.d)); cam.tx = Math.max(-lim, Math.min(lim, cam.tx)); cam.tz = Math.max(-lim, Math.min(lim, cam.tz)); };
  const local = e => { const r = c.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top, r.width, r.height]; };
  const ground = e => { const [x, y, w, h] = local(e); const g = F.r.toWorld(x, y, w, h); return g && Number.isFinite(g[0]) && Number.isFinite(g[1]) ? g : null; };
  const nearVertex = (g) => {
    let best = null;
    F.L.fences.filter(r => r.custom).forEach(r => r.poly.forEach((p, i) => { const d = Math.hypot(g[0] - p[0], g[1] - p[1]); if (d < 1.8 && (!best || d < best.d)) best = { d, r, i }; }));
    return best;
  };
  const hitBuilding = g => F.L.buildings.find(b => Math.abs(g[0] - b.x) <= b.w / 2 + 1 && Math.abs(g[1] - b.z) <= b.d / 2 + 1) || null;

  c.addEventListener("pointerdown", e => {
    c.setPointerCapture(e.pointerId); ptr.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (ptr.size === 1) { startT = Date.now(); moved = 0; } else { clearTimeout(hold); }
    pinch = 0; F.drag = null;
    if (ptr.size !== 1 || !F.own) return;
    const g = ground(e);
    if (F.edit && F.edit.tool === "move" && g) {
      const v = nearVertex(g);
      if (v) { F.drag = { kind: "vtx", id: v.r.id, i: v.i }; return; }
      const b = hitBuilding(g);
      if (b) { F.drag = { kind: "bld", b, ox: b.x - g[0], oz: b.z - g[1] }; return; }
    }
    const [x, y, w, h] = local(e), pk = F.r.pick(x, y, w, h);
    if (pk && pk.kind === "pet") {                           // ضغط مطوّل على حيوان ثم سحبه
      hold = setTimeout(() => {
        const p = F.L.pets.find(q => q.id === pk.id);
        if (p && ptr.size === 1 && moved < 10) { F.drag = { kind: "pet", p }; p.dragging = true; buzz("medium"); }
      }, 380);
    }
  });
  c.addEventListener("pointermove", e => {
    const p = ptr.get(e.pointerId); if (!p) return;
    const dx = e.clientX - p.x, dy = e.clientY - p.y;
    if (F.drag) {
      const g = ground(e); if (g) dragMove(F, g);
      p.x = e.clientX; p.y = e.clientY; moved += Math.abs(dx) + Math.abs(dy); return;
    }
    if (ptr.size === 1) {
      moved += Math.abs(dx) + Math.abs(dy);
      if (moved > 10) clearTimeout(hold);
      const k = F.cam.d / (c.clientHeight || 400) * 1.15;      // تحويل بكسل الشاشة إلى وحدات العالم
      F.cam.tx -= dx * k; F.cam.tz -= dy * k * 1.35; clampCam();
    } else if (ptr.size === 2) {
      const o = [...ptr.entries()].find(([id]) => id !== e.pointerId)[1];
      const nd = Math.hypot(e.clientX - o.x, e.clientY - o.y);
      if (pinch) { F.cam.d *= pinch / nd; clampCam(); }
      pinch = nd; moved += 10;
    }
    p.x = e.clientX; p.y = e.clientY;
  });
  const up = e => {
    clearTimeout(hold);
    const had = ptr.has(e.pointerId); ptr.delete(e.pointerId); pinch = 0;
    if (F.drag) { dragEnd(F); F.drag = null; return; }
    if (had && ptr.size === 0 && moved < 8 && Date.now() - startT < 350) farmTap(F, e, ground(e), local(e));
  };
  c.addEventListener("pointerup", up);
  c.addEventListener("pointercancel", e => { clearTimeout(hold); ptr.delete(e.pointerId); pinch = 0; if (F.drag) { dragEnd(F); F.drag = null; } });
  c.addEventListener("wheel", e => { e.preventDefault(); F.cam.d *= e.deltaY > 0 ? 1.08 : 0.92; clampCam(); }, { passive: false });
}
function dragMove(F, g) {
  const d = F.drag, x = clampN(g[0], WLIM), z = clampN(g[1], WLIM);
  if (d.kind === "pet") { d.p.x = x; d.p.z = z; return; }
  if (d.kind === "bld") { d.b.x = clampN(x + d.ox, WLIM); d.b.z = clampN(z + d.oz, WLIM); if (F.r.moveBuilding) F.r.moveBuilding(d.b); return; }
  if (d.kind === "vtx") {
    const reg = F.L.regions[d.id], sh = F.W.pens[d.id]; if (!sh) return;
    reg.poly[d.i] = [x, z];
    sh.pts[d.i] = [r2(clampN(x - sh.c[0], PLIM)), r2(clampN(z - sh.c[1], PLIM))];
    farmRedraw(F);
  }
}
function dragEnd(F) {
  const d = F.drag;
  if (d.kind === "pet") {
    const p = d.p; p.dragging = false; p.anchor = { x: r2(p.x), z: r2(p.z) }; p.tx = p.tz = 0; p.wait = 1;
    F.W.pos[p.id] = [p.anchor.x, p.anchor.z]; saveWorld(F, { pos: { [p.id]: [p.anchor.x, p.anchor.z] } });
    const bx = $("#fInfo"); if (bx) bx.innerHTML = `📌 ثبّتَّ <b>${p.emoji} ${esc(p.name)}</b> في هذا المكان. (لفكّ التثبيت: ✏️ ثم «فكّ تثبيت الحيوانات»)`;
    return;
  }
  if (d.kind === "bld") { F.W.b[d.b.key] = [r2(d.b.x), r2(d.b.z)]; saveWorld(F, { b: { [d.b.key]: [r2(d.b.x), r2(d.b.z)] } }); buzz(); return; }
  if (d.kind === "vtx") { const sh = F.W.pens[d.id]; saveWorld(F, { pens: { [d.id]: sh } }); buzz(); }
}

function farmTap(F, e, g, loc) {
  const [lx, ly, lw, lh] = loc;
  const box = $("#fInfo"); if (!box) return;
  buzz();
  if (F.edit) { if (g) editTap(F, g[0], g[1]); return; }
  const pk = F.r.pick(lx, ly, lw, lh);
  const L = F.L;
  const bld = pk && pk.kind === "bld" ? L.bmap[pk.key] : (g ? L.buildings.find(b => Math.abs(g[0] - b.x) <= b.w / 2 + 0.6 && Math.abs(g[1] - b.z) <= b.d / 2 + 0.6) : null);
  if (pk && pk.kind === "pet") {
    if (F.own) { openPet(pk.id); return; }
    const p = pk;
    box.innerHTML = `<b>${p.emoji} ${esc(p.name)}</b> ${p.main ? "👑" : ""} <span class="tag" style="color:${RAR_COLOR[p.rar] || "#fff"}">${p.rarEmoji} ${esc(p.rarName)}</span>
      <div class="dim">${p.elEmoji} ${esc(p.elName)} · مستوى ${p.lv}${p.st ? " · " + "⭐".repeat(Math.min(5, p.st)) : ""} · ${p.pw === null || p.pw === undefined ? "🔒 القوة مخفية" : "⚔️ " + fmt(p.pw)}${p.post ? " · في وظيفة" : ""}</div>`;
    return;
  }
  if (pk && pk.kind === "npc") {
    box.innerHTML = `<div class="row"><div class="grow"><b>🧓 الراعي</b><div class="dim">${F.own ? "يعتني بحيواناتك." : "راعي هذه الحظيرة."}</div></div>${F.own ? `<button class="btn sm" id="fFeed">🍖 أطعم الجائعين</button>` : ""}</div>`;
    if (F.own) $("#fFeed").onclick = () => { buzz("medium"); feedAll(); };
    return;
  }
  if (pk && pk.kind === "me") {
    if (!F.own) { box.innerHTML = `<b>${L.me.emoji} ${esc(L.me.name)}</b>`; return; }
    box.innerHTML = `<div class="dim" style="margin-bottom:6px">اختر شكل شخصيتك:</div><div class="row" style="gap:6px;flex-wrap:wrap">${(S.looks || []).map(l => `<button class="btn sec sm" data-l="${l}" style="font-size:20px">${l}</button>`).join("")}</div>`;
    box.querySelectorAll("[data-l]").forEach(b => b.onclick = () => { buzz(); L.me.emoji = b.dataset.l; F.W.av.look = b.dataset.l; saveWorld(F, { av: { look: b.dataset.l } }); if (F.r.setLayout) F.r.setLayout(L); });
    return;
  }
  if (bld) {
    if (!F.own) {
      box.innerHTML = `<b>${bld.e} ${esc(bld.n)}</b>${bld.type === "post" ? " · " + bld.ids.length + " حيوان" : ""}`;
      return;
    }
    const door = doorOf(bld);
    box.innerHTML = `<div class="dim">🚶 شخصيتك في الطريق إلى ${bld.e} ${esc(bld.n)}…</div>`;
    walkTo(F, door[0], door[1], () => enterBuilding(F, bld));
    return;
  }
  if (g && F.own) {                                       // مشي إلى نقطة على الأرض
    walkTo(F, clampN(g[0], WLIM), clampN(g[1], WLIM), () => saveWorld(F, { av: { x: r2(L.me.x), z: r2(L.me.z) } }));
  }
}
function walkTo(F, x, z, after) { const me = F.L.me; me.tx = x; me.tz = z; me.walking = true; me.after = after; }
function enterBuilding(F, b) {
  const box = $("#fInfo"); if (!box) return;
  saveWorld(F, { av: { x: r2(F.L.me.x), z: r2(F.L.me.z) } });
  if (b.type === "svc") { svcOpen(b.id); return; }
  box.innerHTML = `<div class="row" style="gap:6px;flex-wrap:wrap"><div class="grow"><b>${b.e} ${esc(b.n)}</b> · ${b.ids.length} حيوان${b.ids.length ? "" : " (فارغة)"}</div>
    ${b.svc ? `<button class="btn sm" id="fSvc">فتح القسم</button>` : ""}<button class="btn sec sm" id="fMng">إدارة الوظيفة</button></div>`;
  if (b.svc) $("#fSvc").onclick = () => { buzz(); svcOpen(b.svc); };
  $("#fMng").onclick = () => { buzz(); go("more", "posts"); window.__fromWorld = true; };
}

// ======================================================
// رسم ثلاثي الأبعاد
// ======================================================
function farm3dInit(F) {
  const T = window.THREE, c = F.canvas;
  const renderer = new T.WebGLRenderer({ canvas: c, antialias: false, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.setClearColor(0x9fd0f0);
  const scene = new T.Scene();
  scene.fog = new T.Fog(0x9fd0f0, 70, 150);
  const camera = new T.PerspectiveCamera(42, 1, 0.5, 260);
  scene.add(new T.HemisphereLight(0xffffff, 0x4d6b3a, 0.85));
  const sun = new T.DirectionalLight(0xfff2d0, 0.75); sun.position.set(-20, 30, 12); scene.add(sun);

  const textures = new Map();          // تُحفظ بين إعادات البناء
  const emojiTex = e => {
    if (textures.has("e" + e)) return textures.get("e" + e);
    const cv = document.createElement("canvas"); cv.width = cv.height = 128;
    const g = cv.getContext("2d"); g.font = "96px sans-serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(e, 64, 72);
    const t = new T.CanvasTexture(cv); textures.set("e" + e, t); return t;
  };
  const textTex = s => {
    if (textures.has("t" + s)) return textures.get("t" + s);
    const cv = document.createElement("canvas"); cv.width = 256; cv.height = 64;
    const g = cv.getContext("2d"); g.font = "bold 30px sans-serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.lineWidth = 6; g.strokeStyle = "#000"; g.strokeText(s, 128, 34); g.fillStyle = "#fff"; g.fillText(s, 128, 34);
    const t = new T.CanvasTexture(cv); textures.set("t" + s, t); return t;
  };
  const mkSprite = (tex, w, h) => { const sp = new T.Sprite(new T.SpriteMaterial({ map: tex, transparent: true, depthWrite: false })); sp.scale.set(w, h, 1); return sp; };
  const mat = (color, extra) => new T.MeshLambertMaterial(Object.assign({ color, flatShading: true }, extra || {}));
  const dispose = g => { if (!g) return; scene.remove(g); g.traverse(o => { if (o.geometry && !(o.geometry.userData && o.geometry.userData.shared)) o.geometry.dispose(); if (o.material && !o.isSprite && !(o.material.userData && o.material.userData.shared)) o.material.dispose(); }); };
  const boxIn = (g, w, h, d, color, x, y, z) => { const m = new T.Mesh(new T.BoxGeometry(w, h, d), mat(color)); m.position.set(x, y, z); g.add(m); return m; };

  let envG = null, bldG = null, fenceG = null, petG = null;
  const bmap = {};                      // مفتاح المبنى → مجموعته
  let pickables = [], bldPick = [], petPick = [];

  // ---- مجسّمات الحيوانات: هندسة ومواد مشتركة، وكل نوع يُبنى من أجزاء AN3D ----
  const GEO = {}, MATS = {};
  const geo = k => GEO[k] || (GEO[k] = (() => { const g = k === "s" ? new T.SphereGeometry(1, 10, 8) : k === "b" ? new T.BoxGeometry(1, 1, 1) : k === "c" ? new T.ConeGeometry(1, 1, 8) : new T.CylinderGeometry(1, 1, 1, 8); g.userData = { shared: true }; return g; })());
  const smat = col => MATS[col] || (MATS[col] = (() => { const m = new T.MeshLambertMaterial({ color: new T.Color(col), flatShading: true }); m.userData = { shared: true }; return m; })());
  function mkAnimal(p, hi) {
    const parts = window.AN3D && AN3D.parts(p.sp);
    if (!parts) return null;
    const g = new T.Group(), anim = [], data = Object.assign({ kind: "pet" }, p);
    parts.forEach(pt => {
      if (pt.hi && !hi) return;
      const m = new T.Mesh(geo(pt.k), smat(pt.c || "#888888"));
      m.scale.set(pt.s[0], pt.s[1], pt.s[2]); m.userData = data;
      if (pt.r) m.rotation.set(pt.r[0], pt.r[1], pt.r[2]);
      if (pt.pv) {
        const pv = new T.Group(); pv.position.set(pt.pv[0], pt.pv[1], pt.pv[2]);
        m.position.set(pt.p[0] - pt.pv[0], pt.p[1] - pt.pv[1], pt.p[2] - pt.pv[2]); pv.add(m); g.add(pv);
        if (pt.an) anim.push({ o: pv, an: pt.an, ph: pt.ph || 0 });
      } else { m.position.set(pt.p[0], pt.p[1], pt.p[2]); g.add(m); }
    });
    g.userData = data; return { g, anim };
  }
  function animateAnimal(p, t) {
    const mv = p.moving && !p.dragging, k = p.id * 1.7, fl = window.AN3D && AN3D.fly(p.sp) > 0;
    p.anim.forEach(a => {
      if (a.an === "leg") a.o.rotation.x = mv ? Math.sin(t * 9 + a.ph + k) * 0.6 : 0;
      else if (a.an === "wing") a.o.rotation.z = a.ph * Math.sin(t * (fl ? 14 : 10) + k) * (fl ? 0.6 : mv ? 0.55 : 0.06);
      else if (a.an === "tail") a.o.rotation.y = Math.sin(t * (mv ? 7 : 2.5) + a.ph + k) * (mv ? 0.35 : 0.22);
    });
    if (mv && (p.tx || p.tz)) { const want = Math.atan2(p.tx - p.x, p.tz - p.z); let d = want - p.hd; d = Math.atan2(Math.sin(d), Math.cos(d)); p.hd += d * 0.2; }
    p.g.rotation.y = p.hd;
  }

  function buildEnv(L) {
    dispose(envG); envG = new T.Group(); scene.add(envG);
    const ground = new T.Mesh(new T.PlaneGeometry(320, 280), mat(0x58993f)); ground.rotation.x = -Math.PI / 2; envG.add(ground);
    const sea = new T.Mesh(new T.PlaneGeometry(60, 280), mat(0x2f78b5)); sea.rotation.x = -Math.PI / 2; sea.position.set(L.seaX + 30, 0.01, 0); envG.add(sea);
    const shore = new T.Mesh(new T.PlaneGeometry(5, 280), mat(0xc9b78a)); shore.rotation.x = -Math.PI / 2; shore.position.set(L.seaX - 2.5, 0.015, 0); envG.add(shore);
    boxIn(envG, 7, 0.25, 1.8, 0x7a5a3a, L.seaX + 1.5, 0.2, 6);
    L.trees.forEach(t => {
      boxIn(envG, 0.4 * t.s, 1.4 * t.s, 0.4 * t.s, 0x6b4a2a, t.x, 0.7 * t.s, t.z);
      const cone = new T.Mesh(new T.ConeGeometry(1.5 * t.s, 3.6 * t.s, 7), mat(0x2f6b3a)); cone.position.set(t.x, 3 * t.s, t.z); envG.add(cone);
    });
    L.rocks.forEach(r => { const m = new T.Mesh(new T.DodecahedronGeometry(r.s, 0), mat(0x8a8d93)); m.position.set(r.x, r.s * 0.4, r.z); envG.add(m); });
  }
  function buildBuildings(L) {
    dispose(bldG); bldG = new T.Group(); scene.add(bldG); bldPick = [];
    Object.keys(bmap).forEach(k => delete bmap[k]);
    L.buildings.forEach(b => {
      const g = new T.Group(); g.position.set(b.x, 0, b.z); bldG.add(g); bmap[b.key] = g;
      boxIn(g, b.w, b.h, b.d, b.color, 0, b.h / 2, 0);
      boxIn(g, b.w + 0.5, 0.3, b.d + 0.5, b.type === "post" ? 0x6b4a35 : 0x3d3d4a, 0, b.h + 0.15, 0);
      const data = { kind: "bld", key: b.key };
      const sign = mkSprite(emojiTex(b.e), b.type === "post" ? 2.4 : 2.2, b.type === "post" ? 2.4 : 2.2); sign.position.set(0, b.h + (b.type === "post" ? 2 : 1.7), 0); sign.userData = data; g.add(sign); bldPick.push(sign);
      const lab = mkSprite(textTex(b.n), 5, 1.25); lab.position.set(0, b.h + (b.type === "post" ? 3.6 : 3.1), 0); lab.userData = data; g.add(lab); bldPick.push(lab);
      if (b.key === "hatch") L.eggs.forEach(e => { const m = new T.Mesh(new T.SphereGeometry(0.38, 10, 8), mat(e.ready ? 0xffd24d : 0xf3ead2)); m.scale.y = 1.3; m.position.set(e.ox, 0.5, e.oz); g.add(m); });
    });
    if (!L.bmap.hatch) L.eggs.forEach((e, i) => { const m = new T.Mesh(new T.SphereGeometry(0.38, 10, 8), mat(e.ready ? 0xffd24d : 0xf3ead2)); m.scale.y = 1.3; m.position.set(-3 + i * 0.9, 0.5, L.Y + 3); bldG.add(m); });
    rebuildPick();
  }
  function buildFences(L) {
    dispose(fenceG); fenceG = new T.Group(); scene.add(fenceG);
    const rail = (a, b, color, y) => {
      const dx = b[0] - a[0], dz = b[1] - a[1], len = Math.hypot(dx, dz); if (len < 0.1) return;
      const m = new T.Mesh(new T.BoxGeometry(len, 0.12, 0.12), mat(color)); m.position.set((a[0] + b[0]) / 2, y, (a[1] + b[1]) / 2); m.rotation.y = -Math.atan2(dz, dx); fenceG.add(m);
    };
    const post = (x, z, h, color) => boxIn(fenceG, 0.25, h, 0.25, color, x, h / 2, z);
    L.fences.forEach(r => {
      const n = r.poly.length;
      for (let i = 0; i < n; i++) {
        const a = r.poly[i], b = r.poly[(i + 1) % n], gate = i === (r.gate || 0) % n;
        const len = Math.hypot(b[0] - a[0], b[1] - a[1]), k = Math.max(1, Math.round(len / 1.5));
        const at = t => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
        for (let j = 0; j <= k; j++) { const t = j / k; if (gate && t > 0.3 && t < 0.7) continue; const p = at(t); post(p[0], p[1], 1, 0xa57a4a); }
        if (gate) {
          const g1 = at(0.3), g2 = at(0.7);
          rail(a, g1, 0xa57a4a, 0.75); rail(g2, b, 0xa57a4a, 0.75);
          post(g1[0], g1[1], 1.8, 0xe0b040); post(g2[0], g2[1], 1.8, 0xe0b040);
          const lin = new T.Mesh(new T.BoxGeometry(Math.hypot(g2[0] - g1[0], g2[1] - g1[1]), 0.15, 0.15), mat(0xe0b040)); lin.position.set((g1[0] + g2[0]) / 2, 1.8, (g1[1] + g2[1]) / 2); lin.rotation.y = -Math.atan2(b[1] - a[1], b[0] - a[0]); fenceG.add(lin);
        } else rail(a, b, 0xa57a4a, 0.75);
      }
      if (r.custom) {                          // أرضية ترابية داخل الحظيرة المخصّصة
        try {
          const shape = new T.Shape(r.poly.map(p => new T.Vector2(p[0], -p[1])));
          const fl = new T.Mesh(new T.ShapeGeometry(shape), mat(0x8c7a4e)); fl.rotation.x = -Math.PI / 2; fl.position.y = 0.03; fenceG.add(fl);
        } catch (e) { /* بلا أرضية */ }
      } else {
        const dirt = new T.Mesh(new T.CircleGeometry(L.Y + 0.9, 36), mat(0x8c7a4e)); dirt.rotation.x = -Math.PI / 2; dirt.position.y = 0.03; fenceG.add(dirt);
      }
    });
    const E = F.edit;
    if (E) {                                   // مقابض النقاط والمسودة أثناء التعديل
      L.fences.filter(r => r.custom).forEach(r => r.poly.forEach(p => { const m = new T.Mesh(new T.SphereGeometry(0.6, 8, 6), mat(0xffd24d)); m.position.set(p[0], 0.7, p[1]); fenceG.add(m); }));
      E.draft.forEach((p, i) => {
        const m = new T.Mesh(new T.SphereGeometry(0.55, 8, 6), mat(0x4aa3ff)); m.position.set(p[0], 0.6, p[1]); fenceG.add(m);
        if (i > 0) rail(E.draft[i - 1], p, 0x4aa3ff, 0.6);
      });
    }
  }
  function buildPets(L) {
    dispose(petG); petG = new T.Group(); scene.add(petG); petPick = [];
    const ringGeo = new T.RingGeometry(0.55, 0.72, 20), shadowGeo = new T.CircleGeometry(0.6, 14);
    L.pets.forEach(p => {
      p.size = p.main ? 2.5 : 1.8; p.base = p.main ? 1.4 : 1.0;
      p.hd = p.hd || Math.random() * 6.28; p.anim = null;
      const an = mkAnimal(p, p.main || L.pets.length <= 28);
      if (an) { p.g = an.g; p.anim = an.anim; p.gs = (p.main ? 1.5 : 1.15) * (1 + 0.03 * p.rar); petG.add(an.g); petPick.push(an.g); }
      else { const sp = mkSprite(emojiTex(p.emoji), p.size, p.size); sp.userData = Object.assign({ kind: "pet" }, p); p.obj = sp; petG.add(sp); petPick.push(sp); }
      const ring = new T.Mesh(ringGeo, new T.MeshBasicMaterial({ color: new T.Color(RAR_COLOR[p.rar] || "#ffffff"), transparent: true, opacity: 0.9, side: T.DoubleSide })); ring.rotation.x = -Math.PI / 2; petG.add(ring); p.ring = ring;
      const sh = new T.Mesh(shadowGeo, new T.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.28 })); sh.rotation.x = -Math.PI / 2; petG.add(sh); p.sh = sh;
    });
    L.actors.forEach(a => {
      const sp = mkSprite(emojiTex(a.emoji), a.size, a.size); sp.userData = { kind: a.kind }; a.obj = sp; petG.add(sp); petPick.push(sp);
      const lab = mkSprite(textTex(a.name || ""), 4, 1); lab.userData = { kind: a.kind }; a.lab = lab; petG.add(lab); petPick.push(lab);
      const sh = new T.Mesh(shadowGeo, new T.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.28 })); sh.rotation.x = -Math.PI / 2; petG.add(sh); a.sh = sh;
    });
    rebuildPick();
  }
  function rebuildPick() { pickables = bldPick.concat(petPick); }

  const ray = new T.Raycaster(), ndc = new T.Vector2();
  const resize = () => {
    const w = c.clientWidth || 360, h = Math.max(260, Math.round(window.innerHeight * 0.5));
    c.style.height = h + "px"; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
  };
  resize(); F.onResize = resize; window.addEventListener("resize", resize);
  const buildAll = L => { buildEnv(L); buildBuildings(L); buildFences(L); buildPets(L); };
  buildAll(F.L);
  F.cam.d = Math.min(F.L.outer * 5 + 30, (F.L.ring + 5) * 2 / (camera.aspect * 0.77));   // يشمل الساحة وحلقة الوظائف
  F.cam.tz = 2;

  return {
    setLayout(L) { buildAll(L); },
    refreshFences() { buildFences(F.L); },
    moveBuilding(b) { const g = bmap[b.key]; if (g) g.position.set(b.x, 0, b.z); },
    toWorld(x, y, w, h) {
      ndc.set(x / w * 2 - 1, -(y / h) * 2 + 1); ray.setFromCamera(ndc, camera);
      const o = ray.ray.origin, d = ray.ray.direction;
      if (!(Math.abs(d.y) > 1e-6)) return null;
      const t = -o.y / d.y; if (!(t > 0)) return null;
      return [o.x + d.x * t, o.z + d.z * t];
    },
    draw(t) {
      const L = F.L, cam = F.cam, pitch = 1.0;                              // ~57° من الأفق
      camera.position.set(cam.tx, Math.sin(pitch) * cam.d, cam.tz + Math.cos(pitch) * cam.d);
      camera.lookAt(cam.tx, 0, cam.tz);
      const zs = Math.max(1, cam.d / 42);
      L.pets.forEach(p => {
        const bob = p.dragging ? 0.6 : p.moving ? Math.abs(Math.sin(t * 8 + p.id)) * 0.18 : Math.sin(t * 2 + p.id) * 0.03;
        if (p.g) { const sc = p.gs * Math.min(zs, 1.7), fly = window.AN3D ? AN3D.fly(p.sp) : 0; p.g.position.set(p.x, (p.dragging ? 0.7 : 0) + fly + (fly ? Math.sin(t * 2 + p.id) * 0.1 : 0), p.z); p.g.scale.setScalar(sc); animateAnimal(p, t); }
        else { p.obj.position.set(p.x, (p.base + bob) * zs, p.z); p.obj.scale.set(p.size * zs, p.size * zs, 1); }
        p.ring.position.set(p.x, 0.05, p.z); p.sh.position.set(p.x, 0.04, p.z);
        p.ring.scale.setScalar(zs); p.sh.scale.setScalar(zs * (1 - bob * 0.8));
      });
      L.actors.forEach(a => {
        const bob = a.moving ? Math.abs(Math.sin(t * 9)) * 0.22 : Math.sin(t * 2) * 0.03;
        a.obj.position.set(a.x, (a.base + bob) * zs, a.z); a.obj.scale.set(a.size * zs, a.size * zs, 1);
        a.lab.position.set(a.x, (a.base + 1.9) * zs, a.z); a.lab.scale.set(4 * zs, 1 * zs, 1);
        a.sh.position.set(a.x, 0.04, a.z); a.sh.scale.setScalar(zs);
      });
      renderer.render(scene, camera);
    },
    pick(x, y, w, h) {
      ndc.set(x / w * 2 - 1, -(y / h) * 2 + 1); ray.setFromCamera(ndc, camera);
      const hits = ray.intersectObjects(pickables, true);
      return hits[0] ? hits[0].object.userData : null;
    },
    dispose() { try { renderer.dispose(); } catch (e) { /* لا شيء */ } textures.forEach(t => t.dispose && t.dispose()); }
  };
}

// ======================================================
// رسم احتياطي ثنائي الأبعاد (منظر علوي)
// ======================================================
function farm2dInit(F) {
  const c = F.canvas, g = c.getContext("2d");
  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2), w = c.clientWidth || 360, h = Math.max(260, Math.round(window.innerHeight * 0.5));
    c.style.height = h + "px"; c.width = Math.round(w * dpr); c.height = Math.round(h * dpr); g.setTransform(dpr, 0, 0, dpr, 0, 0); F.w = w; F.h = h;
  };
  resize(); F.onResize = resize; window.addEventListener("resize", resize);
  F.cam.d = Math.min(F.L.outer * 5 + 30, F.h * 1.1 * (F.L.ring + 5) * 2 / F.w); F.cam.tz = 2;
  const hits = [];
  const toS = (x, z) => { const k = F.h / F.cam.d * 1.1; return [F.w / 2 + (x - F.cam.tx) * k, F.h / 2 + (z - F.cam.tz) * k, k]; };
  const rect = (x, z, w, d, col) => { const [sx, sz, k] = toS(x - w / 2, z - d / 2); g.fillStyle = col; g.fillRect(sx, sz, w * k, d * k); };
  const label = (txt, x, z, size) => { const [sx, sz, k] = toS(x, z); g.font = "bold " + Math.max(10, Math.round(size * k)) + "px sans-serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.lineWidth = 3; g.strokeStyle = "#000"; g.strokeText(txt, sx, sz); g.fillStyle = "#fff"; g.fillText(txt, sx, sz); };
  const line = (a, b, col, w) => { const [x1, y1] = toS(a[0], a[1]), [x2, y2] = toS(b[0], b[1]); g.strokeStyle = col; g.lineWidth = w; g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke(); };
  return {
    setLayout() { /* F.L يُقرأ مباشرة في كل إطار */ },
    refreshFences() { /* يُرسم كل إطار */ },
    moveBuilding() { /* يُرسم كل إطار */ },
    toWorld(x, y) { const k = F.h / F.cam.d * 1.1; return [(x - F.w / 2) / k + F.cam.tx, (y - F.h / 2) / k + F.cam.tz]; },
    draw() {
      const L = F.L, E = F.edit;
      hits.length = 0;
      g.fillStyle = "#58993f"; g.fillRect(0, 0, F.w, F.h);
      rect(L.seaX + 30, 0, 60, 280, "#2f78b5"); rect(L.seaX - 2.5, 0, 5, 280, "#c9b78a"); rect(L.seaX + 1.5, 6, 7, 1.8, "#7a5a3a");
      L.fences.forEach(r => {                                           // أرضية ثم سياج مع الباب
        g.fillStyle = "#8c7a4e"; g.beginPath(); r.poly.forEach((p, i) => { const [sx, sz] = toS(p[0], p[1]); i ? g.lineTo(sx, sz) : g.moveTo(sx, sz); }); g.closePath(); g.fill();
        const n = r.poly.length, k = toS(0, 0)[2];
        for (let i = 0; i < n; i++) {
          const a = r.poly[i], b = r.poly[(i + 1) % n], gate = i === (r.gate || 0) % n, at = t => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
          if (gate) { line(a, at(0.3), "#a57a4a", Math.max(2, k * 0.25)); line(at(0.7), b, "#a57a4a", Math.max(2, k * 0.25)); line(at(0.3), at(0.7), "#e0b040", Math.max(2, k * 0.18)); }
          else line(a, b, "#a57a4a", Math.max(2, k * 0.25));
        }
      });
      L.trees.forEach(t => { const [sx, sz, k] = toS(t.x, t.z); g.fillStyle = "#2f6b3a"; g.beginPath(); g.arc(sx, sz, 1.4 * t.s * k, 0, 7); g.fill(); });
      L.rocks.forEach(r => { const [sx, sz, k] = toS(r.x, r.z); g.fillStyle = "#8a8d93"; g.beginPath(); g.arc(sx, sz, r.s * k, 0, 7); g.fill(); });
      L.buildings.forEach(b => {
        rect(b.x, b.z, b.w, b.d, b.color); rect(b.x, b.z - b.d / 4, b.w + 0.3, b.d / 2, b.type === "post" ? "#6b4a35" : "#3d3d4a");
        const [sx, sz, k] = toS(b.x, b.z), s = Math.max((b.type === "post" ? 1.8 : 1.6) * k, 22);
        g.font = Math.round(s) + "px sans-serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillStyle = "#fff"; g.fillText(b.e, sx, sz - 2);
        hits.push({ x: sx, y: sz, r: s * 0.9, d: { kind: "bld", key: b.key } });
        label(b.n, b.x, b.z + b.d / 2 + 0.9, 0.95);
        if (b.key === "hatch") L.eggs.forEach(e => { const [ex, ez, kk] = toS(b.x + e.ox, b.z + e.oz); g.fillStyle = e.ready ? "#ffd24d" : "#f3ead2"; g.beginPath(); g.ellipse(ex, ez, 0.38 * kk, 0.5 * kk, 0, 0, 7); g.fill(); });
      });
      L.pets.slice().sort((a, b) => a.z - b.z).forEach(p => {
        const [sx, sz, k] = toS(p.x, p.z), s = Math.max((p.main ? 2.1 : 1.5) * k, p.main ? 22 : 16);
        g.strokeStyle = RAR_COLOR[p.rar] || "#fff"; g.lineWidth = Math.max(1.5, k * 0.12); g.beginPath(); g.ellipse(sx, sz + s * 0.35, s * 0.45, s * 0.2, 0, 0, 7); g.stroke();
        g.font = Math.round(s) + "px sans-serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillStyle = "#fff"; g.fillText(p.emoji, sx, sz - (p.dragging ? s * 0.4 : 0));
        hits.push({ x: sx, y: sz, r: s * 0.6, d: Object.assign({ kind: "pet" }, p) });
      });
      L.actors.forEach(a => {
        const [sx, sz, k] = toS(a.x, a.z), s = Math.max(a.size * k, 26);
        g.font = Math.round(s) + "px sans-serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillStyle = "#fff"; g.fillText(a.emoji, sx, sz);
        label(a.name || "", a.x, a.z - 1.9, 0.9);
        hits.push({ x: sx, y: sz, r: s * 0.7, d: { kind: a.kind } });
      });
      if (E) {                                                          // مقابض ومسودة التعديل
        L.fences.filter(r => r.custom).forEach(r => r.poly.forEach(p => { const [sx, sz, k] = toS(p[0], p[1]); g.fillStyle = "#ffd24d"; g.beginPath(); g.arc(sx, sz, Math.max(6, 0.6 * k), 0, 7); g.fill(); }));
        E.draft.forEach((p, i) => { const [sx, sz, k] = toS(p[0], p[1]); g.fillStyle = "#4aa3ff"; g.beginPath(); g.arc(sx, sz, Math.max(6, 0.55 * k), 0, 7); g.fill(); if (i) line(E.draft[i - 1], p, "#4aa3ff", 3); });
      }
    },
    pick(x, y) {
      for (let i = hits.length - 1; i >= 0; i--) { const h = hits[i]; if (Math.hypot(x - h.x, y - h.y) <= h.r) return h.d; }
      return null;
    },
    dispose() { /* لا موارد خاصة */ }
  };
}

// ======================================================
// العالم المشترك: خريطة شبكية + نقل المزرعة بجانب لاعب + التحالفات
// ======================================================
async function farmMap(cx, cy, sel) {
  farmStop();
  sub = "map";
  const j = await act("mapView", { cx, cy });
  if (!j || !j.ok) { toast("تعذّر تحميل الخريطة", true); return go("pen"); }
  const R = j.radius, N = R * 2 + 1, by = {};
  j.players.forEach(p => { by[p.x + "," + p.y] = p; });
  const al = j.alliance, hrs = Math.ceil(j.wait / 3600000);
  let cells = "";
  for (let y = j.center[1] - R; y <= j.center[1] + R; y++) for (let x = j.center[0] - R; x <= j.center[0] + R; x++) {
    const p = by[x + "," + y], on = sel && sel[0] === x && sel[1] === y;
    cells += `<button class="mc${p ? (p.me ? " me" : p.ally ? " al" : " pl") : ""}${on ? " on" : ""}" data-x="${x}" data-y="${y}">${p ? p.emoji : ""}</button>`;
  }
  const chosen = sel && (by[sel[0] + "," + sel[1]] || null);
  let act1 = "";
  if (sel) {
    if (chosen && chosen.me) act1 = `<b>🏡 مزرعتك</b> (${chosen.x}, ${chosen.y})`;
    else if (chosen) act1 = `<div class="row" style="gap:6px;flex-wrap:wrap"><div class="grow"><b>${chosen.emoji} ${esc(chosen.name)}</b>${chosen.ally ? " 🤝" : ""}</div><button class="btn sm" data-a="visit">👀 زيارة</button><button class="btn sm" data-a="near">📍 انتقل بجانبه</button>${al.leader && !chosen.ally ? `<button class="btn sec sm" data-a="inv">🤝 ادعُه للتحالف</button>` : ""}</div>`;
    else act1 = `<div class="row"><div class="grow">الخانة (${sel[0]}, ${sel[1]}) فارغة</div><button class="btn sm" data-a="here">📍 انتقل هنا</button></div>`;
  }
  const inv = al.invites.map(i => `<div class="row" style="gap:6px"><div class="grow">📨 دعوة من <b>${esc(i.name)}</b> إلى «${esc(i.ally)}»</div><button class="btn sm" data-ya="${esc(i.from)}">قبول</button><button class="btn sec sm" data-no="${esc(i.from)}">رفض</button></div>`).join("");
  const alBox = al.name
    ? `<b>🤝 ${esc(al.name)}</b> (${al.members.length}/${al.max})<div class="dim" style="margin:4px 0">${al.members.map(m => (m.leader ? "👑 " : "") + esc(m.name) + (al.leader && !m.leader ? ` <a href="#" data-kick="${esc(m.uid)}">✖</a>` : "")).join(" · ")}</div><button class="btn sec sm" id="mLeave">${al.leader ? "حلّ التحالف" : "مغادرة التحالف"}</button>`
    : `<div class="dim" style="margin-bottom:6px">التحالف يسمح لأعضائه بالتلاصق وبمدى انتقال أبعد.</div><div class="row" style="gap:6px"><input id="mName" class="grow" maxlength="16" placeholder="اسم التحالف" style="padding:9px;border-radius:10px;background:var(--card2);border:1px solid var(--line);color:inherit"><button class="btn sm" id="mNew">تأسيس</button></div>`;
  view.innerHTML = `<button class="btn sec sm" id="fBack" style="margin-bottom:8px">↩️ رجوع</button><h2>🗺️ العالم المشترك</h2>
    <div class="dim" style="font-size:12px;margin:4px 0 8px">مزرعتك في (${j.loc[0]}, ${j.loc[1]}). ${hrs > 0 ? "⏳ الانتقال متاح بعد " + hrs + " ساعة." : "✅ يمكنك الانتقال الآن."} قفزة الانتقال حتى ${j.hop} خانات (${j.hopAlly} مع الحلفاء)، وبين غير الحلفاء يلزم فراغ خانة واحدة على الأقل.</div>
    <div class="row" style="gap:6px;margin-bottom:6px"><button class="btn sec sm" data-m="-1,0">⬅️</button><button class="btn sec sm" data-m="0,-1">⬆️</button><button class="btn sec sm" data-m="0,1">⬇️</button><button class="btn sec sm" data-m="1,0">➡️</button><button class="btn sec sm" id="mHome">🏡</button></div>
    <div class="mgrid" style="display:grid;grid-template-columns:repeat(${N},1fr);gap:2px;direction:ltr">${cells}</div>
    <div class="card" style="margin-top:8px;min-height:40px">${act1 || '<span class="dim">اضغط على خانة أو لاعب.</span>'}</div>
    ${inv ? `<div class="card" style="margin-top:8px">${inv}</div>` : ""}
    <div class="card" style="margin-top:8px">${alBox}</div>
    <style>.mc{aspect-ratio:1;border:0;border-radius:6px;background:#2d5a2f;font-size:18px;padding:0}.mc.pl{background:#6b3a3a}.mc.al{background:#2f5f7a}.mc.me{background:#7c3aed}.mc.on{outline:2px solid #ffd24d}</style>`;
  const reload = (x, y, s) => farmMap(x, y, s);
  $("#fBack").onclick = () => { buzz(); go("pen"); };
  $("#mHome").onclick = () => reload(j.loc[0], j.loc[1], null);
  view.querySelectorAll("[data-m]").forEach(b => b.onclick = () => { buzz(); const d = b.dataset.m.split(",").map(Number); reload(j.center[0] + d[0] * 5, j.center[1] + d[1] * 5, sel); });
  view.querySelectorAll(".mc").forEach(b => b.onclick = () => { buzz(); reload(j.center[0], j.center[1], [Number(b.dataset.x), Number(b.dataset.y)]); });
  const doAct = async (type, args, msg) => { const r = await act(type, args); if (r && r.msg) toast(r.msg, !r.ok); reload(r && r.ok && r.loc ? r.loc[0] : j.center[0], r && r.ok && r.loc ? r.loc[1] : j.center[1], null); };
  view.querySelectorAll("[data-a]").forEach(b => b.onclick = () => {
    buzz();
    if (b.dataset.a === "visit") return farmOpen(chosen.uid);
    if (b.dataset.a === "near") return doAct("mapMove", { near: chosen.uid });
    if (b.dataset.a === "here") return doAct("mapMove", { x: sel[0], y: sel[1] });
    if (b.dataset.a === "inv") return doAct("allyInvite", { uid: chosen.uid });
  });
  view.querySelectorAll("[data-ya]").forEach(b => b.onclick = () => doAct("allyAccept", { from: b.dataset.ya }));
  view.querySelectorAll("[data-no]").forEach(b => b.onclick = () => doAct("allyDecline", { from: b.dataset.no }));
  view.querySelectorAll("[data-kick]").forEach(a => a.onclick = e => { e.preventDefault(); doAct("allyKick", { uid: a.dataset.kick }); });
  const nw = $("#mNew"); if (nw) nw.onclick = () => doAct("allyCreate", { name: $("#mName").value });
  const lv = $("#mLeave"); if (lv) lv.onclick = () => doAct("allyLeave", {});
}
SUBS.map = () => { if (!$("#fBack")) farmMap(); };
