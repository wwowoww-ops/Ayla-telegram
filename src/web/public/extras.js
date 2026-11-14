"use strict";
// ======================================================
// إضافات الميني أب: موارد، محفظة البيض، صقل وتطور، جنيات، سوق اللاعبين، نسب، عناصر، زعماء
// ======================================================
const resMeta = id => (S.meta.resources.find(r => r.id === id) || { name: id, emoji: "❔", price: 0 });
const resLine = o => Object.keys(o || {}).map(k => `${resMeta(k).emoji}×${fmt(o[k])}`).join(" ");
const elTag = k => (S.meta.elements[k] ? S.meta.elements[k].e + " " + S.meta.elements[k].n : k);

// ---------- شريط علوي: بلورات ----------
const _renderTop = renderTop;
renderTop = function () {
  _renderTop();
  if (!S) return;
  const t = $("#top"), b = $("#hTop");
  const c = document.createElement("span");
  c.className = "chip"; c.innerHTML = `🔷 <b>${fmt((S.res || {}).crystal || 0)}</b>`;
  t.insertBefore(c, b);
};

// ---------- الحضانة: محفظة البيض ----------
const _hatch = VIEWS.hatch;
VIEWS.hatch = () => {
  _hatch();
  const n = S.eggBag.length, free = S.player.hatchSlots - S.eggs.length;
  const ready = S.eggs.filter(e => e.readyIn - (Date.now() - stamp) <= 0).length;
  view.insertAdjacentHTML("beforeend",
    `<div class="row" style="margin-top:8px;gap:8px">
      <button class="btn sec grow ${ready ? "" : "off"}" id="hAll">🐣 فقس الكل${ready ? " (" + ready + ")" : ""}</button>
      <button class="btn sec grow ${n && free > 0 ? "" : "off"}" id="pAll">📥 ضع الكل</button>
    </div>
    <h3 class="dim" style="margin:14px 0 6px">🎒 محفظة البيض (${n})</h3>` +
    (n ? S.eggBag.map(e => `<div class="card row"><div style="font-size:34px">${e.emoji}</div><div class="grow"><b>${esc(e.name)}</b>${e.bred ? ` <span class="tag">🧬 تزاوج</span>` : ""}</div><button class="btn sm ${free > 0 ? "" : "off"}" data-pe="${e.id}">📥 ضع</button></div>`).join("")
      : `<div class="card dim">فارغة. ما تشتريه أو تحصل عليه يأتي هنا لتضعه بنفسك.</div>`));
  $("#hAll").onclick = async () => { if (!ready) return toast("لا بيض جاهز", true); buzz("medium"); const j = await run("hatchAll", {}); if (j && j.ok && j.reveals) revealMany(j.reveals); };
  $("#pAll").onclick = () => { if (n && free > 0) { buzz(); run("placeAll", {}); } else toast(n ? "الحضانة ممتلئة" : "المحفظة فارغة", true); };
  view.querySelectorAll("[data-pe]").forEach(b => b.onclick = () => { if (b.classList.contains("off")) return toast("الحضانة ممتلئة", true); buzz(); run("placeEgg", { id: Number(b.dataset.pe) }); });
};
function revealMany(list) {
  const o = $("#overlay");
  o.classList.remove("hidden");
  o.innerHTML = `<h2>🎉 فقست ${list.length} بيضة!</h2><div style="max-height:62vh;overflow-y:auto;width:100%">` +
    list.map(p => `<div class="card row"><div class="glow" style="--c:${RAR_COLOR[p.rar]}">${petFace(p, 50)}</div><div class="grow"><b>${esc(p.species)}</b><div class="dim">${p.rarEmoji} ${p.rarName} · ${p.elEmoji} ${p.elName} · جودة ${p.grade}</div></div><div class="dim">⚔️ ${fmt(p.power)}</div></div>`).join("") +
    `</div><button class="btn" id="okRev" style="margin-top:10px">رائع! 🎉</button>`;
  buzz("heavy");
  $("#okRev").onclick = () => { o.classList.add("hidden"); o.innerHTML = ""; go("pen"); };
}

