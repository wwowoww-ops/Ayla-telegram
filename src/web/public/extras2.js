"use strict";
// ======================================================
// الموسم الأسبوعي، متجر النوادر، تدوير الحيوانات (تُفتح من «المزيد»)
// ======================================================
const MEDALS = ["🥇", "🥈", "🥉"];
const askOk = m => new Promise(r => { try { if (tg && tg.showConfirm) return tg.showConfirm(m, r); } catch (e) {} r(confirm(m)); });
const prizeLine = p => [p.crystal ? p.crystal + "🔷" : "", p.dust ? p.dust + "✨" : "", p.ess ? p.ess + " جوهر" : "", p.egg || "", p.fairy ? "🧚 جنية" : ""].filter(Boolean).join(" + ");

// ---- الموسم الأسبوعي ----
SUBS.season = () => {
  const s = S.season, t = Date.now() - stamp, left = Math.max(0, s.leftMs - t);
  let h = back + `<h2>🏆 الموسم ${s.n}</h2><div class="card"><div class="dim">⏳ ينتهي بعد <b data-ts="${ts(left)}">${dur(left)}</b></div>` +
    `<div style="margin-top:6px">⭐ نقاطك: <b>${fmt(s.pts)}</b>${s.pos ? ` · المركز <b>${s.pos}</b> من ${s.total}` : " · لم تسجّل نقاطًا بعد"}</div></div>`;
  h += `<h3 class="dim">🔝 المتصدرون</h3><div class="card">` + (s.top.length ? s.top.map((r, i) => `<div class="row" style="justify-content:space-between"><span>${MEDALS[i] || i + 1 + "."} ${esc(r.name)}${String(r.id) === String(S.player.id) ? " 👈" : ""}</span><b>${fmt(r.pts)}</b></div>`).join("") : `<div class="dim">لا أحد بعد، كن الأول!</div>`) + `</div>`;
  h += `<h3 class="dim">🎁 الجوائز</h3><div class="card">` + s.prizes.map((p, i) => `<div style="margin-bottom:4px">${i < 3 ? MEDALS[i] : i === 3 ? "4–10" : "✔️ " + s.minPts + "+ نقطة"}: ${prizeLine(p)}</div>`).join("") + `</div>`;
  h += `<h3 class="dim">📊 كيف تُجمع النقاط؟</h3><div class="card dim">` + s.rules.map(r => `• ${esc(r.n)}: ${r.w}`).join("<br>") + `</div>`;
  if (s.old.length || s.won.length) {
    h += `<h3 class="dim">📜 المواسم السابقة</h3><div class="card">` + s.old.map(o => `<b>الموسم ${o.n}</b> <span class="dim">(${o.total} لاعب)</span><br>` + o.top.map((r, i) => `${MEDALS[i]} ${esc(r.name)} — ${fmt(r.pts)}`).join("<br>")).join("<hr>") +
      (s.won.length ? `<hr><b>🏅 سجلّك</b><br>` + s.won.map(w => `الموسم ${w.n}: المركز ${w.rank} (${fmt(w.pts)} نقطة)`).join("<br>") : "") + `</div>`;
  }
  view.innerHTML = h; bindBack();
};

// ---- متجر النوادر ----
SUBS.shop = () => {
  const cr = (S.res || {}).crystal || 0, items = S.meta.novItems;
  let h = back + `<h2>🛍️ متجر النوادر</h2><div class="dim">🔷 بلوراتك: <b>${fmt(cr)}</b> — تأتي من الزعيم والموسم الأسبوعي وتدوير الحيوانات.</div>`;
  h += items.map(it => `<div class="card"><div class="row" style="justify-content:space-between"><b>${it.e} ${esc(it.n)}</b><span class="dim">لديك ${S.nov[it.id] || 0}</span></div><div class="dim" style="margin:6px 0">${esc(it.d)}</div>` +
    `<button class="btn sm ${cr >= it.price ? "" : "off"}" data-nb="${it.id}">شراء ${it.price} 🔷</button>` +
    (it.id === "box" && S.nov.box > 0 ? ` <button class="btn sm sec" data-nopen="1">🎁 افتح صندوقًا</button>` : "") + `</div>`).join("");
  view.innerHTML = h; bindBack();
  view.querySelectorAll("[data-nb]").forEach(b => b.onclick = async () => { if (b.classList.contains("off")) return; buzz(); await run("nBuy", { id: b.dataset.nb, qty: 1 }); SUBS.shop(); });
  const o = view.querySelector("[data-nopen]");
  if (o) o.onclick = async () => { buzz("medium"); await run("nOpen", {}); SUBS.shop(); };
};

