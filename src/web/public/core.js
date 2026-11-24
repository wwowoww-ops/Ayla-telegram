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
  if (document.hidden) return;
  frameTick++;
  const low = document.documentElement.classList.contains("lowfx");
  document.querySelectorAll(".fa[data-fid] img").forEach(im => {
    const f = FRAME_CACHE[im.parentNode.dataset.fid]; if (!f || f.uris.length < 2) return;
    const r = im.getBoundingClientRect(); if (r.bottom < 0 || r.top > innerHeight) return;      // خارج الشاشة: لا تحريك
    if (low && !im.closest("#top") && frameTick % 2) return;                                   // الأجهزة الضعيفة: نصف السرعة خارج الشريط العلوي
    im.src = f.uris[frameTick % f.uris.length];
  });
}, 160);

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
  const ac = typeof AbortController !== "undefined" ? new AbortController() : null, to = ac ? setTimeout(() => ac.abort(), 20000) : 0;   // لا نترك الطلب معلّقًا للأبد على الشبكة الضعيفة
  try {
    const r = await fetch("/api/act", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Init-Data": tg ? tg.initData : "" },
      body: JSON.stringify({ type, args: args || {} }),
      signal: ac ? ac.signal : undefined
    });
    clearTimeout(to);
    const j = await r.json();
    if (j.state) { S = j.state; stamp = Date.now(); }
    const notes = j.notes || [];
    notes.slice(0, 3).forEach(n => toast(n));
    if (notes.length > 3) toast("🏅 و " + (notes.length - 3) + " إنجازات أخرى");
    if (r.status === 401) fatal(j.msg);
    return j;
  } catch (e) {
    clearTimeout(to);
    return { ok: false, msg: e && e.name === "AbortError" ? "الشبكة بطيئة، أعد المحاولة." : "تعذر الاتصال. تحقق من الإنترنت." };
  }
}
// ينفذ أمرًا ويعرض رسالته ثم يحدّث الواجهة
async function run(type, args, after) {
  if (busy) { toast("⏳ لحظة، العملية السابقة لم تنتهِ بعد"); return null; }
  busy = true;
  let j;
  try { j = await act(type, args); } finally { busy = false; }
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
// ===== بيض برسم يدلّ على فئته (نفس ألوان نقوش المزرعة ثلاثية الأبعاد) =====
const EGG_ART = [
  { c: ["#fff6de", "#e3d2a8"], dot: "#9a7a4a" }, { c: ["#e8a15a", "#a8601e"], band: "#f7d3a0" }, { c: ["#f2f5f9", "#aab4c4"], band: "#ffffff", shine: 1 },
  { c: ["#ffe38a", "#e0a020"], band: "#fff6c0", shine: 1 }, { c: ["#a066f0", "#5a22b0"], crown: "#ffd24d" }, { c: ["#3a3a8a", "#12123a"], dot: "#ffffa8" },
  { c: ["#2a2438", "#07050c"], ring: "#b07aff" }, { c: ["#7a4ae0", "#2a1068"], dot: "#6af0ff", dot2: "#ff7ad8" }, { c: ["#fffbe0", "#ffe27a"], ring: "#ffffff", halo: 1 }
];
const _eggSvg = {};
function eggSvg(tier, px) {
  const t = Math.max(0, Math.min(EGG_ART.length - 1, tier | 0)), k = t + ":" + px;
  if (_eggSvg[k]) return _eggSvg[k];
  const L = EGG_ART[t], id = "eg" + t + "_" + px;
  const dots = L.dot ? [[40, 62, 3.2], [58, 50, 2.6], [66, 74, 3.4], [46, 82, 2.4], [52, 36, 2.2], [34, 46, 2.4]].map((d, i) => `<circle cx="${d[0]}" cy="${d[1]}" r="${d[2]}" fill="${i % 2 && L.dot2 ? L.dot2 : L.dot}"/>`).join("") : "";
  const s = `<svg xmlns="http://www.w3.org/2000/svg" width="${px}" height="${px}" viewBox="0 0 100 100"><defs><radialGradient id="${id}" cx=".35" cy=".3" r=".85"><stop offset="0" stop-color="${L.c[0]}"/><stop offset="1" stop-color="${L.c[1]}"/></radialGradient></defs>`
    + (L.halo ? `<circle cx="50" cy="55" r="44" fill="#fff6a8" opacity=".35"/>` : "")
    + `<ellipse cx="50" cy="92" rx="26" ry="5" fill="#000" opacity=".25"/><path d="M50 8C72 8 84 44 84 64c0 18-15 28-34 28S16 82 16 64C16 44 28 8 50 8Z" fill="url(#${id})" stroke="rgba(0,0,0,.45)" stroke-width="2.5"/>`
    + (L.band ? `<path d="M17 62Q50 76 83 62L84 70Q50 84 16 70Z" fill="${L.band}" opacity=".9"/>` : "") + dots
    + (L.ring ? `<ellipse cx="50" cy="60" rx="40" ry="9" fill="none" stroke="${L.ring}" stroke-width="3" transform="rotate(-14 50 60)"/>` : "")
    + (L.crown ? `<path d="M36 22l5 8 9-12 9 12 5-8 2 14H34Z" fill="${L.crown}" stroke="rgba(0,0,0,.4)" stroke-width="1.5"/>` : "")
    + (L.shine ? `<ellipse cx="36" cy="36" rx="7" ry="13" fill="#fff" opacity=".55" transform="rotate(20 36 36)"/>` : `<ellipse cx="37" cy="34" rx="5" ry="10" fill="#fff" opacity=".28" transform="rotate(20 37 34)"/>`)
    + `</svg>`;
  return (_eggSvg[k] = s);
}
const _eggImg = {};
function eggImage(tier, px) {          // لرسم الكانفس
  const k = tier + ":" + px; if (_eggImg[k]) return _eggImg[k];
  const im = new Image(); im.src = "data:image/svg+xml;utf8," + encodeURIComponent(eggSvg(tier, px)); return (_eggImg[k] = im);
}

// ===== أيقونات مرسومة للعناصر والموارد (تستبدل الإيموجي المقابلة تلقائيًا في كل الشاشات) =====
const IC_O = 'stroke="#1b1b2a" stroke-width="1.3" stroke-linejoin="round" stroke-linecap="round"';
const IC_SVG = {
  "🔥": `<linearGradient id="gf" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffd24d"/><stop offset="1" stop-color="#ff4a1f"/></linearGradient><path d="M12 2c1 4 6 6 6 12a6 6 0 0 1-12 0c0-3 2-4 3-7 1 1 1 2 2 3 1-2 1-5 1-8Z" fill="url(#gf)" ${IC_O}/><path d="M12 22a3.4 3.4 0 0 1-3.4-3.4c0-2 2-3 3.4-5 1.4 2 3.4 3 3.4 5A3.4 3.4 0 0 1 12 22Z" fill="#fff0a0"/>`,
  "💧": `<linearGradient id="gw" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#9fe6ff"/><stop offset="1" stop-color="#2f7ae0"/></linearGradient><path d="M12 2C9 8 5 11 5 15a7 7 0 0 0 14 0c0-4-4-7-7-13Z" fill="url(#gw)" ${IC_O}/><path d="M9 14.5a3.5 3.5 0 0 0 2.5 3.2" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" opacity=".8"/>`,
  "🌿": `<path d="M12 22V10" stroke="#2a6a2a" stroke-width="1.8" stroke-linecap="round"/><path d="M12 12C5 12 3 7 3 4c5 0 9 2 9 8Z" fill="#6ad05a" ${IC_O}/><path d="M12 15c6 0 9-4 9-8-6 0-9 3-9 8Z" fill="#3fa645" ${IC_O}/>`,
  "🪨": `<path d="M3 17l3-8 5-4 6 3 4 7-3 5H6Z" fill="#b08a5a" ${IC_O}/><path d="M6 9l5 3 6-4M11 12l-1 9M11 12l7 5" fill="none" stroke="#7a5a32" stroke-width="1.1"/><path d="M6 9l5-4 3 1-5 4Z" fill="#d8b88a"/>`,
  "⚡": `<path d="M13.5 2 5 13.5h6L9.5 22 19 9.5h-6.2Z" fill="#ffe14a" ${IC_O}/><path d="M12.4 5 8 12h4.4" fill="none" stroke="#fff8c0" stroke-width="1.4" stroke-linecap="round"/>`,
  "🔆": `<circle cx="12" cy="12" r="5" fill="#fff3a0" ${IC_O}/><g stroke="#f0b020" stroke-width="2.2" stroke-linecap="round"><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2"/></g><circle cx="10.5" cy="10.5" r="1.6" fill="#fff"/>`,
  "🌑": `<circle cx="12" cy="12" r="9.5" fill="#2a2342" ${IC_O}/><path d="M16 5a8 8 0 1 0 3 9 6.5 6.5 0 0 1-3-9Z" fill="#7a5ac0"/><circle cx="8" cy="9" r="1.2" fill="#fff" opacity=".8"/><circle cx="14" cy="17" r=".8" fill="#fff" opacity=".7"/>`,
  "❄️": `<g stroke="#e8fbff" stroke-width="2.4" stroke-linecap="round"><path d="M12 2v20M3.3 7l17.4 10M3.3 17 20.7 7"/><path d="M9.5 3.5 12 6l2.5-2.5M9.5 20.5 12 18l2.5 2.5"/></g><g stroke="#3a9ae0" stroke-width="1" stroke-linecap="round" opacity=".7"><path d="M12 2v20M3.3 7l17.4 10M3.3 17 20.7 7"/></g><circle cx="12" cy="12" r="2.2" fill="#9ae0ff" stroke="#1b1b2a" stroke-width="1"/>`,
  "🌪️": `<g fill="none" stroke-linecap="round" stroke-width="2.6"><path d="M3 7h13a3 3 0 1 0-3-3" stroke="#6ad0c0"/><path d="M3 12h16a3 3 0 1 1-3 3" stroke="#3a9aa0"/><path d="M3 17h9a2.6 2.6 0 1 1-2.6 2.6" stroke="#9af0e0"/></g>`,
  "☣️": `<linearGradient id="gp" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#d89aff"/><stop offset="1" stop-color="#6a2aa8"/></linearGradient><path d="M12 2C9 8 5 11 5 15a7 7 0 0 0 14 0c0-4-4-7-7-13Z" fill="url(#gp)" ${IC_O}/><circle cx="10" cy="15" r="1.8" fill="#c8ff6a"/><circle cx="14.2" cy="12.5" r="1.2" fill="#c8ff6a"/><circle cx="14" cy="17" r=".9" fill="#c8ff6a"/>`,
  "⚙️": `<path d="M12 2l2 2.6 3.2-.7.7 3.2 2.6 2-1.3 3 1.3 3-2.6 2-.7 3.2-3.2-.7L12 22l-2-2.6-3.2.7-.7-3.2-2.6-2 1.3-3-1.3-3 2.6-2 .7-3.2 3.2.7Z" fill="#aab4c4" ${IC_O}/><circle cx="12" cy="12" r="3.6" fill="#5a6678" ${IC_O}/><circle cx="12" cy="12" r="1.3" fill="#d8e0ec"/>`,
  "🔷": `<linearGradient id="gc" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#bff0ff"/><stop offset=".55" stop-color="#4aa8ff"/><stop offset="1" stop-color="#2a4ad0"/></linearGradient><path d="M12 2 20 9l-8 13L4 9Z" fill="url(#gc)" ${IC_O}/><path d="M4 9h16M12 2l-3 7 3 13 3-13-3-7" fill="none" stroke="#fff" stroke-width="1" opacity=".65"/><path d="M12 2 9 9h6Z" fill="#e8fbff" opacity=".9"/>`
};
const IC_RE = /(?<!\u200D)(?:🔥|💧|🌿|🪨|⚡|🔆|🌑|❄️?|🌪️?|☣️?|⚙️?|🔷)/g;
let _icN = 0;
function icHTML(ch) {
  const k = ch.replace(/️/g, ""), key = Object.keys(IC_SVG).find(x => x.replace(/️/g, "") === k);
  if (!key) return ch;
  const id = ++_icN, body = IC_SVG[key].replace(/id="(g[a-z])"/g, `id="$1${id}"`).replace(/url\(#(g[a-z])\)/g, `url(#$1${id})`);
  return `<svg class="ic" viewBox="0 0 24 24" aria-hidden="true">${body}</svg>`;
}
function icWalk(root) {
  if (!root || root.nodeType === 8) return;
  if (root.nodeType === 3) {
    const t = root.nodeValue; IC_RE.lastIndex = 0; if (!IC_RE.test(t)) return;
    const p = root.parentNode; if (!p || /^(SCRIPT|STYLE|TEXTAREA|INPUT|OPTION|TITLE|SVG)$/i.test(p.nodeName) || (p.closest && p.closest("svg,textarea,input,option"))) return;
    const sp = document.createElement("span"); sp.className = "icw"; sp.innerHTML = esc(t).replace(IC_RE, icHTML); p.replaceChild(sp, root); return;
  }
  if (root.nodeType !== 1 || /^(SCRIPT|STYLE|TEXTAREA|INPUT|SVG|CANVAS|SELECT)$/i.test(root.nodeName) || root.classList.contains("icw")) return;
  Array.from(root.childNodes).forEach(icWalk);
}
(function () {
  let q = new Set(), raf = 0;
  const flush = () => { raf = 0; const a = q; q = new Set(); a.forEach(n => { if (n.isConnected) icWalk(n); }); };
  const mo = new MutationObserver(ms => { ms.forEach(m => { if (m.type === "characterData") q.add(m.target); else m.addedNodes.forEach(n => q.add(n)); }); if (!raf) raf = requestAnimationFrame(flush); });
  const start = () => { icWalk(document.body); mo.observe(document.body, { childList: true, subtree: true, characterData: true }); };
  if (document.body) start(); else document.addEventListener("DOMContentLoaded", start);
})();
