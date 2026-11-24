// ======================================================
// حديقة الجنيات: عالم ثلاثي الأبعاد تتجوّل فيه جنياتك. لكل جنية مجسّم بجناحين متحركين ولون عائلتها،
// وبيئاتها الأربع (غابة، بحيرة، قمة، مرج) حول شجرة الجنيات الكبيرة. اسحب للدوران، واضغط جنية لترى بَفها.
// ======================================================
const GD_FAM = { gold: ["#ffd24d", "#fff1a8"], wis: ["#6aa8ff", "#d6e6ff"], sat: ["#4fd0a0", "#d2f7e6"], hatch: ["#ffb36a", "#ffe3c6"], war: ["#ff6a6a", "#ffd0d0"], luck: ["#5ad05a", "#d6f7c8"], guard: ["#9aa4c4", "#e4e8f4"], trade: ["#e0b04a", "#fff0c0"], heal: ["#ff8ac0", "#ffd6ea"], breed: ["#ffa0d8", "#ffe0f2"], time: ["#b080ff", "#e6d6ff"], dawn: ["#ff9a6a", "#ffe0a8"] };
const GD_REG = { forest: [-11, -8], lake: [11, -8], peak: [-11, 9], meadow: [11, 9] };
const GD_HAIR = [0x6b4a2a, 0x3a2a1a, 0xe0a84a, 0xff6ab0, 0x9a6aff];
let gdSel = null;

SUBS.garden = async () => {
  view.innerHTML = back + `<h2>🌸 حديقة الجنيات</h2><div class="dim" style="margin-bottom:6px">جنياتك تتجوّل في حديقتها. اسحب بإصبع للدوران، وبإصبعين للتحريك والتكبير/التصغير، واضغط على جنية لتعرف بَفها.</div>
    <canvas id="gdC" style="width:100%;height:56vh;min-height:280px;border-radius:16px;display:block;touch-action:none;background:#bfe8ff"></canvas>
    <div class="row" style="gap:6px;margin-top:6px"><button class="btn sm sec" id="gdIn">➕ تكبير</button><button class="btn sm sec" id="gdOut">➖ تصغير</button><button class="btn sm sec" id="gdRst">🎯 إعادة</button></div>
    <div id="gdInfo" class="card" style="margin-top:8px"><span class="dim">${(S.fairies || []).length ? "اضغط على جنية…" : "لا جنيات بعد. اصطدها بعد الفوز في الصيد أو اشترِها من متجر الجنيات."}</span></div>
    <div class="scroll-x" id="gdChips" style="display:flex;gap:6px;overflow-x:auto;padding-bottom:6px">${(S.fairies || []).map(f => `<button class="pick" data-fid="${f.id}">${f.emoji} ${esc(f.name)}</button>`).join("")}</div>`;
  bindBack();
  const c = $("#gdC"); if (!(await loadThree())) { c.outerHTML = `<div class="card dim">تعذّر تحميل العرض ثلاثي الأبعاد (تحتاج اتصالًا بالإنترنت).</div>`; return; }
  if (!$("#gdC")) return;
  try { gardenInit(c); } catch (e) { c.outerHTML = `<div class="card dim">تعذّر فتح الحديقة على هذا الجهاز.</div>`; }
};

