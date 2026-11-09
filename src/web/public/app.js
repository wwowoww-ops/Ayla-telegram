// واجهة لعبة الحيوان المصغّرة (تعمل داخل تيليجرام)
(function () {
"use strict";

// ---------- أدوات ----------
const tg = window.Telegram && window.Telegram.WebApp;
if (tg) { try { tg.ready(); tg.expand(); tg.setHeaderColor("#120e1f"); tg.setBackgroundColor("#120e1f"); } catch (e) {} }
const $ = s => document.querySelector(s);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const buzz = (k = "light") => { try { tg && tg.HapticFeedback.impactOccurred(k); } catch (e) {} };
const sleep = ms => new Promise(r => setTimeout(r, ms));

const SUF = [[1e15, "Qa"], [1e12, "T"], [1e9, "B"], [1e6, "M"], [1e3, "K"]];
function fmt(n) {
  n = Number(n) || 0;
  const a = Math.abs(n);
  if (a < 1e4) return Math.floor(n).toLocaleString("en-US");
  for (let i = 0; i < SUF.length; i++) {
    const v = SUF[i][0], s = SUF[i][1];
    if (a < v) continue;
    const val = Number((n / v).toPrecision(3));
    if (Math.abs(val) >= 1000 && i > 0) return Number((n / SUF[i - 1][0]).toPrecision(3)) + SUF[i - 1][1];
    return val + s;
  }
  return String(n);
}
function dur(ms) {
  const s = Math.ceil(ms / 1000);
  if (s < 60) return s + " ث";
  const m = Math.floor(s / 60);
  if (m < 60) return m + " د " + (s % 60) + " ث";
  const h = Math.floor(m / 60);
  return h + " س " + (m % 60) + " د";
}

const RAR_COLOR = ["#cbd5e1", "#4ade80", "#60a5fa", "#c084fc", "#fb923c", "#f87171", "#67e8f9"];
const EL_COLOR = { fire: "#ff6b35", water: "#38bdf8", plant: "#4ade80", earth: "#b08968", thunder: "#facc15", light: "#fff3b0", dark: "#8b5cf6" };
const MONSTERS = ["🧟", "🦇", "🦂", "⛄", "🌋", "🌩️", "💀", "👼", "👾", "👹"];

// صور الأنواع (اختيارية): /img/<رقم النوع>. إن لم توجد نستعمل الرمز التعبيري.
const imgs = {};
function speciesImg(sp) {
  if (!imgs[sp]) {
    const o = { ok: false, img: new Image() };
    o.img.onload = () => { o.ok = true; };
    o.img.src = "/img/" + sp;
    imgs[sp] = o;
  }
  return imgs[sp].ok ? imgs[sp].img : null;
}
function petFace(p, px) {
  return speciesImg(p.sp)
    ? `<img src="/img/${p.sp}" style="width:${px}px;height:${px}px;border-radius:50%;object-fit:cover">`
    : `<span style="font-size:${px * 0.85}px;line-height:1">${p.emoji}</span>`;
}

// ---------- الاتصال بالخادم ----------
let S = null, stamp = 0, busy = false;
async function act(type, args) {
  try {
    const r = await fetch("/api/act", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Init-Data": tg ? tg.initData : "" },
      body: JSON.stringify({ type, args: args || {} })
    });
    const j = await r.json();
    if (j.state) { S = j.state; stamp = Date.now(); }
    const notes = j.notes || [];
    notes.slice(0, 3).forEach(n => toast(n));
    if (notes.length > 3) toast("🏅 و " + (notes.length - 3) + " إنجازات أخرى");
    if (r.status === 401) fatal(j.msg);
    return j;
  } catch (e) {
    return { ok: false, msg: "تعذر الاتصال. تحقق من الإنترنت." };
  }
}
// ينفذ أمرًا ويعرض رسالته ثم يحدّث الواجهة
async function run(type, args, after) {
  if (busy) return null;
  busy = true;
  const j = await act(type, args);
  busy = false;
  if (j.msg) toast(j.msg, !j.ok);
  update();
  if (after) after(j);
  return j;
}
function toast(msg, err) {
  const d = document.createElement("div");
  d.className = "toast" + (err ? " err" : "");
  d.textContent = msg;
  $("#toasts").appendChild(d);
  setTimeout(() => d.remove(), 3000);
}
function fatal(msg) {
  const o = $("#overlay");
  o.classList.remove("hidden");
  o.innerHTML = `<div class="big">🔒</div><h2>${esc(msg || "حدث خطأ")}</h2>`;
}

// ---------- الهيكل ----------
const view = $("#view");
const TABS = [["pen", "🏡", "الحظيرة"], ["hatch", "🥚", "الحضانة"], ["hunt", "⚔️", "الصيد"], ["shop", "🛒", "المتجر"], ["more", "☰", "المزيد"]];
let tab = "pen", sub = null;
const VIEWS = {};

function renderTabs() {
  $("#tabs").innerHTML = TABS.map(t => `<button data-t="${t[0]}" class="${t[0] === tab ? "on" : ""}"><span>${t[1]}</span>${t[2]}</button>`).join("");
  document.querySelectorAll("#tabs button").forEach(b => b.onclick = () => { buzz(); go(b.dataset.t); });
}
function renderTop() {
  if (!S) return;
  const p = S.player;
  $("#top").innerHTML =
    `<span class="chip">🪙 <b>${fmt(p.coins)}</b></span>` +
    `<span class="chip">⚔️ ${fmt(p.power)}</span>` +
    `<span class="chip">💰 ${fmt(p.income)}/س</span>` +
    `<span class="chip">🐾 ${S.pets.length}/${p.slots}</span>`;
}
function go(t, s) {
  stopPen();
  tab = t; sub = s || null;
  renderTabs();
  view.scrollTop = 0;
  VIEWS[tab]();
}
// تحديث بعد أي أمر مع حفظ موضع التمرير
function update() {
  renderTop();
  if (tab === "pen" && pen) { penSync(); penBar(); }
  else { const y = view.scrollTop; stopPen(); VIEWS[tab](); view.scrollTop = y; }
  if (sheetPet != null) openPet(sheetPet);
}
function closeSheet() { $("#sheet").classList.add("hidden"); sheetPet = null; renaming = false; releasing = false; }
$("#sheet").addEventListener("pointerdown", e => { if (e.target.id === "sheet") closeSheet(); });

// عدّادات تنازلية: أي عنصر فيه data-ts (وقت الانتهاء المطلق)
setInterval(() => {
  const now = Date.now();
  let refresh = false;
  document.querySelectorAll("[data-ts]").forEach(el => {
    const left = Number(el.dataset.ts) - now;
    if (left <= 0) { if (el.dataset.done !== "1") { el.dataset.done = "1"; refresh = true; } el.textContent = "جاهز"; }
    else el.textContent = dur(left);
  });
  if (refresh && !busy && (tab === "hatch" || sheetPet != null)) { update(); }
}, 1000);
setInterval(async () => { if (!busy && !document.hidden && $("#overlay").classList.contains("hidden")) { await act("state"); update(); } }, 60000);
document.addEventListener("visibilitychange", async () => { if (!document.hidden && !busy) { await act("state"); update(); } });
const ts = ms => Date.now() + ms;   // وقت مطلق من مدة متبقية

// ======================================================
// الحظيرة: حيوانات تتجول على أرض من الكانفاس
// ======================================================
let pen = null;
function stopPen() { if (pen) { cancelAnimationFrame(pen.raf); window.removeEventListener("resize", pen.onResize); pen = null; } }

VIEWS.pen = () => {
  view.innerHTML = `
    <div class="pen-bar"><button class="btn" id="bCollect"></button><button class="btn sec" id="bDaily"></button><button class="btn sec" id="bFeed">🍖 أطعم</button></div>
    <canvas id="pen"></canvas>
    <div class="hint dim">اضغط على حيوان لفتح بطاقته، أو على الأرض ليركض نحوك</div>`;
  $("#bCollect").onclick = () => { buzz("medium"); run("collect"); };
  $("#bDaily").onclick = () => { buzz("medium"); run("daily"); };
  $("#bFeed").onclick = feedAll;
  startPen();
  penBar();
  if (!S.pets.length) { view.insertAdjacentHTML("beforeend", `<div class="card"><b>لا حيوانات بعد.</b><div class="dim">افقس بيضتك الأولى من تبويب الحضانة 🥚</div></div>`); }
};

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

function startPen() {
  const c = $("#pen");
  const ctx = c.getContext("2d");
  pen = { c, ctx, actors: new Map(), parts: [], t: 0, last: performance.now(), W: 0, H: 0, bg: null };
  pen.onResize = () => { sizePen(); };
  window.addEventListener("resize", pen.onResize);
  sizePen();
  penSync();
  c.addEventListener("pointerdown", penTap);
  const loop = now => {
    if (!pen) return;
    const dt = Math.min(0.05, (now - pen.last) / 1000);
    pen.last = now; pen.t += dt;
    penStep(dt); penDraw();
    pen.raf = requestAnimationFrame(loop);
  };
  pen.raf = requestAnimationFrame(loop);
}

function sizePen() {
  const c = pen.c, dpr = Math.min(window.devicePixelRatio || 1, 2);
  const r = c.getBoundingClientRect();
  pen.W = r.width; pen.H = r.height;
  c.width = Math.round(r.width * dpr); c.height = Math.round(r.height * dpr);
  pen.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  pen.bg = makeBackground(pen.W, pen.H, dpr);
  pen.actors.forEach(a => { a.x = Math.min(a.x, pen.W - 40); a.y = Math.min(a.y, pen.H - 40); });
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
  for (let x = 0; x < W; x += 44) g.fillRect(x, 0, 22, H);       // خطوط عشب
  // بركة
  const px = W * 0.82, py = H * 0.2;
  g.fillStyle = "#2c6fa8"; g.beginPath(); g.ellipse(px, py, W * 0.13, H * 0.07, 0, 0, 7); g.fill();
  g.strokeStyle = "rgba(255,255,255,.35)"; g.lineWidth = 2;
  g.beginPath(); g.ellipse(px, py, W * 0.09, H * 0.045, 0, 0, 7); g.stroke();
  // زينة
  const seed = n => { const x = Math.sin(n * 91.7) * 43758.5; return x - Math.floor(x); };
  g.textAlign = "center"; g.textBaseline = "middle";
  for (let i = 0; i < 16; i++) { g.font = "16px serif"; g.fillText(i % 3 ? "🌼" : "🌱", 30 + seed(i) * (W - 60), 60 + seed(i + 40) * (H - 90)); }
  [["🌳", 0.08, 0.14, 46], ["🌳", 0.93, 0.62, 42], ["🌲", 0.06, 0.82, 44], ["🪨", 0.55, 0.9, 26], ["🌳", 0.45, 0.08, 40]]
    .forEach(([e, x, y, s]) => { g.font = s + "px serif"; g.fillText(e, x * W, y * H); });
  // سياج
  g.strokeStyle = "#7a5230"; g.lineWidth = 6; g.strokeRect(5, 5, W - 10, H - 10);
  g.fillStyle = "#a0713f";
  for (let x = 5; x <= W - 5; x += 34) { g.fillRect(x - 3, 0, 6, 12); g.fillRect(x - 3, H - 12, 6, 12); }
  for (let y = 5; y <= H - 5; y += 34) { g.fillRect(0, y - 3, 12, 6); g.fillRect(W - 12, y - 3, 12, 6); }
  return o;
}

const petSize = p => 30 + p.rar * 4;
function penSync() {
  if (!pen) return;
  const ids = new Set(S.pets.map(p => p.id));
  pen.actors.forEach((a, id) => { if (!ids.has(id)) pen.actors.delete(id); });
  S.pets.forEach(p => {
    let a = pen.actors.get(p.id);
    if (!a) {
      a = { x: 40 + Math.random() * (pen.W - 80), y: 70 + Math.random() * (pen.H - 120), tx: 0, ty: 0, wait: Math.random() * 2, dir: 1, ph: Math.random() * 6.28, speed: 26 + Math.random() * 22, boost: 0 };
      a.tx = a.x; a.ty = a.y;
      pen.actors.set(p.id, a);
    }
    a.pet = p;
  });
}
function penStep(dt) {
  pen.actors.forEach(a => {
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
        a.ty = 76 + Math.random() * (pen.H - 120);
        a.wait = 0.8 + Math.random() * 3;
      }
    }
  });
  pen.parts = pen.parts.filter(p => (p.life -= dt) > 0);
  pen.parts.forEach(p => { p.y -= 34 * dt; p.x += p.vx * dt; });
}
function penDraw() {
  const { ctx, W, H } = pen;
  ctx.drawImage(pen.bg, 0, 0, W, H);
  const list = [...pen.actors.values()].sort((a, b) => a.y - b.y);
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  list.forEach(a => {
    const p = a.pet, size = petSize(p), bob = Math.sin(pen.t * (a.moving ? 9 : 2) + a.ph) * (a.moving ? 3 : 1.2);
    // ظل وهالة العنصر
    ctx.fillStyle = "rgba(0,0,0,.25)";
    ctx.beginPath(); ctx.ellipse(a.x, a.y + size * 0.45, size * 0.55, size * 0.18, 0, 0, 7); ctx.fill();
    const ec = EL_COLOR[p.el] || "#fff";
    const gr = ctx.createRadialGradient(a.x, a.y + size * 0.4, 2, a.x, a.y + size * 0.4, size * 0.9);
    gr.addColorStop(0, ec + "88"); gr.addColorStop(1, ec + "00");
    ctx.fillStyle = gr; ctx.beginPath(); ctx.ellipse(a.x, a.y + size * 0.4, size * 0.9, size * 0.35, 0, 0, 7); ctx.fill();
    // الحيوان
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
    // علامات
    ctx.font = "bold 11px system-ui";
    ctx.fillStyle = "#fff"; ctx.strokeStyle = "rgba(0,0,0,.7)"; ctx.lineWidth = 3;
    const label = "Lv." + p.lv + (p.st ? " " + "★".repeat(p.st) : "");
    ctx.strokeText(label, a.x, a.y + size * 0.75); ctx.fillText(label, a.x, a.y + size * 0.75);
    if (p.main) { ctx.font = "16px serif"; ctx.fillText("👑", a.x, a.y - size * 0.75 + bob); }
    if (p.hunger < 35) { ctx.font = "15px serif"; ctx.globalAlpha = 0.6 + 0.4 * Math.sin(pen.t * 6); ctx.fillText("🍖", a.x + size * 0.6, a.y - size * 0.5 + bob); ctx.globalAlpha = 1; }
  });
  pen.parts.forEach(p => { ctx.globalAlpha = Math.min(1, p.life * 2); ctx.font = "20px serif"; ctx.fillText(p.ch, p.x, p.y); });
  ctx.globalAlpha = 1;
}
function penTap(e) {
  const r = pen.c.getBoundingClientRect();
  const x = e.clientX - r.left, y = e.clientY - r.top;
  let best = null, bd = 1e9;
  pen.actors.forEach(a => { const d = Math.hypot(a.x - x, a.y - y); if (d < bd) { bd = d; best = a; } });
  if (best && bd < petSize(best.pet) * 0.9 + 12) { buzz(); pen.parts.push({ x: best.x, y: best.y - 20, vx: 0, life: 0.8, ch: "❤️" }); openPet(best.pet.id); return; }
  if (best) { best.tx = x; best.ty = y; best.boost = 2; best.wait = 1.5; }
  pen.parts.push({ x, y, vx: 0, life: 0.7, ch: "✨" });
}