// ---------- بطاقة الحيوان: بلورات، صقل، تطور ----------
function petExtras(p) {
  const cr = (S.res || {}).crystal || 0, c = p.polCost, M = S.meta;
  let h = `<div class="dim" style="margin:12px 0 6px">🔷 بلورات → خبرة (لديك ${fmt(cr)})</div><div class="row" style="gap:6px">` +
    [1, 5, 25].map(n => `<button class="btn sm sec ${cr >= n && p.lv < M.lvCap ? "" : "off"}" data-cx="${n}">×${n}</button>`).join("") + `</div>`;
  h += `<div class="dim" style="margin:12px 0 6px">🎖 الجودة ${p.grade} (${Number(p.q).toFixed(3)})${p.elite ? " 👑 نخبة" : ""} · الصقل ${p.pol}/${p.polMax}</div>`;
  const es = (S.res || {})["ess_" + p.el] || 0;
  h += `<button class="btn sec ${p.canPolish && cr >= c.crystal && es >= c.ess && S.player.coins >= c.coins ? "" : "off"}" data-polish="1" style="width:100%">💎 صقل: ${c.crystal}🔷 + ${c.ess}${resMeta("ess_" + p.el).emoji} + ${fmt(c.coins)}🪙</button>`;
  if (p.el2) h += `<div class="dim" style="margin-top:8px">🧿 العنصر الثانوي: ${p.el2Emoji} ${esc(p.el2Name)} (واحد فقط لكل حيوان)</div>`;
  else if (p.lv >= 20 || p.st > 0) {
    const e = p.evoCost;
    h += `<div class="dim" style="margin:10px 0 6px">🧬 تطور: عنصر ثانوي (${e.ess} جوهر + ${fmt(e.coins)}🪙) — مرة واحدة</div><div class="scroll-x">` +
      Object.keys(M.elements).filter(k => k !== p.el).map(k => `<button class="pick ${(S.res || {})["ess_" + k] >= e.ess && S.player.coins >= e.coins ? "" : "off"}" data-evo="${k}"><span class="em">${M.elements[k].e}</span>${esc(M.elements[k].n)}<br>×${(S.res || {})["ess_" + k] || 0}</button>`).join("") + `</div>`;
  } else h += `<div class="dim" style="margin-top:8px">🧬 التطور (عنصر ثانوي) من المستوى 20.</div>`;
  return h;
}
function petExtrasBind(panel, p, id) {
  panel.querySelectorAll("[data-cx]").forEach(b => b.onclick = () => { if (b.classList.contains("off")) return; buzz(); run("crystal", { id, n: Number(b.dataset.cx) }); });
  const pb = panel.querySelector("[data-polish]"); if (pb) pb.onclick = () => { if (pb.classList.contains("off")) return toast("الموارد أو الصقل غير كافٍ", true); buzz("medium"); run("polish", { id }); };
  panel.querySelectorAll("[data-evo]").forEach(b => b.onclick = () => { if (b.classList.contains("off")) return toast("جواهر أو عملات غير كافية", true); buzz("medium"); run("evolve", { id, el: b.dataset.evo }); });
}

// ---------- المخزن ----------
SUBS.bag = () => {
  let h = back + `<h2>🎒 المخزن</h2><h3 class="dim">🔷 الموارد</h3>`;
  const keys = Object.keys(S.res || {});
  h += keys.length ? keys.map(k => { const m = resMeta(k); return `<div class="card row"><div style="font-size:30px">${m.emoji}</div><div class="grow"><b>${esc(m.name)}</b><div class="dim">${esc(m.desc || "")}</div></div><b>×${fmt(S.res[k])}</b></div>`; }).join("")
    : `<div class="card dim">لا موارد. اصطد أو اشترِ من المتجر.</div>`;
  h += `<h3 class="dim">🍖 الطعام</h3>`;
  h += S.items.length ? S.items.map(i => { const m = S.meta.foods.find(f => f.id === i.id); return `<div class="card row"><div style="font-size:30px">${m.emoji}</div><div class="grow"><b>${esc(m.name)}</b><div class="dim">جوع +${m.hg}${m.xp ? " · خبرة +" + Math.round(m.xp * 100) + "%" : ""}</div></div><b>×${i.count}</b></div>`; }).join("")
    : `<div class="card dim">لا طعام.</div>`;
  h += `<div class="card">🎒 محفظة البيض: <b>${S.eggBag.length}</b> بيضة — تضعها من تبويب الحضانة.</div>`;
  view.innerHTML = h; bindBack();
};

