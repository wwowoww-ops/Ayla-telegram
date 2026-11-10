"use strict";
// ======================================================
// الحضانة والفقس: غرفة بأعشاش وبيض يتحرك
// ======================================================
let nur = null;
VIEWS.hatch = () => {
  view.innerHTML = `<canvas id="nur"></canvas><div class="row" style="margin-top:10px;gap:8px"><button class="btn sec grow" id="goShop">🛒 اشترِ بيضًا</button><button class="btn sec grow" id="goBreed">🧬 تزاوج</button></div>`;
  $("#goShop").onclick = () => { shopTab = "eggs"; go("shop"); };
  $("#goBreed").onclick = () => { go("more", "breed"); };
  startNur();
};

function startNur() {
  const c = $("#nur"), ctx = c.getContext("2d");
  nur = { c, ctx, t: 0, last: performance.now(), W: 0, H: 0, cells: [], parts: [] };
  nur.onResize = () => sizeNur();
  window.addEventListener("resize", nur.onResize);
  sizeNur();
  c.addEventListener("pointerup", nurTap);
  const loop = now => {
    if (!nur) return;
    const dt = Math.min(0.05, (now - nur.last) / 1000); nur.last = now; nur.t += dt;
    nur.parts = nur.parts.filter(p => (p.life -= dt) > 0); nur.parts.forEach(p => { p.y -= 30 * dt; });
    nurDraw(); nur.raf = requestAnimationFrame(loop);
  };
  nur.raf = requestAnimationFrame(loop);
}
function sizeNur() {
  const c = nur.c, dpr = Math.min(window.devicePixelRatio || 1, 2);
  const slots = S.player.hatchSlots, cols = 3, rows = Math.ceil(slots / cols);
  const w = c.parentElement.clientWidth - 24;
  const ch = Math.min(150, w / cols * 1.05);
  nur.W = w; nur.H = rows * ch + 16;
  c.style.width = w + "px"; c.style.height = nur.H + "px";
  c.width = Math.round(w * dpr); c.height = Math.round(nur.H * dpr);
  nur.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  nur.cells = [];
  for (let i = 0; i < slots; i++) {
    const col = i % cols, row = Math.floor(i / cols);
    nur.cells.push({ x: (col + 0.5) * w / cols, y: 8 + row * ch + ch / 2, cw: w / cols, ch });
  }
}
function nurDraw() {
  const { ctx, W, H, t } = nur, now = Date.now() - stamp;
  const bg = ctx.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, "#6b4a2b"); bg.addColorStop(1, "#4a3220");
  ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "rgba(0,0,0,.12)";
  for (let y = 0; y < H; y += 26) ctx.fillRect(0, y, W, 2);   // ألواح خشب
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  nur.cells.forEach((c, i) => {
    const egg = S.eggs[i];
    // العش
    ctx.fillStyle = "#c9a35a"; ctx.beginPath(); ctx.ellipse(c.x, c.y + 26, c.cw * 0.36, 20, 0, 0, 7); ctx.fill();
    ctx.strokeStyle = "#8a6a2f"; ctx.lineWidth = 2;
    for (let k = -3; k <= 3; k++) { ctx.beginPath(); ctx.moveTo(c.x + k * 12, c.y + 16); ctx.lineTo(c.x + k * 14, c.y + 40); ctx.stroke(); }
    if (!egg) {
      ctx.fillStyle = "rgba(255,255,255,.35)"; ctx.font = "bold 28px system-ui"; ctx.fillText("+", c.x, c.y);
      return;
    }
    const left = egg.readyIn - now, ready = left <= 0;
    const rot = ready ? Math.sin(t * 14 + i) * 0.22 : Math.sin(t * 2 + i) * 0.07;
    if (ready) {
      const g = ctx.createRadialGradient(c.x, c.y, 4, c.x, c.y, 60 + Math.sin(t * 5) * 6);
      g.addColorStop(0, "rgba(255,209,102,.8)"); g.addColorStop(1, "rgba(255,209,102,0)");
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(c.x, c.y, 66, 0, 7); ctx.fill();
    }
    ctx.save(); ctx.translate(c.x, c.y + 14); ctx.rotate(rot); ctx.font = "58px serif"; ctx.fillText(egg.emoji, 0, -10); ctx.restore();
    ctx.font = "bold 12px system-ui"; ctx.lineWidth = 3; ctx.strokeStyle = "rgba(0,0,0,.7)"; ctx.fillStyle = ready ? "#ffd166" : "#fff";
    const txt = ready ? "اضغط للفقس!" : dur(left);
    ctx.strokeText(txt, c.x, c.y + 52); ctx.fillText(txt, c.x, c.y + 52);
    if (egg.bred) { ctx.font = "14px serif"; ctx.fillText("🧬", c.x + 30, c.y - 24); }
    if (ready && Math.random() < 0.08) nur.parts.push({ x: c.x + (Math.random() - 0.5) * 50, y: c.y, life: 0.9, ch: "✨" });
  });
  nur.parts.forEach(p => { ctx.globalAlpha = Math.min(1, p.life * 2); ctx.font = "16px serif"; ctx.fillText(p.ch, p.x, p.y); });
  ctx.globalAlpha = 1;
}
async function nurTap(e) {
  const r = nur.c.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
  const i = nur.cells.findIndex(c => Math.abs(x - c.x) < c.cw / 2 && Math.abs(y - c.y) < c.ch / 2);
  if (i < 0) return;
  const egg = S.eggs[i];
  if (!egg) { shopTab = "eggs"; return go("shop"); }
  const left = egg.readyIn - (Date.now() - stamp);
  if (left > 0) { buzz(); return toast("⏳ تفقس بعد " + dur(left)); }
  buzz("medium");
  const j = await run("hatch", { id: egg.id });
  if (j && j.ok && j.reveal) reveal(j.reveal);
}


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