// ======================================================
// بطاقة الحيوان
// ======================================================
let sheetPet = null;
let renaming = false, releasing = false;
function openPet(id) {
  const p = S.pets.find(x => x.id === id);
  if (!p) { closeSheet(); return; }
  sheetPet = id;
  const t = Date.now() - stamp;
  const cd = ms => Math.max(0, ms - t);
  const foods = S.items;
  const mk = (label, left, handler, cls) => {
    const l = cd(left);
    return `<button class="btn sec ${cls || ""} ${l ? "off" : ""}" data-a="${handler}">${label}${l ? ` <span class="dim" data-ts="${ts(l)}">${dur(l)}</span>` : ""}</button>`;
  };
  $("#sheet").innerHTML = `<div class="panel">
    <div class="row">
      <div class="glow" style="--c:${EL_COLOR[p.el]}">${petFace(p, 74)}</div>
      <div class="grow">
        <div style="font-size:19px;font-weight:800">${esc(p.name)} ${p.main ? "👑" : ""}</div>
        <div class="dim">${esc(p.species)} · النوع #${p.sp}</div>
        <div style="margin-top:4px"><span class="tag" style="color:${RAR_COLOR[p.rar]}">${p.rarEmoji} ${p.rarName}</span> <span class="tag">${p.elEmoji} ${p.elName}</span> <span class="tag">${p.grade}</span>${p.st ? ` <span class="tag">${"⭐".repeat(p.st)}</span>` : ""}</div>
      </div>
    </div>
    <div style="margin:12px 0 4px" class="dim">المستوى ${p.lv}/${S.meta.lvCap}${p.lv < S.meta.lvCap ? ` · الخبرة ${p.xp}/${p.xpNeed}` : ""}</div>
    <div class="bar"><i style="width:${p.lv >= S.meta.lvCap ? 100 : Math.min(100, p.xp / p.xpNeed * 100)}%"></i></div>
    <div style="margin:10px 0 4px" class="dim">الجوع ${p.hunger}%</div>
    <div class="bar hg"><i style="width:${p.hunger}%"></i></div>
    <div class="grid2" style="margin:12px 0"><div class="card" style="margin:0">⚔️ القوة<br><b>${fmt(p.power)}</b></div><div class="card" style="margin:0">💰 الدخل<br><b>${fmt(p.income)}/س</b></div></div>
    <div class="dim" style="margin-bottom:6px">إطعام</div>
    <div class="scroll-x">${foods.length ? foods.map(f => { const m = S.meta.foods.find(x => x.id === f.id); return `<button class="pick" data-feed="${f.id}"><span class="em">${m.emoji}</span>${esc(m.name)}<br>×${f.count}${m.el && m.el === p.el ? " ✨" : ""}</button>`; }).join("") : `<span class="dim">لا طعام. اشترِ من المتجر.</span>`}</div>
    <div class="grid2" style="margin-top:10px">
      ${mk("🏋️ تدريب", p.cd.train, "train")}
      ${mk("🎮 لعب", p.cd.play, "play")}
      ${p.main ? "" : `<button class="btn sec" data-a="main">📌 اجعله أساسيًا</button>`}
      ${p.starCost ? `<button class="btn" data-a="upgrade">⭐ ترقية ${fmt(p.starCost)}</button>` : ""}
      <button class="btn sec" data-a="rename">✏️ تسمية</button>
      <button class="btn bad" data-a="release">🗑️ تخلٍّ</button>
    </div>
    ${renaming ? `<div class="row" style="margin-top:10px"><input id="nm" maxlength="16" placeholder="الاسم الجديد" style="flex:1;padding:9px;border-radius:10px;border:1px solid var(--line);background:#0e0a18;color:#fff"><button class="btn sm" data-a="saveName">حفظ</button></div>` : ""}
    ${releasing ? `<div class="card" style="margin-top:10px;border-color:var(--bad)">هل أنت متأكد؟ لا يمكن التراجع.<div class="row" style="margin-top:8px"><button class="btn bad sm" data-a="confirmRelease">نعم، تخلَّ</button><button class="btn sec sm" data-a="cancel">إلغاء</button></div></div>` : ""}
  </div>`;
  $("#sheet").classList.remove("hidden");
  const panel = $("#sheet .panel");
  panel.querySelectorAll("[data-feed]").forEach(b => b.onclick = () => { buzz(); run("feed", { id, food: b.dataset.feed }); });
  panel.querySelectorAll("[data-a]").forEach(b => b.onclick = () => {
    if (b.classList.contains("off")) return;
    const a = b.dataset.a; buzz();
    if (a === "train" || a === "play" || a === "main" || a === "upgrade") run(a, { id });
    else if (a === "rename") { renaming = !renaming; openPet(id); }
    else if (a === "saveName") { const v = $("#nm").value; renaming = false; run("nick", { id, name: v }); }
    else if (a === "release") { releasing = true; openPet(id); }
    else if (a === "cancel") { releasing = false; openPet(id); }
    else if (a === "confirmRelease") { releasing = false; closeSheet(); run("release", { id }); }
  });
}

