// أزياء الحيوانات: اختر حيوانًا ثم ألبسه قطعًا من خانات الرأس والوجه والعنق والظهر. تُشترى بالغبار/البلورات أو تأتي هدايا من الزعماء والمكافأة اليومية.
let csPet = null, csTab = "wear";
SUBS.costumes = () => {
  const cat = (S.costumes && S.costumes.cat) || [], own = new Set((S.costumes && S.costumes.own) || []);
  const pets = S.pets || []; if (!pets.length) { view.innerHTML = back + `<h2>👗 الأزياء</h2><div class="card dim">لا تملك حيوانات بعد.</div>`; bindBack(); return; }
  if (csPet == null || !pets.some(p => p.id === csPet)) csPet = (pets.find(p => p.main) || pets[0]).id;
  const pet = pets.find(p => p.id === csPet), SL = { head: "الرأس", face: "الوجه", neck: "العنق", back: "الظهر" }, RE = { dust: "✨", crystal: "🔷" };
  let h = back + `<h2>👗 الأزياء</h2><div class="seg"><button data-t="wear" class="${csTab === "wear" ? "on" : ""}">🐾 ألبس</button><button data-t="shop" class="${csTab === "shop" ? "on" : ""}">🛒 المتجر</button></div>`;
  h += `<div class="card" style="text-align:center;padding:26px 8px 14px"><div style="display:inline-block">${petFace(pet, 96)}</div><div style="margin-top:8px"><b>${esc(pet.name)}</b></div></div>`;
  h += `<div class="scroll-x" style="display:flex;gap:6px;overflow-x:auto;padding:6px 0">${pets.map(p => `<button class="pick ${p.id === csPet ? "on" : ""}" data-p="${p.id}" style="padding-top:14px">${petFace(p, 34)}</button>`).join("")}</div>`;
  if (csTab === "wear") {
    Object.keys(SL).forEach(sl => {
      const mine = cat.filter(c => c.slot === sl && own.has(c.id));
      h += `<div class="card"><b>${SL[sl]}</b><div class="scroll-x" style="display:flex;gap:6px;overflow-x:auto;margin-top:6px">` +
        (mine.length ? mine.map(c => `<button class="pick ${pet.cs && pet.cs[sl] === c.id ? "on" : ""}" data-w="${c.id}"><span class="em">${c.e}</span>${esc(c.n)}</button>`).join("") : `<span class="dim">لا تملك قطعًا هنا. اشترِ من المتجر.</span>`) + `</div></div>`;
    });
    h += `<button class="btn sec" data-w="none">🧺 نزع الكل</button>`;
  } else {
    h += `<div class="dim" style="margin:6px 0">✨ ${(S.res || {}).dust || 0} غبار · 🔷 ${(S.res || {}).crystal || 0} بلورة. القطع للزينة فقط، وتُلبس على أكثر من حيوان.</div>`;
    h += cat.map(c => `<div class="card"><div class="row"><div style="font-size:34px">${c.e}</div><div class="grow"><b>${esc(c.n)}</b><div class="dim">${SL[c.slot]}</div></div>` +
      (own.has(c.id) ? `<span class="tag">✅ مملوكة</span>` : c.res ? `<button class="btn sm" data-b="${c.id}">${RE[c.res]} ${c.price}</button>` : `<span class="tag">🎁 هدية: زعيم/مكافأة</span>`) + `</div></div>`).join("");
  }
  view.innerHTML = h; bindBack();
  view.querySelectorAll("[data-t]").forEach(b => b.onclick = () => { csTab = b.dataset.t; SUBS.costumes(); });
  view.querySelectorAll("[data-p]").forEach(b => b.onclick = () => { csPet = Number(b.dataset.p); SUBS.costumes(); });
  view.querySelectorAll("[data-w]").forEach(b => b.onclick = () => { buzz(); run("cosWear", { pet: csPet, id: b.dataset.w }, () => SUBS.costumes()); });
  view.querySelectorAll("[data-b]").forEach(b => b.onclick = () => { buzz("medium"); run("cosBuy", { id: b.dataset.b }, () => SUBS.costumes()); });
};

