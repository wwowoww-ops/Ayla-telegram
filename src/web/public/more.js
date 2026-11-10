"use strict";
// ======================================================
// المزيد: تزاوج، مهام، إنجازات، ترتيب، ملفي، مخزن
// ======================================================
VIEWS.more = () => {
  if (sub) return SUBS[sub]();
  const tiles = [["breed", "🧬", "تزاوج"], ["quests", "🎯", "مهام"], ["ach", "🏅", "إنجازات"], ["top", "🏆", "الترتيب"], ["profile", "👤", "ملفي"], ["bag", "🎒", "المخزن"], ["elements", "🔮", "العناصر"], ["collection", "🐾", "حيواناتي"], ["guide", "📖", "الدليل"]];
  view.innerHTML = `<h2>☰ المزيد</h2><div class="grid3">${tiles.map(t => `<button class="tile" data-sub="${t[0]}"><span>${t[1]}</span>${t[2]}</button>`).join("")}</div>`;
  view.querySelectorAll("[data-sub]").forEach(b => b.onclick = () => { buzz(); sub = b.dataset.sub; SUBS[sub](); });
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

// ---- العناصر ----
SUBS.top = () => loadTop();
SUBS.elements = () => {
  const m = S.meta, E = m.elements, B = m.beats;
  const mine = {}; S.pets.forEach(p => mine[p.el] = (mine[p.el] || 0) + 1);
  const chain = ["fire", "plant", "earth", "thunder", "water", "fire"].map(k => `<span style="font-size:34px">${E[k].e}</span>`).join(`<span class="dim">➜</span>`);
  let h = back + `<h2>🔮 العناصر</h2>
    <div class="card" style="text-align:center"><div class="row" style="justify-content:center;gap:4px">${chain}</div>
    <div class="dim" style="margin-top:8px">كل عنصر يتفوق على الذي بعده (×1.5 قوة) ويضعف أمام الذي قبله (×0.75)</div></div>
    <div class="card" style="text-align:center"><span style="font-size:34px">${E.light.e}</span> <span class="dim">⇄</span> <span style="font-size:34px">${E.dark.e}</span><div class="dim">النور والظلام يتفوق كل منهما على الآخر</div></div>`;
  Object.keys(E).forEach(k => {
    const strong = B[k], weak = Object.keys(B).find(x => B[x] === k);
    h += `<div class="card row"><div style="font-size:36px">${E[k].e}</div><div class="grow"><b style="color:${EL_COLOR[k]}">${esc(E[k].n)}</b><div class="dim">يتفوق على ${E[strong].e} ${esc(E[strong].n)} · يضعف أمام ${E[weak].e} ${esc(E[weak].n)}</div></div><span class="tag">${mine[k] || 0} عندك</span></div>`;
  });
  h += `<div class="dim">نصيحة: انظر لعناصر وحوش كل منطقة في خريطة الصيد واختر حيوانك الأساسي المتفوق عليها.</div>`;
  view.innerHTML = h; bindBack();
};

// ---- حيواناتي (قائمة مع تصفية وترتيب) ----
let colEl = "all", colSort = "power";
SUBS.collection = () => {
  const E = S.meta.elements;
  const segs = [["all", "الكل"]].concat(Object.keys(E).map(k => [k, E[k].e]));
  const sorts = [["power", "الأقوى"], ["lv", "المستوى"], ["rar", "الندرة"], ["hunger", "الجائع"]];
  let list = S.pets.filter(p => colEl === "all" || p.el === colEl);
  list.sort((a, b) => colSort === "lv" ? b.lv - a.lv : colSort === "rar" ? b.rar - a.rar || b.power - a.power : colSort === "hunger" ? a.hunger - b.hunger : b.power - a.power);
  let h = back + `<h2>🐾 حيواناتي <span class="dim">${list.length}/${S.pets.length}</span></h2>
    <div class="seg">${segs.map(s => `<button data-el="${s[0]}" class="${s[0] === colEl ? "on" : ""}">${s[1]}</button>`).join("")}</div>
    <div class="seg">${sorts.map(s => `<button data-so="${s[0]}" class="${s[0] === colSort ? "on" : ""}">${s[1]}</button>`).join("")}</div>`;
  if (!list.length) h += `<div class="card dim">لا حيوانات هنا.</div>`;
  list.forEach(p => {
    h += `<div class="card row" data-pet="${p.id}"><div class="glow" style="--c:${EL_COLOR[p.el]}">${petFace(p, 46)}</div><div class="grow"><b>${esc(p.name)}</b> ${p.main ? "👑" : ""}<div class="dim">Lv.${p.lv}${p.st ? " " + "⭐".repeat(p.st) : ""} · ${p.rarEmoji} ${p.rarName} · ${p.elEmoji}</div>` +
      `<div class="bar hg" style="margin-top:5px;height:5px"><i style="width:${p.hunger}%"></i></div></div><div style="text-align:left"><b>⚔️ ${fmt(p.power)}</b><div class="dim">💰 ${fmt(p.income)}/س</div></div></div>`;
  });
  view.innerHTML = h; bindBack();
  view.querySelectorAll("[data-el]").forEach(b => b.onclick = () => { colEl = b.dataset.el; SUBS.collection(); });
  view.querySelectorAll("[data-so]").forEach(b => b.onclick = () => { colSort = b.dataset.so; SUBS.collection(); });
  view.querySelectorAll("[data-pet]").forEach(b => b.onclick = () => { buzz(); openPet(Number(b.dataset.pet)); });
};

// ---- الدليل: كل الأنواع حسب الندرة ----
let guideR = 0;
SUBS.guide = () => {
  const m = S.meta, owned = new Set(S.pets.map(p => p.sp));
  const all = m.species, have = all.filter(s => owned.has(s.id)).length;
  let h = back + `<h2>📖 الدليل <span class="dim">${have}/${all.length}</span></h2>
    <div class="seg">${m.rarities.map((r, i) => `<button data-r="${i}" class="${i === guideR ? "on" : ""}">${r.e} ${esc(r.n)}</button>`).join("")}</div>`;
  const list = all.filter(s => s.r === guideR);
  if (!list.length) h += `<div class="card dim">لا أنواع في هذه الندرة.</div>`;
  list.forEach(s => {
    const o = owned.has(s.id);
    h += `<div class="card row" style="${o ? "" : "opacity:.55"}"><div style="font-size:38px">${o ? s.e : "❓"}</div><div class="grow"><b>${o ? esc(s.n) : "غير مكتشف"}</b> <span class="dim">#${s.id}</span><div class="dim">${o ? (s.els || []).map(k => m.elements[k].e + " " + m.elements[k].n).join(" · ") : "اجمعه لتكتشفه"}</div></div>${o ? "✅" : ""}</div>`;
  });
  view.innerHTML = h; bindBack();
  view.querySelectorAll("[data-r]").forEach(b => b.onclick = () => { guideR = Number(b.dataset.r); SUBS.guide(); });
};