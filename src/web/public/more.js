"use strict";
// ======================================================
// المزيد: تزاوج، مهام، إنجازات، ترتيب، ملفي، مخزن
// ======================================================
VIEWS.more = () => {
  if (sub) return SUBS[sub]();
  const tiles = [["tower", "🗼", "برج الأزل"], ["visit", "👥", "زيارة"], ["season", "🏆", "الموسم"], ["shop", "🛍️", "النوادر"], ["recycle", "♻️", "تدوير"], ["posts", "🧰", "وظائف"], ["breed", "🧬", "تزاوج"], ["quests", "🎯", "مهام"], ["ach", "🏅", "إنجازات"], ["top", "🏆", "الترتيب"], ["profile", "👤", "ملفي"], ["bag", "🎒", "المخزن"], ["elements", "🔮", "العناصر"], ["collection", "🐾", "حيواناتي"], ["guide", "📖", "كتاب المجموعة"], ["fairies", "🧚", "الجنيات"], ["market", "🏪", "السوق"], ["rates", "📊", "النسب"], ["boss", "👑", "الزعماء"], ["cos", "🎖️", "إطارات وألقاب"], ["exp", "🧭", "استكشاف"]];
  view.innerHTML = `<h2>☰ المزيد</h2><div class="grid3">${tiles.map(t => `<button class="tile" data-sub="${t[0]}"><span>${t[1]}</span>${t[2]}</button>`).join("")}</div>`;
  view.querySelectorAll("[data-sub]").forEach(b => b.onclick = () => { buzz(); sub = b.dataset.sub; SUBS[sub](); });
};
const back = `<button class="btn sec sm" id="back" style="margin-bottom:8px">↩️ رجوع</button>`;
const bindBack = () => { const b = $("#back"); if (b) b.onclick = () => { if (window.__fromWorld) { go("pen"); return; } sub = null; VIEWS.more(); }; };
const SUBS = {};

// ---- التزاوج ----
let breedA = null, breedB = null;
SUBS.breed = () => {
  const m = S.meta, t = Date.now() - stamp;
  const ok = S.pets.filter(p => (p.lv >= m.breedLv || p.st > 0) && p.cd.breed - t <= 0);
  if (breedA && !ok.find(p => p.id === breedA)) breedA = null;
  if (breedB && !ok.find(p => p.id === breedB)) breedB = null;
  const pick = (cur, key) => `<div class="scroll-x">${ok.length ? ok.map(p => `<button class="pick ${cur === p.id ? "on" : ""} ${key === "b" && p.id === breedA || key === "a" && p.id === breedB ? "off" : ""}" data-p="${key}:${p.id}"><span class="em">${p.emoji}</span>${esc(p.name)}<br>Lv.${p.lv} ${p.elEmoji}</button>`).join("") : `<span class="dim">لا حيوان مؤهل (المستوى ${m.breedLv}+ وراحة بعد كل مرة)</span>`}</div>`;
  let h = back + `<h2>🧬 التزاوج</h2><div class="dim">النتيجة بيضة بجودة أبويها، وفرصة طفرة 12% لندرة أعلى. 🧬 اختر أبوين بعنصرين مختلفين: فرصة 10% لعنصر ثانٍ.</div><h3 class="dim">الأول</h3>${pick(breedA, "a")}<h3 class="dim">الثاني</h3>${pick(breedB, "b")}`;
  if (breedA && breedB) {
    const a = S.pets.find(p => p.id === breedA), b = S.pets.find(p => p.id === breedB);
    const cost = m.eggs[Math.min(6, Math.max(a.rar, b.rar))].price * 2;
    h += `<div class="card" style="margin-top:10px"><div class="row" style="justify-content:center;font-size:44px">${a.emoji} ✖️ ${b.emoji}</div><div class="dim" style="text-align:center">التكلفة: <b style="color:var(--gold)">${fmt(cost)}</b> 🪙</div></div><button class="btn ${S.player.coins < cost ? "off" : ""}" style="width:100%" id="goBreed">🧬 زاوج</button>` + ((S.nov || {}).stone > 0 && a.el !== b.el ? `<button class="btn sec" style="width:100%;margin-top:8px" id="goBreedS">🧿 زاوج بحجر الطفرة (${S.nov.stone})</button>` : "") + `<div class="dim" style="margin-top:6px">🧬 إن اختلف عنصرا الأبوين فقد تظهر طفرة بعنصرين أساسيين.</div>`;
  }
  view.innerHTML = h; bindBack();
  view.querySelectorAll("[data-p]").forEach(b => b.onclick = () => { if (b.classList.contains("off")) return; const [k, id] = b.dataset.p.split(":"); if (k === "a") breedA = Number(id); else breedB = Number(id); SUBS.breed(); });
  const gs = $("#goBreedS");
  if (gs) gs.onclick = async () => { buzz("medium"); const j = await run("breed", { a: breedA, b: breedB, stone: true }); if (j && j.ok) { breedA = breedB = null; sub = null; go("hatch"); } };
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
  const list = (title, rows, f) => `<h2>${title}</h2>` + rows.map((r, i) => `<div class="card row" data-pro="${esc(r.uid || "")}" style="cursor:pointer"><div>${med[i] || i + 1}</div><div class="grow">${nameTag(r.name, r.tg)}</div><b>${f(r.v)}</b><span class="dim">👤</span></div>`).join("");
  view.innerHTML = back + list("🏆 الأقوى", j.top.power, v => "⚔️ " + fmt(v)) + list("💎 الأغنى", j.top.rich, v => "🪙 " + fmt(v));
  bindBack();
  view.querySelectorAll("[data-pro]").forEach(b => b.onclick = () => { if (b.dataset.pro) { buzz(); SUBS.pro(b.dataset.pro, () => loadTop()); } });
}