// ---------- العناصر ----------
SUBS.elements = () => {
  const m = S.meta, E = m.elements, B = m.beatsAll;
  const beaten = k => Object.keys(B).filter(x => B[x].includes(k));
  const mine = {}; S.pets.forEach(p => mine[p.el] = (mine[p.el] || 0) + 1);
  let h = back + `<h2>🔮 العناصر (${Object.keys(E).length})</h2><div class="card dim">التفوق ×1.5 · الضعف ×0.7. لكل عنصر عدد مختلف من نقاط القوة والضعف. العنصر الثانوي يعطي نصف أثره ويُحتسب الأفضل بين العنصرين.</div>`;
  Object.keys(E).forEach(k => {
    h += `<div class="card"><div class="row"><div style="font-size:34px">${E[k].e}</div><div class="grow"><b style="color:${EL_COLOR[k] || "#fff"}">${esc(E[k].n)}</b>${mine[k] ? ` <span class="dim">(${mine[k]} حيوان)</span>` : ""}</div></div>` +
      `<div class="dim" style="margin-top:6px">⬆️ يتفوق على: ${B[k].map(x => E[x].e + " " + E[x].n).join(" · ")}</div>` +
      `<div class="dim">⬇️ يضعف أمام: ${beaten(k).map(x => E[x].e + " " + E[x].n).join(" · ") || "—"}</div></div>`;
  });
  view.innerHTML = h; bindBack();
};

// ---------- النسب ----------
SUBS.rates = () => {
  const m = S.meta;
  let h = back + `<h2>📊 النسب</h2><h3 class="dim">🥚 نسب الفقس</h3>`;
  m.eggs.forEach(e => {
    const tot = e.w.reduce((a, b) => a + b, 0);
    h += `<div class="card"><b>${e.emoji} ${esc(e.name)}</b><div style="margin-top:4px">` + e.w.map((w, i) => w ? `<span class="tag" style="color:${RAR_COLOR[i]}">${m.rarities[i].e} ${Math.round(w / tot * 1000) / 10}%</span>` : "").join(" ") + `</div></div>`;
  });
  h += `<h3 class="dim">⚔️ غنائم الصيد (عند الفوز)</h3><div class="card dim">🪙 عملات: دائمًا<br>🥚 بيضة المنطقة (في المحفظة): 8%<br>🔷 بلورات: 75%<br>💠 جوهرة عنصر الوحش: 40%<br>✨ غبار الجنيات: 3% + 0.5% لكل مرحلة (من المرحلة 4)<br>🌟 مهارة الحيوان: 30% + 4% لكل ندرة (مضاعف ×1.25 / ×1.5 / ×2)<br>👑 وحوش النخبة من المرحلة 9</div>`;
  h += `<h3 class="dim">🧬 التزاوج</h3><div class="card dim">طفرة لندرة أعلى: 12% (20% إذا كان الأبوان نخبة) · الجودة أقوى من الفقس العادي وتزيد مع الجيل.</div>`;
  h += `<h3 class="dim">🧚 الجنيات</h3><div class="card dim" style="line-height:1.7">${m.fairyRates.replace(/\n/g, "<br>")}</div>`;
  view.innerHTML = h; bindBack();
};