function gardenInit(c) {
  const T = window.THREE, low = qLow(), SEG = low ? 10 : 16, hour = new Date().getHours(), night = hour < 6 || hour >= 19;
  const renderer = new T.WebGLRenderer({ canvas: c, antialias: false, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, low ? 1 : 1.5));
  const sky = night ? 0x1a1f4a : 0xbfe8ff; renderer.setClearColor(sky);
  const scene = new T.Scene(); scene.fog = new T.Fog(sky, 40, 95);
  const camera = new T.PerspectiveCamera(46, 1, 0.5, 200);
  scene.add(new T.HemisphereLight(night ? 0x8898ff : 0xffffff, night ? 0x202040 : 0x5a8a4a, night ? 0.75 : 0.95));
  const sun = new T.DirectionalLight(night ? 0xaab8ff : 0xfff2d0, night ? 0.35 : 0.6); sun.position.set(14, 24, 10); scene.add(sun);
  const G = { s: new T.SphereGeometry(1, SEG, Math.round(SEG * 0.75)), c: new T.ConeGeometry(1, 1, SEG), y: new T.CylinderGeometry(1, 1, 1, SEG), b: new T.BoxGeometry(1, 1, 1) };
  const M = {}, mat = (col, o) => { const k = col + (o ? JSON.stringify(o) : ""); return M[k] || (M[k] = new T.MeshLambertMaterial(Object.assign({ color: col }, o || {}))); };
  const bas = (col, o) => new T.MeshBasicMaterial(Object.assign({ color: col }, o || {}));
  const mk = (g, m, sc, p, parent, rot) => { const o = new T.Mesh(G[g] || g, m); o.scale.set(sc[0], sc[1], sc[2]); o.position.set(p[0], p[1], p[2]); if (rot) o.rotation.set(rot[0], rot[1], rot[2]); (parent || scene).add(o); return o; };
  const rnd = (() => { let s = 12345; return () => (s = (s * 16807) % 2147483647) / 2147483647; })();
  const emoTex = {};
  const emoji = e => emoTex[e] || (emoTex[e] = (() => { const cv = document.createElement("canvas"); cv.width = cv.height = 128; const g = cv.getContext("2d"); g.font = "92px sans-serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(e, 64, 70); return new T.CanvasTexture(cv); })());

  // ---- الأرض والبيئات ----
  const disc = (r, col, x, z, y) => { const o = new T.Mesh(new T.CircleGeometry(r, 36), mat(col)); o.rotation.x = -Math.PI / 2; o.position.set(x, y, z); scene.add(o); return o; };
  disc(34, night ? 0x2f6a3a : 0x7ccf6a, 0, 0, 0);
  disc(8, night ? 0x3a7a46 : 0x8ee07a, 0, 0, 0.01);
  disc(8.5, night ? 0x244a2a : 0x4f9a4a, GD_REG.forest[0], GD_REG.forest[1], 0.01);
  disc(8.5, night ? 0x6a5f3f : 0xe6d49a, GD_REG.lake[0], GD_REG.lake[1], 0.01); disc(6, 0x4fb4e8, GD_REG.lake[0], GD_REG.lake[1], 0.03);
  disc(8.5, night ? 0x4a4a52 : 0x9a9a8a, GD_REG.peak[0], GD_REG.peak[1], 0.01);
  disc(8.5, night ? 0x4a6a2a : 0xa8e070, GD_REG.meadow[0], GD_REG.meadow[1], 0.01);

  // شجرة الجنيات الكبيرة
  mk("y", mat(0x8a5a32), [1, 5, 1], [0, 2.5, 0]); mk("y", mat(0x8a5a32), [1.5, 0.8, 1.5], [0, 0.4, 0]);
  [[0, 6.6, 0, 3.4, 0xf7a8d0], [-2.2, 5.6, 0.6, 2.4, 0xffc6e4], [2.3, 5.8, -0.4, 2.5, 0x9ae6d0], [0.4, 8.2, 0.3, 2.2, 0xffd6ea]].forEach(a => mk("s", mat(a[4]), [a[3], a[3] * 0.85, a[3]], [a[0], a[1], a[2]]));
  const orbs = []; for (let i = 0; i < (low ? 8 : 14); i++) { const a = rnd() * 6.28, r = 2 + rnd() * 3; orbs.push({ o: mk("s", bas(night ? 0xfff59a : 0xffe27a), [0.14, 0.14, 0.14], [Math.cos(a) * r, 4.5 + rnd() * 4, Math.sin(a) * r]), p: rnd() * 6 }); }
  // بيوت الفطر: بيت لكل جنية (3 على الأقل)
  const nF = (S.fairies || []).length, nH = Math.max(3, Math.min(12, nF)), capCols = [0xe0457a, 0x7a5ae0, 0x3fa6d6, 0xe0a030];
  for (let i = 0; i < nH; i++) {
    const a = i / nH * 6.283 + 0.3, r = 5.4 + (i % 2) * 1.2, x = Math.cos(a) * r, z = Math.sin(a) * r, s = 0.9 + (i % 3) * 0.15;
    mk("y", mat(0xf6efe0), [0.55 * s, 1.3 * s, 0.55 * s], [x, 0.65 * s, z]); mk("s", mat(capCols[i % 4]), [1.15 * s, 0.7 * s, 1.15 * s], [x, 1.5 * s, z]);
    for (let k = 0; k < 4; k++) { const b = k * 1.6 + i; mk("s", mat(0xffffff), [0.16, 0.06, 0.16], [x + Math.cos(b) * 0.75 * s, 1.85 * s + (k % 2) * 0.1, z + Math.sin(b) * 0.75 * s]); }
    mk("b", mat(0x7a4a2a), [0.3 * s, 0.5 * s, 0.06], [x - Math.cos(a) * 0.55 * s, 0.3 * s, z - Math.sin(a) * 0.55 * s], null, [0, -a + Math.PI / 2, 0]);
    mk("s", bas(night ? 0xffe27a : 0xfff1b0), [0.1, 0.1, 0.04], [x + Math.sin(a) * 0.5 * s, 0.9 * s, z - Math.cos(a) * 0.5 * s]);
  }
  // الغابة: أشجار مخروطية
  for (let i = 0; i < (low ? 7 : 11); i++) { const a = rnd() * 6.28, r = 2 + rnd() * 6, x = GD_REG.forest[0] + Math.cos(a) * r, z = GD_REG.forest[1] + Math.sin(a) * r, s = 0.8 + rnd() * 0.7; mk("y", mat(0x6b4a2a), [0.3 * s, 1.4 * s, 0.3 * s], [x, 0.7 * s, z]); [0, 1, 2].forEach(k => mk("c", mat(k % 2 ? 0x2f8a46 : 0x3a9a50), [(1.3 - k * 0.3) * s, 1.4 * s, (1.3 - k * 0.3) * s], [x, (1.7 + k * 0.9) * s, z])); }
  // البحيرة: أوراق نيلوفر وزنابق وقصب
  for (let i = 0; i < 7; i++) { const a = i * 0.9, r = 1.2 + (i % 3) * 1.4, x = GD_REG.lake[0] + Math.cos(a) * r, z = GD_REG.lake[1] + Math.sin(a) * r; mk("y", mat(0x3aa650), [0.6, 0.03, 0.6], [x, 0.07, z]); if (i % 2 === 0) mk("s", mat(0xff9ac8), [0.22, 0.16, 0.22], [x, 0.2, z]); }
  for (let i = 0; i < 12; i++) { const a = i / 12 * 6.28, x = GD_REG.lake[0] + Math.cos(a) * 6.3, z = GD_REG.lake[1] + Math.sin(a) * 6.3; mk("y", mat(0x5a9a3a), [0.05, 1.3, 0.05], [x, 0.65, z]); mk("y", mat(0x7a4a2a), [0.1, 0.35, 0.1], [x, 1.3, z]); }
  // القمة: صخور وبلورات
  for (let i = 0; i < 8; i++) { const a = rnd() * 6.28, r = 1 + rnd() * 6, x = GD_REG.peak[0] + Math.cos(a) * r, z = GD_REG.peak[1] + Math.sin(a) * r, s = 0.4 + rnd() * 0.9; mk("s", mat(0x8a8a96), [s, s * 0.7, s], [x, s * 0.4, z]); }
  [[0, 0, 1.6], [2, 1.2, 1.1], [-1.6, 1.4, 1.2]].forEach((p, i) => mk("c", bas([0xb08aff, 0x7ad0ff, 0xff9ad8][i], { transparent: true, opacity: 0.9 }), [0.5, p[2] * 1.5, 0.5], [GD_REG.peak[0] + p[0], p[2] * 0.75, GD_REG.peak[1] + p[1]]));
  // المرج: زهور
  const FL = [0xff6a8a, 0xffd24d, 0xffffff, 0x8ab0ff, 0xff9ad8];
  for (let i = 0; i < (low ? 26 : 46); i++) { const a = rnd() * 6.28, r = rnd() * 7.5, x = GD_REG.meadow[0] + Math.cos(a) * r, z = GD_REG.meadow[1] + Math.sin(a) * r; mk("y", mat(0x3a9a3a), [0.03, 0.5, 0.03], [x, 0.25, z]); mk("s", mat(FL[i % 5]), [0.16, 0.12, 0.16], [x, 0.55, z]); }
  // قوس قزح
  if (!night) [0xff5a5a, 0xffa23a, 0xffe14a, 0x5ad05a, 0x4aa8ff, 0xa06aff].forEach((col, i) => { const o = new T.Mesh(new T.TorusGeometry(15 - i * 0.55, 0.3, 6, low ? 20 : 36, Math.PI), bas(col, { transparent: true, opacity: 0.55 })); o.position.set(0, -1, -24); scene.add(o); });
  // اليراعات
  const flies = []; for (let i = 0; i < (low ? 12 : 24); i++) flies.push({ o: mk("s", bas(0xfff59a), [0.09, 0.09, 0.09], [0, 1, 0]), x: (rnd() - 0.5) * 36, z: (rnd() - 0.5) * 36, y: 0.8 + rnd() * 3, p: rnd() * 6, sp: 0.3 + rnd() * 0.5 });
  // سحب
  const clouds = []; if (!night) for (let i = 0; i < 5; i++) { const g = new T.Group(); [[0, 0, 0, 2.4], [2, -0.3, 0.4, 1.8], [-2, -0.2, -0.3, 1.9]].forEach(q => mk("s", bas(0xffffff, { transparent: true, opacity: 0.9 }), [q[3], q[3] * 0.5, q[3] * 0.7], [q[0], q[1], q[2]], g)); g.position.set(-30 + i * 15, 17 + (i % 2) * 3, -14 + (i % 3) * 10); scene.add(g); clouds.push(g); }

  // ---- الجنيات ----
  const fairies = [], FS = S.fairies || [];
  const mkFairy = f => {
    const col = GD_FAM[f.fam] || ["#ff9ad8", "#ffe0f2"], g = new T.Group(), sc = 0.95 + 0.1 * f.rar;
    const c1 = new T.Color(col[0]), c2 = new T.Color(col[1]);
    mk("c", mat(c1), [0.32, 0.75, 0.32], [0, 0.4, 0], g); mk("s", mat(0xffe0c8), [0.2, 0.2, 0.2], [0, 0.95, 0], g);
    mk("s", mat(GD_HAIR[Math.min(4, f.rar)]), [0.22, 0.14, 0.22], [0, 1.07, -0.02], g);
    [-1, 1].forEach(sx => { mk("s", mat(0x2a1a1a), [0.03, 0.03, 0.02], [sx * 0.07, 0.96, 0.18], g); mk("y", mat(0xffe0c8), [0.04, 0.4, 0.04], [sx * 0.26, 0.6, 0.05], g, [0, 0, sx * 0.7]); });
    if (f.rar >= 3) mk("c", mat(0xffd24d), [0.14, 0.2, 0.14], [0, 1.28, 0], g);
    const wl = new T.Group(), wr = new T.Group(); g.add(wl); g.add(wr); wl.position.set(-0.08, 0.85, -0.14); wr.position.set(0.08, 0.85, -0.14);
    const wm = bas(c2, { transparent: true, opacity: 0.7, side: T.DoubleSide });
    mk("s", wm, [0.42, 0.6, 0.04], [-0.3, 0.1, 0], wl, [0, 0, 0.5]); mk("s", wm, [0.42, 0.6, 0.04], [0.3, 0.1, 0], wr, [0, 0, -0.5]);
    mk("s", wm, [0.28, 0.38, 0.04], [-0.24, -0.35, 0], wl, [0, 0, -0.3]); mk("s", wm, [0.28, 0.38, 0.04], [0.24, -0.35, 0], wr, [0, 0, 0.3]);
    mk("s", bas(c1, { transparent: true, opacity: 0.13 }), [0.7, 0.8, 0.7], [0, 0.8, 0], g);                                       // هالة
    const spr = new T.Sprite(new T.SpriteMaterial({ map: emoji(f.emoji), transparent: true, depthWrite: false })); spr.scale.set(0.8, 0.8, 1); spr.position.set(0, 1.75, 0); g.add(spr);
    g.scale.set(sc, sc, sc); g.userData = { fid: f.id };
    scene.add(g); return { f, g, wl, wr, spr, ph: rnd() * 6, home: null, tx: 0, tz: 0, wait: 0, sel: 0 };
  };
  FS.forEach((f, i) => {
    const o = mkFairy(f), reg = f.hab && GD_REG[f.hab], a = i * 2.4;
    o.home = reg ? [reg[0], reg[1], 5] : [Math.cos(a) * 4, Math.sin(a) * 4, 9];
    o.g.position.set(o.home[0] + (rnd() - 0.5) * 3, 1.4, o.home[1] + (rnd() - 0.5) * 3); o.tx = o.g.position.x; o.tz = o.g.position.z; fairies.push(o);
  });
  const pick = o => { const h = o.home, a = rnd() * 6.28, r = rnd() * h[2]; o.tx = h[0] + Math.cos(a) * r; o.tz = h[1] + Math.sin(a) * r; };

  // ---- الكاميرا والتفاعل ----
  let az = 0.6, el = 0.62, dist = 34; const tgt = new T.Vector3(0, 2, 0), want = new T.Vector3(0, 2, 0);
  const place = () => { camera.position.set(tgt.x + Math.sin(az) * Math.cos(el) * dist, tgt.y + Math.sin(el) * dist, tgt.z + Math.cos(az) * Math.cos(el) * dist); camera.lookAt(tgt); };
  const resize = () => { const w = c.clientWidth || 360, h = c.clientHeight || 300; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); };
  resize(); window.addEventListener("resize", resize);
  let down = null, moved = 0; const ptr = new Map(); let pinch = null;
  const pan = { x: 0, z: 0 }, clampPan = () => { pan.x = Math.max(-30, Math.min(30, pan.x)); pan.z = Math.max(-30, Math.min(30, pan.z)); };
  const panBy = (dx, dy) => { const k = dist * 0.0018; pan.x += -Math.cos(az) * dx * k - Math.sin(az) * dy * k; pan.z += Math.sin(az) * dx * k - Math.cos(az) * dy * k; clampPan(); gdSel = null; };
  const zoom = f => { dist = Math.max(8, Math.min(55, dist * f)); };
  const two = () => { const p = [...ptr.values()]; return { d: Math.hypot(p[0][0] - p[1][0], p[0][1] - p[1][1]) || 1, x: (p[0][0] + p[1][0]) / 2, y: (p[0][1] + p[1][1]) / 2 }; };
  c.addEventListener("pointerdown", e => { ptr.set(e.pointerId, [e.clientX, e.clientY]); down = [e.clientX, e.clientY]; moved = 0; if (ptr.size === 2) pinch = two(); try { c.setPointerCapture(e.pointerId); } catch (x) { /* لا شيء */ } });
  c.addEventListener("pointermove", e => {
    if (!ptr.has(e.pointerId)) return; ptr.set(e.pointerId, [e.clientX, e.clientY]);
    if (ptr.size >= 2) { const n = two(); if (pinch) { zoom(pinch.d / n.d); panBy(n.x - pinch.x, n.y - pinch.y); } pinch = n; moved = 99; return; }
    if (!down) return; const dx = e.clientX - down[0], dy = e.clientY - down[1]; moved += Math.abs(dx) + Math.abs(dy); az -= dx * 0.008; el = Math.max(0.25, Math.min(1.35, el + dy * 0.005)); down = [e.clientX, e.clientY];
  });
  const endP = e => { ptr.delete(e.pointerId); if (ptr.size < 2) pinch = null; };
  c.addEventListener("pointercancel", endP);
  const ray = new T.Raycaster(), ndc = new T.Vector2();
  c.addEventListener("pointerup", e => {
    const was = down; down = null; endP(e); if (!was || moved > 8) return;
    const r = c.getBoundingClientRect(); ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); ray.setFromCamera(ndc, camera);
    const hits = ray.intersectObjects(fairies.map(o => o.g), true);
    for (const h of hits) { let o = h.object; while (o && !(o.userData && o.userData.fid)) o = o.parent; if (o) { select(o.userData.fid); return; } }
  });
  c.addEventListener("wheel", e => { e.preventDefault(); zoom(e.deltaY > 0 ? 1.1 : 0.9); }, { passive: false });
  const sel = () => fairies.find(o => o.f.id === gdSel);
  function select(id) {
    gdSel = id; const o = sel(), box = $("#gdInfo"); if (!o || !box) return; buzz();
    const f = o.f; o.wait = 4; want.set(o.g.position.x, 2, o.g.position.z);
    box.innerHTML = `<div class="row"><div style="font-size:38px">${f.emoji}</div><div class="grow"><b>${esc(f.name)}</b> <span class="tag">${f.rankEmoji} ${esc(f.rarName)}</span><div class="dim">مستوى ${f.lv} · ${esc(f.species)}${f.hab ? " · 🌿 في البيئة" : ""}${f.equipped ? " · ✅ مجهّزة" : ""}</div><div style="margin-top:4px">✨ ${esc(f.buff || "بلا بَف")}</div></div></div>
      <button class="btn sm" id="gdMng" style="margin-top:8px">⚙️ إدارة الجنية</button>`;
    $("#gdMng").onclick = () => { buzz(); SUBS.fairies(); };
  }
  const bz = (id, fn) => { const b = document.getElementById(id); if (b) b.onclick = () => { buzz(); fn(); }; };
  bz("gdIn", () => zoom(0.8)); bz("gdOut", () => zoom(1.25)); bz("gdRst", () => { pan.x = pan.z = 0; gdSel = null; dist = 34; el = 0.62; });
  document.querySelectorAll("#gdChips [data-fid]").forEach(b => b.onclick = () => select(Number(b.dataset.fid)));

  // ---- الحلقة ----
  let last = performance.now(), t = 0;
  const loop = now => {
    if (!c.isConnected) { window.removeEventListener("resize", resize); renderer.dispose(); return; }
    requestAnimationFrame(loop);
    if (document.hidden) { last = now; return; }
    const dt = Math.min(0.05, (now - last) / 1000); last = now; t += dt;
    fairies.forEach(o => {
      const g = o.g, dx = o.tx - g.position.x, dz = o.tz - g.position.z, d = Math.hypot(dx, dz);
      if (o.wait > 0) o.wait -= dt;
      else if (d < 0.4) { o.wait = 0.5 + rnd() * 2; pick(o); }
      else { const sp = 1.6 * dt; g.position.x += dx / d * sp; g.position.z += dz / d * sp; const ty = Math.atan2(dx, dz); g.rotation.y += Math.atan2(Math.sin(ty - g.rotation.y), Math.cos(ty - g.rotation.y)) * Math.min(1, dt * 5); }
      g.position.y = 1.4 + Math.sin(t * 2 + o.ph) * 0.25 + (gdSel === o.f.id ? 0.35 : 0);
      const fl = Math.sin(t * 22 + o.ph) * 0.55; o.wl.rotation.y = fl; o.wr.rotation.y = -fl;
      o.spr.position.y = 1.75 + Math.sin(t * 3 + o.ph) * 0.06;
    });
    flies.forEach(q => { q.o.position.set(q.x + Math.sin(t * q.sp + q.p) * 2, q.y + Math.sin(t * 1.3 + q.p) * 0.5, q.z + Math.cos(t * q.sp * 0.8 + q.p) * 2); q.o.scale.setScalar(0.07 + 0.04 * (1 + Math.sin(t * 3 + q.p)) * (night ? 1.4 : 0.8)); });
    orbs.forEach(q => { q.o.position.y += Math.sin(t * 1.5 + q.p) * 0.004; });
    clouds.forEach(q => { q.position.x += dt * 0.6; if (q.position.x > 40) q.position.x = -40; });
    const f0 = sel(); if (f0) { want.set(f0.g.position.x, 2, f0.g.position.z); pan.x = f0.g.position.x; pan.z = f0.g.position.z; } else want.set(pan.x, 2, pan.z);
    tgt.lerp(want, Math.min(1, dt * 2)); 
    place(); renderer.render(scene, camera);
  };
  gdSel = null; place(); requestAnimationFrame(loop);
}