// ======================================================
// الحضانة والفقس
// ======================================================
VIEWS.hatch = () => {
  const p = S.player, t = Date.now() - stamp;
  let h = `<h2>🥚 الحضانة <span class="dim">${S.eggs.length}/${p.hatchSlots}</span></h2>`;
  if (!S.eggs.length) h += `<div class="card"><b>لا بيض الآن.</b><div class="dim">اشترِ بيضة من المتجر 🛒 أو زاوج حيوانين 🧬</div></div>`;
  h += `<div class="grid2">`;
  S.eggs.forEach(e => {
    const left = e.readyIn - t, ready = left <= 0;
    h += `<div class="card egg ${ready ? "ready" : ""}"><div class="e">${e.emoji}</div><div style="font-weight:700">${esc(e.name)}</div>` +
      `<div class="dim">${e.bred ? "من التزاوج · " : ""}${ready ? "جاهزة!" : `<span data-ts="${ts(left)}">${dur(left)}</span>`}</div>` +
      `<button class="btn sm ${ready ? "" : "off"}" style="margin-top:8px" data-h="${e.id}">${ready ? "🐣 افقس" : "⏳ انتظر"}</button></div>`;
  });
  h += `</div><button class="btn sec" style="width:100%" id="goShop">🛒 اشترِ بيضًا</button>`;
  view.innerHTML = h;
  view.querySelectorAll("[data-h]").forEach(b => b.onclick = async () => {
    if (b.classList.contains("off")) return;
    buzz("medium");
    const j = await run("hatch", { id: Number(b.dataset.h) });
    if (j && j.ok && j.reveal) reveal(j.reveal);
  });
  $("#goShop").onclick = () => { shopTab = "eggs"; go("shop"); };
};

