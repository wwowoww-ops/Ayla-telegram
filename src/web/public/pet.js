"use strict";
// ======================================================
// بطاقة الحيوان
// ======================================================
let sheetPet = null;
let renaming = false, releasing = false;
function openPet(id) {
  const p = S.pets.find(x => x.id === id);
  if (!p) { closeSheet(); return; }
  sheetPet = id;
  const t = Date.now() - stamp;
  const cd = ms => Math.max(0, ms - t);
  const foods = S.items;
  const mk = (label, left, handler, cls) => {
    const l = cd(left);
    return `<button class="btn sec ${cls || ""} ${l ? "off" : ""}" data-a="${handler}">${label}${l ? ` <span class="dim" data-ts="${ts(l)}">${dur(l)}</span>` : ""}</button>`;
  };
  $("#sheet").innerHTML = `<div class="panel">
    <div class="row">
      <div class="glow" style="--c:${EL_COLOR[p.el]}">${petFace(p, 74)}</div>
      <div class="grow">
        <div style="font-size:19px;font-weight:800">${esc(p.name)} ${p.main ? "👑" : ""}</div>
        <div class="dim">${esc(p.species)} · النوع #${p.sp}</div>
        <div style="margin-top:4px"><span class="tag" style="color:${RAR_COLOR[p.rar]}">${p.rarEmoji} ${p.rarName}</span> <span class="tag">${p.elEmoji} ${p.elName}</span> <span class="tag">${p.grade}</span>${p.st ? ` <span class="tag">${"⭐".repeat(p.st)}</span>` : ""}</div>
      </div>
    </div>
    <div style="margin:12px 0 4px" class="dim">المستوى ${p.lv}/${S.meta.lvCap}${p.lv < S.meta.lvCap ? ` · الخبرة ${p.xp}/${p.xpNeed}` : ""}</div>
    <div class="bar"><i style="width:${p.lv >= S.meta.lvCap ? 100 : Math.min(100, p.xp / p.xpNeed * 100)}%"></i></div>
    <div style="margin:10px 0 4px" class="dim">الجوع ${p.hunger}%</div>
    <div class="bar hg"><i style="width:${p.hunger}%"></i></div>
    <div class="grid2" style="margin:12px 0"><div class="card" style="margin:0">⚔️ القوة<br><b>${fmt(p.power)}</b></div><div class="card" style="margin:0">💰 الدخل<br><b>${fmt(p.income)}/س</b></div></div>
    <div class="dim" style="margin-bottom:6px">إطعام</div>
    <div class="scroll-x">${foods.length ? foods.map(f => { const m = S.meta.foods.find(x => x.id === f.id); return `<button class="pick" data-feed="${f.id}"><span class="em">${m.emoji}</span>${esc(m.name)}<br>×${f.count}${m.el && m.el === p.el ? " ✨" : ""}</button>`; }).join("") : `<span class="dim">لا طعام. اشترِ من المتجر.</span>`}</div>
    <div class="dim" style="margin:12px 0 6px">الحظيرة</div>
    <div class="scroll-x">${[{ id: 0, name: "🏡 الكبرى" }].concat(S.pens).map(x => `<button class="pick ${penOf(p) === x.id ? "on" : ""}" data-pen="${x.id}">${esc(x.name)}</button>`).join("")}</div>
    ${p.fx != null ? `<div class="dim" style="margin-top:6px">📌 مثبّت في مكان محدد</div>` : ""}
    <div class="grid2" style="margin-top:10px">
      ${p.fx != null ? `<button class="btn sec" data-a="unpin">🔓 اتركه يتجول</button>` : ""}
      ${mk("🏋️ تدريب", p.cd.train, "train")}
      ${mk("🎮 لعب", p.cd.play, "play")}
      ${p.main ? "" : `<button class="btn sec" data-a="main">📌 اجعله أساسيًا</button>`}
      ${p.starCost ? `<button class="btn" data-a="upgrade">⭐ ترقية ${fmt(p.starCost)}</button>` : ""}
      <button class="btn sec" data-a="rename">✏️ تسمية</button>
      <button class="btn bad" data-a="release">🗑️ تخلٍّ</button>
    </div>
    ${renaming ? `<div class="row" style="margin-top:10px"><input id="nm" maxlength="16" placeholder="الاسم الجديد" style="flex:1;padding:9px;border-radius:10px;border:1px solid var(--line);background:#0e0a18;color:#fff"><button class="btn sm" data-a="saveName">حفظ</button></div>` : ""}
    ${releasing ? `<div class="card" style="margin-top:10px;border-color:var(--bad)">هل أنت متأكد؟ لا يمكن التراجع.<div class="row" style="margin-top:8px"><button class="btn bad sm" data-a="confirmRelease">نعم، تخلَّ</button><button class="btn sec sm" data-a="cancel">إلغاء</button></div></div>` : ""}
  </div>`;
  $("#sheet").classList.remove("hidden");
  const panel = $("#sheet .panel");
  panel.querySelectorAll("[data-feed]").forEach(b => b.onclick = () => { buzz(); run("feed", { id, food: b.dataset.feed }); });
  panel.querySelectorAll("[data-pen]").forEach(b => b.onclick = () => { if (Number(b.dataset.pen) !== penOf(p)) { buzz(); run("movePet", { id, pen: Number(b.dataset.pen) }); } });
  panel.querySelectorAll("[data-a]").forEach(b => b.onclick = () => {
    if (b.classList.contains("off")) return;
    const a = b.dataset.a; buzz();
    if (a === "train" || a === "play" || a === "main" || a === "upgrade" || a === "unpin") run(a, { id });
    else if (a === "rename") { renaming = !renaming; openPet(id); }
    else if (a === "saveName") { const v = $("#nm").value; renaming = false; run("nick", { id, name: v }); }
    else if (a === "release") { releasing = true; openPet(id); }
    else if (a === "cancel") { releasing = false; openPet(id); }
    else if (a === "confirmRelease") { releasing = false; closeSheet(); run("release", { id }); }
  });
}