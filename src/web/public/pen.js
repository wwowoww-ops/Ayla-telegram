"use strict";
// ======================================================
// الحظيرة: عالم كبير يتسع مع عدد الحيوانات، تحريك بالسحب وتكبير/تصغير
// ======================================================
let pen = null;
let penSel = "all";            // "all" = الكل، 0 = الكبرى، أو رقم حظيرة
let pensOpen = false;
const penOf = p => p.pen || 0;
const visiblePets = () => S.pets.filter(p => penSel === "all" || penOf(p) === penSel);
function stopPen() {
  if (pen) { cancelAnimationFrame(pen.raf); window.removeEventListener("resize", pen.onResize); pen = null; }
  if (nur) { cancelAnimationFrame(nur.raf); window.removeEventListener("resize", nur.onResize); nur = null; }
}

VIEWS.pen = () => {
  if (penSel !== "all" && penSel !== 0 && !S.pens.find(p => p.id === penSel)) penSel = "all";
  view.innerHTML = `
    <div class="seg" id="penTabs"></div>
    <div class="pen-bar"><button class="btn" id="bCollect"></button><button class="btn sec" id="bDaily"></button><button class="btn sec" id="bFeed">🍖</button><button class="btn sec" id="bZoom">🔍</button></div>
    <canvas id="pen"></canvas>`;
  $("#bCollect").onclick = () => { buzz("medium"); run("collect"); };
  $("#bDaily").onclick = () => { buzz("medium"); run("daily"); };
  $("#bFeed").onclick = feedAll;
  $("#bZoom").onclick = () => { pen.fit = !pen.fit; pen.zoomT = pen.fit ? fitZoom() : 1; buzz(); };
  startPen();
  penBar();
  penTabs();
  if (!S.pets.length) toast("لا حيوانات بعد. افقس بيضتك الأولى 🥚");
};

function penTabs() {
  const el = $("#penTabs");
  if (!el) return;
  const cnt = id => S.pets.filter(p => penOf(p) === id).length;
  const tabs = [["all", "🌍 الكل " + S.pets.length], [0, "🏡 الكبرى " + cnt(0)]].concat(S.pens.map(p => [p.id, esc(p.name) + " " + cnt(p.id)]));
  el.innerHTML = tabs.map(t => `<button data-p="${t[0]}" class="${t[0] === penSel ? "on" : ""}">${t[1]}</button>`).join("") + `<button data-p="cfg">⚙️ الحظائر</button>`;
  el.querySelectorAll("button").forEach(b => b.onclick = () => {
    buzz();
    if (b.dataset.p === "cfg") return openPens();
    penSel = b.dataset.p === "all" ? "all" : Number(b.dataset.p);
    if (pen) { pen.fit = false; pen.zoomT = 1; pen.cx = 0; pen.cy = 0; penSync(); }
    penTabs();
  });
}

// نافذة إدارة الحظائر: إنشاء، تسمية، حذف، نقل جماعي
function openPens() {
  pensOpen = true;
  const cnt = id => S.pets.filter(p => penOf(p) === id).length;
  const opts = (all) => (all ? `<option value="all">كل الحظائر</option>` : "") + `<option value="0">🏡 الكبرى</option>` + S.pens.map(p => `<option value="${p.id}">${esc(p.name)}</option>`).join("");
  $("#sheet").innerHTML = `<div class="panel">
    <h2>⚙️ الحظائر</h2>
    <div class="card"><b>🏡 الكبرى</b> <span class="dim">· ${cnt(0)} حيوان · الحظيرة الأساسية</span></div>
    ${S.pens.map(p => `<div class="card"><div class="row"><input data-n="${p.id}" value="${esc(p.name)}" maxlength="14" class="grow"><button class="btn sm" data-save="${p.id}">حفظ</button><button class="btn bad sm" data-del="${p.id}">🗑️</button></div><div class="dim" style="margin-top:4px">${cnt(p.id)} حيوان</div></div>`).join("")}
    ${S.pens.length < S.meta.penMax ? `<div class="row" style="margin:8px 0"><input id="newPen" placeholder="اسم حظيرة جديدة" maxlength="14" class="grow"><button class="btn sm" id="addPen">➕ أنشئ</button></div>` : `<div class="dim">وصلت أقصى عدد من الحظائر (${S.meta.penMax}).</div>`}
    <div class="dim" style="margin:12px 0 6px">نقل جماعي</div>
    <div class="row"><select id="mvFrom" class="grow">${opts(true)}</select><span>➜</span><select id="mvTo" class="grow">${opts(false)}</select><button class="btn sm" id="mvGo">انقل</button></div>
    <div class="dim" style="margin-top:12px">💡 اضغط مطولًا على أي حيوان داخل الحظيرة ثم حرّكه وأفلته حيث تريد، فيبقى هناك. ولنقل حيوان واحد افتح بطاقته.</div>
  </div>`;
  $("#sheet").classList.remove("hidden");
  const P = $("#sheet .panel");
  P.querySelectorAll("[data-save]").forEach(b => b.onclick = () => run("renamePen", { id: Number(b.dataset.save), name: P.querySelector(`[data-n="${b.dataset.save}"]`).value }));
  P.querySelectorAll("[data-del]").forEach(b => b.onclick = () => { if (confirm("حذف الحظيرة؟ ستعود حيواناتها للحظيرة الكبرى.")) run("delPen", { id: Number(b.dataset.del) }); });
  const add = $("#addPen");
  if (add) add.onclick = () => run("newPen", { name: $("#newPen").value });
  $("#mvGo").onclick = () => {
    const f = $("#mvFrom").value;
    run("movePets", { from: f === "all" ? -1 : Number(f), to: Number($("#mvTo").value) });
  };
}