// شاشة كشف الحيوان بعد الفقس
async function reveal(p) {
  const o = $("#overlay");
  o.classList.remove("hidden");
  o.innerHTML = `<div class="big" id="egg" style="animation:shake .5s infinite">🥚</div><div class="dim" style="margin-top:14px">تتشقق البيضة…</div>`;
  buzz("heavy");
  await sleep(1400);
  const col = RAR_COLOR[p.rar];
  o.innerHTML = `<div class="flash"><div class="big pop glow" style="--c:${col}">${petFace(p, 130)}</div></div>
    <h2 class="pop" style="margin-top:16px">${esc(p.species)}</h2>
    <div><span class="tag" style="color:${col}">${p.rarEmoji} ${p.rarName}</span> <span class="tag">${p.elEmoji} ${p.elName}</span> <span class="tag">جودة ${p.grade}</span></div>
    <div class="dim" style="margin:8px 0 18px">⚔️ ${fmt(p.power)} · 💰 ${fmt(p.income)}/س</div>
    <button class="btn" id="okRev">رائع! 🎉</button>`;
  buzz("heavy");
  $("#okRev").onclick = () => { o.classList.add("hidden"); o.innerHTML = ""; go("pen"); };
}

// ======================================================
// الصيد: خريطة مناطق ومعركة متحركة
// ======================================================
VIEWS.hunt = () => {
  const main = S.pets.find(p => p.main);
  const t = Date.now() - stamp;
  let h = `<h2>⚔️ مناطق الصيد</h2>`;
  if (!main) h += `<div class="card">لا يوجد حيوان أساسي. افقس حيوانًا أولًا.</div>`;
  else {
    const cd = main.cd.hunt - t;
    h += `<div class="card row"><div>${petFace(main, 44)}</div><div class="grow"><b>${esc(main.name)}</b> Lv.${main.lv}<div class="dim">⚔️ ${fmt(main.power)} · ${main.elEmoji} ${main.elName}</div></div>` +
      `<div class="dim">${cd > 0 ? `🏹 <span data-ts="${ts(cd)}">${dur(cd)}</span>` : "🏹 جاهز"}</div></div>`;
  }
  h += `<div class="map">`;
  S.meta.zones.forEach(z => {
    const ratio = main ? main.power / z.power : 0;
    const cls = ratio >= 1.2 ? "easy" : ratio >= 0.8 ? "mid" : "hard";
    h += `<div class="node ${cls}"><div class="card" data-z="${z.i}"><div class="mon">${MONSTERS[z.i]}</div><div class="grow"><b>${z.i + 1}. ${esc(z.name)}</b><div class="dim">قوة ${fmt(z.power)} · 🪙 ${fmt(z.coins)}</div>` +
      `<div>${z.els.slice(0, 4).map(e => S.meta.elements[e].e).join(" ")}</div></div><div>${ratio >= 1.2 ? "🟢" : ratio >= 0.8 ? "🟡" : "🔴"}</div></div></div>`;
  });
  h += `</div>`;
  view.innerHTML = h;
  view.querySelectorAll("[data-z]").forEach(c => c.onclick = () => { buzz(); startHunt(Number(c.dataset.z)); });
};