// ---- تدوير الحيوانات ----
let recSel = new Set();
SUBS.recycle = () => {
  const list = S.pets.filter(p => !p.main).sort((a, b) => a.power - b.power);
  recSel = new Set([...recSel].filter(id => list.some(p => p.id === id)));
  const sum = { c: 0, e: {} };
  recSel.forEach(id => { const p = S.pets.find(x => x.id === id); sum.c += p.rv.crystal; Object.entries(p.rv.ess).forEach(([k, n]) => { sum.e[k] = (sum.e[k] || 0) + n; }); });
  const resE = k => (S.meta.resources.find(r => r.id === k) || {}).emoji || "";
  let h = back + `<h2>♻️ تدوير الحيوانات</h2><div class="dim">حوّل الزائد إلى 🔷 بلورات وجواهر عناصرها. الحيوان الأساسي لا يُدوَّر، والمميّز (نجوم/نخبة) يظهر بتحذير.</div>`;
  h += `<div class="row" style="gap:6px;margin:10px 0;flex-wrap:wrap">` + [0, 1, 2, 3].map(r => {
    const n = list.filter(p => p.rar <= r && p.lv <= 25 && !p.prot).length;
    return `<button class="btn sm sec ${n ? "" : "off"}" data-rb="${r}">${S.meta.rarities[r].e} حتى ${esc(S.meta.rarities[r].n)} (${n})</button>`;
  }).join("") + `</div>`;
  h += list.length ? list.map(p => `<div class="card row" style="align-items:center"><div style="font-size:30px">${p.emoji}</div><div class="grow"><b>${esc(p.name)}</b> ${p.rarEmoji} <span class="dim">Lv.${p.lv}${p.st ? " " + "⭐".repeat(p.st) : ""} ${p.elEmoji}${p.elbEmoji || ""}${p.elite ? " 👑" : ""}</span>` +
    `<div class="dim" style="font-size:12px">↳ ${p.rv.crystal}🔷${Object.entries(p.rv.ess).map(([k, n]) => " + " + n + resE(k)).join("")}${p.prot ? " ⚠️ مميّز" : ""}</div></div>` +
    `<button class="btn sm ${recSel.has(p.id) ? "" : "sec"}" data-rs="${p.id}">${recSel.has(p.id) ? "✔️" : "اختر"}</button></div>`).join("") : `<div class="card dim">لا حيوانات للتدوير.</div>`;
  if (recSel.size) h += `<div class="card" style="position:sticky;bottom:8px"><div>سيُدوَّر <b>${recSel.size}</b>: ${sum.c}🔷${Object.entries(sum.e).map(([k, n]) => " + " + n + resE(k)).join("")}</div><button class="btn" style="width:100%;margin-top:6px" id="goRec">♻️ دوّر المختار</button></div>`;
  view.innerHTML = h; bindBack();
  view.querySelectorAll("[data-rs]").forEach(b => b.onclick = () => { const id = Number(b.dataset.rs); recSel.has(id) ? recSel.delete(id) : recSel.add(id); buzz(); SUBS.recycle(); });
  view.querySelectorAll("[data-rb]").forEach(b => b.onclick = async () => {
    if (b.classList.contains("off")) return;
    if (!(await askOk("تدوير كل الحيوانات المحدّدة؟ لا يمكن التراجع."))) return;
    buzz("medium"); await run("recycleBulk", { r: Number(b.dataset.rb) }); SUBS.recycle();
  });
  const g = $("#goRec");
  if (g) g.onclick = async () => {
    const hasProt = [...recSel].some(id => (S.pets.find(p => p.id === id) || {}).prot);
    if (!(await askOk(hasProt ? "بين المختار حيوان مميّز (نجوم/نخبة). متأكد من التدوير؟" : "تدوير " + recSel.size + " حيوان؟ لا يمكن التراجع."))) return;
    buzz("medium"); const ids = [...recSel]; const j = await run("recycle", { ids }); if (j && j.ok) recSel.clear(); SUBS.recycle();
  };
};