function penBar() {
  const p = S.player;
  const c = $("#bCollect"), d = $("#bDaily");
  if (!c) return;
  c.innerHTML = `💰 اجمع <b style="color:#fff">${fmt(p.pending)}</b>`;
  const left = p.dailyIn - (Date.now() - stamp);
  d.innerHTML = left > 0 ? `🎁 <span data-ts="${ts(left)}">${dur(left)}</span>` : "🎁 يومي";
  d.classList.toggle("off", left > 0);
}

async function feedAll() {
  const foods = S.items.filter(i => ["date", "meat", "feast"].includes(i.id));
  const hungry = S.pets.filter(p => p.hunger < 60);
  if (!foods.length) return toast("لا تملك طعامًا. اشترِ من المتجر 🛒", true);
  if (!hungry.length) return toast("كل الحيوانات شبعانة 😋");
  let n = 0;
  const left = {}; foods.forEach(f => left[f.id] = f.count);
  for (const p of hungry) {
    const id = Object.keys(left).find(k => left[k] > 0);
    if (!id) break;
    const j = await act("feed", { id: p.id, food: id });
    if (j.ok) { left[id]--; n++; }
  }
  toast(n ? `🍖 أُطعم ${n} حيوان` : "لم يُطعم أحد", !n);
  update();
}

// حجم العالم بحسب عدد الحيوانات (مساحة أكبر كلما كثروا)
function worldK() { return Math.max(1, Math.min(3.4, Math.sqrt(visiblePets().length / 5))); }
function fitZoom() { return Math.min(1, Math.min(pen.vw / pen.W, pen.vh / pen.H)); }

function startPen() {
  const c = $("#pen");
  const ctx = c.getContext("2d");
  pen = { c, ctx, actors: new Map(), parts: [], t: 0, last: performance.now(), W: 0, H: 0, vw: 0, vh: 0, bg: null, k: 0, cx: 0, cy: 0, z: 1, zoomT: 1, fit: false, drag: null };
  pen.onResize = () => sizePen(true);
  window.addEventListener("resize", pen.onResize);
  sizePen(true);
  penSync();
  const toWorld = e => { const r = c.getBoundingClientRect(); return { x: (e.clientX - r.left) / pen.z + pen.cx, y: (e.clientY - r.top) / pen.z + pen.cy }; };
  c.addEventListener("pointerdown", e => {
    const w = toWorld(e), hit = hitActor(w.x, w.y);
    const d = { x: e.clientX, y: e.clientY, cx: pen.cx, cy: pen.cy, moved: false, actor: hit, carry: false, timer: 0 };
    // ضغط مطول على حيوان = التقاطه لتحريكه
    if (hit) d.timer = setTimeout(() => {
      if (pen && pen.drag === d && !d.moved) { d.carry = true; hit.carried = true; hit.moving = false; buzz("heavy"); toast("📍 حرّكه وأفلته حيث تريد"); }
    }, 380);
    pen.drag = d;
    try { c.setPointerCapture(e.pointerId); } catch (_) {}
  });
  c.addEventListener("pointermove", e => {
    const d = pen.drag; if (!d) return;
    if (d.carry) { const w = toWorld(e); d.actor.x = Math.max(24, Math.min(pen.W - 24, w.x)); d.actor.y = Math.max(40, Math.min(pen.H - 26, w.y)); return; }
    const dx = e.clientX - d.x, dy = e.clientY - d.y;
    if (!d.moved && Math.hypot(dx, dy) > 8) { d.moved = true; clearTimeout(d.timer); }
    if (d.moved) { pen.cx = d.cx - dx / pen.z; pen.cy = d.cy - dy / pen.z; clampCam(); }
  });
  c.addEventListener("pointerup", e => {
    const d = pen.drag; pen.drag = null;
    if (!d) return;
    clearTimeout(d.timer);
    if (d.carry) return dropActor(d.actor);
    if (!d.moved) penTap(e);
  });
  c.addEventListener("pointercancel", () => { const d = pen.drag; pen.drag = null; if (d) { clearTimeout(d.timer); if (d.carry) dropActor(d.actor); } });
  const loop = now => {
    if (!pen) return;
    const dt = Math.min(0.05, (now - pen.last) / 1000);
    pen.last = now; pen.t += dt;
    pen.z += (pen.zoomT - pen.z) * Math.min(1, dt * 8);
    clampCam();
    penStep(dt); penDraw();
    pen.raf = requestAnimationFrame(loop);
  };
  pen.raf = requestAnimationFrame(loop);
}

