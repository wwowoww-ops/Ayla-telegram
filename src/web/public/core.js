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
    `<span class="chip">🐾 ${S.pets.length}/${p.slots}</span>` +
    `<button class="chip" id="hTop">🏆</button>`;
  $("#hTop").onclick = () => { buzz(); go("more", "top"); };
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
  if (tab === "pen" && pen) { penSync(); penBar(); penTabs(); }
  else { const y = view.scrollTop; stopPen(); VIEWS[tab](); view.scrollTop = y; }
  if (sheetPet != null) openPet(sheetPet);
  if (pensOpen) openPens();
}
function closeSheet() { $("#sheet").classList.add("hidden"); sheetPet = null; renaming = false; releasing = false; pensOpen = false; }
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