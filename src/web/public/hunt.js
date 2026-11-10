"use strict";
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