function hitActor(x, y) {
  let best = null, bd = 1e9;
  pen.actors.forEach(a => { const d = Math.hypot(a.x - x, a.y - y); if (d < bd) { bd = d; best = a; } });
  return best && bd < petSize(best.pet) * 0.9 + 14 ? best : null;
}
// أفلت الحيوان: نثبّت مكانه ونحفظه (كنسبة من حجم الحظيرة)
async function dropActor(a) {
  a.carried = false; a.pin = true;
  const j = await act("place", { id: a.pet.id, fx: Math.round(a.x / pen.W * 1000) / 1000, fy: Math.round(a.y / pen.H * 1000) / 1000 });
  toast(j.ok ? "📌 تم تثبيت " + a.pet.name : (j.msg || "تعذر الحفظ"), !j.ok);
  if (pen) { penSync(); penTabs(); }
}

function clampCam() {
  const vw = pen.vw / pen.z, vh = pen.vh / pen.z;
  pen.cx = vw >= pen.W ? (pen.W - vw) / 2 : Math.max(0, Math.min(pen.W - vw, pen.cx));
  pen.cy = vh >= pen.H ? (pen.H - vh) / 2 : Math.max(0, Math.min(pen.H - vh, pen.cy));
}

function sizePen(force) {
  const c = pen.c, dpr = Math.min(window.devicePixelRatio || 1, 2);
  const r = c.getBoundingClientRect();
  pen.vw = r.width; pen.vh = r.height;
  c.width = Math.round(r.width * dpr); c.height = Math.round(r.height * dpr);
  pen.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const k = worldK();
  if (force || k !== pen.k) {
    pen.k = k; pen.W = Math.round(pen.vw * k); pen.H = Math.round(pen.vh * k);
    pen.bg = makeBackground(pen.W, pen.H, Math.min(dpr, 1.5));
    pen.actors.forEach(a => { a.x = Math.min(a.x, pen.W - 40); a.y = Math.min(a.y, pen.H - 40); a.tx = a.x; a.ty = a.y; });
    if (pen.fit) pen.zoomT = fitZoom();
  }
}

