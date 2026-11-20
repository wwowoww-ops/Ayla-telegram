"use strict";
// ======================================================
// الحظيرة = عالم بمنظر علوي ثلاثي الأبعاد (three.js) هو الشاشة الرئيسية للعبة.
//   • الساحة في الوسط تتجول فيها حيوانات الحظيرة المختارة (الكل / الكبرى / حظيرة معيّنة).
//   • حلقة أولى: مباني الوظائف السبعة. حلقة خارجية: بوابات أقسام اللعبة (سوق، حضانة، صيد…).
//   • شريط سفلي سريع لنفس الأقسام، وزيارة حظائر اللاعبين الآخرين.
// إن تعذّر three.js أو WebGL يُرسم العالم نفسه ثنائي الأبعاد بدل شاشة فارغة.
// المنطق (التخطيط، الحركة، اللمس) مشترك بين الرسمين.
// ======================================================
const THREE_URL = "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js";
const FARM_COL = { post: ["#c9a35a", "#7d8fa3", "#5aa66b", "#b86bd1", "#d98b4c", "#d4b83e", "#d65f5f"], svc: ["#4f7cc9", "#c9744f", "#4fb59a", "#a655c9", "#c9b04f", "#5f6fd6"] };
let fm = null;            // المشهد الحالي
let threeState = "idle";  // idle | loading | ok | fail
let farmBusy = false;