// ---------- الجنيات ----------
let fyTab = "eq", fyEdit = null;
SUBS.fairies = () => {
  const m = S.meta, list = S.fairies, now = Date.now() - stamp;
  const seg = [["eq", "✅ المجهزة"], ["all", "🧚 جنياتي"], ["shop", "🛒 المتجر"]];
  let h = back + `<h2>🧚 الجنيات <span class="dim">${list.length}/${m.fairyOwnCap}</span></h2><div class="seg">${seg.map(s => `<button data-ft="${s[0]}" class="${s[0] === fyTab ? "on" : ""}">${s[1]}</button>`).join("")}</div>`;
  const card = f => {
    const hab = f.hab ? m.habitats.find(x => x.id === f.hab) : null;
    let c = `<div class="card"><div class="row"><div style="font-size:38px">${f.emoji}</div><div class="grow"><b>${esc(f.name)}</b> ${f.rankEmoji}<div class="dim">Lv.${f.lv}/${m.fairyMaxLv} · ${esc(m.fairyFam[f.fam] || "")}${hab ? " · " + hab.e + " " + esc(hab.n) : ""}</div></div>` +
      `<button class="btn sm sec" data-fe="${f.id}">${fyEdit && fyEdit.id === f.id ? "▲" : "⚙️"}</button></div><div class="dim" style="margin-top:6px">${esc(f.buff)}</div>`;
    if (hab && f.nextMs > 0) c += `<div class="dim">⏳ للمستوى التالي: ${dur(f.nextMs)}</div>`;
    if (fyEdit && fyEdit.id === f.id) {
      c += `<div class="grid2" style="margin-top:8px"><button class="btn sec" data-fa="toggle:${f.id}">${f.equipped ? "⏏️ إزالة" : "✅ تجهيز"}</button><button class="btn sec" data-fa="dust:${f.id}">✨ غبار (${(S.res || {}).dust || 0})</button>` +
        `<button class="btn sec" data-fa="name:${f.id}">✏️ تسمية</button><button class="btn sec" data-fa="hab:${f.id}">🌿 بيئة</button><button class="btn bad" data-fa="rel:${f.id}">🕊️ إطلاق</button></div>`;
      if (fyEdit.mode === "name") c += `<div class="row" style="margin-top:8px"><input id="fnm" maxlength="16" placeholder="الاسم (فارغ = إزالة)" style="flex:1"><button class="btn sm" data-fa="savename:${f.id}">حفظ</button></div>`;
      if (fyEdit.mode === "hab") c += `<div class="scroll-x" style="margin-top:8px">${m.habitats.map(x => `<button class="pick ${f.hab === x.id ? "on" : ""}" data-fa="sethab:${f.id}:${x.id}"><span class="em">${x.e}</span>${esc(x.n)}</button>`).join("")}${f.hab ? `<button class="pick" data-fa="unhab:${f.id}"><span class="em">⏏️</span>نزع</button>` : ""}</div><div class="dim">جنية واحدة فقط في البيئات، تتلفل بلا وقت محدد. البيئة المناسبة لعائلتها ×1.5.</div>`;
      if (fyEdit.mode === "rel") c += `<div class="card" style="margin-top:8px;border-color:var(--bad)">إطلاقها نهائي. متأكد؟<div class="row" style="margin-top:8px"><button class="btn bad sm" data-fa="confirmrel:${f.id}">نعم أطلقها</button><button class="btn sec sm" data-fa="cancel:${f.id}">تراجع</button></div></div>`;
    }
    return c + `</div>`;
  };
  if (fyTab === "eq") {
    const eq = list.filter(f => f.equipped);
    h += `<div class="card dim">الخانات: ${eq.length}/${S.fslots}. تعمل البفات وهي مجهزة فقط.` + (S.fslotPrice ? ` <button class="btn sm" data-fa="slot">➕ خانة ${fmt(S.fslotPrice)}🪙</button>` : "") + `</div>`;
    h += eq.length ? eq.map(card).join("") : `<div class="card dim">لا جنية مجهزة. افتح "جنياتي" وجهّز واحدة.</div>`;
    const bm = S.bossMods || {};
    if (Object.values(bm).some(v => v)) h += `<div class="card dim">👑 بفات البوس: ${bm.atk ? "ضرر +" + Math.round(bm.atk * 100) + "% " : ""}${bm.heal ? "علاج +" + Math.round(bm.heal * 100) + "% " : ""}${bm.hp ? "حياة +" + Math.round(bm.hp * 100) + "% " : ""}${bm.dr ? "درع " + Math.round(bm.dr * 100) + "%" : ""}</div>`;
  } else if (fyTab === "all") {
    h += list.length ? list.map(card).join("") : `<div class="card dim">لا تملك جنيات. اصطدها أو اشترها من المتجر.</div>`;
  } else {
    h += `<div class="dim" style="margin-bottom:8px">3 عروض تتجدد يوميًا.</div>` + S.fshop.map(o => `<div class="card row"><div style="font-size:38px">${o.emoji}</div><div class="grow"><b>${esc(o.name)}</b> ${o.rankEmoji}<div class="dim">${esc(o.rarName)} · ${esc(m.fairyFam[o.fam] || "")}</div></div>${o.sold ? `<span class="dim">بيعت</span>` : `<button class="btn sm ${S.player.coins >= o.price ? "" : "off"}" data-fb="${o.idx}">${fmt(o.price)}🪙</button>`}</div>`).join("");
  }
  view.innerHTML = h; bindBack();
  view.querySelectorAll("[data-ft]").forEach(b => b.onclick = () => { fyTab = b.dataset.ft; fyEdit = null; SUBS.fairies(); });
  view.querySelectorAll("[data-fe]").forEach(b => b.onclick = () => { const id = Number(b.dataset.fe); fyEdit = fyEdit && fyEdit.id === id ? null : { id, mode: null }; SUBS.fairies(); });
  view.querySelectorAll("[data-fb]").forEach(b => b.onclick = () => { buzz("medium"); run("fBuy", { idx: Number(b.dataset.fb) }, () => SUBS.fairies()); });
  view.querySelectorAll("[data-fa]").forEach(b => b.onclick = () => {
    const [a, id, x] = b.dataset.fa.split(":"), n = Number(id); buzz();
    const done = () => SUBS.fairies();
    if (a === "toggle") run("fToggle", { id: n }, done);
    else if (a === "dust") run("fDust", { id: n, n: 1 }, done);
    else if (a === "name" || a === "hab" || a === "rel") { fyEdit = { id: n, mode: a }; SUBS.fairies(); }
    else if (a === "cancel") { fyEdit = { id: n, mode: null }; SUBS.fairies(); }
    else if (a === "savename") { const v = $("#fnm").value; run("fName", { id: n, name: v }, () => { fyEdit = { id: n, mode: null }; SUBS.fairies(); }); }
    else if (a === "sethab") run("fHab", { id: n, hab: x }, done);
    else if (a === "unhab") run("fUnhab", { id: n }, done);
    else if (a === "confirmrel") run("fRelease", { id: n }, () => { fyEdit = null; SUBS.fairies(); });
    else if (a === "slot") run("fSlot", {}, done);
  });
};
// بعد أي تحديث للحالة ونحن داخل شاشة فرعية نعيد رسمها
const _update = update;
update = function () {
  if (tab === "more" && sub && SUBS[sub] && ["fairies", "market", "bag"].includes(sub) && sheetPet == null) { renderTop(); const y = view.scrollTop; SUBS[sub](); view.scrollTop = y; return; }
  _update();
};