// ---- بروفايل لاعب ----
function proAvatar(p, px) {
  const img = src => `<img alt="" src="${esc(src)}" style="width:100%;height:100%;object-fit:cover;border-radius:inherit">`;
  if (p.av && p.av.mode === "photo" && p.av.data) return img(p.av.data);
  if (p.av && p.av.mode === "tg" && p.av.url) return img(p.av.url);
  return p.top ? (speciesImg(p.top.sp) ? `<img alt="" src="/img/${p.top.sp}" style="width:100%;height:100%;object-fit:cover">` : `<span style="font-size:${px * 0.7}px;line-height:1">${p.top.emoji}</span>`) : "🐾";
}
SUBS.pro = async (uid, backFn) => {
  view.innerHTML = back + `<div class="dim">جارٍ التحميل…</div>`; bindBack();
  const j = await act("profileOf", { uid });
  if (!j || !j.ok) { if (j && j.msg) toast(j.msg, true); return; }
  const p = j.p, t = p.top;
  view.innerHTML = `<button class="btn sec sm" id="proBack" style="margin-bottom:8px">↩️ رجوع</button><div style="display:flex;justify-content:center;margin:6px 0" id="proAv">${p.tg && p.tg.fid ? framedHTML(proAvatar(p, 96), p.tg.fid, 150) : `<div style="width:130px;height:130px;border-radius:22px;border:4px solid #ffd166;box-shadow:0 0 14px #ffd16688,inset 0 0 0 2px rgba(0,0,0,.35);overflow:hidden;background:linear-gradient(135deg,#3b2f6b,#1b1740);display:flex;align-items:center;justify-content:center">${proAvatar(p, 120)}</div>`}</div><h2>${nameTag(p.name, p.tg)}</h2>
    <div class="card">📅 اليوم <b>${p.days}</b> في اللعبة · 🔥 مواظبة <b>${p.streak}</b> يوم<br>⚔️ القوة الكلية <b>${fmt(p.power)}</b><br>🐾 الحظيرة <b>${p.pets}/${p.slots}</b>${p.bestRar ? `<br>${p.bestRar.e} أندر ما يملك: <b>${esc(p.bestRar.n)}</b> ×${p.bestRar.count}` : ""}<br>📖 الكتاب <b>${p.dex.have}/${p.dex.total}</b></div>
    ${t ? `<div class="card row"><div style="font-size:44px">${t.emoji}</div><div class="grow">👑 أقوى حيوان<br><b>${esc(t.name)}</b> ${t.rarEmoji} Lv.${t.lv}${t.st ? " " + "⭐".repeat(Math.min(5, t.st)) : ""}<div class="dim">${t.elEmoji}${t.elb ? " " + t.elb : ""} · ⚔️ ${fmt(t.power)}</div></div></div>` : ""}
    <div class="card">🥚 البيض المفقوس <b>${fmt(p.hatched)}</b><br>🧬 التزاوج <b>${fmt(p.bred)}</b><br>🏹 الصيد <b>${fmt(p.hunts)}</b> (فوز ${fmt(p.wins)})<br>⚔️ المبارزات <b>${fmt(p.duels)}</b> (فوز ${fmt(p.duelWins)})<br>🧭 رحلات الاستكشاف <b>${fmt(p.exp)}</b> · 🛡️ غارات ناجحة <b>${fmt(p.raid)}</b><br>🗼 أعلى طابق في البرج <b>${p.tower}</b></div>
    ${j.self ? "" : `<button class="btn" id="proVisit" style="width:100%">🏡 زيارة حظيرته</button>`}`;
  try { frameFill($("#proAv")); } catch (e) { /* لا شيء */ }
  $("#proBack").onclick = () => { buzz(); if (backFn) backFn(); else { sub = ""; VIEWS.more(); } };
  const v = $("#proVisit"); if (v) v.onclick = () => { buzz(); farmOpen(uid); };
};

