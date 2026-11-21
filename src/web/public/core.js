"use strict";

// ---------- أدوات ----------
const tg = window.Telegram && window.Telegram.WebApp;
if (tg) { try { tg.ready(); tg.expand(); tg.setHeaderColor("#120e1f"); tg.setBackgroundColor("#120e1f"); } catch (e) {} }
const $ = s => document.querySelector(s);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const buzz = (k = "light") => { try { tg && tg.HapticFeedback.impactOccurred(k); } catch (e) {} };
const sleep = ms => new Promise(r => setTimeout(r, ms));

const SUF = [[1e24, "Sp"], [1e21, "Sx"], [1e18, "Qi"], [1e15, "Qa"], [1e12, "T"], [1e9, "B"], [1e6, "M"], [1e3, "K"]];
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

const RAR_COLOR = ["#cbd5e1", "#4ade80", "#60a5fa", "#c084fc", "#fb923c", "#f87171", "#67e8f9", "#a78bfa", "#fde047"];
const EL_COLOR = { fire: "#ff6b35", water: "#38bdf8", plant: "#4ade80", earth: "#b08968", thunder: "#facc15", light: "#fff3b0", dark: "#8b5cf6", ice: "#a5f3fc", wind: "#86efac", poison: "#a3e635", metal: "#94a3b8" };
const MONSTERS = ["🧟", "🦇", "🦂", "⛄", "🌋", "🌩️", "💀", "👼", "👾", "👹", "🧊", "🌪️", "☄️", "👑"];

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

// اسم اللاعب مع لقبه وإطاره (tg من الخادم: t لقب، fe رمز الإطار، fid معرّفه)
function nameTag(name, tg) {
  const n = esc(name);
  if (!tg) return n;
  const fr = tg.fe ? "border:2px solid #ffd166;box-shadow:0 0 8px rgba(255,209,102,.5);border-radius:10px;padding:1px 8px;display:inline-block" : "";
  return `<span style="${fr}">${tg.fe ? tg.fe + " " : ""}${n}${tg.fe ? " " + tg.fe : ""}</span>` + (tg.t ? `<div class="dim" style="font-size:11px;margin-top:2px">${esc(tg.t)}</div>` : "");
}

// ---------- صورة الحساب: حيوان / صورة تيليجرام / من المعرض ----------
let AVPHOTO = null, avLoading = false;
const tgPhoto = () => { try { return (tg && tg.initDataUnsafe && tg.initDataUnsafe.user && tg.initDataUnsafe.user.photo_url) || ""; } catch (e) { return ""; } };
async function avatarLoad() {
  if (avLoading || AVPHOTO !== null || !S || S.avMode !== "photo") return;
  avLoading = true; const j = await act("avatarGet", {}); avLoading = false;
  if (j && j.ok && j.data) { AVPHOTO = j.data; renderTop(); }
}
// محتوى الصورة الدائرية حسب اختيار اللاعب
function avatarInner(px) {
  const img = src => `<img alt="" src="${src}" style="width:100%;height:100%;object-fit:cover;border-radius:inherit">`;
  const m = (S && S.avMode) || "pet", main = S && (S.pets.find(x => x.main) || S.pets[0]);
  if (m === "photo") { if (AVPHOTO) return img(AVPHOTO); avatarLoad(); }
  else if (m === "tg" && tgPhoto()) return img(tgPhoto());
  return main ? petFace(main, px) : "🐾";
}
// يختار صورة من المعرض ويصغّرها إلى 192×192 قبل الرفع
function pickPhoto() {
  return new Promise(res => {
    const inp = document.createElement("input"); inp.type = "file"; inp.accept = "image/*";
    inp.onchange = () => {
      const f = inp.files && inp.files[0]; if (!f) return res(null);
      const im = new Image(), url = URL.createObjectURL(f);
      im.onload = () => {
        const c = document.createElement("canvas"); c.width = c.height = 192; const g = c.getContext("2d"), s = Math.min(im.width, im.height);
        g.drawImage(im, (im.width - s) / 2, (im.height - s) / 2, s, s, 0, 0, 192, 192); URL.revokeObjectURL(url);
        let q = 0.85, d = c.toDataURL("image/jpeg", q); while (d.length > 70000 && q > 0.3) { q -= 0.15; d = c.toDataURL("image/jpeg", q); }
        res(d);
      };
      im.onerror = () => res(null); im.src = url;
    };
    inp.click();
  });
}