// الخلفية ثابتة فنرسمها مرة واحدة
function makeBackground(W, H, dpr) {
  const o = document.createElement("canvas");
  o.width = Math.round(W * dpr); o.height = Math.round(H * dpr);
  const g = o.getContext("2d");
  g.scale(dpr, dpr);
  const grad = g.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, "#4c9a4a"); grad.addColorStop(1, "#2f7a3a");
  g.fillStyle = grad; g.fillRect(0, 0, W, H);
  g.fillStyle = "rgba(255,255,255,.045)";
  for (let x = 0; x < W; x += 44) g.fillRect(x, 0, 22, H);
  const seed = n => { const x = Math.sin(n * 91.7) * 43758.5; return x - Math.floor(x); };
  const area = W * H / 100000;
  // بركات
  const ponds = Math.max(1, Math.round(area / 6));
  for (let i = 0; i < ponds; i++) {
    const px = W * (0.15 + seed(i + 200) * 0.7), py = H * (0.12 + seed(i + 300) * 0.7), rw = 50 + seed(i + 400) * 40;
    g.fillStyle = "#2c6fa8"; g.beginPath(); g.ellipse(px, py, rw, rw * 0.55, 0, 0, 7); g.fill();
    g.strokeStyle = "rgba(255,255,255,.35)"; g.lineWidth = 2; g.beginPath(); g.ellipse(px, py, rw * 0.7, rw * 0.35, 0, 0, 7); g.stroke();
  }
  // درب ترابي عبر الأرض
  g.strokeStyle = "rgba(190,150,90,.55)"; g.lineWidth = 26; g.lineCap = "round";
  g.beginPath(); g.moveTo(20, H * 0.5); g.bezierCurveTo(W * 0.3, H * 0.3, W * 0.6, H * 0.7, W - 20, H * 0.5); g.stroke();
  g.textAlign = "center"; g.textBaseline = "middle";
  for (let i = 0; i < Math.round(14 * area); i++) { g.font = "16px serif"; g.fillText(i % 3 ? "🌼" : "🌱", 30 + seed(i) * (W - 60), 50 + seed(i + 40) * (H - 80)); }
  const deco = ["🌳", "🌲", "🪨", "🌳", "🍄", "🌴"];
  for (let i = 0; i < Math.round(7 * area); i++) { g.font = (34 + seed(i + 70) * 18) + "px serif"; g.fillText(deco[i % deco.length], 30 + seed(i + 90) * (W - 60), 40 + seed(i + 130) * (H - 70)); }
  // سياج
  g.strokeStyle = "#7a5230"; g.lineWidth = 6; g.strokeRect(5, 5, W - 10, H - 10);
  g.fillStyle = "#a0713f";
  for (let x = 5; x <= W - 5; x += 34) { g.fillRect(x - 3, 0, 6, 12); g.fillRect(x - 3, H - 12, 6, 12); }
  for (let y = 5; y <= H - 5; y += 34) { g.fillRect(0, y - 3, 12, 6); g.fillRect(W - 12, y - 3, 12, 6); }
  return o;
}

