"use strict";
// ======================================================
// المتجر
// ======================================================
let shopTab = "eggs";
VIEWS.shop = () => {
  const m = S.meta, coins = S.player.coins;
  const seg = [["eggs", "🥚 بيض"], ["food", "🍖 طعام"], ["fruit", "🍇 فواكه"], ["up", "🏠 توسعات"]];
  let h = `<h2>🛒 المتجر</h2><div class="seg">${seg.map(s => `<button data-s="${s[0]}" class="${s[0] === shopTab ? "on" : ""}">${s[1]}</button>`).join("")}</div>`;
  if (shopTab === "eggs") {
    m.eggs.forEach(e => {
      const tot = e.w.reduce((a, b) => a + b, 0);
      const chances = e.w.map((w, i) => w ? `<span class="tag" style="color:${RAR_COLOR[i]}">${m.rarities[i].e} ${Math.round(w / tot * 1000) / 10}%</span>` : "").join(" ");
      h += `<div class="card row"><div style="font-size:42px">${e.emoji}</div><div class="grow"><b>${esc(e.name)}</b><div class="dim">⏳ ${dur(e.min * 60000)}</div><div style="margin-top:4px">${chances}</div></div>` +
        `<button class="btn sm ${coins < e.price ? "off" : ""}" data-egg="${e.tier}">${fmt(e.price)} 🪙</button></div>`;
    });
  } else if (shopTab === "food" || shopTab === "fruit") {
    m.foods.filter(f => (shopTab === "fruit") === !!f.el).forEach(f => {
      const own = (S.items.find(i => i.id === f.id) || {}).count || 0;
      h += `<div class="card row"><div style="font-size:36px">${f.emoji}</div><div class="grow"><b>${esc(f.name)}</b> <span class="dim">(عندك ${own})</span>` +
        `<div class="dim">جوع +${f.hg}${f.xp && !f.el ? " · خبرة +" + Math.round(f.xp * 100) + "%" : ""}${f.el ? " · " + m.elements[f.el].e + " " + m.elements[f.el].n : ""}</div></div>` +
        `<div class="row" style="gap:5px">${[1, 5, 25].map(q => `<button class="btn sm sec ${coins < f.price * q ? "off" : ""}" data-food="${f.id}" data-q="${q}">×${q}<br><span class="dim">${fmt(f.price * q)}</span></button>`).join("")}</div></div>`;
    });
  } else {
    h += `<div class="card row"><div style="font-size:36px">🏠</div><div class="grow"><b>توسعة الحظيرة +3</b><div class="dim">${S.pets.length}/${S.player.slots}</div></div><button class="btn sm ${coins < m.slotPrice ? "off" : ""}" data-up="slots">${fmt(m.slotPrice)} 🪙</button></div>`;
    h += m.hatchPrice
      ? `<div class="card row"><div style="font-size:36px">🥚</div><div class="grow"><b>مكان حضانة +1</b><div class="dim">${S.eggs.length}/${S.player.hatchSlots}</div></div><button class="btn sm ${coins < m.hatchPrice ? "off" : ""}" data-up="hatch">${fmt(m.hatchPrice)} 🪙</button></div>`
      : `<div class="card dim">الحضانة وصلت أقصى حد.</div>`;
  }
  view.innerHTML = h;
  view.querySelectorAll("[data-s]").forEach(b => b.onclick = () => { shopTab = b.dataset.s; VIEWS.shop(); });
  view.querySelectorAll("[data-egg]").forEach(b => b.onclick = () => { buzz(); run("buyEgg", { tier: Number(b.dataset.egg) }); });
  view.querySelectorAll("[data-food]").forEach(b => b.onclick = () => { buzz(); run("buyFood", { id: b.dataset.food, qty: Number(b.dataset.q) }); });
  view.querySelectorAll("[data-up]").forEach(b => b.onclick = () => { buzz("medium"); run(b.dataset.up === "slots" ? "expandSlots" : "expandHatch"); });
};