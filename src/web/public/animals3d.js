"use strict";
// نماذج الحيوانات ثلاثية الأبعاد: مجسّمات منخفضة التفاصيل تُبنى من أشكال بسيطة (كرة، صندوق، مخروط، أسطوانة)،
// لكل نوع وصفة (قالب جسم + ألوان + إضافات). هذا الملف بيانات خالصة بلا three.js، فيمكن معاينته بأي رسم.
// المحاور: y للأعلى، الحيوان ينظر نحو +z. الجزء: {k: s|b|c|y, s: الأبعاد, p: المركز, c: اللون, r: دوران، pv: محور التأرجح، an: حركة، ph: طور، hi: تفصيل للعرض القريب فقط}
//   s: كرة [نصف قطر x,y,z] · b: صندوق [عرض,ارتفاع,عمق] · c: مخروط [نصف القطر,الارتفاع,نصف القطر] · y: أسطوانة [نصف القطر,الارتفاع,نصف القطر]
(function () {
  const S = (s, p, c, o) => Object.assign({ k: "s", s, p, c }, o);
  const B = (s, p, c, o) => Object.assign({ k: "b", s, p, c }, o);
  const C = (s, p, c, o) => Object.assign({ k: "c", s, p, c }, o);
  const Y = (s, p, c, o) => Object.assign({ k: "y", s, p, c }, o);
  const DK = "#1c1c22", WH = "#f4f4f0", PI = "#e89aa5", OR = "#f0a030";
  const eyes = (y, z, x, r, o) => [S([r * 1.55, r * 1.55, r * 0.9], [x, y, z - r * 0.25], WH, { hi: 1 }), S([r * 1.55, r * 1.55, r * 0.9], [-x, y, z - r * 0.25], WH, { hi: 1 }), S([r, r, r], [x, y, z + r * 0.15], DK, Object.assign({ hi: 1 }, o)), S([r, r, r], [-x, y, z + r * 0.15], DK, Object.assign({ hi: 1 }, o))];

  // ---------- ذوات الأربع ----------
  function quad(o) {
    const P = [], L = o.leg == null ? 1 : o.leg, legH = 0.24 * L, bw = o.w || 1, bh = o.h || 1, bl = o.l || 1, hs = (o.hs || 1) * 1.3;   // رأس أكبر وأرجل أقصر وأسمك: شكل لطيف بدل «الحشرة»
    const by = legH + 0.29 * bh, neck = o.neck || 0, c = o.c, c2 = o.c2 || o.c;
    P.push(S([0.34 * bw, 0.3 * bh, 0.56 * bl], [0, by, 0], c), S([0.32 * bw, 0.29 * bh, 0.34 * bl], [0, by - 0.005, -0.18 * bl], c), S([0.31 * bw, 0.3 * bh, 0.34 * bl], [0, by + 0.01, 0.18 * bl], c));   // جسم واحد متصل بدل ثلاث كرات متفاوتة (كانت تشبه جسم الحشرة)
    if (!o.neck) P.push(S([0.14 * hs, 0.14 * hs, 0.15 * hs], [0, by + 0.08 * bh, 0.36 * bl], o.hc || c));
    if (o.belly) P.push(S([0.3 * bw, 0.22 * bh, 0.5 * bl], [0, by - 0.07, 0.03], c2));
    const hy = by + 0.12 * bh + neck, hz = 0.44 * bl + 0.04 * hs + (neck ? 0.06 : 0);
    if (neck) P.push(Y([0.1 * hs, neck + 0.22, 0.1 * hs], [0, by + 0.08 + neck / 2, 0.4 * bl], c, { r: [0.35, 0, 0] }));
    P.push(S([0.2 * hs, 0.19 * hs, 0.21 * hs], [0, hy, hz], o.hc || c));
    const sn = o.sn == null ? 1 : o.sn;
    if (sn > 0) {
      P.push(S([0.1 * hs * sn, 0.085 * hs, 0.12 * hs * sn], [0, hy - 0.05 * hs, hz + 0.17 * hs * sn], o.snc || c2));
      P.push(S([0.035, 0.03, 0.03], [0, hy - 0.02 * hs, hz + 0.17 * hs * sn + 0.1 * hs * sn], DK, { hi: 1 }));
    }
    P.push(...eyes(hy + 0.05 * hs, hz + 0.14 * hs, 0.09 * hs, 0.035 * hs));
    if (o.patch) P.push(S([0.06, 0.07, 0.04], [0.09 * hs, hy + 0.05 * hs, hz + 0.16 * hs], DK, { hi: 1 }), S([0.06, 0.07, 0.04], [-0.09 * hs, hy + 0.05 * hs, hz + 0.16 * hs], DK, { hi: 1 }));
    const ec = o.ec || c, ez = hz - 0.04;
    if (o.ear === "point") P.push(C([0.075, 0.17, 0.075], [0.12 * hs, hy + 0.2 * hs, ez], ec), C([0.075, 0.17, 0.075], [-0.12 * hs, hy + 0.2 * hs, ez], ec), C([0.04, 0.11, 0.03], [0.12 * hs, hy + 0.19 * hs, ez + 0.03], PI, { hi: 1 }), C([0.04, 0.11, 0.03], [-0.12 * hs, hy + 0.19 * hs, ez + 0.03], PI, { hi: 1 }));
    else if (o.ear === "round") P.push(S([0.08, 0.08, 0.04], [0.14 * hs, hy + 0.17 * hs, ez], ec), S([0.08, 0.08, 0.04], [-0.14 * hs, hy + 0.17 * hs, ez], ec));
    else if (o.ear === "bigRound") P.push(S([0.14, 0.14, 0.05], [0.2 * hs, hy + 0.12 * hs, ez], ec), S([0.14, 0.14, 0.05], [-0.2 * hs, hy + 0.12 * hs, ez], ec));
    else if (o.ear === "long") P.push(B([0.07, 0.36, 0.05], [0.08 * hs, hy + 0.3, ez - 0.02], ec, { r: [0, 0, -0.12] }), B([0.07, 0.36, 0.05], [-0.08 * hs, hy + 0.3, ez - 0.02], ec, { r: [0, 0, 0.12] }));
    else if (o.ear === "floppy") P.push(B([0.07, 0.22, 0.1], [0.2 * hs, hy, ez], ec, { r: [0, 0, 0.25] }), B([0.07, 0.22, 0.1], [-0.2 * hs, hy, ez], ec, { r: [0, 0, -0.25] }));
    else if (o.ear === "huge") P.push(S([0.03, 0.3, 0.26], [0.28 * hs, hy - 0.02, ez - 0.06], ec), S([0.03, 0.3, 0.26], [-0.28 * hs, hy - 0.02, ez - 0.06], ec));
    if (o.mane) P.push(S([0.3, 0.3, 0.2], [0, hy, hz - 0.1], o.mane), S([0.24, 0.24, 0.1], [0, hy, hz - 0.02], o.mane));
    if (o.horn === "bull") P.push(C([0.045, 0.22, 0.045], [0.2, hy + 0.16, ez], WH, { r: [0, 0, -1.1] }), C([0.045, 0.22, 0.045], [-0.2, hy + 0.16, ez], WH, { r: [0, 0, 1.1] }));
    if (o.horn === "one") P.push(C([0.06, 0.3, 0.06], [0, hy + 0.04 * hs, hz + 0.3 * hs * Math.max(sn, 1)], o.hornc || "#e9e0c8", { r: [0.9, 0, 0] }));
    if (o.horn === "uni") P.push(C([0.05, 0.4, 0.05], [0, hy + 0.3, hz + 0.1], "#ffd24d", { r: [0.35, 0, 0] }));
    if (o.horn === "big") P.push(C([0.06, 0.28, 0.06], [0.12, hy + 0.27, ez - 0.02], "#e0d4b0", { r: [0, 0, -0.3] }), C([0.06, 0.28, 0.06], [-0.12, hy + 0.27, ez - 0.02], "#e0d4b0", { r: [0, 0, 0.3] }));
    if (o.antler) [1, -1].forEach(sx => P.push(Y([0.025, 0.4, 0.025], [sx * 0.1, hy + 0.34, ez - 0.02], o.antler, { r: [0, 0, -sx * 0.3] }), C([0.02, 0.2, 0.02], [sx * 0.2, hy + 0.42, ez - 0.02], o.antler, { r: [0, 0, -sx * 0.7] }), C([0.02, 0.18, 0.02], [sx * 0.16, hy + 0.3, ez + 0.05], o.antler, { r: [0.6, 0, -sx * 0.3] })));
    if (o.trunk) P.push(Y([0.07, 0.5, 0.07], [0, hy - 0.2, hz + 0.28], c2, { r: [0.25, 0, 0], an: "tail", ph: 0 }), Y([0.09, 0.1, 0.09], [0, hy - 0.44, hz + 0.3], c2));
    if (o.tusk) P.push(C([0.035, 0.28, 0.035], [0.12, hy - 0.2, hz + 0.18], WH, { r: [2.0, 0, -0.1] }), C([0.035, 0.28, 0.035], [-0.12, hy - 0.2, hz + 0.18], WH, { r: [2.0, 0, 0.1] }));
    if (o.fang) P.push(C([0.025, 0.1, 0.025], [0.06, hy - 0.12 * hs, hz + 0.22 * hs], WH, { r: [3.14, 0, 0], hi: 1 }), C([0.025, 0.1, 0.025], [-0.06, hy - 0.12 * hs, hz + 0.22 * hs], WH, { r: [3.14, 0, 0], hi: 1 }));
    if (o.stripes) for (let i = -2; i <= 2; i++) P.push(B([0.62 * bw, 0.04, 0.07], [0, by + 0.24 * bh, i * 0.19 * bl], o.stripes, { hi: 1 }));
    if (o.spots) for (let i = 0; i < 7; i++) P.push(S([0.05, 0.05, 0.05], [((i % 2) ? 1 : -1) * 0.18 * bw, by + 0.13 * bh + (i % 3) * 0.04, -0.4 * bl + i * 0.13 * bl], o.spots, { hi: 1 }));
    if (o.hump) P.push(S([0.2, 0.2, 0.22], [0, by + 0.25, 0.12], o.hump));
    if (o.back) for (let i = 0; i < 5; i++) P.push(C([0.05, 0.14, 0.05], [0, by + 0.3 * bh + 0.02, 0.32 * bl - i * 0.17 * bl], o.back));
    // الذيل
    const tz = -0.48 * bl, ty = by + 0.04, tc = o.tc || c;
    if (o.tail === "long") P.push(Y([0.04, 0.55, 0.04], [0, ty + 0.1, tz - 0.2], tc, { r: [-1.0, 0, 0], pv: [0, ty, tz], an: "tail" }));
    else if (o.tail === "thin") P.push(Y([0.025, 0.5, 0.025], [0, ty - 0.05, tz - 0.22], tc, { r: [-1.2, 0, 0], pv: [0, ty, tz], an: "tail" }));
    else if (o.tail === "fluff") P.push(S([0.11, 0.11, 0.11], [0, ty + 0.04, tz - 0.08], tc));
    else if (o.tail === "up") P.push(Y([0.045, 0.34, 0.045], [0, ty + 0.18, tz - 0.06], tc, { r: [-0.5, 0, 0], pv: [0, ty, tz], an: "tail" }));
    else if (o.tail === "bushy") P.push(S([0.14, 0.14, 0.32], [0, ty + 0.06, tz - 0.3], tc, { r: [0.4, 0, 0], pv: [0, ty, tz], an: "tail" }), S([0.1, 0.1, 0.12], [0, ty + 0.1, tz - 0.55], o.tip || tc));
    else if (o.tail === "squirrel") P.push(S([0.14, 0.3, 0.14], [0, ty + 0.3, tz - 0.12], tc, { r: [-0.2, 0, 0] }));
    else if (o.tail === "croc") P.push(Y([0.1, 0.9, 0.1], [0, ty - 0.08, tz - 0.38], tc, { r: [-1.45, 0, 0], pv: [0, ty, tz], an: "tail" }));
    else if (o.tail === "horse") P.push(S([0.07, 0.3, 0.07], [0, ty - 0.12, tz - 0.12], o.mc || tc, { r: [0.25, 0, 0], pv: [0, ty, tz], an: "tail" }));
    // الأرجل
    const lw = o.lw || 0.115, lc = o.lc || c, lz = 0.27 * bl, lx = 0.2 * bw;
    [[1, 1, 0], [-1, 1, 3.14], [1, -1, 3.14], [-1, -1, 0]].forEach(l => P.push(Y([lw, legH, lw], [l[0] * lx, legH / 2, l[1] * lz], lc, { pv: [l[0] * lx, legH, l[1] * lz], an: "leg", ph: l[2] }), S([lw * 1.25, 0.06, lw * 1.7], [l[0] * lx, 0.04, l[1] * lz + 0.03], o.fc || lc, { pv: [l[0] * lx, legH, l[1] * lz], an: "leg", ph: l[2] })));
    return P;
  }

  // ---------- الطيور ----------
  function bird(o) {
    const P = [], up = o.up, c = o.c, c2 = o.c2 || c, legH = o.leg == null ? 0.16 : o.leg, sz = o.bs || 1;
    const by = legH + 0.3 * sz;
    P.push(S([0.28 * sz, 0.3 * sz * (up ? 1.25 : 1), 0.32 * sz], [0, by, 0], c, up ? { r: [0.15, 0, 0] } : {}));
    P.push(S([0.2 * sz, 0.2 * sz * (up ? 1.2 : 1), 0.2 * sz], [0, by - 0.05, 0.08 * sz], c2));
    const neck = o.neck || 0, hy = by + 0.3 * sz * (up ? 1.2 : 0.7) + neck, hz = up ? 0.04 : 0.2 * sz;
    if (neck) P.push(Y([0.07, neck + 0.1, 0.07], [0, by + 0.18 + neck / 2, 0.12 * sz], c));
    P.push(S([0.25 * sz, 0.24 * sz, 0.24 * sz], [0, hy, hz], o.hc || c));
    if (o.face) P.push(S([0.14 * sz, 0.12 * sz, 0.06], [0, hy, hz + 0.2 * sz], o.face));
    const bk = o.beak || OR;
    if (o.beakT === "flat") P.push(B([0.14, 0.04, 0.2], [0, hy - 0.04, hz + 0.32 * sz], bk));
    else if (o.beakT === "hook") P.push(C([0.06, 0.2, 0.06], [0, hy - 0.04, hz + 0.3 * sz], bk, { r: [1.9, 0, 0] }));
    else P.push(C([0.055, 0.17, 0.055], [0, hy - 0.02, hz + 0.3 * sz], bk, { r: [1.57, 0, 0] }));
    P.push(...eyes(hy + 0.05 * sz, hz + 0.19 * sz, 0.1 * sz, 0.04, o.eyeC ? { c: o.eyeC } : {}));
    if (o.owl) P.push(S([0.07, 0.07, 0.03], [0.08, hy + 0.04, hz + 0.23], "#ffe27a", { hi: 1 }), S([0.07, 0.07, 0.03], [-0.08, hy + 0.04, hz + 0.23], "#ffe27a", { hi: 1 }), C([0.05, 0.12, 0.05], [0.12, hy + 0.2, hz], c), C([0.05, 0.12, 0.05], [-0.12, hy + 0.2, hz], c));
    if (o.crest) P.push(C([0.05, 0.22, 0.05], [0, hy + 0.24 * sz, hz - 0.02], o.crest, { r: [-0.2, 0, 0] }), C([0.04, 0.16, 0.04], [0.05, hy + 0.2 * sz, hz - 0.04], o.crest, { r: [-0.2, 0, 0.3] }), C([0.04, 0.16, 0.04], [-0.05, hy + 0.2 * sz, hz - 0.04], o.crest, { r: [-0.2, 0, -0.3] }));
    if (o.comb) P.push(S([0.04, 0.09, 0.07], [0, hy + 0.2, hz + 0.02], "#e0302a"), S([0.03, 0.06, 0.03], [0, hy - 0.14, hz + 0.2], "#e0302a"));
    P.push(S([0.2 * sz, 0.16 * sz, 0.14 * sz], [0, by - 0.1, 0.24 * sz], c2, { hi: 1 }));
    const ww = o.ww || 1;
    const wing = sx => B([0.05, 0.26 * sz, 0.4 * ww], [sx * (0.3 * sz + 0.02), by + 0.02, -0.02], o.wc || c, { pv: [sx * 0.28 * sz, by + 0.14, 0], an: "wing", ph: sx > 0 ? 1 : -1, r: [0.1, 0, sx * 0.25] });
    P.push(wing(1), wing(-1));
    if (o.tail === "wide") P.push(B([0.34, 0.03, 0.4], [0, by + 0.02, -0.5], o.tc || c, { r: [0.25, 0, 0], an: "tail" }));
    else if (o.tail === "fan") for (let i = -3; i <= 3; i++) P.push(C([0.09, 0.7, 0.09], [i * 0.12, by + 0.25 + Math.abs(i) * -0.02, -0.55], i % 2 ? "#2f9e6a" : "#2a7ac9", { r: [-1.2, 0, -i * 0.12], an: "tail" }));
    if (o.tail === "fan" && o.dots) for (let i = -3; i <= 3; i++) P.push(S([0.045, 0.045, 0.02], [i * 0.17, by + 0.6 - Math.abs(i) * 0.05, -0.9], "#ffd24d", { hi: 1 }));
    else if (o.tail === "long") P.push(B([0.1, 0.03, 0.6], [0, by + 0.06, -0.55], o.tc || c, { r: [0.15, 0, 0], an: "tail" }));
    else if (o.tail === "flame") P.push(C([0.14, 0.8, 0.14], [0, by + 0.05, -0.55], "#ff7a1a", { r: [-1.57, 0, 0], an: "tail" }), C([0.09, 0.6, 0.09], [0.1, by + 0.15, -0.5], "#ffd24d", { r: [-1.57, 0, 0.3], an: "tail" }), C([0.09, 0.6, 0.09], [-0.1, by + 0.15, -0.5], "#ff3a3a", { r: [-1.57, 0, -0.3], an: "tail" }));
    else P.push(B([0.2, 0.04, 0.2], [0, by, -0.34 * sz], o.tc || c, { r: [0.4, 0, 0] }));
    const lc = o.lc || OR;
    if (up) [1, -1].forEach(sx => P.push(B([0.14, 0.04, 0.2], [sx * 0.1, 0.03, 0.06], lc, { pv: [sx * 0.1, 0.2, 0], an: "leg", ph: sx > 0 ? 0 : 3.14 })));
    else [1, -1].forEach(sx => P.push(Y([0.05, legH, 0.05], [sx * 0.11, legH / 2, 0.02], lc, { pv: [sx * 0.1, legH, 0.02], an: "leg", ph: sx > 0 ? 0 : 3.14 })));
    return P;
  }

  // ---------- الماء ----------
  function fish(o) {
    const P = [], c = o.c, c2 = o.c2 || c, k = o.k || 1, y = 0.45 * k;
    P.push(S([0.22 * k * (o.fat || 1), 0.26 * k * (o.fat || 1), 0.55 * k], [0, y, 0], c));
    P.push(S([0.18 * k * (o.fat || 1), 0.16 * k, 0.45 * k], [0, y - 0.1 * k, 0.04], c2));
    P.push(C([0.2 * k, 0.4 * k, 0.04], [0, y, -0.7 * k], o.tc || c, { r: [-1.57, 0, 0], an: "tail" }));
    if (o.flukes) P.splice(P.length - 1, 1, B([0.7 * k, 0.05, 0.25 * k], [0, y + 0.05, -0.72 * k], o.tc || c, { an: "tail" }));
    P.push(C([0.06 * k, 0.3 * k * (o.fin || 1), 0.06 * k], [0, y + 0.3 * k * (o.fat || 1), -0.05], o.fc || c, { r: [-0.35, 0, 0] }));
    [1, -1].forEach(sx => P.push(C([0.05, 0.22 * k, 0.05], [sx * 0.24 * k, y - 0.08 * k, 0.18 * k], o.fc || c, { r: [0.4, 0, sx * -1.3], an: "wing", ph: sx })));
    P.push(...eyes(y + 0.08 * k, 0.4 * k, 0.15 * k * (o.fat || 1), 0.045 * k));
    if (o.teeth) P.push(C([0.03, 0.08, 0.03], [0.05, y - 0.1 * k, 0.55 * k], WH, { r: [3.14, 0, 0], hi: 1 }), C([0.03, 0.08, 0.03], [-0.05, y - 0.1 * k, 0.55 * k], WH, { r: [3.14, 0, 0], hi: 1 }));
    return P;
  }
  function squid(o) {
    const P = [], c = o.c, y = 0.7;
    P.push(S([0.3, 0.38, 0.3], [0, y + 0.18, -0.04], c));
    P.push(S([0.26, 0.24, 0.26], [0, y - 0.05, 0.04], o.c2 || c));
    P.push(...eyes(y, 0.22, 0.14, 0.06, { c: o.eyeC || "#ffe27a" }));
    const n = o.n || 8;
    for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2; P.push(Y([0.045, 0.6, 0.045], [Math.cos(a) * 0.2, y - 0.4, Math.sin(a) * 0.2], o.tc || c, { pv: [Math.cos(a) * 0.2, y - 0.1, Math.sin(a) * 0.2], an: "leg", ph: i })); }
    if (o.stars) for (let i = 0; i < 5; i++) P.push(S([0.03, 0.03, 0.03], [Math.cos(i * 1.3) * 0.22, y + 0.2 + (i % 3) * 0.1, Math.sin(i * 1.3) * 0.2], "#fff6a8", { hi: 1 }));
    return P;
  }
  function snake(o) {
    const P = [];
    for (let i = 0; i < 9; i++) { const r = 0.2 - i * 0.015; P.push(S([r, r, r * 1.15], [Math.sin(i * 0.9) * 0.14, 0.2 - i * 0.004, -i * 0.26 + 0.35], i % 2 ? o.c2 || o.c : o.c, { an: "tail", ph: i * 0.6 })); }
    P.push(S([0.22, 0.17, 0.25], [0, 0.26, 0.55], o.c));
    P.push(...eyes(0.34, 0.68, 0.1, 0.045, { c: o.eyeC || "#ffd24d" }));
    P.push(B([0.03, 0.02, 0.18], [0, 0.22, 0.82], "#d93a3a", { hi: 1 }));
    if (o.glow) P.push(S([0.07, 0.07, 0.07], [0, 0.5, 0.2], o.glow, { hi: 1 }));
    return P;
  }

  // ---------- زواحف وديناصورات ----------
  function dino(o) {
    const P = [], c = o.c, c2 = o.c2 || c;
    P.push(S([0.34, 0.36, 0.55], [0, 0.78, 0], c), S([0.26, 0.2, 0.46], [0, 0.66, 0.04], c2));
    P.push(S([0.26, 0.26, 0.34], [0, 1.16, 0.5], c), B([0.3, 0.16, 0.3], [0, 1.08, 0.76], c));
    P.push(...eyes(1.24, 0.64, 0.14, 0.04, { c: "#ffd24d" }));
    P.push(C([0.04, 0.1, 0.04], [0.07, 1.0, 0.84], WH, { r: [3.14, 0, 0], hi: 1 }), C([0.04, 0.1, 0.04], [-0.07, 1.0, 0.84], WH, { r: [3.14, 0, 0], hi: 1 }));
    P.push(Y([0.14, 1.0, 0.14], [0, 0.72, -0.9], c, { r: [-1.45, 0, 0], pv: [0, 0.78, -0.4], an: "tail" }));
    [1, -1].forEach((sx, i) => P.push(Y([0.12, 0.6, 0.12], [sx * 0.22, 0.3, 0.05], c, { pv: [sx * 0.22, 0.6, 0.05], an: "leg", ph: i ? 3.14 : 0 }), B([0.18, 0.06, 0.26], [sx * 0.22, 0.03, 0.12], c2, { pv: [sx * 0.22, 0.6, 0.05], an: "leg", ph: i ? 3.14 : 0 }), Y([0.05, 0.2, 0.05], [sx * 0.2, 0.84, 0.46], c2, { r: [0.5, 0, 0] })));
    for (let i = 0; i < 4; i++) P.push(C([0.06, 0.14, 0.06], [0, 1.1 - i * 0.07, 0.02 - i * 0.24], o.back || c2));
    return P;
  }
  function croc(o) {
    const P = [], c = o.c;
    P.push(S([0.3, 0.18, 0.75], [0, 0.26, 0], c), S([0.24, 0.1, 0.62], [0, 0.18, 0], o.c2 || c));
    P.push(B([0.3, 0.14, 0.55], [0, 0.26, 0.85], c), B([0.26, 0.05, 0.5], [0, 0.18, 0.86], o.c2 || c));
    P.push(...eyes(0.38, 0.72, 0.1, 0.045, { c: "#ffd24d" }));
    P.push(C([0.04, 0.08, 0.04], [0.1, 0.22, 1.1], WH, { r: [3.14, 0, 0], hi: 1 }), C([0.04, 0.08, 0.04], [-0.1, 0.22, 1.1], WH, { r: [3.14, 0, 0], hi: 1 }));
    P.push(Y([0.12, 1.0, 0.12], [0, 0.22, -1.0], c, { r: [-1.57, 0, 0], an: "tail" }));
    [[1, 1], [-1, 1], [1, -1], [-1, -1]].forEach((l, i) => P.push(Y([0.07, 0.2, 0.07], [l[0] * 0.3, 0.1, l[1] * 0.4], c, { pv: [l[0] * 0.3, 0.2, l[1] * 0.4], an: "leg", ph: i % 3 ? 3.14 : 0 })));
    for (let i = 0; i < 6; i++) P.push(C([0.045, 0.1, 0.045], [0, 0.42, 0.5 - i * 0.26], o.back || "#2f5a2a"));
    return P;
  }
  function turtle(o) {
    const P = [];
    P.push(S([0.42, 0.28, 0.5], [0, 0.34, 0], o.c), S([0.3, 0.12, 0.36], [0, 0.55, 0], o.c2 || o.c));
    P.push(S([0.38, 0.1, 0.46], [0, 0.2, 0], "#c9b87a"));
    P.push(S([0.15, 0.14, 0.17], [0, 0.34, 0.62], (o.sk || "#7fb06a")), ...eyes(0.4, 0.72, 0.07, 0.03));
    [[1, 1], [-1, 1], [1, -1], [-1, -1]].forEach((l, i) => P.push(Y([0.08, 0.16, 0.08], [l[0] * 0.3, 0.08, l[1] * 0.32], (o.sk || "#7fb06a"), { pv: [l[0] * 0.3, 0.16, l[1] * 0.32], an: "leg", ph: i % 3 ? 3.14 : 0 })));
    P.push(C([0.06, 0.14, 0.06], [0, 0.3, -0.55], (o.sk || "#7fb06a"), { r: [-1.57, 0, 0] }));
    return P;
  }
  function frog(o) {
    const P = [], c = o.c;
    P.push(S([0.3, 0.24, 0.34], [0, 0.3, 0], c), S([0.24, 0.16, 0.28], [0, 0.22, 0.04], o.c2 || WH));
    P.push(S([0.24, 0.17, 0.2], [0, 0.42, 0.28], c), S([0.06, 0.06, 0.05], [0, 0.4, 0.46], PI, { hi: 1 }));
    [1, -1].forEach(sx => P.push(S([0.08, 0.08, 0.08], [sx * 0.12, 0.6, 0.3], WH), S([0.04, 0.04, 0.04], [sx * 0.12, 0.61, 0.36], DK, { hi: 1 }),
      S([0.1, 0.1, 0.22], [sx * 0.3, 0.14, -0.1], c, { pv: [sx * 0.3, 0.2, -0.1], an: "leg", ph: sx > 0 ? 0 : 3.14 }), B([0.1, 0.04, 0.24], [sx * 0.3, 0.03, 0.08], c, { pv: [sx * 0.3, 0.2, -0.1], an: "leg", ph: sx > 0 ? 0 : 3.14 }),
      Y([0.05, 0.2, 0.05], [sx * 0.2, 0.1, 0.3], c)));
    return P;
  }

  // ---------- حشرات ----------
  function butterfly(o) {
    const P = [];
    P.push(S([0.06, 0.06, 0.2], [0, 0.7, 0], DK), S([0.07, 0.07, 0.07], [0, 0.72, 0.2], DK));
    [1, -1].forEach(sx => P.push(B([0.4, 0.03, 0.3], [sx * 0.24, 0.74, 0.04], o.c, { pv: [0, 0.72, 0], an: "wing", ph: sx }), B([0.3, 0.03, 0.24], [sx * 0.2, 0.74, -0.2], o.c2, { pv: [0, 0.72, 0], an: "wing", ph: sx }),
      Y([0.01, 0.2, 0.01], [sx * 0.04, 0.82, 0.28], DK, { r: [0.5, 0, 0], hi: 1 })));
    return P;
  }
  function bee(o) {
    const P = [];
    P.push(S([0.2, 0.2, 0.28], [0, 0.6, 0], "#f2c230"));
    for (let i = 0; i < 3; i++) P.push(B([0.3, 0.26, 0.05], [0, 0.6, -0.16 + i * 0.14], DK, { hi: 1 }));
    P.push(S([0.14, 0.14, 0.14], [0, 0.62, 0.3], "#f2c230"), ...eyes(0.66, 0.38, 0.08, 0.035), C([0.04, 0.12, 0.04], [0, 0.58, -0.38], DK, { r: [-1.57, 0, 0] }));
    [1, -1].forEach(sx => P.push(B([0.3, 0.02, 0.18], [sx * 0.2, 0.82, 0], "#dff1ff", { pv: [0, 0.78, 0], an: "wing", ph: sx })));
    return P;
  }
  function scorpion(o) {
    const P = [], c = o.c;
    P.push(S([0.3, 0.14, 0.4], [0, 0.2, 0], c), S([0.18, 0.12, 0.18], [0, 0.2, 0.44], c), ...eyes(0.3, 0.56, 0.07, 0.03));
    [1, -1].forEach(sx => P.push(Y([0.04, 0.3, 0.04], [sx * 0.2, 0.22, 0.62], c, { r: [1.57, 0, 0] }), S([0.13, 0.06, 0.15], [sx * 0.2, 0.22, 0.86], o.c2 || c)));
    for (let i = 0; i < 5; i++) P.push(S([0.07, 0.07, 0.07], [0, 0.26 + Math.sin(i * 0.65) * 0.3 + i * 0.04, -0.38 - Math.cos(i * 0.65) * 0.1 + i * 0.0 - i * 0.08 + (i > 2 ? 0.2 : 0)], c, { an: "tail", ph: i }));
    P.push(C([0.045, 0.14, 0.045], [0, 0.78, -0.2], "#d93a3a", { r: [2.3, 0, 0] }));
    [-1, 0, 1].forEach(z => [1, -1].forEach(sx => P.push(Y([0.02, 0.2, 0.02], [sx * 0.34, 0.1, z * 0.18], c, { r: [0, 0, sx * 0.9] }))));
    return P;
  }
  function snail(o) {
    const P = [];
    P.push(S([0.16, 0.12, 0.5], [0, 0.12, 0], o.c), S([0.14, 0.14, 0.14], [0, 0.22, 0.44], o.c), ...eyes(0.34, 0.5, 0.06, 0.03));
    [1, -1].forEach(sx => P.push(Y([0.015, 0.2, 0.015], [sx * 0.06, 0.34, 0.48], o.c, { r: [0.2, 0, 0] })));
    P.push(S([0.28, 0.28, 0.22], [0, 0.4, -0.1], o.sh, { r: [0, 0, 0] }), S([0.18, 0.18, 0.14], [0, 0.42, -0.1], o.sh2 || "#fff2d8"));
    return P;
  }
  function bat(o) {
    const P = [], c = o.c;
    P.push(S([0.2, 0.22, 0.26], [0, 0.75, 0], c), S([0.17, 0.16, 0.17], [0, 0.92, 0.2], c), C([0.05, 0.14, 0.05], [0.09, 1.08, 0.18], c), C([0.05, 0.14, 0.05], [-0.09, 1.08, 0.18], c), ...eyes(0.95, 0.34, 0.07, 0.03, { c: "#ff4a4a" }), C([0.02, 0.06, 0.02], [0.04, 0.8, 0.34], WH, { r: [3.14, 0, 0], hi: 1 }));
    [1, -1].forEach(sx => P.push(B([0.7, 0.03, 0.4], [sx * 0.44, 0.8, -0.04], o.wc || c, { pv: [0, 0.8, 0], an: "wing", ph: sx }), C([0.2, 0.22, 0.02], [sx * 0.7, 0.72, -0.04], o.wc || c, { r: [3.14, 0, 0], pv: [0, 0.8, 0], an: "wing", ph: sx })));
    return P;
  }

  // ---------- خاصة ----------
  function dragon(o) {
    const P = quad(Object.assign({ ear: null, back: o.back, tail: "croc", sn: 1.2, fang: 1, horn: "big", leg: 0.9, hs: 1.1 }, o));
    const wy = 0.95;
    [1, -1].forEach(sx => P.push(B([0.8, 0.03, 0.55], [sx * 0.5, wy + 0.1, -0.05], o.wc || o.c2, { pv: [sx * 0.18, wy, 0], an: "wing", ph: sx, r: [0, 0, sx * 0.25] }), C([0.14, 0.4, 0.02], [sx * 0.9, wy + 0.08, -0.12], o.wc || o.c2, { pv: [sx * 0.18, wy, 0], an: "wing", ph: sx, r: [0, 0, -sx * 1.5] })));
    return P;
  }
  function hourglass(o) {
    const P = [];
    P.push(Y([0.34, 0.06, 0.34], [0, 0.18, 0], "#c9a14a"), Y([0.34, 0.06, 0.34], [0, 1.22, 0], "#c9a14a"));
    P.push(C([0.28, 0.5, 0.28], [0, 0.48, 0], "#bfe6ff"), C([0.28, 0.5, 0.28], [0, 0.95, 0], "#bfe6ff", { r: [3.14, 0, 0] }));
    P.push(C([0.2, 0.28, 0.2], [0, 0.4, 0], "#ffd24d"), S([0.05, 0.05, 0.05], [0, 0.7, 0], "#ffd24d"));
    [[1, 1], [-1, 1], [1, -1], [-1, -1]].forEach(l => P.push(Y([0.025, 1.0, 0.025], [l[0] * 0.27, 0.7, l[1] * 0.27], "#c9a14a")));
    P.push(...eyes(0.7, 0.2, 0.1, 0.04));
    return P;
  }
  // فينيق الأبد: طائر كوني بنفسجي بجناحين واسعين وذيل لهب وتاج نجوم (كان كرة مذنّب لا تشبه حيوانًا)
  function comet(o) {
    const P = bird({ c: "#5a3ad0", c2: "#c9a8ff", wc: "#3a7ae0", tail: "flame", ww: 1.8, crest: "#8ae0ff", beak: "#ffd24d", bs: 1.1, leg: 0.2, eyeC: "#8ae0ff" });
    [1, -1].forEach(sx => P.push(S([0.045, 0.045, 0.045], [sx * 0.62, 0.95, -0.05], "#fff6a8", { hi: 1 }), S([0.04, 0.04, 0.04], [sx * 0.16, 1.28, 0.1], "#fff6a8", { hi: 1 })));
    return P;
  }
  // حارس الزمن: سلحفاة ذهبية عتيقة تحمل ساعة رملية على ظهرها (كانت ساعة رملية بعينين)
  function guardian(o) {
    const P = turtle({ c: "#b98a3a", c2: "#ffd24d", sk: "#d9b25a" });
    P.push(Y([0.12, 0.03, 0.12], [0, 0.66, 0], "#fff1b0"), Y([0.12, 0.03, 0.12], [0, 1.0, 0], "#fff1b0"));
    P.push(C([0.1, 0.16, 0.1], [0, 0.76, 0], "#bfe6ff"), C([0.1, 0.16, 0.1], [0, 0.91, 0], "#bfe6ff", { r: [3.14, 0, 0] }), S([0.035, 0.035, 0.035], [0, 0.71, 0], "#ffd24d", { hi: 1 }));
    return P;
  }


  // ---------- الشخصيات (بشر) ----------
  const SKIN = "#f1c9a0";
  const LOOK = {
    "🧑‍🌾": { shirt: "#4a8ad0", pants: "#6a5a3a", hat: "straw", hair: "#5a3a22" },
    "👨‍🌾": { shirt: "#c9503a", pants: "#3a4a6a", hat: "cap", hair: "#3a2a1a", beard: "#3a2a1a" },
    "👩‍🌾": { shirt: "#e8a0c0", pants: "#7a5a8a", hat: "straw", hair: "#a8602a", braids: 1 },
    "🧙": { shirt: "#6a3ab0", pants: "#6a3ab0", hat: "wizard", hair: "#e8e8f0", beard: "#f0f0f4", robe: 1, staff: 1 },
    "🥷": { shirt: "#22222a", pants: "#22222a", hat: "ninja", hair: "#22222a" },
    "🧑‍🚀": { shirt: "#f0f0f4", pants: "#e0e0e8", hat: "helmet", hair: "#222" },
    "🦸": { shirt: "#2a5ac8", pants: "#c9302a", hat: "mask", hair: "#222", cape: "#c9302a" },
    "🧝": { shirt: "#3a9a5a", pants: "#6a4a2a", hat: "none", hair: "#f0d878", elf: 1 },
    "🤠": { shirt: "#c9a14a", pants: "#3a4a8a", hat: "cowboy", hair: "#5a3a22", vest: "#6a3a22" },
    "🧑‍🎤": { shirt: "#e83a9a", pants: "#2a2a3a", hat: "spikes", hair: "#ff5ac8", shades: 1 },
    npc: { shirt: "#7a5a3a", pants: "#5a4a30", hat: "straw", hair: "#e8e8e8", beard: "#f0f0f0", robe: 1, staff: 1, old: 1 }
  };
  function human(look) {
    const o = LOOK[look] || LOOK["🧑‍🌾"], P = [], hy = 1.52;
    if (o.robe) P.push(C([0.4, 0.95, 0.4], [0, 0.55, 0], o.shirt));
    else [1, -1].forEach(sx => P.push(Y([0.09, 0.7, 0.09], [sx * 0.12, 0.35, 0], o.pants, { pv: [sx * 0.12, 0.7, 0], an: "leg", ph: sx > 0 ? 0 : 3.14 }), B([0.14, 0.07, 0.22], [sx * 0.12, 0.03, 0.04], "#3a2a22", { pv: [sx * 0.12, 0.7, 0], an: "leg", ph: sx > 0 ? 0 : 3.14 })));
    P.push(B([0.5, o.robe ? 0.4 : 0.6, 0.3], [0, o.robe ? 1.1 : 1.0, 0], o.shirt));
    if (o.vest) P.push(B([0.52, 0.45, 0.32], [0, 1.05, 0], o.vest));
    [1, -1].forEach(sx => P.push(Y([0.07, 0.55, 0.07], [sx * 0.33, 1.02, 0], o.shirt, { pv: [sx * 0.33, 1.3, 0], an: "leg", ph: sx > 0 ? 3.14 : 0 }), S([0.075, 0.075, 0.075], [sx * 0.33, 0.72, 0], SKIN, { pv: [sx * 0.33, 1.3, 0], an: "leg", ph: sx > 0 ? 3.14 : 0 })));
    P.push(S([0.2, 0.22, 0.2], [0, hy, 0], o.hat === "ninja" ? "#22222a" : SKIN));
    if (o.hat !== "ninja" && o.hat !== "helmet") P.push(...eyes(hy + 0.03, 0.17, 0.08, 0.03));
    if (o.hat === "ninja") P.push(B([0.3, 0.07, 0.04], [0, hy + 0.03, 0.17], SKIN), ...eyes(hy + 0.03, 0.2, 0.07, 0.02), B([0.42, 0.06, 0.42], [0, hy + 0.12, 0], "#d62a2a"));
    if (!o.hat || o.hat === "none" || o.hat === "straw" || o.hat === "cap" || o.hat === "cowboy" || o.hat === "wizard" || o.hat === "mask") P.push(S([0.21, 0.13, 0.21], [0, hy + 0.1, -0.03], o.hair));
    if (o.braids) [1, -1].forEach(sx => P.push(Y([0.04, 0.4, 0.04], [sx * 0.2, hy - 0.2, -0.05], o.hair)));
    if (o.beard) P.push(S([0.16, o.old ? 0.26 : 0.1, 0.1], [0, hy - (o.old ? 0.2 : 0.12), 0.12], o.beard));
    if (o.hat === "straw") P.push(Y([0.42, 0.04, 0.42], [0, hy + 0.2, 0], "#e8c86a"), Y([0.22, 0.14, 0.22], [0, hy + 0.28, 0], "#e8c86a"));
    if (o.hat === "cap") P.push(S([0.22, 0.14, 0.22], [0, hy + 0.14, 0], "#c9503a"), B([0.22, 0.03, 0.18], [0, hy + 0.1, 0.22], "#c9503a"));
    if (o.hat === "wizard") P.push(Y([0.4, 0.04, 0.4], [0, hy + 0.2, 0], o.shirt), C([0.24, 0.65, 0.24], [0, hy + 0.55, 0], o.shirt, { r: [-0.12, 0, 0] }), S([0.04, 0.04, 0.04], [0, hy + 0.5, 0.2], "#ffd24d"));
    if (o.hat === "cowboy") P.push(Y([0.46, 0.04, 0.46], [0, hy + 0.2, 0], "#7a4a22"), Y([0.22, 0.2, 0.22], [0, hy + 0.3, 0], "#7a4a22"));
    if (o.hat === "helmet") P.push(S([0.3, 0.3, 0.3], [0, hy + 0.02, 0], "#e8f4ff"), S([0.2, 0.16, 0.1], [0, hy, 0.2], "#2a4a8a"));
    if (o.hat === "mask") P.push(B([0.4, 0.1, 0.2], [0, hy + 0.03, 0.1], "#c9302a"), B([0.12, 0.1, 0.02], [0.08, hy + 0.03, 0.21], WH), B([0.12, 0.1, 0.02], [-0.08, hy + 0.03, 0.21], WH));
    if (o.hat === "spikes") for (let i = -2; i <= 2; i++) P.push(C([0.05, 0.22, 0.05], [i * 0.07, hy + 0.28 - Math.abs(i) * 0.02, 0], o.hair, { r: [0, 0, -i * 0.15] }));
    if (o.shades) P.push(B([0.3, 0.06, 0.04], [0, hy + 0.03, 0.2], "#111"));
    if (o.elf) [1, -1].forEach(sx => P.push(C([0.05, 0.22, 0.03], [sx * 0.25, hy + 0.05, 0], SKIN, { r: [0, 0, -sx * 1.2] })));
    if (o.cape) P.push(B([0.52, 0.85, 0.04], [0, 0.95, -0.19], o.cape, { r: [0.12, 0, 0] }));
    if (o.staff) P.push(Y([0.025, 1.5, 0.025], [0.5, 0.75, 0.12], "#7a5a3a"), S([0.07, 0.07, 0.07], [0.5, 1.55, 0.12], o.old ? "#7a5a3a" : "#ffd24d"));
    return P;
  }

  // ---------- جدول الأنواع (رقم النوع → وصفة) ----------
  const T = {
    1: () => quad({ c: "#e8a050", c2: WH, belly: 1, ear: "point", tail: "long", leg: 0.8, l: 0.8, w: 0.9, hs: 1.05, sn: 0.5, stripes: null }),
    2: () => quad({ c: "#c9965a", c2: "#f0d7a8", belly: 1, ear: "floppy", ec: "#7a5230", tail: "up", leg: 0.9, hs: 1.05, sn: 1 }),
    3: () => quad({ c: "#efe8de", c2: WH, ear: "long", ec: "#f0c7c7", tail: "fluff", leg: 0.6, l: 0.8, w: 0.95, hs: 0.9, sn: 0.4 }),
    4: () => quad({ c: "#e8c58a", c2: WH, belly: 1, ear: "round", tail: null, leg: 0.4, l: 0.6, w: 1.15, h: 1.15, hs: 1.05, sn: 0.3 }),
    5: () => quad({ c: "#b8703c", c2: "#f0d8b8", belly: 1, ear: "point", tail: "squirrel", tc: "#a05c2c", leg: 0.6, l: 0.7, hs: 0.9, sn: 0.5 }),
    6: () => butterfly({ c: "#ff8ad0", c2: "#8a6cff" }),
    7: () => snail({ c: "#c9b88a", sh: "#c97a4a", sh2: "#f6d9a8" }),
    8: () => fish({ c: "#ff9a3a", c2: "#ffd89a", fin: 1 }),
    9: () => quad({ c: "#e8782a", c2: WH, belly: 1, ear: "point", ec: "#4a2a14", tail: "bushy", tip: WH, leg: 0.85, hs: 0.95, sn: 1.2, lc: "#4a2a14" }),
    10: () => quad({ c: WH, c2: WH, ear: "round", ec: DK, lc: DK, tail: "fluff", leg: 0.55, l: 0.85, w: 1.2, h: 1.2, hs: 1.15, sn: 0.5, snc: "#e8e8e0", patch: 1 }),
    11: () => bird({ c: "#e84a4a", c2: "#f2b83a", wc: "#2a7ac9", tc: "#2a7ac9", tail: "long", crest: null, beak: "#f4f4f0", beakT: "hook" }),
    12: () => turtle({ c: "#4f8a46", c2: "#6fae5a" }),
    13: () => bird({ c: DK, c2: WH, up: 1, tail: null, wc: DK, beak: OR, lc: OR, bs: 1 }),
    14: () => quad({ c: "#a9a9b4", c2: "#d8d8de", belly: 1, ear: "bigRound", ec: "#bcbcc6", tail: null, leg: 0.6, l: 0.8, w: 1.1, h: 1.1, hs: 1.2, sn: 0.5, snc: DK }),
    15: () => bird({ c: "#2a2a36", c2: "#3a3a4a", beak: "#4a4a55", beakT: "hook", tail: "long", leg: 0.25, eyeC: "#ffd24d" }),
    16: () => quad({ c: "#8c929c", c2: "#d0d3d8", belly: 1, ear: "point", tail: "bushy", leg: 1.05, l: 1.1, hs: 1.05, sn: 1.3, lc: "#6a7078" }),
    17: () => quad({ c: "#8a5a34", c2: "#8a5a34", ear: "point", tail: "horse", mc: "#2e1e12", mane: "#2e1e12", leg: 1.7, l: 1.3, neck: 0.3, hs: 0.95, sn: 1.4, lc: "#8a5a34", w: 0.95 }),
    18: () => quad({ c: "#f0902a", c2: WH, belly: 1, ear: "round", ec: "#3a2a1a", tail: "long", tc: "#f0902a", stripes: DK, leg: 0.95, l: 1.15, hs: 1.05, sn: 0.8, w: 1.05 }),
    19: () => quad({ c: "#d9a24a", c2: "#f0d098", belly: 1, ear: "round", mane: "#8a4a1c", tail: "long", leg: 0.95, l: 1.15, w: 1.1, hs: 1.0, sn: 0.8 }),
    20: () => quad({ c: "#7a4e2c", c2: "#c9a070", ear: "round", tail: "fluff", leg: 0.6, l: 0.95, w: 1.3, h: 1.3, hs: 1.15, sn: 0.8, snc: "#c9a070" }),
    21: () => quad({ c: "#c99a5c", c2: WH, belly: 1, ear: "point", antler: "#e8d8b0", tail: "fluff", leg: 1.8, l: 1.0, neck: 0.25, hs: 0.85, sn: 1.2, w: 0.85 }),
    22: () => bird({ c: "#7a5230", c2: "#a8805a", hc: WH, beak: "#f2c230", beakT: "hook", ww: 1.7, wc: "#5a3a20", tail: "wide", leg: 0.25, bs: 1.15 }),
    23: () => bird({ c: "#a8845c", c2: "#e8d8b8", up: 1, owl: 1, face: "#e8d8b8", beak: "#c9a14a", tail: null, bs: 1.05, lc: "#c9a14a" }),
    24: () => quad({ c: "#3a3a44", c2: "#5a5a64", ear: "round", tail: null, leg: 1.0, l: 0.85, w: 1.45, h: 1.45, hs: 1.0, sn: 0.5, snc: "#6a6a74", lw: 0.12 }),
    25: () => quad({ c: "#e8b84a", c2: "#f4e0a8", belly: 1, ear: "round", tail: "long", spots: DK, leg: 0.85, l: 1.25, w: 0.9, h: 0.9, hs: 0.95, sn: 0.8 }),
    26: () => croc({ c: "#5a8a3a", c2: "#c9d88a" }),
    27: () => fish({ c: "#7a8a9a", c2: WH, k: 1.4, fin: 1.8, fc: "#6a7a8a", teeth: 1 }),
    28: () => fish({ c: "#3a5a8a", c2: "#c9d8e8", k: 1.8, fat: 1.3, flukes: 1, fin: 0.4 }),
    29: () => quad({ c: "#e8c050", c2: "#e8c050", ear: "point", spots: "#8a5a2a", tail: "thin", leg: 2.4, l: 1.0, neck: 0.9, hs: 0.7, sn: 1.0, w: 0.8, h: 0.9 }),
    30: () => quad({ c: "#7a5a3a", c2: "#d8b890", ear: "bigRound", tail: null, leg: 1.1, l: 0.8, w: 1.0, hs: 1.0, sn: 0.5, snc: "#d8b890" }),
    31: () => quad({ c: "#8a8a92", c2: "#a8a8b0", ear: "point", horn: "one", tail: "thin", leg: 0.7, l: 1.25, w: 1.3, h: 1.3, hs: 1.0, sn: 1.2 }),
    32: () => quad({ c: "#8e949e", c2: "#8e949e", ear: "huge", trunk: 1, tusk: 1, tail: "thin", leg: 1.1, l: 1.3, w: 1.5, h: 1.5, hs: 1.2, sn: 0, lw: 0.14 }),
    33: () => bird({ c: "#5a6a8a", c2: "#e8e8ee", hc: "#4a5a7a", beak: "#f2c230", beakT: "hook", ww: 1.6, wc: "#3a4a6a", tail: "wide", leg: 0.25, bs: 1.0 }),
    34: () => quad({ c: "#6a3a8a", c2: "#9a5ac0", belly: 1, ear: "point", horn: "bull", fang: 1, tail: "long", back: "#ff5a3a", leg: 1.0, l: 1.2, w: 1.35, h: 1.35, hs: 1.2, sn: 0.9 }),
    35: () => dragon({ c: "#d63a2a", c2: "#f08a3a", wc: "#a82a22", back: "#f0b03a", belly: 1 }),
    36: () => quad({ c: WH, c2: WH, ear: "point", horn: "uni", tail: "horse", mc: "#ff9ad0", mane: "#ff9ad0", leg: 1.7, l: 1.25, neck: 0.3, hs: 0.95, sn: 1.3, w: 0.95 }),
    37: () => squid({ c: "#6a3a9a", c2: "#9a6ac8", n: 8, tc: "#7a4aaa", eyeC: "#ffd24d" }),
    38: () => quad({ c: "#8a6a4a", c2: "#e8d0a8", ear: "round", tail: null, leg: 0.35, l: 0.7, w: 1.1, h: 1.1, hs: 0.9, sn: 1.3, snc: "#e8d0a8", back: "#4a3624" }),
    39: () => bird({ c: "#ff5a2a", c2: "#ffb03a", wc: "#ff7a1a", tail: "flame", crest: "#ffd24d", ww: 1.5, beak: "#ffd24d", bs: 1.1, leg: 0.2 }),
    40: () => quad({ c: "#7a5a46", c2: "#7a5a46", ear: "round", trunk: 1, tusk: 1, tail: "thin", leg: 1.0, l: 1.35, w: 1.5, h: 1.5, hs: 1.2, sn: 0, lw: 0.14, mane: "#5a3e2c", hump: "#5a3e2c" }),
    41: () => frog({ c: "#5ab04a", c2: "#d8f0a8" }),
    42: () => bird({ c: WH, c2: "#f0f0e8", hc: "#3a8a4a", beak: OR, beakT: "flat", tail: null, leg: 0.15, wc: "#e8e8e0", bs: 0.95 }),
    43: () => bee({}),
    44: () => bat({ c: "#3a3446", wc: "#5a4a6a" }),
    45: () => quad({ c: "#2e2a2a", c2: "#4a4242", ear: "round", horn: "bull", tail: "thin", leg: 0.85, l: 1.2, w: 1.3, h: 1.3, hs: 1.05, sn: 0.8, hump: "#2e2a2a" }),
    46: () => quad({ c: "#8a7a8a", c2: "#c9a8b0", ear: "round", tail: "thin", leg: 0.4, l: 1.3, w: 1.55, h: 1.5, hs: 1.4, sn: 1.4, snc: "#c9a8b0", lw: 0.13 }),
    47: () => scorpion({ c: "#b8742a", c2: "#d99a4a" }),
    48: () => dino({ c: "#5a9a4a", c2: "#c9d88a", back: "#c9703a" }),
    49: () => quad({ c: WH, c2: WH, ear: "round", ec: "#e0e8f0", tail: "fluff", leg: 0.6, l: 1.0, w: 1.3, h: 1.3, hs: 1.1, sn: 1.0, snc: "#e0e8f0" }),
    50: () => snake({ c: "#3a2a5a", c2: "#5a3a8a", eyeC: "#ff4a4a", glow: "#a86aff" }),
    51: () => quad({ c: "#3a8a9a", c2: "#8ad0d8", belly: 1, ear: null, tail: "croc", leg: 0.9, l: 1.7, w: 1.4, h: 1.4, neck: 0.9, hs: 0.6, sn: 1.2, back: "#ffd24d", lw: 0.13 }),
    52: () => bird({ c: "#e8b030", c2: "#2f9e6a", hc: "#2a7ac9", crest: "#ffd24d", tail: "fan", dots: 1, neck: 0.25, beak: "#c98a2a", wc: "#d89a28", bs: 1.05, leg: 0.28 }),
    53: () => squid({ c: "#2a2a7a", c2: "#5a4ac0", n: 10, tc: "#4a3aa8", eyeC: "#8ae0ff", stars: 1 }),
    54: () => dragon({ c: "#4a2a9a", c2: "#8a5ae0", wc: "#2a6ac0", back: "#8ae0ff", belly: 1 }),
    55: () => quad({ c: "#aec8e8", c2: WH, belly: 1, ear: "point", antler: "#8ae0ff", tail: "fluff", leg: 1.8, l: 1.0, neck: 0.25, hs: 0.85, sn: 1.2, w: 0.85, ec: "#8ab0d8" }),
    56: () => guardian({}),
    57: () => comet({}),
    58: () => bird({ c: "#f4f0e8", c2: "#f4f0e8", comb: 1, beak: "#f2b83a", beakT: "hook", tail: "long", tc: "#d8d0c0", wc: "#e8e0d0", leg: 0.22, bs: 1.0 }),
    59: () => dragon({ c: "#bfe6ff", c2: WH, wc: "#7ac0f0", back: "#8ae0ff", belly: 1 }),
    60: () => quad({ c: "#c8d8ec", c2: WH, belly: 1, ear: "point", tail: "bushy", tip: "#8ad0ff", leg: 1.05, l: 1.15, w: 1.05, hs: 1.05, sn: 1.3, lc: "#9fb6d0" }),
    61: () => quad({ c: "#e8f2ff", c2: WH, belly: 1, ear: "point", ec: "#8ab0d8", tail: "bushy", tip: "#8ad0ff", leg: 0.9, hs: 1.05, sn: 1.3, lc: "#8ab0d8" }),
    62: () => quad({ c: "#f0f0ff", c2: WH, ear: "long", tail: "fluff", leg: 0.8, l: 0.85, hs: 1.0, sn: 0.6 }),
    63: () => quad({ c: "#25232e", c2: "#3a3646", ear: "point", tail: "up", leg: 0.9, l: 0.95, hs: 1.05, sn: 0.6, snc: "#3a3646" }),
    64: () => quad({ c: WH, c2: WH, hc: "#4a4a50", ec: "#4a4a50", ear: "floppy", tail: "fluff", leg: 0.8, l: 1.0, w: 1.35, h: 1.35, hs: 0.95, sn: 0.8, snc: "#4a4a50", lc: "#4a4a50" }),
    65: () => quad({ c: "#5a2a1a", c2: "#ff7a2a", ear: "round", horn: "bull", tail: "thin", hump: "#5a2a1a", back: "#ff7a1a", leg: 0.85, l: 1.2, w: 1.35, h: 1.35, hs: 1.05, sn: 0.8 }),
    66: () => fish({ c: "#6a9ad0", c2: WH, k: 1.5, fat: 0.9, flukes: 1, fin: 0.8 }),
    67: () => squid({ c: "#ff9ad8", c2: "#ffc8ec", n: 12, tc: "#ff7ac8", eyeC: "#ffffff", stars: 1 }),
    68: () => dragon({ c: "#3a9a4a", c2: "#8ad05a", wc: "#2a7a3a", back: "#b05ae0", belly: 1 })
  };
  const HOP = { 3: 1, 4: 1, 5: 1, 41: 1, 62: 1, 38: 0 };   // أنواع تقفز بدل المشي
  const cache = {};
  const FLY = { 6: 1.3, 11: 1.5, 15: 1.9, 22: 3.2, 33: 3.4, 39: 2.5, 43: 1.1, 44: 2.1, 57: 3.5, 56: 0.5, 37: 0.4, 53: 1.0, 67: 0.8 };   // ارتفاع التحليق عن الأرض
  window.AN3D = {
    has: id => !!T[id],
    fly: id => FLY[id] || 0,
    hop: id => !!HOP[id],
    tall(id) { const ps = this.parts(id); let m = 0; (ps || []).forEach(q => { const h = q.p[1] + (q.k === "c" || q.k === "y" ? q.s[1] / 2 : q.s[1]); if (h > m) m = h; }); return Math.min(m, 3.2); },
    human: look => human(look),
    // أجزاء النموذج (تُخزَّن لأنها بيانات ثابتة)
    parts(id) { if (!cache[id]) cache[id] = T[id] ? T[id]() : null; return cache[id]; }
  };
})();