async function startHunt(zi) {
  if (!S.pets.find(p => p.main)) return toast("اختر حيوانًا أساسيًا أولًا", true);
  buzz("medium");
  const j = await run("hunt", { zone: zi });
  if (!j || !j.ok) return;
  battle(j.battle);
}

// المعركة: حيواننا على اليسار ووحش المنطقة على اليمين
async function battle(b) {
  const o = $("#overlay");
  o.classList.remove("hidden");
  const z = S.meta.zones[b.zone];
  o.innerHTML = `<h2>${esc(z.name)}</h2><canvas id="arena"></canvas><div id="blog" class="dim" style="margin:10px 0;min-height:22px"></div><div id="bres"></div>`;
  const c = $("#arena"), dpr = Math.min(window.devicePixelRatio || 1, 2), r = c.getBoundingClientRect();
  const W = r.width, H = r.height;
  c.width = W * dpr; c.height = H * dpr;
  const ctx = c.getContext("2d"); ctx.scale(dpr, dpr);
  const pet = b.pet, mon = MONSTERS[b.zone];
  const S0 = { px: W * 0.25, py: H * 0.62, mx: W * 0.75, my: H * 0.5, ph: 1, mh: 1, shake: 0, flash: 0, pdx: 0, mdx: 0, nums: [], t: 0 };
  const monCol = EL_COLOR[b.monEl];
  let running = true;
  const draw = () => {
    ctx.clearRect(0, 0, W, H);
    const sky = ctx.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, "#1d3b52"); sky.addColorStop(1, "#2f6a45");
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "rgba(0,0,0,.2)"; ctx.fillRect(0, H * 0.78, W, H * 0.22);
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    // وحش
    const mxx = S0.mx + S0.mdx + (S0.shake ? (Math.random() - 0.5) * 10 : 0);
    const g = ctx.createRadialGradient(mxx, S0.my + 30, 4, mxx, S0.my + 30, 70); g.addColorStop(0, monCol + "99"); g.addColorStop(1, monCol + "00");
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(mxx, S0.my + 30, 70, 0, 7); ctx.fill();
    ctx.font = "84px serif"; ctx.globalAlpha = S0.mh <= 0 ? 0.25 : 1; ctx.fillText(mon, mxx, S0.my + Math.sin(S0.t * 3) * 4); ctx.globalAlpha = 1;
    // حيواننا
    const pxx = S0.px + S0.pdx;
    ctx.font = "70px serif";
    if (speciesImg(pet.sp)) { ctx.save(); ctx.beginPath(); ctx.arc(pxx, S0.py, 42, 0, 7); ctx.clip(); ctx.drawImage(speciesImg(pet.sp), pxx - 42, S0.py - 42, 84, 84); ctx.restore(); }
    else { ctx.globalAlpha = S0.ph <= 0 ? 0.25 : 1; ctx.fillText(pet.emoji, pxx, S0.py + Math.sin(S0.t * 4) * 3); ctx.globalAlpha = 1; }
    // أشرطة الصحة
    const bar = (x, y, v, col) => { ctx.fillStyle = "#0008"; ctx.fillRect(x - 40, y, 80, 8); ctx.fillStyle = col; ctx.fillRect(x - 40, y, 80 * Math.max(0, v), 8); };
    bar(S0.px, S0.py - 62, S0.ph, "#4ade80"); bar(S0.mx, S0.my - 66, S0.mh, "#ef4444");
    // أرقام الضرر
    S0.nums.forEach(n => { ctx.globalAlpha = Math.max(0, n.life); ctx.font = "bold 24px system-ui"; ctx.fillStyle = n.col; ctx.strokeStyle = "#000"; ctx.lineWidth = 4; ctx.strokeText(n.txt, n.x, n.y); ctx.fillText(n.txt, n.x, n.y); });
    ctx.globalAlpha = 1;
    if (S0.flash > 0) { ctx.fillStyle = `rgba(255,255,255,${S0.flash})`; ctx.fillRect(0, 0, W, H); }
  };
  let last = performance.now();
  const frame = now => {
    if (!running) return;
    const dt = Math.min(0.05, (now - last) / 1000); last = now; S0.t += dt;
    S0.nums.forEach(n => { n.y -= 40 * dt; n.life -= dt * 1.2; }); S0.nums = S0.nums.filter(n => n.life > 0);
    S0.flash = Math.max(0, S0.flash - dt * 3); S0.shake = Math.max(0, S0.shake - dt * 4);
    draw(); requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
  const tween = (ms, fn) => new Promise(res => { const s = performance.now(); const st = n => { const k = Math.min(1, (n - s) / ms); fn(k); k < 1 ? requestAnimationFrame(st) : res(); }; requestAnimationFrame(st); });
  const hit = (x, y, txt, col) => { S0.nums.push({ x, y, txt, col, life: 1 }); S0.flash = 0.35; S0.shake = 1; buzz("heavy"); };
  const logEl = $("#blog");
  logEl.textContent = `ظهر وحش ${S.meta.elements[b.monEl].e} ${S.meta.elements[b.monEl].n}! ${b.eff > 1 ? "⬆️ عنصرك يتفوق!" : b.eff < 1 ? "⬇️ العنصر ضدك" : ""}`;
  await sleep(700);

  // ثلاث جولات: حيواننا يندفع ثم الوحش
  const total = 3;
  for (let i = 0; i < total; i++) {
    await tween(260, k => { S0.pdx = (S0.mx - S0.px - 60) * Math.sin(k * Math.PI / 2); });
    const lastRound = i === total - 1;
    const dmg = b.win ? (lastRound ? S0.mh : 1 / total + 0.05) : 0.12 + Math.random() * 0.1;
    S0.mh = b.win && lastRound ? 0 : Math.max(0.15, S0.mh - dmg);
    hit(S0.mx, S0.my - 30, "-" + fmt(Math.max(1, Math.round(b.mine / total))), "#fde047");
    await tween(240, k => { S0.pdx = (S0.mx - S0.px - 60) * (1 - k); });
    await sleep(200);
    await tween(260, k => { S0.mdx = -(S0.mx - S0.px - 60) * Math.sin(k * Math.PI / 2); });
    S0.ph = !b.win && lastRound ? 0 : Math.max(0.2, S0.ph - (b.win ? 0.1 : 0.3));
    hit(S0.px, S0.py - 30, "-" + fmt(Math.max(1, Math.round(b.monPower / total))), "#fca5a5");
    await tween(240, k => { S0.mdx = -(S0.mx - S0.px - 60) * (1 - k); });
    await sleep(250);
  }
  await sleep(400);
  running = false;
  logEl.innerHTML = b.win ? `<b style="color:var(--good)">🏆 انتصار!</b>` : `<b style="color:var(--bad)">💀 خسارة</b> — قوتك الفعلية ${fmt(b.mine)} مقابل ${fmt(b.monPower)}`;
  const res = [];
  if (b.win) res.push(`🪙 +${fmt(b.coins)}`);
  if (b.levels) res.push(`⬆️ ارتقى المستوى`);
  (b.drops || []).forEach(d => res.push("🎁 " + esc(d)));
  $("#bres").innerHTML = `<div class="card">${res.length ? res.join("<br>") : "حاول مجددًا بحيوان أقوى أو منطقة أسهل."}</div><button class="btn" id="okB">تمام</button>`;
  b.win ? buzz("medium") : 0;
  $("#okB").onclick = () => { o.classList.add("hidden"); o.innerHTML = ""; update(); };
}