// ---------- سوق اللاعبين ----------
let mkTab = "browse", mkSell = { kind: "f", ref: null, qty: 1 };
SUBS.market = async () => {
  view.innerHTML = back + `<div class="dim">جارٍ التحميل…</div>`; bindBack();
  const j = await act("mList");
  const list = (j && j.market) || [];
  const seg = [["browse", "🏪 تصفح"], ["mine", "📦 معروضاتي"], ["sell", "➕ بيع"]];
  let h = back + `<h2>🏪 سوق اللاعبين</h2><div class="seg">${seg.map(s => `<button data-mt="${s[0]}" class="${s[0] === mkTab ? "on" : ""}">${s[1]}</button>`).join("")}</div>`;
  const row = (l, mine) => `<div class="card row"><div class="grow"><b>${esc(l.desc)}</b><div class="dim">${esc(l.by)} · ⏳ ${dur(l.left)}</div></div>` +
    (mine ? `<button class="btn sm bad" data-mc="${l.id}">↩️ إلغاء</button>` : `<button class="btn sm ${S.player.coins >= l.price ? "" : "off"}" data-mb="${l.id}">${fmt(l.price)}🪙</button>`) + `</div>`;
  if (mkTab === "browse") { const o = list.filter(l => !l.mine); h += o.length ? o.map(l => row(l, false)).join("") : `<div class="card dim">لا معروضات حاليًا.</div>`; }
  else if (mkTab === "mine") { const o = list.filter(l => l.mine); h += o.length ? o.map(l => row(l, true)).join("") : `<div class="card dim">لا تعرض شيئًا.</div>`; }
  else {
    const kinds = [["f", "🧚 جنية"], ["e", "🥚 بيضة"], ["r", "🔷 مورد"]];
    h += `<div class="seg">${kinds.map(k => `<button data-mk="${k[0]}" class="${k[0] === mkSell.kind ? "on" : ""}">${k[1]}</button>`).join("")}</div><div class="scroll-x">`;
    if (mkSell.kind === "f") h += S.fairies.filter(f => !f.equipped).map(f => `<button class="pick ${mkSell.ref === f.id ? "on" : ""}" data-mr="${f.id}"><span class="em">${f.emoji}</span>${esc(f.name)}<br>Lv${f.lv}</button>`).join("") || `<div class="dim">لا جنيات غير مجهزة.</div>`;
    else if (mkSell.kind === "e") h += S.eggBag.map(e => `<button class="pick ${mkSell.ref === e.id ? "on" : ""}" data-mr="${e.id}"><span class="em">${e.emoji}</span>${esc(e.name)}</button>`).join("") || `<div class="dim">المحفظة فارغة.</div>`;
    else h += Object.keys(S.res || {}).map(k => `<button class="pick ${mkSell.ref === k ? "on" : ""}" data-mr="${k}"><span class="em">${resMeta(k).emoji}</span>×${fmt(S.res[k])}</button>`).join("") || `<div class="dim">لا موارد.</div>`;
    h += `</div>`;
    if (mkSell.kind === "r") h += `<div class="row" style="margin-top:8px"><span class="dim">الكمية</span><input id="mq" type="number" min="1" value="${mkSell.qty}" style="width:90px"></div>`;
    h += `<div class="row" style="margin-top:8px"><input id="mp" type="number" min="1" placeholder="السعر (فارغ = المقترح)" style="flex:1"><button class="btn ${mkSell.ref != null ? "" : "off"}" id="mGo">عرض للبيع</button></div><div class="dim" style="margin-top:6px">ضريبة البيع ${Math.round((j.tax || 0.05) * 100)}%. المعروض يُسحب منك ويُعاد عند الإلغاء أو الانتهاء (7 أيام).</div>`;
  }
  view.innerHTML = h; bindBack();
  const again = () => SUBS.market();
  view.querySelectorAll("[data-mt]").forEach(b => b.onclick = () => { mkTab = b.dataset.mt; again(); });
  view.querySelectorAll("[data-mk]").forEach(b => b.onclick = () => { mkSell = { kind: b.dataset.mk, ref: null, qty: 1 }; again(); });
  view.querySelectorAll("[data-mr]").forEach(b => b.onclick = () => { const v = b.dataset.mr; mkSell.ref = mkSell.kind === "r" ? v : Number(v); const q = $("#mq"); if (q) mkSell.qty = Number(q.value) || 1; again(); });
  view.querySelectorAll("[data-mb]").forEach(b => b.onclick = () => { if (b.classList.contains("off")) return toast("رصيدك لا يكفي", true); buzz("medium"); run("mBuy", { id: Number(b.dataset.mb) }, again); });
  view.querySelectorAll("[data-mc]").forEach(b => b.onclick = () => { buzz(); run("mCancel", { id: Number(b.dataset.mc) }, again); });
  const go_ = $("#mGo");
  if (go_) go_.onclick = () => {
    if (mkSell.ref == null) return toast("اختر ما تعرضه", true);
    const q = $("#mq"), p = $("#mp");
    buzz("medium");
    run("mSell", { kind: mkSell.kind, ref: mkSell.ref, qty: q ? Number(q.value) || 1 : 1, price: p && p.value ? Number(p.value) : 0 }, j2 => { if (j2 && j2.ok) { mkSell.ref = null; mkTab = "mine"; } again(); });
  };
};

