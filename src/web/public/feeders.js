"use strict";
// ======================================================
// أماكن الأكل: شراء أوعية، وضعها في حظيرة بكمية محدودة، تعبئتها وإزالتها
// ======================================================
let bowlsOpen = false;

function bowlPenLabel(id) {
  return id === -1 ? "🌍 كل الحظائر" : id === 0 ? "🏡 الكبرى" : ((S.pens.find(p => p.id === id) || {}).name || "؟");
}

function openBowls() {
  bowlsOpen = true;
  const m = S.meta, list = S.bowls, free = list.filter(b => b.pen == null), placed = list.filter(b => b.pen != null);
  const own = id => (S.items.find(i => i.id === id) || {}).count || 0;
  const foods = m.bowlFoods.map(id => m.foods.find(f => f.id === id));
  const penOpts = `<option value="-1">🌍 كل الحظائر</option><option value="0">🏡 الكبرى</option>` + S.pens.map(p => `<option value="${p.id}">${esc(p.name)}</option>`).join("");
  let h = `<div class="panel"><h2>🥣 أماكن الأكل</h2>
    <div class="dim" style="margin-bottom:10px">ضع الأوعية في حظيرة بكمية طعام محدودة، فتأكل منها الحيوانات الجائعة تلقائيًا حتى ينتهي الطعام. الحد ${m.bowlCap} لكل وعاء.</div>
    <div class="card row"><div style="font-size:34px">🥣</div><div class="grow"><b>${list.length}/${m.bowlMax} وعاء</b><div class="dim">${free.length} غير موضوع · ${placed.length} موضوع</div></div>` +
    (list.length < m.bowlMax ? `<button class="btn sm ${S.player.coins < m.bowlPrice ? "off" : ""}" data-bb="buy">🛒 ${fmt(m.bowlPrice)} 🪙</button>` : "") + `</div>`;
  if (free.length) {
    h += `<div class="card"><b>📍 ضع أوعية</b>
      <div class="row" style="margin-top:8px"><span class="dim" style="min-width:74px">عدد الأوعية</span><select id="bwCount" class="grow">${free.map((_, i) => `<option value="${i + 1}">${i + 1}</option>`).join("")}</select></div>
      <div class="row" style="margin-top:6px"><span class="dim" style="min-width:74px">الحظيرة</span><select id="bwPen" class="grow">${penOpts}</select></div>
      <div class="row" style="margin-top:6px"><span class="dim" style="min-width:74px">الطعام</span><select id="bwFood" class="grow">${foods.map(f => `<option value="${f.id}">${f.emoji} ${esc(f.name)} (عندك ${own(f.id)})</option>`).join("")}</select></div>
      <div class="row" style="margin-top:6px"><span class="dim" style="min-width:74px">كمية لكل وعاء</span><input id="bwQty" type="number" min="1" max="${m.bowlCap}" value="20" class="grow"></div>
      <button class="btn" style="width:100%;margin-top:10px" id="bwGo">🥣 ضع</button></div>`;
  }
  placed.forEach(b => {
    const f = m.foods.find(x => x.id === b.food);
    h += `<div class="card"><div class="row"><div style="font-size:30px">🥣</div><div class="grow"><b>وعاء #${b.id}</b> <span class="dim">· ${esc(bowlPenLabel(b.pen))}</span>
      <div class="dim">${f ? f.emoji + " " + esc(f.name) : ""} ${b.qty}/${m.bowlCap}${b.qty ? "" : " ⚠️ فارغ"}</div></div></div>
      <div class="bar hg" style="margin:8px 0"><i style="width:${Math.min(100, b.qty / m.bowlCap * 100)}%"></i></div>
      <div class="row" style="gap:6px"><button class="btn sec sm grow" data-bf="${b.id}:10">+10</button><button class="btn sec sm grow" data-bf="${b.id}:25">+25</button><button class="btn sec sm grow" data-bf="${b.id}:${m.bowlCap}">+الأقصى</button><button class="btn bad sm" data-bx="${b.id}">📤 أزل</button></div></div>`;
  });
  if (placed.length > 1) h += `<button class="btn bad" style="width:100%" data-bx="-1">📤 إزالة كل الأوعية</button>`;
  h += `</div>`;
  $("#sheet").innerHTML = h;
  $("#sheet").classList.remove("hidden");
  const P = $("#sheet .panel");
  P.querySelectorAll("[data-bb]").forEach(b => b.onclick = () => { buzz("medium"); run("buyBowl"); });
  P.querySelectorAll("[data-bf]").forEach(b => b.onclick = () => { const [id, q] = b.dataset.bf.split(":"); buzz(); run("refillBowl", { id: Number(id), qty: Number(q) }); });
  P.querySelectorAll("[data-bx]").forEach(b => b.onclick = () => { buzz(); run("removeBowl", { id: Number(b.dataset.bx) }); });
  const go = $("#bwGo");
  if (go) go.onclick = () => {
    buzz("medium");
    run("placeBowls", { count: Number($("#bwCount").value), pen: Number($("#bwPen").value), food: $("#bwFood").value, qty: Math.floor(Number($("#bwQty").value)) });
  };
}