// حظيرة الزعماء: زعيمك المروَّض ورتبته (ندرات خاصة: مروَّض ← مهيب ← جبّار ← ملكي ← خالد)
SUBS.den = () => {
  const bs = (S.pets || []).filter(p => p.boss);
  let h = back + `<h2>👑 حظيرة الزعماء</h2>`;
  const t = S.tame;
  if (t) {
    const mood = { love: "🥰", ok: "🙂", bad: "😠", "": "👀" }[t.mood], hrs = Math.ceil(t.left / 3600e3);
    h += `<div class="card" style="text-align:center;border:2px solid #ffd166"><b>🐾 طقس الترويض</b>
      <div class="dim" style="margin:4px 0">زعيم مُنهك يختبرك. جرّب أساليب مختلفة حتى تكسب ثقته (${hrs} ساعة متبقية)</div>
      <div class="tmBoss" style="font-size:84px;line-height:1.1">${t.e}<span style="font-size:34px;margin-inline-start:-14px">${mood}</span></div>
      <b>${esc(t.n)}</b>
      <div class="bar" style="height:14px;border-radius:9px;background:#0003;margin:8px 0;overflow:hidden"><div style="height:100%;width:${t.trust}%;background:linear-gradient(90deg,#ff9a6a,#ffd166);transition:width .5s"></div></div>
      <div>💞 الثقة ${t.trust}/${t.goal} · 🎯 محاولات ${t.tries}</div>
      <div class="dim" style="margin:6px 0;font-style:italic">«${esc(t.hint)}»</div>
      ${t.tries > 0 ? `<div class="row" style="gap:6px;flex-wrap:wrap;justify-content:center">${t.apps.map(a => `<button class="btn" data-ap="${a.id}" style="flex:1 1 40%">${a.e} ${a.n}</button>`).join("")}</div>` : ""}
      <div class="row" style="gap:6px;margin-top:8px;justify-content:center"><button class="btn sec sm" data-offer="1">💎 قربان ${t.offer}🔷 (+30 ثقة)</button>${t.canRetry ? `<button class="btn sm" data-retry="1">🔁 محاولات إضافية ${t.retryCost}🔷</button>` : ""}</div>
      <div style="margin-top:8px;text-align:start">${t.log.slice().reverse().map(l => `<div class="dim">${esc(l)}</div>`).join("") || `<div class="dim">لم تجرّب شيئًا بعد.</div>`}</div></div>`;
  }
  if (!bs.length && !t) {
    h += `<div class="card"><b>لا زعيم مروَّض بعد</b><div class="dim" style="margin-top:6px">هزم زعيمًا مع مجموعتك: صاحب أكبر ضرر يحصل على فرصة ترويض دائمًا، وللمشاركين فرصة 20%، ثم تخوض طقس الترويض هنا بتجربة الأساليب. يُروَّض زعيم واحد فقط لكل لاعب، ويسكن حظيرة خاصة لا تأخذ من أماكن حظيرتك.</div></div>`;
  }
  bs.forEach(p => {
    h += `<div class="card"><div class="row"><div>${petFace(p, 64)}</div><div class="grow"><b>${esc(p.name)}</b> <span class="tag">${p.boss.e} ${esc(p.boss.name)}</span><div class="dim">مستوى ${p.lv} · ⚔️ ${fmt(p.power)} · 💰 ${fmt(p.income)}/س</div></div></div>` +
      (p.boss.max ? `<div class="dim" style="margin-top:8px">♾️ بلغ أعلى رتبة</div>` : (() => { const q = p.boss.req, row = (ok, t) => `<div style="${ok ? "" : "opacity:.8"}">${ok ? "✅" : "❌"} ${t}</div>`; return `<div style="margin-top:8px"><b>شروط الرتبة التالية:</b>` + row(q.lv[1] >= q.lv[0], `مستوى ${q.lv[0]} (لديك ${q.lv[1]})`) + row(q.kills[1] >= q.kills[0], `هزيمة ${q.kills[0]} زعماء بعد آخر ترقية (${q.kills[1]})`) + row(q.ess[1] >= q.ess[0], `${q.ess[2]} ×${q.ess[0]} (${q.ess[1]})`) + row(q.cry[1] >= q.cry[0], `🔷 ${q.cry[0]} (${q.cry[1]})`) + row(!q.wait, q.wait ? "انتظار " + Math.ceil(q.wait / 3600e3) + " ساعة" : "المهلة انتهت") + `</div><button class="btn" data-r="${p.id}" style="margin-top:8px">⬆️ ترقية الرتبة (+35% قوة ودخل)</button>`; })()) + `</div>`;
  });
  h += `<div class="dim" style="margin-top:8px">الرتب: 🐾 مروَّض ← 🔥 مهيب ← ⚡ جبّار ← 👑 ملكي ← ♾️ خالد. تجده في الحظيرة الخاصة 👑 داخل عالم المزرعة.</div>`;
  view.innerHTML = h; bindBack();
  const done = j => { if (j && j.tamed) { buzz("heavy"); try { sfx("big"); } catch (e) { /* لا شيء */ } } SUBS.den(); };
  view.querySelectorAll("[data-ap]").forEach(b => b.onclick = () => { buzz(); run("tameStep", { ap: b.dataset.ap }, done); });
  view.querySelectorAll("[data-offer]").forEach(b => b.onclick = () => { buzz("medium"); run("tameOffer", {}, done); });
  view.querySelectorAll("[data-retry]").forEach(b => b.onclick = () => { buzz(); run("tameRetry", {}, done); });
  view.querySelectorAll("[data-r]").forEach(b => b.onclick = () => { buzz("medium"); run("bossRank", { id: Number(b.dataset.r) }, () => SUBS.den()); });
};