const petSize = p => 26 + p.rar * 3;
function penSync() {
  if (!pen) return;
  sizePen(false);
  const vis = visiblePets();
  const ids = new Set(vis.map(p => p.id));
  pen.actors.forEach((a, id) => { if (!ids.has(id)) pen.actors.delete(id); });
  vis.forEach(p => {
    let a = pen.actors.get(p.id);
    if (!a) {
      a = { x: 40 + Math.random() * (pen.W - 80), y: 70 + Math.random() * (pen.H - 120), tx: 0, ty: 0, wait: Math.random() * 2, dir: 1, ph: Math.random() * 6.28, speed: 26 + Math.random() * 22, boost: 0 };
      a.tx = a.x; a.ty = a.y;
      pen.actors.set(p.id, a);
    }
    a.pet = p;
    if (!a.carried) {
      a.pin = p.fx != null;
      if (a.pin) { a.x = a.tx = p.fx * pen.W; a.y = a.ty = p.fy * pen.H; }
    }
  });
}
function penStep(dt) {
  const list = [...pen.actors.values()];
  list.forEach(a => {
    if (a.pin || a.carried) { a.moving = false; return; }
    a.boost = Math.max(0, a.boost - dt);
    const dx = a.tx - a.x, dy = a.ty - a.y, d = Math.hypot(dx, dy);
    if (d > 3) {
      const sp = (a.speed + (a.boost > 0 ? 90 : 0)) * dt;
      a.x += dx / d * Math.min(sp, d); a.y += dy / d * Math.min(sp, d);
      if (Math.abs(dx) > 2) a.dir = dx < 0 ? -1 : 1;
      a.moving = true;
    } else {
      a.moving = false;
      a.wait -= dt;
      if (a.wait <= 0) {
        a.tx = 36 + Math.random() * (pen.W - 72);
        a.ty = 60 + Math.random() * (pen.H - 100);
        a.wait = 0.8 + Math.random() * 3;
      }
    }
  });
  // تباعد: يدفع الحيوانات المتقاربة بعيدًا حتى لا تتراكم فوق بعضها
  for (let i = 0; i < list.length; i++) for (let j = i + 1; j < list.length; j++) {
    const a = list[i], b = list[j], dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 0.01, min = 40;
    if (d < min) {
      const push = (min - d) / 2 * Math.min(1, dt * 6), wa = a.pin || a.carried ? 0 : 1, wb = b.pin || b.carried ? 0 : 1;
      a.x -= dx / d * push * wa; a.y -= dy / d * push * wa; b.x += dx / d * push * wb; b.y += dy / d * push * wb;
    }
  }
  list.filter(a => !a.pin && !a.carried).forEach(a => { a.x = Math.max(24, Math.min(pen.W - 24, a.x)); a.y = Math.max(40, Math.min(pen.H - 26, a.y)); });
  pen.parts = pen.parts.filter(p => (p.life -= dt) > 0);
  pen.parts.forEach(p => { p.y -= 34 * dt; p.x += p.vx * dt; });
}
function penDraw() {
  const { ctx, vw, vh, z } = pen;
  ctx.fillStyle = "#1c3a22"; ctx.fillRect(0, 0, vw, vh);
  ctx.save();
  ctx.scale(z, z); ctx.translate(-pen.cx, -pen.cy);
  ctx.drawImage(pen.bg, 0, 0, pen.W, pen.H);
  const list = [...pen.actors.values()].sort((a, b) => a.y - b.y);
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  list.forEach(a => {
    if (a.x < pen.cx - 60 || a.x > pen.cx + vw / z + 60 || a.y < pen.cy - 60 || a.y > pen.cy + vh / z + 60) return;
    const p = a.pet, size = petSize(p), bob = Math.sin(pen.t * (a.moving ? 9 : 2) + a.ph) * (a.moving ? 3 : 1.2);
    ctx.fillStyle = "rgba(0,0,0,.25)";
    ctx.beginPath(); ctx.ellipse(a.x, a.y + size * 0.45, size * 0.55, size * 0.18, 0, 0, 7); ctx.fill();
    const ec = EL_COLOR[p.el] || "#fff";
    const gr = ctx.createRadialGradient(a.x, a.y + size * 0.4, 2, a.x, a.y + size * 0.4, size * 0.9);
    gr.addColorStop(0, ec + "88"); gr.addColorStop(1, ec + "00");
    ctx.fillStyle = gr; ctx.beginPath(); ctx.ellipse(a.x, a.y + size * 0.4, size * 0.9, size * 0.35, 0, 0, 7); ctx.fill();
    ctx.save();
    ctx.translate(a.x, a.y + bob);
    const img = speciesImg(p.sp);
    if (img) {
      const s = size * 1.5;
      ctx.beginPath(); ctx.arc(0, 0, s / 2, 0, 7); ctx.clip();
      ctx.drawImage(img, -s / 2, -s / 2, s, s);
    } else {
      ctx.scale(a.dir, 1);
      ctx.font = size + "px serif";
      ctx.fillText(p.emoji, 0, 0);
    }
    ctx.restore();
    ctx.font = "bold 11px system-ui";
    ctx.fillStyle = "#fff"; ctx.strokeStyle = "rgba(0,0,0,.7)"; ctx.lineWidth = 3;
    const label = "Lv." + p.lv + (p.st ? " " + "★".repeat(p.st) : "");
    ctx.strokeText(label, a.x, a.y + size * 0.75); ctx.fillText(label, a.x, a.y + size * 0.75);
    if (a.pin) { ctx.font = "11px serif"; ctx.fillText("📌", a.x - size * 0.6, a.y - size * 0.5 + bob); }
    if (a.carried) { ctx.font = "18px serif"; ctx.fillText("✋", a.x, a.y - size * 0.95); }
    if (p.main) { ctx.font = "16px serif"; ctx.fillText("👑", a.x, a.y - size * 0.75 + bob); }
    if (p.hunger < 35) { ctx.font = "15px serif"; ctx.globalAlpha = 0.6 + 0.4 * Math.sin(pen.t * 6); ctx.fillText("🍖", a.x + size * 0.6, a.y - size * 0.5 + bob); ctx.globalAlpha = 1; }
  });
  pen.parts.forEach(p => { ctx.globalAlpha = Math.min(1, p.life * 2); ctx.font = "20px serif"; ctx.fillText(p.ch, p.x, p.y); });
  ctx.globalAlpha = 1;
  ctx.restore();
}
function penTap(e) {
  const r = pen.c.getBoundingClientRect();
  const x = (e.clientX - r.left) / pen.z + pen.cx, y = (e.clientY - r.top) / pen.z + pen.cy;
  let best = null, bd = 1e9;
  pen.actors.forEach(a => { const d = Math.hypot(a.x - x, a.y - y); if (d < bd && !a.pin) { bd = d; best = a; } });
  const hit = hitActor(x, y);
  if (hit) { best = hit; bd = 0; }
  if (best && bd < petSize(best.pet) * 0.9 + 14) { buzz(); pen.parts.push({ x: best.x, y: best.y - 20, vx: 0, life: 0.8, ch: "❤️" }); openPet(best.pet.id); return; }
  if (best) { best.tx = x; best.ty = y; best.boost = 2; best.wait = 1.5; }
  pen.parts.push({ x, y, vx: 0, life: 0.7, ch: "✨" });
}