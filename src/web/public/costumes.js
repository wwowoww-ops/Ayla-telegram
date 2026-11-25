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
  if (!bs.length) {
    h += `<div class="card"><b>لا زعيم مروَّض بعد</b><div class="dim" style="margin-top:6px">هزم زعيمًا مع مجموعتك: صاحب أكبر ضرر يروّضه دائمًا، وللمشاركين فرصة 20%. يُروَّض زعيم واحد فقط لكل لاعب، ويسكن حظيرة خاصة لا تأخذ من أماكن حظيرتك.</div></div>`;
  }
  bs.forEach(p => {
    h += `<div class="card"><div class="row"><div>${petFace(p, 64)}</div><div class="grow"><b>${esc(p.name)}</b> <span class="tag">${p.boss.e} ${esc(p.boss.name)}</span><div class="dim">مستوى ${p.lv} · ⚔️ ${fmt(p.power)} · 💰 ${fmt(p.income)}/س</div></div></div>` +
      (p.boss.max ? `<div class="dim" style="margin-top:8px">♾️ بلغ أعلى رتبة</div>` : `<button class="btn" data-r="${p.id}" style="margin-top:8px">⬆️ ترقية الرتبة 🔷 ${p.boss.cost} (+35% قوة ودخل)</button>`) + `</div>`;
  });
  h += `<div class="dim" style="margin-top:8px">الرتب: 🐾 مروَّض ← 🔥 مهيب ← ⚡ جبّار ← 👑 ملكي ← ♾️ خالد. تجده في الحظيرة الخاصة 👑 داخل عالم المزرعة.</div>`;
  view.innerHTML = h; bindBack();
  view.querySelectorAll("[data-r]").forEach(b => b.onclick = () => { buzz("medium"); run("bossRank", { id: Number(b.dataset.r) }, () => SUBS.den()); });
};