// ======================================================
// المتجر
// ======================================================
let shopTab = "eggs";
VIEWS.shop = () => {
  const m = S.meta, coins = S.player.coins;
  const seg = [["eggs", "🥚 بيض"], ["food", "🍖 طعام"], ["fruit", "🍇 فواكه"], ["up", "🏠 توسعات"]];
  let h = `<h2>🛒 المتجر</h2><div class="seg">${seg.map(s => `<button data-s="${s[0]}" class="${s[0] === shopTab ? "on" : ""}">${s[1]}</button>`).join("")}</div>`;
  if (shopTab === "eggs") {
    m.eggs.forEach(e => {
      const tot = e.w.reduce((a, b) => a + b, 0);
      const chances = e.w.map((w, i) => w ? `<span class="tag" style="color:${RAR_COLOR[i]}">${m.rarities[i].e} ${Math.round(w / tot * 1000) / 10}%</span>` : "").join(" ");
      h += `<div class="card row"><div style="font-size:42px">${e.emoji}</div><div class="grow"><b>${esc(e.name)}</b><div class="dim">⏳ ${dur(e.min * 60000)}</div><div style="margin-top:4px">${chances}</div></div>` +
        `<button class="btn sm ${coins < e.price ? "off" : ""}" data-egg="${e.tier}">${fmt(e.price)} 🪙</button></div>`;
    });
  } else if (shopTab === "food" || shopTab === "fruit") {
    m.foods.filter(f => (shopTab === "fruit") === !!f.el).forEach(f => {
      const own = (S.items.find(i => i.id === f.id) || {}).count || 0;
      h += `<div class="card row"><div style="font-size:36px">${f.emoji}</div><div class="grow"><b>${esc(f.name)}</b> <span class="dim">(عندك ${own})</span>` +
        `<div class="dim">جوع +${f.hg}${f.xp && !f.el ? " · خبرة +" + Math.round(f.xp * 100) + "%" : ""}${f.el ? " · " + m.elements[f.el].e + " " + m.elements[f.el].n : ""}</div></div>` +
        `<div class="row" style="gap:5px">${[1, 5, 25].map(q => `<button class="btn sm sec ${coins < f.price * q ? "off" : ""}" data-food="${f.id}" data-q="${q}">×${q}<br><span class="dim">${fmt(f.price * q)}</span></button>`).join("")}</div></div>`;
    });
  } else {
    h += `<div class="card row"><div style="font-size:36px">🏠</div><div class="grow"><b>توسعة الحظيرة +3</b><div class="dim">${S.pets.length}/${S.player.slots}</div></div><button class="btn sm ${coins < m.slotPrice ? "off" : ""}" data-up="slots">${fmt(m.slotPrice)} 🪙</button></div>`;
    h += m.hatchPrice
      ? `<div class="card row"><div style="font-size:36px">🥚</div><div class="grow"><b>مكان حضانة +1</b><div class="dim">${S.eggs.length}/${S.player.hatchSlots}</div></div><button class="btn sm ${coins < m.hatchPrice ? "off" : ""}" data-up="hatch">${fmt(m.hatchPrice)} 🪙</button></div>`
      : `<div class="card dim">الحضانة وصلت أقصى حد.</div>`;
  }
  view.innerHTML = h;
  view.querySelectorAll("[data-s]").forEach(b => b.onclick = () => { shopTab = b.dataset.s; VIEWS.shop(); });
  view.querySelectorAll("[data-egg]").forEach(b => b.onclick = () => { buzz(); run("buyEgg", { tier: Number(b.dataset.egg) }); });
  view.querySelectorAll("[data-food]").forEach(b => b.onclick = () => { buzz(); run("buyFood", { id: b.dataset.food, qty: Number(b.dataset.q) }); });
  view.querySelectorAll("[data-up]").forEach(b => b.onclick = () => { buzz("medium"); run(b.dataset.up === "slots" ? "expandSlots" : "expandHatch"); });
};