// ---- الملف والمخزن ----
SUBS.profile = () => {
  const p = S.player, s = p.stats, top = [...S.pets].sort((a, b) => b.power - a.power)[0];
  view.innerHTML = back + `<h2>👤 ${nameTag(p.name, S.cos)}</h2>
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

// ---- كتاب المجموعة (الدليل + جوائز الإكمال) ----
let guideR = 0;
SUBS.guide = async () => {
  const m = S.meta;
  const j = await act("dexView", {});
  if (!j || !j.ok) return;
  const got = new Map(j.list.map(x => [x.id, x.have])), grp = new Map(j.groups.map(g => [g.r, g]));
  const all = m.species;
  let h = back + `<h2>📖 كتاب المجموعة <span class="dim">${j.have}/${j.total}</span></h2>
    <div class="seg">${m.rarities.map((r, i) => `<button data-r="${i}" class="${i === guideR ? "on" : ""}">${r.e} ${esc(r.n)}${grp.get(i) && grp.get(i).have === grp.get(i).total ? (grp.get(i).claimed ? " ✅" : " 🎁") : ""}</button>`).join("")}</div>`;
  const g = grp.get(guideR), list = all.filter(s => s.r === guideR);
  if (g) h += `<div class="card"><div class="row"><b class="grow">${g.emoji} ${esc(g.name)} · ${g.have}/${g.total}</b>${g.claimed ? "✅ استُلمت" : g.have === g.total ? `<button class="btn sm" data-rc="${g.r}">🎁 استلم الجائزة</button>` : `<span class="dim" style="font-size:12px">الجائزة: 🔷×${g.rw.crystals} + بيضة</span>`}</div><div class="bar" style="margin-top:8px"><i style="width:${g.have / g.total * 100}%"></i></div></div>`;
  if (!list.length) h += `<div class="card dim">لا أنواع في هذه الندرة.</div>`;
  list.forEach(s => {
    const o = got.get(s.id);
    h += `<div class="card row" style="${o ? "" : "opacity:.55"}"><div style="font-size:38px">${o ? s.e : "❓"}</div><div class="grow"><b>${o ? esc(s.n) : "غير مكتشف"}</b> <span class="dim">#${s.id}</span><div class="dim">${o ? (s.els || []).map(k => m.elements[k].e + " " + m.elements[k].n).join(" · ") : "اجمعه لتكتشفه"}</div></div>${o ? "✅" : ""}</div>`;
  });
  view.innerHTML = h; bindBack();
  view.querySelectorAll("[data-r]").forEach(b => b.onclick = () => { guideR = Number(b.dataset.r); SUBS.guide(); });
  view.querySelectorAll("[data-rc]").forEach(b => b.onclick = () => run("dexClaim", { r: Number(b.dataset.rc) }, () => SUBS.guide()));
};
SUBS.book = () => SUBS.guide();