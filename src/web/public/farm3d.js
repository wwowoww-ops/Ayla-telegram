"use strict";
// ======================================================
// المزرعة: منظر علوي ثلاثي الأبعاد (three.js) + زيارة حظائر اللاعبين.
// إن تعذّر تحميل three.js أو WebGL يُرسم المشهد نفسه ثنائي الأبعاد بدل شاشة فارغة.
// المنطق (التخطيط، حركة الحيوانات، التحكم باللمس) مشترك بين الرسمين.
// ======================================================
const THREE_URL = "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js";
const FARM_COL = { post: ["#c9a35a", "#7d8fa3", "#5aa66b", "#b86bd1", "#d98b4c", "#d4b83e", "#d65f5f"] };   // ألوان مبانٍ الوظائف بالترتيب
let fm = null;            // المشهد الحالي
let threeState = "idle";  // idle | loading | ok | fail

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
// الإحداثيات: x يمين، z نحو الكاميرا. الساحة دائرة حول (0,0) يتسع نصف قطرها Y مع عدد الحيوانات،
// ومباني الوظائف على حلقة خارجها، والماء شرقًا.
const SLOT0 = -Math.PI / 2, SLOT_STEP = Math.PI / 4;   // 8 مواضع على الحلقة: 7 وظائف + الحظيرة الكبرى
function farmLayout(f) {
  const rnd = mulberry(hashSeed(f.uid + f.name));
  const roam = f.pets.filter(p => !Object.values(f.post).some(ids => ids.includes(p.id))).length;
  const Y = Math.max(8, Math.min(15, 6.5 + Math.sqrt(roam) * 0.95));
  const ring = Y + 6;
  const slot = k => [Math.cos(SLOT0 + k * SLOT_STEP) * ring, Math.sin(SLOT0 + k * SLOT_STEP) * ring];
  const posts = f.posts.map((p, i) => {
    const s = slot(i % 7);
    return { id: p.id, e: p.e, n: p.n, x: s[0], z: s[1], w: 4.2, d: 3.2, h: 2.6, color: FARM_COL.post[i % FARM_COL.post.length], ids: f.post[p.id] || [] };
  });
  const bs = slot(7), barn = { x: bs[0] * 1.12, z: bs[1] * 1.12, w: 11, d: 6.4, h: 4.4 };
  const seaX = Y + 14;
  const trees = [];
  for (let i = 0; i < 60 && trees.length < 28; i++) {
    const x = -Y - 26 + rnd() * (Y + 24 + seaX - 4), z = -Y - 22 + rnd() * (2 * Y + 44);
    const bad = Math.hypot(x, z) < ring + 5 || x > seaX - 3 || (Math.abs(x - barn.x) < barn.w && Math.abs(z - barn.z) < barn.d + 3);
    if (!bad) trees.push({ x, z, s: 0.8 + rnd() * 0.8 });
  }
  const rocks = [];
  for (let i = 0; i < 40 && rocks.length < 18; i++) {
    const x = -Y - 24 + rnd() * (2 * Y + 44), z = -Y - 20 + rnd() * (2 * Y + 40);
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
  return { Y, ring, seaX, posts, barn, trees, rocks, eggs, pets };
}

// حركة الحيوانات: يتجول كل حيوان في ساحته أو قرب وظيفته
function stepPets(L, dt) {
  L.pets.forEach(p => {
    if (p.wait > 0) { p.wait -= dt; p.moving = false; return; }
    if (!p.tx && !p.tz) pickTarget(p);
    const dx = p.tx - p.x, dz = p.tz - p.z, d = Math.hypot(dx, dz);
    if (d < 0.15) { p.wait = 1.5 + Math.random() * 5; p.tx = p.tz = 0; p.moving = false; return; }
    const v = Math.min(d, p.speed * dt);
    p.x += dx / d * v; p.z += dz / d * v; p.moving = true; p.face = dx < 0 ? -1 : 1;
  });
}
function pickTarget(p) {
  if (p.home) { p.tx = p.home.x + (Math.random() - 0.5) * 3.4; p.tz = p.home.z + p.home.d / 2 + 1 + Math.random() * 1.8; return; }
  const a = Math.random() * Math.PI * 2, r = Math.sqrt(Math.random()) * (p.Y - 0.8);
  p.tx = Math.cos(a) * r; p.tz = Math.sin(a) * r;
}

// ---------- الواجهة ----------
let farmBusy = false;
SUBS.farm = () => {
  if (farmBusy || (fm && fm.canvas && document.body.contains(fm.canvas))) return;     // لا نعيد البناء عند تحديث الحالة الدوري
  farmOpen("");
};
SUBS.visit = () => { if ($("#fList")) return; farmVisitList(""); };

function farmBack() { sub = null; VIEWS.more(); }

async function farmOpen(uid) {
  if (farmBusy) return;
  farmBusy = true;
  try { await farmOpenInner(uid); } finally { farmBusy = false; }
}
async function farmOpenInner(uid) {
  farmStop();
  view.innerHTML = `<button class="btn sec sm" id="fBack" style="margin-bottom:8px">↩️ رجوع</button><div class="dim">جارٍ تحضير المزرعة…</div>`;
  $("#fBack").onclick = () => (uid ? farmVisitList("") : farmBack());
  const j = await act("farmView", { uid });
  if (!j || !j.ok) { toast((j && j.msg) || "تعذر فتح الحظيرة", true); return uid ? farmVisitList("") : farmBack(); }
  const f = j.farm;
  view.innerHTML = `
    <div class="pen-bar">
      <button class="btn sec sm" id="fBack" style="flex:none">↩️</button>
      <div class="grow" style="align-self:center;font-weight:700">${uid ? "👀 " : "🌄 "}${esc(f.name)} <span class="dim" style="font-weight:400">⚔️ ${fmt(f.power)} · 🐾 ${f.count}</span></div>
      ${uid ? `<button class="btn sm" id="fMine" style="flex:none">🏠 حظيرتي</button>` : `<button class="btn sm" id="fVisit" style="flex:none">👥 زيارة</button>`}
    </div>
    <canvas id="farm"></canvas>
    <div id="fInfo" class="card dim" style="margin-top:8px;min-height:44px">اسحب للتحرك، اضغط بإصبعين للتكبير، واضغط على حيوان لترى بياناته.</div>
    ${j.self && j.log && j.log.length ? `<div class="dim" style="font-size:12px;margin-top:6px">👀 آخر زوّار حظيرتك: ${j.log.map(v => esc(v.n)).join("، ")}</div>` : ""}
    <div class="dim" id="fMode" style="font-size:11px;margin-top:4px"></div>`;
  $("#fBack").onclick = () => (uid ? farmVisitList("") : farmBack());
  if (uid) $("#fMine").onclick = () => { buzz(); farmOpen(""); };
  else $("#fVisit").onclick = () => { buzz(); farmVisitList(""); };
  let canvas = $("#farm");
  const L = farmLayout(f);
  fm = { canvas, L, f, cam: { tx: 0, tz: 2, d: 40 }, raf: 0, last: 0, mode: "2d", sel: null };
  const ok = await loadThree();
  if (!fm || fm.canvas !== canvas) return;       // غادر المستخدم الشاشة أثناء التحميل
  let r = null;
  if (ok) { try { r = farm3dInit(fm); fm.mode = "3d"; } catch (e) { console.warn("farm3d", e); r = null; } }
  if (!r) {
    // لوحة حصلت على سياق WebGL لا تقبل 2d: نستبدلها بلوحة جديدة
    const nc = document.createElement("canvas"); nc.id = "farm"; canvas.replaceWith(nc); canvas = nc; fm.canvas = nc;
    r = farm2dInit(fm); fm.mode = "2d";
  }
  fm.r = r;
  $("#fMode").textContent = fm.mode === "3d" ? "عرض ثلاثي الأبعاد" : "عرض مبسّط (تعذّر تحميل الثلاثي الأبعاد)";
  farmInput(fm);
  const F = fm;
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

async function farmVisitList(q) {
  farmStop();
  sub = "visit";
  view.innerHTML = `<button class="btn sec sm" id="fBack" style="margin-bottom:8px">↩️ رجوع</button><h2>👥 زيارة حظائر اللاعبين</h2>
    <div class="row" style="gap:6px;margin-bottom:8px"><input id="fQ" class="grow" placeholder="ابحث باسم لاعب" value="${esc(q || "")}" style="padding:9px;border-radius:10px;background:var(--card2);border:1px solid var(--line);color:inherit"><button class="btn sm" id="fGo">بحث</button></div>
    <div id="fList"><div class="dim">جارٍ التحميل…</div></div>`;
  $("#fBack").onclick = () => { buzz(); sub = "farm"; farmOpen(""); };
  const load = async () => {
    const j = await act("visitList", { q: $("#fQ").value });
    if (!j || !j.ok) return;
    $("#fList").innerHTML = j.list.length ? j.list.map(r => `<div class="card row"><div style="font-size:30px">${r.emoji}</div><div class="grow"><b>${esc(r.name)}</b><div class="dim">⚔️ ${fmt(r.power)} · 🐾 ${r.pets}</div></div><button class="btn sm" data-u="${esc(r.uid)}">زيارة</button></div>`).join("") : `<div class="dim">لا يوجد لاعبون مطابقون.</div>`;
    $("#fList").querySelectorAll("[data-u]").forEach(b => b.onclick = () => { buzz(); sub = "farm"; farmOpen(b.dataset.u); });
  };
  $("#fGo").onclick = load;
  $("#fQ").onkeydown = e => { if (e.key === "Enter") load(); };
  load();
}

// ---------- التحكم باللمس (مشترك) ----------
function farmInput(F) {
  const c = F.canvas, ptr = new Map();
  let startT = 0, moved = 0, pinch = 0;
  const clampCam = () => { const cam = F.cam, lim = F.L.ring + 10; cam.d = Math.max(14, Math.min(F.L.ring * 7 + 20, cam.d)); cam.tx = Math.max(-lim, Math.min(lim, cam.tx)); cam.tz = Math.max(-lim, Math.min(lim, cam.tz)); };
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
  F.sel = p || null;
  const box = $("#fInfo"); if (!box) return;
  buzz();
  if (!p) { box.innerHTML = `<span class="dim">اضغط على حيوان أو مبنى لرؤية بياناته.</span>`; return; }
  if (p.kind === "post") {
    box.innerHTML = `<b>${p.e} ${esc(p.n)}</b> · ${p.ids.length} حيوان${p.ids.length ? "" : " (فارغة)"}`;
    return;
  }
  box.innerHTML = `<b>${p.emoji} ${esc(p.name)}</b> ${p.main ? "👑" : ""} <span class="tag" style="color:${RAR_COLOR[p.rar] || "#fff"}">${p.rarEmoji} ${esc(p.rarName)}</span>
    <div class="dim">${p.elEmoji} ${esc(p.elName)} · مستوى ${p.lv}${p.st ? " · " + "⭐".repeat(Math.min(5, p.st)) : ""} · ⚔️ ${fmt(p.pw)}${p.post ? " · في وظيفة" : ""}</div>`;
}

// ======================================================
// رسم ثلاثي الأبعاد
// ======================================================
function farm3dInit(F) {
  const T = window.THREE, c = F.canvas, L = F.L;
  const renderer = new T.WebGLRenderer({ canvas: c, antialias: false, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.setClearColor(0x9fd0f0);
  const scene = new T.Scene();
  scene.fog = new T.Fog(0x9fd0f0, 55, 110);
  const camera = new T.PerspectiveCamera(42, 1, 0.5, 200);
  scene.add(new T.HemisphereLight(0xffffff, 0x4d6b3a, 0.85));
  const sun = new T.DirectionalLight(0xfff2d0, 0.75); sun.position.set(-20, 30, 12); scene.add(sun);

  const mat = (color, extra) => new T.MeshLambertMaterial(Object.assign({ color, flatShading: true }, extra || {}));
  const box = (w, h, d, color, x, y, z) => { const m = new T.Mesh(new T.BoxGeometry(w, h, d), mat(color)); m.position.set(x, y, z); scene.add(m); return m; };

  // الأرض والماء والمرسى
  const ground = new T.Mesh(new T.PlaneGeometry(260, 220), mat(0x58993f)); ground.rotation.x = -Math.PI / 2; scene.add(ground);
  const dirt = new T.Mesh(new T.CircleGeometry(L.Y + 1.2, 36), mat(0x8c7a4e)); dirt.rotation.x = -Math.PI / 2; dirt.position.y = 0.02; scene.add(dirt);
  const sea = new T.Mesh(new T.PlaneGeometry(40, 220), mat(0x2f78b5)); sea.rotation.x = -Math.PI / 2; sea.position.set(L.seaX + 20, 0.01, 0); scene.add(sea);
  const shore = new T.Mesh(new T.PlaneGeometry(5, 220), mat(0xc9b78a)); shore.rotation.x = -Math.PI / 2; shore.position.set(L.seaX - 2.5, 0.015, 0); scene.add(shore);
  box(7, 0.25, 1.8, 0x7a5a3a, L.seaX + 1.5, 0.2, 6);

  // الحظيرة الكبرى
  const b = L.barn;
  box(b.w, b.h, b.d, 0xb5443a, b.x, b.h / 2, b.z);
  const rf = (sx) => { const r = box(b.w + 0.6, 0.35, b.d / 2 + 0.7, 0x9c8f7a, b.x, b.h + 0.9, b.z + sx * (b.d / 4)); r.rotation.x = sx * 0.45; return r; };
  rf(-1); rf(1);
  box(2.4, 2.8, 0.2, 0x4a2a22, b.x, 1.4, b.z + b.d / 2 + 0.05);

  // مباني الوظائف + اللافتات
  const pickables = [];
  const sprites = new Map();
  const emojiTex = e => {
    if (sprites.has(e)) return sprites.get(e);
    const cv = document.createElement("canvas"); cv.width = cv.height = 128;
    const g = cv.getContext("2d"); g.font = "96px sans-serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(e, 64, 72);
    const t = new T.CanvasTexture(cv); sprites.set(e, t); return t;
  };
  const mkSprite = (e, s) => { const sp = new T.Sprite(new T.SpriteMaterial({ map: emojiTex(e), transparent: true, depthWrite: false })); sp.scale.set(s, s, 1); return sp; };
  L.posts.forEach(p => {
    box(p.w, p.h, p.d, p.color, p.x, p.h / 2, p.z);
    const rr = box(p.w + 0.5, 0.3, p.d + 0.5, 0x6b4a35, p.x, p.h + 0.15, p.z);
    const sign = mkSprite(p.e, 2.4); sign.position.set(p.x, p.h + 2, p.z); scene.add(sign);
    sign.userData = { kind: "post", e: p.e, n: p.n, ids: p.ids };
    pickables.push(sign);
  });

  // سياج الساحة
  const nFence = Math.round(L.Y * 4.2);
  for (let i = 0; i < nFence; i++) {
    const a = i / nFence * Math.PI * 2;
    if (Math.abs(a - Math.PI / 2) < 0.2) continue;                     // مدخل
    const x = Math.cos(a) * (L.Y + 0.9), z = Math.sin(a) * (L.Y + 0.9);
    const post = box(0.25, 1, 0.25, 0xa57a4a, x, 0.5, z);
  }
  // أشجار وصخور
  L.trees.forEach(t => {
    box(0.4 * t.s, 1.4 * t.s, 0.4 * t.s, 0x6b4a2a, t.x, 0.7 * t.s, t.z);
    const cone = new T.Mesh(new T.ConeGeometry(1.5 * t.s, 3.6 * t.s, 7), mat(0x2f6b3a)); cone.position.set(t.x, 3 * t.s, t.z); scene.add(cone);
  });
  L.rocks.forEach(r => { const m = new T.Mesh(new T.DodecahedronGeometry(r.s, 0), mat(0x8a8d93)); m.position.set(r.x, r.s * 0.4, r.z); scene.add(m); });
  // البيض
  L.eggs.forEach(e => { const m = new T.Mesh(new T.SphereGeometry(0.38, 10, 8), mat(e.ready ? 0xffd24d : 0xf3ead2)); m.scale.y = 1.3; m.position.set(e.x, 0.5, e.z); scene.add(m); });
  // الحيوانات: صور رمزية قائمة مع حلقة الندرة وظل
  const ringGeo = new T.RingGeometry(0.55, 0.72, 20), shadowGeo = new T.CircleGeometry(0.6, 14);
  const rarCol = i => new T.Color(RAR_COLOR[i] || "#ffffff");
  L.pets.forEach(p => {
    const sp = mkSprite(p.emoji, p.main ? 2.5 : 1.8); sp.userData = Object.assign({ kind: "pet" }, p); p.obj = sp; scene.add(sp); pickables.push(sp);
    const ring = new T.Mesh(ringGeo, new T.MeshBasicMaterial({ color: rarCol(p.rar), transparent: true, opacity: 0.9, side: T.DoubleSide })); ring.rotation.x = -Math.PI / 2; scene.add(ring); p.ring = ring;
    const sh = new T.Mesh(shadowGeo, new T.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.28 })); sh.rotation.x = -Math.PI / 2; scene.add(sh); p.sh = sh;
    p.base = p.main ? 1.4 : 1.0; p.size = p.main ? 2.5 : 1.8;
  });

  const ray = new T.Raycaster(), ndc = new T.Vector2();
  const resize = () => {
    const w = c.clientWidth || 360, h = Math.max(260, Math.round(window.innerHeight * 0.55));
    c.style.height = h + "px"; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
  };
  resize(); F.onResize = resize; window.addEventListener("resize", resize);
  F.cam.d = Math.min(F.L.ring * 7 + 20, (L.ring + 5) * 2 / (camera.aspect * 0.77));   // يشمل عرض الحلقة كاملًا
  F.cam.tz = 2;

  return {
    draw(t) {
      const cam = F.cam, pitch = 1.0;                                      // ~57° من الأفق
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
    dispose() { try { renderer.dispose(); } catch (e) { /* لا شيء */ } sprites.forEach(t => t.dispose && t.dispose()); }
  };
}

// ======================================================
// رسم احتياطي ثنائي الأبعاد (منظر علوي)
// ======================================================
function farm2dInit(F) {
  const c = F.canvas, g = c.getContext("2d"), L = F.L;
  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2), w = c.clientWidth || 360, h = Math.max(260, Math.round(window.innerHeight * 0.55));
    c.style.height = h + "px"; c.width = Math.round(w * dpr); c.height = Math.round(h * dpr); g.setTransform(dpr, 0, 0, dpr, 0, 0); F.w = w; F.h = h;
  };
  resize(); F.onResize = resize; window.addEventListener("resize", resize);
  F.cam.d = Math.min(F.L.ring * 7 + 20, F.h * 1.1 * (L.ring + 5) * 2 / F.w); F.cam.tz = 2;
  const hits = [];
  const toS = (x, z) => { const k = F.h / F.cam.d * 1.1; return [F.w / 2 + (x - F.cam.tx) * k, F.h / 2 + (z - F.cam.tz) * k, k]; };
  const rect = (x, z, w, d, col) => { const [sx, sz, k] = toS(x - w / 2, z - d / 2); g.fillStyle = col; g.fillRect(sx, sz, w * k, d * k); };
  return {
    draw() {
      hits.length = 0;
      g.fillStyle = "#58993f"; g.fillRect(0, 0, F.w, F.h);
      rect(L.seaX + 20, 0, 40, 220, "#2f78b5"); rect(L.seaX - 2.5, 0, 5, 220, "#c9b78a"); rect(L.seaX + 1.5, 6, 7, 1.8, "#7a5a3a");
      { const [sx, sz, k] = toS(0, 0); g.fillStyle = "#8c7a4e"; g.beginPath(); g.arc(sx, sz, (L.Y + 1.2) * k, 0, 7); g.fill(); g.strokeStyle = "#a57a4a"; g.lineWidth = Math.max(2, k * 0.25); g.setLineDash([k * 0.3, k * 0.4]); g.beginPath(); g.arc(sx, sz, (L.Y + 0.9) * k, 0, 7); g.stroke(); g.setLineDash([]); }
      L.trees.forEach(t => { const [sx, sz, k] = toS(t.x, t.z); g.fillStyle = "#2f6b3a"; g.beginPath(); g.arc(sx, sz, 1.4 * t.s * k, 0, 7); g.fill(); });
      L.rocks.forEach(r => { const [sx, sz, k] = toS(r.x, r.z); g.fillStyle = "#8a8d93"; g.beginPath(); g.arc(sx, sz, r.s * k, 0, 7); g.fill(); });
      const b = L.barn; rect(b.x, b.z, b.w, b.d, "#b5443a"); rect(b.x, b.z - b.d / 4, b.w + 0.4, b.d / 2, "#9c8f7a");
      L.posts.forEach(p => {
        rect(p.x, p.z, p.w, p.d, p.color); rect(p.x, p.z - p.d / 4, p.w + 0.3, p.d / 2, "#6b4a35");
        const [sx, sz, k] = toS(p.x, p.z); g.font = Math.round(Math.max(1.8 * k, 22)) + "px sans-serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(p.e, sx, sz);
        hits.push({ x: sx, y: sz, r: Math.max(1.8 * k, 22), d: { kind: "post", e: p.e, n: p.n, ids: p.ids } });
      });
      L.eggs.forEach(e => { const [sx, sz, k] = toS(e.x, e.z); g.fillStyle = e.ready ? "#ffd24d" : "#f3ead2"; g.beginPath(); g.ellipse(sx, sz, 0.38 * k, 0.5 * k, 0, 0, 7); g.fill(); });
      const sorted = L.pets.slice().sort((a, b) => a.z - b.z);
      sorted.forEach(p => {
        const [sx, sz, k] = toS(p.x, p.z), s = Math.max((p.main ? 2.1 : 1.5) * k, p.main ? 22 : 16);
        g.strokeStyle = RAR_COLOR[p.rar] || "#fff"; g.lineWidth = Math.max(1.5, k * 0.12); g.beginPath(); g.ellipse(sx, sz + s * 0.35, s * 0.45, s * 0.2, 0, 0, 7); g.stroke();
        g.font = Math.round(s) + "px sans-serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(p.emoji, sx, sz);
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
