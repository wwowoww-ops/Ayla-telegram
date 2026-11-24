// برج الأزل: طوابق لا نهائية. الفريق = أقوى 3 حيوانات غير مسافرة.
let towerRes = null;
const towerTime = ms => { const m = Math.ceil(ms / 60000); return m >= 60 ? Math.floor(m / 60) + " س " + (m % 60) + " د" : m + " د"; };
SUBS.tower = async () => {
  const T = S.tower; if (!T) { view.innerHTML = back + `<div class="card dim">البرج غير متاح.</div>`; bindBack(); return; }
  const ratio = T.mon.power ? T.mine / T.mon.power : 0, hint = ratio >= 1.25 ? ["🟢", "فرصتك ممتازة"] : ratio >= 0.95 ? ["🟡", "معركة متقاربة"] : ["🔴", "الوحش أقوى منك"];
  let h = back + `<h2>🗼 برج الأزل</h2><div class="dim">طوابق لا نهاية لها، كل طابق أقوى من الذي قبله. كل 10 طوابق زعيم بجائزة بيضة. تتجدد محاولة كل ساعة.</div>`;
  if (towerRes) {
    const r = towerRes;
    h += `<div class="card" style="border:2px solid ${r.win ? "#4ade80" : "#f87171"};text-align:center"><div style="font-size:42px">${r.win ? (r.boss ? "👑" : "🏆") : "💥"}</div><b>${esc(r.msg)}</b>
      <div class="dim">قوتك ${fmt(r.mine)} ضد ${r.mon.e} ${fmt(r.mon.power)}</div>${r.loot.length ? `<div style="margin-top:6px">${r.loot.map(esc).join(" · ")}</div>` : ""}</div>`;
  }
  h += `<div class="card" style="text-align:center;${T.boss ? "border:2px solid #fbbf24" : ""}">
    <div class="dim">الطابق</div><div style="font-size:40px;font-weight:bold">${T.f}${T.boss ? " 👑" : ""}</div>
    <div style="font-size:46px;margin:4px 0">${T.boss ? "👹" : "👾"}</div>
    <div><b>${T.mon.e} وحش ${esc(T.mon.n)}</b> · قوته ${fmt(T.mon.power)}</div>
    <div class="dim" style="margin-top:4px">قوة فريقك مع أفضلية العناصر: <b>${fmt(T.mine)}</b> ${hint[0]} ${hint[1]}</div>
    <div class="dim" style="margin-top:6px">🔋 محاولات: <b>${T.en}/${T.enMax}</b>${T.enLeft ? " · التالية بعد " + towerTime(T.enLeft) : ""}</div>
    <button class="btn" id="twGo" style="width:100%;margin-top:10px" ${T.en < 1 || !T.team.length ? "disabled" : ""}>⚔️ اصعد الطابق ${T.f}</button></div>`;
  h += `<div class="card"><b>🛡️ فريقك (أقوى 3)</b><div class="row" style="gap:8px;margin-top:8px;flex-wrap:wrap">${T.team.length ? T.team.map(p => `<div style="text-align:center;min-width:70px"><div style="font-size:30px">${p.emoji}</div><div style="font-size:12px">${esc(p.name)}</div><div class="dim" style="font-size:11px">⚔️ ${fmt(p.power)}</div></div>`).join("") : `<span class="dim">لا حيوانات متاحة.</span>`}</div>
    <div class="dim" style="margin-top:6px;font-size:12px">💡 كل حيوان يقاتل بعنصره: جرّب أن يكون في فريقك عناصر متنوعة تتفوق على عنصر وحش الطابق.</div></div>`;
  h += `<div class="card row"><div class="grow"><b>📈 هذا الأسبوع</b><div class="dim">تسلّقت ${T.wkGain} طابقًا · أعلى طابق وصلت له ${T.best}</div></div>${T.pend ? `<button class="btn sm" id="twWk">🎁 ${T.pend} 🔷</button>` : ""}</div>
    <h3 style="margin:12px 0 6px">🏅 أعلى المتسلّقين</h3><div id="twTop" class="card dim">جارٍ التحميل…</div>`;
  view.innerHTML = h; bindBack();
  const go = $("#twGo"); if (go) go.onclick = () => { buzz(); run("towerClimb", {}, j => { towerRes = j.ok ? j : null; if (j.win) { sfx("big"); sparkle(innerWidth / 2, 200); } SUBS.tower(); }); };
  const wk = $("#twWk"); if (wk) wk.onclick = () => run("towerWeek", {}, () => SUBS.tower());
  const j = await act("towerTop", {});
  const el = $("#twTop"); if (el && j && j.ok) el.innerHTML = j.rows.length ? j.rows.map((r, i) => `<div class="row" data-pro="${esc(r.uid || "")}" style="padding:4px 0;cursor:pointer"><b style="width:26px">${["🥇", "🥈", "🥉"][i] || i + 1}</b><span class="grow">${nameTag(r.name, r.tg)}</span><b>${r.v}</b></div>`).join("") : "لا أحد صعد بعد. كن الأول!";
  document.querySelectorAll("#twTop [data-pro]").forEach(b => b.onclick = () => { if (b.dataset.pro) { buzz(); SUBS.pro(b.dataset.pro, () => SUBS.tower()); } });
};

// ===== صيد البحر =====
let fishRes = null;
SUBS.fish = () => {
  const F = S.fish; if (!F) { view.innerHTML = back + `<div class="card dim">غير متاح.</div>`; bindBack(); return; }
  let h = back + `<h2>🎣 صيد البحر</h2><div class="dim">ارمِ الصنارة من الرصيف: عملات وبلورات وصدف عنصرية، وقد تجد بيضة أو كنزًا. حيواناتك المائية والثلجية ترفع فرصة الغنائم النادرة.</div>`;
  if (fishRes) h += `<div class="card" style="text-align:center;border:2px solid #60a5fa"><div style="font-size:54px">${fishRes.emoji}</div><b>${esc(fishRes.title)}</b>${fishRes.loot.length ? `<div style="margin-top:6px">${fishRes.loot.map(esc).join(" · ")}</div>` : ""}</div>`;
  h += `<div class="card" style="text-align:center"><div style="font-size:40px">🌊🎣🌊</div><div>🔋 رميات: <b>${F.en}/${F.max}</b>${F.left ? " · التالية بعد " + towerTime(F.left) : ""}</div>
    <div class="dim" style="margin-top:4px">🍀 حظ الحيوانات المائية: +${F.luck}% · اصطدت ${fmt(F.total)} مرة</div>
    <button class="btn" id="fiGo" style="width:100%;margin-top:10px" ${F.en < 1 ? "disabled" : ""}>🎣 ارمِ الصنارة</button></div>`;
  view.innerHTML = h; bindBack();
  const go_ = $("#fiGo"); if (go_) go_.onclick = () => { buzz(); run("fishCast", {}, j => { fishRes = j.ok ? j : null; if (j.ok) { sfx("big"); sparkle(innerWidth / 2, 220); } SUBS.fish(); }); };
};