// أقسام اللعبة: [المعرّف، الرمز، الاسم، [تبويب، قسم فرعي]]
const SERVICES = [
  ["market", "🏪", "السوق", ["more", "market"]], ["shop", "🛒", "المتجر", ["shop"]], ["nov", "🛍️", "النوادر", ["more", "shop"]],
  ["hatch", "🥚", "الحضانة", ["hatch"]], ["hunt", "⚔️", "الصيد", ["hunt"]], ["breed", "🧬", "التزاوج", ["more", "breed"]],
  ["boss", "👑", "الزعماء", ["more", "boss"]], ["season", "🏆", "الموسم", ["more", "season"]], ["fairies", "🧚", "الجنيات", ["more", "fairies"]],
  ["recycle", "♻️", "التدوير", ["more", "recycle"]], ["quests", "🎯", "المهام", ["more", "quests"]], ["top", "🥇", "الترتيب", ["more", "top"]],
  ["visit", "👥", "زيارة", null], ["bag", "🎒", "المخزن", ["more", "bag"]], ["more", "☰", "المزيد", ["more"]]
];
function svcOpen(id) {
  const s = SERVICES.find(x => x[0] === id);
  if (!s) return;
  if (id === "visit") return farmVisitList("");
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

// ---------- التخطيط (بيانات خالصة) ----------
// x يمين، z نحو الكاميرا. الساحة دائرة نصف قطرها Y (يكبر مع عدد الحيوانات)، ثم حلقة الوظائف، ثم حلقة الأقسام، ثم الماء شرقًا.
const SLOT0 = -Math.PI / 2, SLOT_STEP = Math.PI / 4;   // 8 مواضع: 7 وظائف + الحظيرة الكبرى
function farmLayout(f) {
  const rnd = mulberry(hashSeed(f.uid + "|" + f.seed));
  const inPost = new Set([].concat(...Object.values(f.post)));
  const roam = f.pets.filter(p => !inPost.has(p.id)).length;
  const Y = Math.max(8, Math.min(15, 6.5 + Math.sqrt(roam) * 0.95));
  const ring = Y + 6;
  const slot = k => [Math.cos(SLOT0 + k * SLOT_STEP) * ring, Math.sin(SLOT0 + k * SLOT_STEP) * ring];
  const posts = f.posts.map((p, i) => {
    const s = slot(i % 7);
    return { id: p.id, e: p.e, n: p.n, x: s[0], z: s[1], w: 4.2, d: 3.2, h: 2.6, color: FARM_COL.post[i % FARM_COL.post.length], ids: f.post[p.id] || [] };
  });
  const bs = slot(7), barn = { x: bs[0] * 1.12, z: bs[1] * 1.12, w: 11, d: 6.4, h: 4.4, n: f.barnName || "الحظيرة" };
  const svcs = f.services || [], R2 = ring + 9;
  const services = svcs.map((s, i) => {
    const a = SLOT0 + (i + 0.5) * Math.PI * 2 / svcs.length;
    return { id: s[0], e: s[1], n: s[2], x: Math.cos(a) * R2, z: Math.sin(a) * R2, w: 3.6, d: 2.6, h: 2.2, color: FARM_COL.svc[i % FARM_COL.svc.length] };
  });
  const outer = svcs.length ? R2 : ring;
  const seaX = outer + 10;
  const trees = [];
  for (let i = 0; i < 90 && trees.length < 32; i++) {
    const x = -outer - 22 + rnd() * (outer + 20 + seaX - 4), z = -outer - 18 + rnd() * (2 * outer + 36);
    const bad = Math.hypot(x, z) < outer + 5 || x > seaX - 3;
    if (!bad) trees.push({ x, z, s: 0.8 + rnd() * 0.8 });
  }
  const rocks = [];
  for (let i = 0; i < 60 && rocks.length < 22; i++) {
    const x = -outer - 20 + rnd() * (2 * outer + 36), z = -outer - 16 + rnd() * (2 * outer + 32);
    if (Math.hypot(x, z) > Y + 1.8 && x < seaX - 1) rocks.push({ x, z, s: 0.25 + rnd() * 0.5 });
  }
  const hatch = posts.find(p => p.id === "hatch");
  const eggs = f.eggs.map((e, i) => ({ emoji: e.emoji, ready: e.ready, x: (hatch ? hatch.x : 0) + 3 + (i % 4) * 0.9, z: (hatch ? hatch.z : Y + 2) + 2.6 + Math.floor(i / 4) * 0.9 }));
  const where = {};
  posts.forEach(p => p.ids.forEach(id => { where[id] = p; }));
  const pets = f.pets.map(p => {
    const home = where[p.id];
    const a = rnd() * Math.PI * 2, r = Math.sqrt(rnd()) * (Y - 1);
    return Object.assign({}, p, {
      x: home ? home.x + (rnd() - 0.5) * 3 : Math.cos(a) * r,
      z: home ? home.z + home.d / 2 + 1.2 + rnd() * 1.4 : Math.sin(a) * r,
      home: home || null, tx: 0, tz: 0, wait: rnd() * 3, speed: 0.6 + rnd() * 0.7, Y
    });
  });
  return { Y, ring, outer, seaX, posts, services, barn, trees, rocks, eggs, pets };
}

// حركة الحيوانات: يتجول كل حيوان في ساحته أو قرب وظيفته
function stepPets(L, dt) {
  L.pets.forEach(p => {
    if (p.wait > 0) { p.wait -= dt; p.moving = false; return; }
    if (!p.tx && !p.tz) pickTarget(p);
    const dx = p.tx - p.x, dz = p.tz - p.z, d = Math.hypot(dx, dz);
    if (d < 0.15) { p.wait = 1.5 + Math.random() * 5; p.tx = p.tz = 0; p.moving = false; return; }
    const v = Math.min(d, p.speed * dt);
    p.x += dx / d * v; p.z += dz / d * v; p.moving = true;
  });
}
function pickTarget(p) {
  if (p.home) { p.tx = p.home.x + (Math.random() - 0.5) * 3.4; p.tz = p.home.z + p.home.d / 2 + 1 + Math.random() * 1.8; return; }
  const a = Math.random() * Math.PI * 2, r = Math.sqrt(Math.random()) * (p.Y - 0.8);
  p.tx = Math.cos(a) * r; p.tz = Math.sin(a) * r;
}

// ---------- بيانات حظيرتي من حالة اللعبة (بلا طلب إضافي للخادم) ----------
function ownFarm() {
  const pets = S.pets.filter(p => penSel === "all" || penOf(p) === penSel);
  const ids = new Set(pets.map(p => p.id));
  const post = {};
  (S.meta.posts || []).forEach(m => { post[m.id] = (((S.posts || {}).list || {})[m.id] || []).map(x => x.id).filter(id => ids.has(id)); });
  const seed = penSel === "all" ? "all" : String(penSel);
  const penName = penSel === "all" ? "كل الحظائر" : penSel === 0 ? "الحظيرة الكبرى" : ((S.pens.find(p => p.id === penSel) || {}).name || "حظيرة");
  return {
    uid: S.player.id, name: S.player.name, seed, barnName: penName, power: S.player.power, count: pets.length,
    pets: pets.map(p => ({ id: p.id, sp: p.sp, emoji: p.emoji, name: p.name, rar: p.rar, rarEmoji: p.rarEmoji, rarName: p.rarName, el: p.el, elEmoji: p.elEmoji, elName: p.elName, lv: p.lv, st: p.st, main: p.main, post: p.post, pw: p.power }))
      .sort((a, b) => (b.main - a.main) || (b.pw - a.pw)),
    eggs: S.eggs.slice(0, 12).map(e => ({ tier: e.tier, emoji: e.emoji, ready: e.readyIn <= 0 })),
    post, posts: (S.meta.posts || []).map(m => ({ id: m.id, e: m.e, n: m.n })), services: SERVICES
  };
}
const farmSig = f => f.seed + "|" + f.pets.map(p => p.id + ":" + (p.post || "") + (p.main ? "m" : "")).join(",") + "|" + f.eggs.map(e => e.tier + (e.ready ? "r" : "")).join(",");

// ======================================================
// الشاشة الرئيسية (حظيرتي)
// ======================================================
VIEWS.pen = () => {
  if (penSel !== "all" && penSel !== 0 && !S.pens.find(p => p.id === penSel)) penSel = "all";
  if (farmBusy) return;
  if (fm && fm.own && fm.canvas && document.body.contains(fm.canvas) && fm.r) {      // تحديث في مكانه دون إعادة بناء الشاشة
    penBar(); farmPenTabs();
    const f = ownFarm(), sig = farmSig(f);
    if (sig !== fm.sig) { fm.sig = sig; fm.f = f; fm.L = farmLayout(f); fm.r.setLayout(fm.L); }
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
      <div class="pen-bar"><button class="btn" id="bCollect"></button><button class="btn sec" id="bDaily"></button><button class="btn sec" id="bFeed">🍖</button><button class="btn sec" id="bBowl">🥣</button></div>
      <canvas id="farm"></canvas>
      <div id="fInfo" class="card dim" style="margin-top:8px;min-height:44px">اسحب للتحرك، وإصبعان للتكبير. اضغط على حيوان لإدارته، وعلى أي مبنى لفتح قسمه.</div>
      <div class="dock" id="fDock"></div>
      <div class="dim" id="fMode" style="font-size:11px;margin-top:2px"></div>`;
    $("#bCollect").onclick = () => { buzz("medium"); run("collect"); };
    $("#bDaily").onclick = () => { buzz("medium"); run("daily"); };
    $("#bFeed").onclick = feedAll;
    $("#bBowl").onclick = () => { buzz(); openBowls(); };
    farmPenTabs(); penBar(); farmDock();
    await sceneStart(f, true);
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
async function sceneStart(f, own) {
  let canvas = $("#farm");
  const L = farmLayout(f);
  const F = fm = { canvas, L, f, own, sig: farmSig(f), cam: { tx: 0, tz: 2, d: 40 }, raf: 0, last: 0, mode: "2d" };
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
    if (!document.hidden) { stepPets(F.L, dt); F.r.draw(t / 1000); }
    F.raf = requestAnimationFrame(loop);
  };
  F.raf = requestAnimationFrame(loop);
}
function farmDispose(F) {
  if (!F || F.dead) return;
  F.dead = true;
  cancelAnimationFrame(F.raf);
  try { if (F.r && F.r.dispose) F.r.dispose(); } catch (e) { /* لا شيء */ }
  if (F.onResize) window.removeEventListener("resize", F.onResize);
}
function farmStop() { farmDispose(fm); fm = null; }

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
        <div class="grow" style="align-self:center;font-weight:700">👀 ${esc(f.name)} <span class="dim" style="font-weight:400">⚔️ ${fmt(f.power)} · 🐾 ${f.count}</span></div>
        <button class="btn sm" id="fMine" style="flex:none">🏠 حظيرتي</button>
      </div>
      <canvas id="farm"></canvas>
      <div id="fInfo" class="card dim" style="margin-top:8px;min-height:44px">اضغط على حيوان أو مبنى لترى بياناته.</div>
      <div class="dim" id="fMode" style="font-size:11px;margin-top:4px"></div>`;
    $("#fBack").onclick = () => farmVisitList("");
    $("#fMine").onclick = () => { buzz(); go("pen"); };
    await sceneStart(f, false);
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
    $("#fList").innerHTML = j.list.length ? j.list.map(r => `<div class="card row"><div style="font-size:30px">${r.emoji}</div><div class="grow"><b>${esc(r.name)}</b><div class="dim">⚔️ ${fmt(r.power)} · 🐾 ${r.pets}</div></div><button class="btn sm" data-u="${esc(r.uid)}">زيارة</button></div>`).join("") : `<div class="dim">لا يوجد لاعبون مطابقون.</div>`;
    $("#fList").querySelectorAll("[data-u]").forEach(b => b.onclick = () => { buzz(); farmOpen(b.dataset.u); });
  };
  $("#fGo").onclick = load;
  $("#fQ").onkeydown = e => { if (e.key === "Enter") load(); };
  load();
}

// ---------- التحكم باللمس (مشترك) ----------
function farmInput(F) {
  const c = F.canvas, ptr = new Map();
  let startT = 0, moved = 0, pinch = 0;
  const clampCam = () => { const cam = F.cam, lim = F.L.outer + 12; cam.d = Math.max(14, Math.min(F.L.outer * 5 + 30, cam.d)); cam.tx = Math.max(-lim, Math.min(lim, cam.tx)); cam.tz = Math.max(-lim, Math.min(lim, cam.tz)); };
  c.addEventListener("pointerdown", e => { c.setPointerCapture(e.pointerId); ptr.set(e.pointerId, { x: e.clientX, y: e.clientY }); if (ptr.size === 1) { startT = Date.now(); moved = 0; } pinch = 0; });
  c.addEventListener("pointermove", e => {
    const p = ptr.get(e.pointerId); if (!p) return;
    const dx = e.clientX - p.x, dy = e.clientY - p.y;
    if (ptr.size === 1) {
      moved += Math.abs(dx) + Math.abs(dy);
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
    const had = ptr.has(e.pointerId); ptr.delete(e.pointerId); pinch = 0;
    if (had && ptr.size === 0 && moved < 8 && Date.now() - startT < 350) farmTap(F, e);
  };
  c.addEventListener("pointerup", up); c.addEventListener("pointercancel", e => { ptr.delete(e.pointerId); pinch = 0; });
  c.addEventListener("wheel", e => { e.preventDefault(); F.cam.d *= e.deltaY > 0 ? 1.08 : 0.92; clampCam(); }, { passive: false });
}
function farmTap(F, e) {
  const rect = F.canvas.getBoundingClientRect();
  const p = F.r.pick(e.clientX - rect.left, e.clientY - rect.top, rect.width, rect.height);
  const box = $("#fInfo"); if (!box) return;
  buzz();
  if (!p) { box.innerHTML = `<span class="dim">اضغط على حيوان أو مبنى.</span>`; return; }
  if (p.kind === "svc") {
    box.innerHTML = `<div class="row"><div class="grow"><b>${p.e} ${esc(p.n)}</b></div><button class="btn sm" id="fOpen">فتح</button></div>`;
    $("#fOpen").onclick = () => { buzz(); svcOpen(p.id); };
    return;
  }
  if (p.kind === "post") {
    box.innerHTML = `<div class="row"><div class="grow"><b>${p.e} ${esc(p.n)}</b> · ${p.ids.length} حيوان${p.ids.length ? "" : " (فارغة)"}</div>${F.own ? `<button class="btn sm" id="fOpen">إدارة</button>` : ""}</div>`;
    if (F.own) $("#fOpen").onclick = () => { buzz(); go("more", "posts"); window.__fromWorld = true; };
    return;
  }
  if (p.kind === "barn") { box.innerHTML = `<b>🏡 ${esc(p.n)}</b>`; return; }
  if (F.own) { openPet(p.id); return; }              // حيواني: نافذة إدارته المعتادة
  box.innerHTML = `<b>${p.emoji} ${esc(p.name)}</b> ${p.main ? "👑" : ""} <span class="tag" style="color:${RAR_COLOR[p.rar] || "#fff"}">${p.rarEmoji} ${esc(p.rarName)}</span>
    <div class="dim">${p.elEmoji} ${esc(p.elName)} · مستوى ${p.lv}${p.st ? " · " + "⭐".repeat(Math.min(5, p.st)) : ""} · ⚔️ ${fmt(p.pw)}${p.post ? " · في وظيفة" : ""}</div>`;
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

  let group = null, pickables = [];
  const mat = (color, extra) => new T.MeshLambertMaterial(Object.assign({ color, flatShading: true }, extra || {}));

  function build(L) {
    if (group) { scene.remove(group); group.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material && !o.isSprite) o.material.dispose(); }); }
    group = new T.Group(); scene.add(group); pickables = [];
    const add = o => { group.add(o); return o; };
    const box = (w, h, d, color, x, y, z) => { const m = new T.Mesh(new T.BoxGeometry(w, h, d), mat(color)); m.position.set(x, y, z); return add(m); };
    const labelOf = (n, x, y, z, data) => { const l = mkSprite(textTex(n), 5, 1.25); l.position.set(x, y, z); l.userData = data; add(l); pickables.push(l); };

    const ground = new T.Mesh(new T.PlaneGeometry(300, 260), mat(0x58993f)); ground.rotation.x = -Math.PI / 2; add(ground);
    const dirt = new T.Mesh(new T.CircleGeometry(L.Y + 1.2, 36), mat(0x8c7a4e)); dirt.rotation.x = -Math.PI / 2; dirt.position.y = 0.02; add(dirt);
    const sea = new T.Mesh(new T.PlaneGeometry(60, 260), mat(0x2f78b5)); sea.rotation.x = -Math.PI / 2; sea.position.set(L.seaX + 30, 0.01, 0); add(sea);
    const shore = new T.Mesh(new T.PlaneGeometry(5, 260), mat(0xc9b78a)); shore.rotation.x = -Math.PI / 2; shore.position.set(L.seaX - 2.5, 0.015, 0); add(shore);
    box(7, 0.25, 1.8, 0x7a5a3a, L.seaX + 1.5, 0.2, 6);

    // الحظيرة الكبرى
    const b = L.barn, bd = { kind: "barn", n: b.n };
    const body = box(b.w, b.h, b.d, 0xb5443a, b.x, b.h / 2, b.z);
    [-1, 1].forEach(sx => { const r = box(b.w + 0.6, 0.35, b.d / 2 + 0.7, 0x9c8f7a, b.x, b.h + 0.9, b.z + sx * (b.d / 4)); r.rotation.x = sx * 0.45; });
    box(2.4, 2.8, 0.2, 0x4a2a22, b.x, 1.4, b.z + b.d / 2 + 0.05);
    labelOf(b.n, b.x, b.h + 3.2, b.z, bd);

    // مباني الوظائف
    L.posts.forEach(p => {
      box(p.w, p.h, p.d, p.color, p.x, p.h / 2, p.z);
      box(p.w + 0.5, 0.3, p.d + 0.5, 0x6b4a35, p.x, p.h + 0.15, p.z);
      const sign = mkSprite(emojiTex(p.e), 2.4, 2.4); sign.position.set(p.x, p.h + 2, p.z); sign.userData = { kind: "post", e: p.e, n: p.n, ids: p.ids }; add(sign); pickables.push(sign);
      labelOf(p.n, p.x, p.h + 3.6, p.z, sign.userData);
    });
    // بوابات أقسام اللعبة
    L.services.forEach(s => {
      box(s.w, s.h, s.d, s.color, s.x, s.h / 2, s.z);
      box(s.w + 0.4, 0.25, s.d + 0.4, 0x3d3d4a, s.x, s.h + 0.12, s.z);
      const d = { kind: "svc", id: s.id, e: s.e, n: s.n };
      const sign = mkSprite(emojiTex(s.e), 2.2, 2.2); sign.position.set(s.x, s.h + 1.7, s.z); sign.userData = d; add(sign); pickables.push(sign);
      labelOf(s.n, s.x, s.h + 3.1, s.z, d);
    });
    // سياج الساحة (مع مدخل جنوبي)
    const nFence = Math.round(L.Y * 4.2);
    for (let i = 0; i < nFence; i++) {
      const a = i / nFence * Math.PI * 2;
      if (Math.abs(a - Math.PI / 2) < 0.2) continue;
      box(0.25, 1, 0.25, 0xa57a4a, Math.cos(a) * (L.Y + 0.9), 0.5, Math.sin(a) * (L.Y + 0.9));
    }
    // أشجار وصخور وبيض
    L.trees.forEach(t => {
      box(0.4 * t.s, 1.4 * t.s, 0.4 * t.s, 0x6b4a2a, t.x, 0.7 * t.s, t.z);
      const cone = new T.Mesh(new T.ConeGeometry(1.5 * t.s, 3.6 * t.s, 7), mat(0x2f6b3a)); cone.position.set(t.x, 3 * t.s, t.z); add(cone);
    });
    L.rocks.forEach(r => { const m = new T.Mesh(new T.DodecahedronGeometry(r.s, 0), mat(0x8a8d93)); m.position.set(r.x, r.s * 0.4, r.z); add(m); });
    L.eggs.forEach(e => { const m = new T.Mesh(new T.SphereGeometry(0.38, 10, 8), mat(e.ready ? 0xffd24d : 0xf3ead2)); m.scale.y = 1.3; m.position.set(e.x, 0.5, e.z); add(m); });
    // الحيوانات: صور رمزية قائمة مع حلقة الندرة وظل
    const ringGeo = new T.RingGeometry(0.55, 0.72, 20), shadowGeo = new T.CircleGeometry(0.6, 14);
    L.pets.forEach(p => {
      p.size = p.main ? 2.5 : 1.8; p.base = p.main ? 1.4 : 1.0;
      const sp = mkSprite(emojiTex(p.emoji), p.size, p.size); sp.userData = Object.assign({ kind: "pet" }, p); p.obj = sp; add(sp); pickables.push(sp);
      const ring = new T.Mesh(ringGeo, new T.MeshBasicMaterial({ color: new T.Color(RAR_COLOR[p.rar] || "#ffffff"), transparent: true, opacity: 0.9, side: T.DoubleSide })); ring.rotation.x = -Math.PI / 2; add(ring); p.ring = ring;
      const sh = new T.Mesh(shadowGeo, new T.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.28 })); sh.rotation.x = -Math.PI / 2; add(sh); p.sh = sh;
    });
  }

  const ray = new T.Raycaster(), ndc = new T.Vector2();
  const resize = () => {
    const w = c.clientWidth || 360, h = Math.max(260, Math.round(window.innerHeight * 0.5));
    c.style.height = h + "px"; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
  };
  resize(); F.onResize = resize; window.addEventListener("resize", resize);
  build(F.L);
  F.cam.d = Math.min(F.L.outer * 5 + 30, (F.L.ring + 5) * 2 / (camera.aspect * 0.77));   // يشمل الساحة وحلقة الوظائف
  F.cam.tz = 2;

  return {
    setLayout(L) { build(L); },
    draw(t) {
      const L = F.L, cam = F.cam, pitch = 1.0;                              // ~57° من الأفق
      camera.position.set(cam.tx, Math.sin(pitch) * cam.d, cam.tz + Math.cos(pitch) * cam.d);
      camera.lookAt(cam.tx, 0, cam.tz);
      const zs = Math.max(1, cam.d / 42);
      L.pets.forEach(p => {
        const bob = p.moving ? Math.abs(Math.sin(t * 8 + p.id)) * 0.18 : Math.sin(t * 2 + p.id) * 0.03;
        p.obj.position.set(p.x, (p.base + bob) * zs, p.z); p.obj.scale.set(p.size * zs, p.size * zs, 1);
        p.ring.position.set(p.x, 0.05, p.z); p.sh.position.set(p.x, 0.04, p.z);
        p.ring.scale.setScalar(zs); p.sh.scale.setScalar(zs * (1 - bob * 0.8));
      });
      renderer.render(scene, camera);
    },
    pick(x, y, w, h) {
      ndc.set(x / w * 2 - 1, -(y / h) * 2 + 1); ray.setFromCamera(ndc, camera);
      const hit = ray.intersectObjects(pickables, false)[0];
      return hit ? hit.object.userData : null;
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
  return {
    setLayout() { /* F.L يُقرأ مباشرة في كل إطار */ },
    draw() {
      const L = F.L;
      hits.length = 0;
      g.fillStyle = "#58993f"; g.fillRect(0, 0, F.w, F.h);
      rect(L.seaX + 30, 0, 60, 260, "#2f78b5"); rect(L.seaX - 2.5, 0, 5, 260, "#c9b78a"); rect(L.seaX + 1.5, 6, 7, 1.8, "#7a5a3a");
      { const [sx, sz, k] = toS(0, 0); g.fillStyle = "#8c7a4e"; g.beginPath(); g.arc(sx, sz, (L.Y + 1.2) * k, 0, 7); g.fill(); g.strokeStyle = "#a57a4a"; g.lineWidth = Math.max(2, k * 0.25); g.setLineDash([k * 0.3, k * 0.4]); g.beginPath(); g.arc(sx, sz, (L.Y + 0.9) * k, 0, 7); g.stroke(); g.setLineDash([]); }
      L.trees.forEach(t => { const [sx, sz, k] = toS(t.x, t.z); g.fillStyle = "#2f6b3a"; g.beginPath(); g.arc(sx, sz, 1.4 * t.s * k, 0, 7); g.fill(); });
      L.rocks.forEach(r => { const [sx, sz, k] = toS(r.x, r.z); g.fillStyle = "#8a8d93"; g.beginPath(); g.arc(sx, sz, r.s * k, 0, 7); g.fill(); });
      const b = L.barn; rect(b.x, b.z, b.w, b.d, "#b5443a"); rect(b.x, b.z - b.d / 4, b.w + 0.4, b.d / 2, "#9c8f7a"); label(b.n, b.x, b.z, 1.1);
      { const [sx, sz, k] = toS(b.x, b.z); hits.push({ x: sx, y: sz, r: Math.max(b.d * k * 0.6, 24), d: { kind: "barn", n: b.n } }); }
      const emojiBox = (e, x, z, size, data) => { const [sx, sz, k] = toS(x, z), s = Math.max(size * k, 22); g.font = Math.round(s) + "px sans-serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillStyle = "#fff"; g.fillText(e, sx, sz - 2); hits.push({ x: sx, y: sz, r: s * 0.9, d: data }); };
      L.posts.forEach(p => { rect(p.x, p.z, p.w, p.d, p.color); rect(p.x, p.z - p.d / 4, p.w + 0.3, p.d / 2, "#6b4a35"); emojiBox(p.e, p.x, p.z, 1.8, { kind: "post", e: p.e, n: p.n, ids: p.ids }); label(p.n, p.x, p.z + p.d / 2 + 0.9, 0.95); });
      L.services.forEach(s => { rect(s.x, s.z, s.w, s.d, s.color); rect(s.x, s.z - s.d / 4, s.w + 0.3, s.d / 2, "#3d3d4a"); emojiBox(s.e, s.x, s.z, 1.6, { kind: "svc", id: s.id, e: s.e, n: s.n }); label(s.n, s.x, s.z + s.d / 2 + 0.9, 0.95); });
      L.eggs.forEach(e => { const [sx, sz, k] = toS(e.x, e.z); g.fillStyle = e.ready ? "#ffd24d" : "#f3ead2"; g.beginPath(); g.ellipse(sx, sz, 0.38 * k, 0.5 * k, 0, 0, 7); g.fill(); });
      L.pets.slice().sort((a, b2) => a.z - b2.z).forEach(p => {
        const [sx, sz, k] = toS(p.x, p.z), s = Math.max((p.main ? 2.1 : 1.5) * k, p.main ? 22 : 16);
        g.strokeStyle = RAR_COLOR[p.rar] || "#fff"; g.lineWidth = Math.max(1.5, k * 0.12); g.beginPath(); g.ellipse(sx, sz + s * 0.35, s * 0.45, s * 0.2, 0, 0, 7); g.stroke();
        g.font = Math.round(s) + "px sans-serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillStyle = "#fff"; g.fillText(p.emoji, sx, sz);
        hits.push({ x: sx, y: sz, r: s * 0.6, d: Object.assign({ kind: "pet" }, p) });
      });
    },
    pick(x, y) {
      for (let i = hits.length - 1; i >= 0; i--) { const h = hits[i]; if (Math.hypot(x - h.x, y - h.y) <= h.r) return h.d; }
      return null;
    },
    dispose() { /* لا موارد خاصة */ }
  };
}