// ---------- الزعماء ----------
SUBS.boss = () => {
  const m = S.meta, E = m.elements, B = m.beatsAll, bm = S.bossMods || {};
  let h = back + `<h2>👑 الزعماء</h2><div class="card dim">البوس الجماعي يُستدعى ويُقاتل داخل المجموعة بأمر <b>.بوس</b>. الانتظار بين الزعماء 3 ساعات، ويمكن تسريعه أو استدعاؤه فورًا أو بعنصر محدد أو تعزيز فريقك بالموارد 🔷. عند التسجيل يصلك في الخاص ترتيب فريقك وبفاتك الحالية.</div>`;
  const bf = Object.entries({ atk: "ضرر", heal: "علاج", hp: "حياة", dr: "درع" }).filter(([k]) => bm[k]).map(([k, n]) => `${n} +${Math.round(bm[k] * 100)}%`).join(" · ");
  h += `<div class="card">🧚 بفات جنياتك على البوس: <b>${bf || "لا شيء (جهّز جنيات)"}</b></div>`;
  (m.bossKinds || []).forEach(k => {
    const beat = Object.keys(B).filter(x => B[x].includes(k.el));
    h += `<div class="card"><div class="row"><div style="font-size:34px">${k.e}</div><div class="grow"><b>${esc(k.n)}</b><div class="dim">${E[k.el].e} ${esc(E[k.el].n)}</div></div></div><div class="dim" style="margin-top:6px">⬆️ أفضل ضده: ${beat.map(x => E[x].e).join(" ") || "—"}</div></div>`;
  });
  view.innerHTML = h; bindBack();
};