// ---------- الإطارات المتحركة (نظام البوت نفسه) ----------
const FRAME_CACHE = {};
const svgUri = s => "data:image/svg+xml;utf8," + encodeURIComponent(s);
async function loadFrame(id) {
  if (FRAME_CACHE[id]) return FRAME_CACHE[id];
  const j = await act("frameAnim", { id });
  if (!j || !j.ok) return null;
  return (FRAME_CACHE[id] = { uris: j.svg.map(svgUri), win: j.win, square: j.square });
}
// يضع الصورة داخل نافذة الإطار: win بإحداثيات 400×400
function framedHTML(inner, fid, size) {
  const f = fid ? FRAME_CACHE[fid] : null;
  if (!fid) return `<div class="fa" style="width:${size}px;height:${size}px"><div class="in" style="inset:0;border-radius:50%;border:2px solid #ffd166">${inner}</div></div>`;
  const w = f && f.win ? f.win : { x: 76, y: 94, w: 248, h: 248, r: 20 }, k = size / 400;
  return `<div class="fa" data-fid="${fid}" style="width:${size}px;height:${size}px"><div class="in" style="left:${w.x * k}px;top:${w.y * k}px;width:${w.w * k}px;height:${w.h * k}px;border-radius:${w.r * k}px">${inner}</div><img alt="" ${f ? `src="${f.uris[0]}"` : ""}></div>`;
}
async function frameFill(root) {
  const els = (root || document).querySelectorAll(".fa[data-fid]");
  for (const el of els) { const id = el.dataset.fid; if (!FRAME_CACHE[id]) { await loadFrame(id); } const f = FRAME_CACHE[id]; const im = el.querySelector("img"); if (f && im && !im.getAttribute("src")) im.src = f.uris[0]; }
}
let frameTick = 0;
setInterval(() => {
  frameTick++;
  document.querySelectorAll(".fa[data-fid] img").forEach(im => { const f = FRAME_CACHE[im.parentNode.dataset.fid]; if (f && f.uris.length > 1) im.src = f.uris[frameTick % f.uris.length]; });
}, 140);