// ======================================================
// المزيد: تزاوج، مهام، إنجازات، ترتيب، ملفي، مخزن
// ======================================================
VIEWS.more = () => {
  if (sub) return SUBS[sub]();
  const tiles = [["breed", "🧬", "تزاوج"], ["quests", "🎯", "مهام"], ["ach", "🏅", "إنجازات"], ["top", "🏆", "الترتيب"], ["profile", "👤", "ملفي"], ["bag", "🎒", "المخزن"]];
  view.innerHTML = `<h2>☰ المزيد</h2><div class="grid3">${tiles.map(t => `<button class="tile" data-sub="${t[0]}"><span>${t[1]}</span>${t[2]}</button>`).join("")}</div>`;
  view.querySelectorAll("[data-sub]").forEach(b => b.onclick = () => { buzz(); sub = b.dataset.sub; if (sub === "top") loadTop(); else SUBS[sub](); });
};
const back = `<button class="btn sec sm" id="back" style="margin-bottom:8px">↩️ رجوع</button>`;
const bindBack = () => { const b = $("#back"); if (b) b.onclick = () => { sub = null; VIEWS.more(); }; };
const SUBS = {};

// ---- التزاوج ----
let breedA = null, breedB = null;
SUBS.breed = () => {
  const m = S.meta, t = Date.now() - stamp;
  const ok = S.pets.filter(p => (p.lv >= m.breedLv || p.st > 0) && p.cd.breed - t <= 0);
  if (breedA && !ok.find(p => p.id === breedA)) breedA = null;
  if (breedB && !ok.find(p => p.id === breedB)) breedB = null;
  const pick = (cur, key) => `<div class="scroll-x">${ok.length ? ok.map(p => `<button class="pick ${cur === p.id ? "on" : ""} ${key === "b" && p.id === breedA || key === "a" && p.id === breedB ? "off" : ""}" data-p="${key}:${p.id}"><span class="em">${p.emoji}</span>${esc(p.name)}<br>Lv.${p.lv} ${p.elEmoji}</button>`).join("") : `<span class="dim">لا حيوان مؤهل (المستوى ${m.breedLv}+ وراحة بعد كل مرة)</span>`}</div>`;
  let h = back + `<h2>🧬 التزاوج</h2><div class="dim">النتيجة بيضة بجودة أبويها، وفرصة طفرة 12% لندرة أعلى.</div><h3 class="dim">الأول</h3>${pick(breedA, "a")}<h3 class="dim">الثاني</h3>${pick(breedB, "b")}`;
  if (breedA && breedB) {
    const a = S.pets.find(p => p.id === breedA), b = S.pets.find(p => p.id === breedB);
    const cost = m.eggs[Math.min(6, Math.max(a.rar, b.rar))].price * 2;
    h += `<div class="card" style="margin-top:10px"><div class="row" style="justify-content:center;font-size:44px">${a.emoji} ✖️ ${b.emoji}</div><div class="dim" style="text-align:center">التكلفة: <b style="color:var(--gold)">${fmt(cost)}</b> 🪙</div></div><button class="btn ${S.player.coins < cost ? "off" : ""}" style="width:100%" id="goBreed">🧬 زاوج</button>`;
  }
  view.innerHTML = h; bindBack();
  view.querySelectorAll("[data-p]").forEach(b => b.onclick = () => { if (b.classList.contains("off")) return; const [k, id] = b.dataset.p.split(":"); if (k === "a") breedA = Number(id); else breedB = Number(id); SUBS.breed(); });
  const g = $("#goBreed");
  if (g) g.onclick = async () => { buzz("medium"); const j = await run("breed", { a: breedA, b: breedB }); if (j && j.ok) { breedA = breedB = null; sub = null; go("hatch"); } };
};