// ---------- صوت وجزيئات (إحساس اللعبة) ----------
let AC = null;
const sndOn = () => { try { return localStorage.getItem("ayla_snd") !== "0"; } catch (e) { return true; } };
function sfx(kind) {
  if (!sndOn()) return;
  try {
    AC = AC || new (window.AudioContext || window.webkitAudioContext)();
    if (AC.state === "suspended") AC.resume();
    const t0 = AC.currentTime, seq = { tap: [[520, .05]], ok: [[660, .07], [880, .09]], err: [[200, .12]], big: [[523, .07], [659, .07], [784, .07], [1046, .14]] }[kind] || [];
    let t = t0;
    seq.forEach(([f, d]) => { const o = AC.createOscillator(), g = AC.createGain(); o.type = kind === "err" ? "sawtooth" : "triangle"; o.frequency.value = f; g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(.12, t + .01); g.gain.exponentialRampToValueAtTime(.0001, t + d); o.connect(g); g.connect(AC.destination); o.start(t); o.stop(t + d + .02); t += d; });
  } catch (e) { /* لا شيء */ }
}
function sparkle(x, y, n, ems) {
  const E = ems || ["✨", "⭐", "💫"];
  for (let i = 0; i < n; i++) {
    const d = document.createElement("div"); d.className = "spk"; d.textContent = E[i % E.length];
    const a = Math.random() * 6.28, r = 26 + Math.random() * 34;
    d.style.cssText = `left:${x - 8}px;top:${y - 8}px;--dx:${Math.cos(a) * r}px;--dy:${Math.sin(a) * r - 12}px;--rot:${(Math.random() - .5) * 120}deg`;
    document.body.appendChild(d); setTimeout(() => d.remove(), 700);
  }
}
function floatGain(text, x, y) {
  const d = document.createElement("div"); d.className = "gain"; d.textContent = text;
  d.style.left = (x == null ? innerWidth / 2 - 40 : x - 30) + "px"; d.style.top = (y == null ? innerHeight * 0.35 : y - 20) + "px";
  document.body.appendChild(d); setTimeout(() => d.remove(), 1150);
}
let lastTap = [innerWidth / 2, innerHeight / 2];
document.addEventListener("pointerdown", e => {
  lastTap = [e.clientX, e.clientY];
  const b = e.target.closest && e.target.closest("button, .tile, .pick");
  if (b && !b.classList.contains("off") && !b.disabled) { sfx("tap"); if (b.classList.contains("btn") || b.classList.contains("tile")) sparkle(e.clientX, e.clientY, 4); }
}, true);

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
  if (j.ok && type === "collect") { floatGain((j.msg.match(/[\d.,]+\s?[A-Za-z]*\s?🪙|🪙\s?[\d.,]+\s?[A-Za-z]*/) || ["+🪙"])[0], lastTap[0], lastTap[1]); sfx("big"); sparkle(lastTap[0], lastTap[1], 10, ["🪙", "✨"]); }
  update();
  if (after) after(j);
  return j;
}
function toast(msg, err) {
  const d = document.createElement("div");
  d.className = "toast" + (err ? " err" : "");
  d.textContent = msg; sfx(err ? "err" : "ok");
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
  const p = S.player, main = S.pets.find(x => x.main) || S.pets[0], fid = (S.cos && S.cos.fid) || "";
  const face = avatarInner(44);
  $("#top").innerHTML = `<div class="hud">
    <div class="hud-av" id="hAv">${framedHTML(face, fid, 58).replace('class="fa"', 'class="fa hud-fa"')}</div>
    <div class="hud-mid">
      <div class="hud-name">${esc(p.name || "لاعب")}${S.cos && S.cos.t ? `<small>${esc(S.cos.t)}</small>` : ""}</div>
      <div class="pills">
        <span class="pill gold"><i>🪙</i><b>${fmt(p.coins)}</b></span>
        <span class="pill pw"><i>⚔️</i>${fmt(p.power)}</span>
        <span class="pill inc"><i>💰</i>${fmt(p.income)}/س</span>
        <span class="pill pt"><i>🐾</i>${S.pets.length}/${p.slots}</span>
        <span class="pill cr"><i>🔷</i>${fmt((S.res || {}).crystal || 0)}</span>
      </div>
    </div>
    <button class="hbtn" id="hSnd" title="الصوت">${sndOn() ? "🔊" : "🔇"}</button>
    <button class="hbtn" id="hTop" title="الترتيب">🏆</button></div>`;
  $("#hTop").onclick = () => { buzz(); go("more", "top"); };
  $("#hSnd").onclick = () => { try { localStorage.setItem("ayla_snd", sndOn() ? "0" : "1"); } catch (e) { /* لا شيء */ } renderTop(); sfx("ok"); };
  $("#hAv").onclick = () => { buzz(); go("more", "cos"); };
  frameFill($("#top"));
}
function go(t, s) {
  window.__fromWorld = false;     // يُضبط من جديد عند الدخول إلى قسم من العالم (farm3d.js)
  stopPen();
  tab = t; sub = s || null;
  renderTabs();
  view.scrollTop = 0;
  VIEWS[tab]();
}
// تحديث بعد أي أمر مع حفظ موضع التمرير
function update() {
  renderTop();
  if (tab === "pen" && pen) { penSync(); penBar(); penTabs(); }
  else { const y = view.scrollTop; stopPen(); VIEWS[tab](); view.scrollTop = y; }
  if (sheetPet != null) openPet(sheetPet);
  if (pensOpen) openPens();
  if (bowlsOpen) openBowls();
}
function closeSheet() { $("#sheet").classList.add("hidden"); sheetPet = null; renaming = false; releasing = false; pensOpen = false; bowlsOpen = false; }
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