// ---- المهام والإنجازات ----
SUBS.quests = () => {
  const q = S.quests;
  let h = back + `<h2>🎯 مهام اليوم</h2>`;
  if (!q) h += `<div class="card dim">المهام غير مفعّلة.</div>`;
  else {
    q.missions.forEach(m => { h += `<div class="card"><div class="row"><div class="grow">${m.done ? "✅" : "⬜"} ${esc(m.text)}</div><span class="dim">${m.cur}/${m.target}</span></div><div class="bar" style="margin-top:8px"><i style="width:${m.cur / m.target * 100}%"></i></div></div>`; });
    h += `<div class="dim">إكمال الكل يمنحك مكافأة إضافية ${q.bonus ? "✅" : ""}. المكافآت تُمنح تلقائيًا.</div>`;
  }
  view.innerHTML = h; bindBack();
};
SUBS.ach = () => {
  const q = S.quests;
  let h = back + `<h2>🏅 الإنجازات</h2>`;
  if (!q) h += `<div class="card dim">الإنجازات غير مفعّلة.</div>`;
  else q.achievements.forEach(a => {
    const full = a.done >= a.total;
    h += `<div class="card"><div class="row"><div class="grow">${full ? "✅" : "🔸"} <b>${esc(a.name)}</b></div><span class="dim">${a.done}/${a.total}</span></div>` +
      (full ? "" : `<div class="bar" style="margin:8px 0 2px"><i style="width:${Math.min(100, a.cur / a.next * 100)}%"></i></div><div class="dim">${a.label ? esc(a.label) : fmt(a.cur) + " / " + fmt(a.next)}</div>`) + `</div>`;
  });
  view.innerHTML = h; bindBack();
};

// ---- الترتيب ----
async function loadTop() {
  view.innerHTML = back + `<div class="dim">جارٍ التحميل…</div>`; bindBack();
  const j = await act("top");
  if (!j.ok) return;
  const med = ["🥇", "🥈", "🥉"];
  const list = (title, rows, f) => `<h2>${title}</h2>` + rows.map((r, i) => `<div class="card row"><div>${med[i] || i + 1}</div><div class="grow">${esc(r.name)}</div><b>${f(r.v)}</b></div>`).join("");
  view.innerHTML = back + list("🏆 الأقوى", j.top.power, v => "⚔️ " + fmt(v)) + list("💎 الأغنى", j.top.rich, v => "🪙 " + fmt(v));
  bindBack();
}

// ---- الملف والمخزن ----
SUBS.profile = () => {
  const p = S.player, s = p.stats, top = [...S.pets].sort((a, b) => b.power - a.power)[0];
  view.innerHTML = back + `<h2>👤 ${esc(p.name)}</h2>
    <div class="card">🪙 الرصيد <b>${fmt(p.coins)}</b><br>⚔️ القوة <b>${fmt(p.power)}</b><br>💰 الدخل <b>${fmt(p.income)}/س</b><br>🔥 المواظبة <b>${p.streak}</b> يوم</div>
    ${top ? `<div class="card row"><div>${petFace(top, 52)}</div><div class="grow">👑 أقوى حيوان<br><b>${esc(top.name)}</b> Lv.${top.lv} · ${fmt(top.power)}</div></div>` : ""}
    <div class="card">📈 الصيد ${fmt(s.hunts)} (فوز ${fmt(s.wins)})<br>المبارزات ${fmt(s.duels)} (فوز ${fmt(s.duelWins)})<br>البيض المفقوس ${fmt(s.hatched)}<br>التزاوج ${fmt(s.bred)}</div>`;
  bindBack();
};
SUBS.bag = () => {
  let h = back + `<h2>🎒 المخزن</h2>`;
  if (!S.items.length) h += `<div class="card dim">فارغ. اشترِ طعامًا من المتجر.</div>`;
  S.items.forEach(i => { const m = S.meta.foods.find(f => f.id === i.id); h += `<div class="card row"><div style="font-size:32px">${m.emoji}</div><div class="grow"><b>${esc(m.name)}</b><div class="dim">جوع +${m.hg}${m.xp && !m.el ? " · خبرة +" + Math.round(m.xp * 100) + "%" : ""}</div></div><b>×${i.count}</b></div>`; });
  view.innerHTML = h; bindBack();
};

// ======================================================
// البدء
// ======================================================
(async function boot() {
  const j = await act("state");
  if (!S) return fatal(j.msg || "تعذر تحميل اللعبة. افتحها من داخل تيليجرام.");
  renderTop();
  go("pen");
})();
})();