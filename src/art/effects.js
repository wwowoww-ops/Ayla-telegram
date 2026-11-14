// مؤثرات العناصر: كل عنصر يُرجع { back, front } (خلف الحيوان وأمامه). عنصران: يُدمجان في جهتين متقابلتين بتناسق.
const rng = seed => { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
const COLORS = { fire: "#ff7a2b", water: "#3fb4ff", plant: "#5fd95f", earth: "#c99a52", thunder: "#ffe53d", light: "#fff2a6", dark: "#8d5bff", ice: "#a8ecff", wind: "#9ff0d0", poison: "#aef23a", metal: "#c3ccd6" };

// منطقة التوزيع: side = "L" | "R" | "B" (الجهتان)
const spot = (r, side, margin) => {
  const m = margin || 40;
  let x = side === "L" ? m + r() * 330 : side === "R" ? 1024 - m - r() * 330 : m + r() * (1024 - 2 * m);
  let y = 110 + r() * 800;
  if (side === "B" && x > 330 && x < 694) y = r() < 0.5 ? 60 + r() * 150 : 820 + r() * 120;   // لا نحجب وسط الحيوان
  return [x, y];
};
const glowOrb = (x, y, rr, col, op) => `<circle cx="${x}" cy="${y}" r="${rr}" fill="${col}" opacity="${op}" filter="url(#fxb)"/>`;

const GEN = {
  fire(r, side) {
    let back = "", front = "";
    for (let i = 0; i < 9; i++) {
      const [x, , ] = spot(r, side), y = 930 - r() * 120, h = 160 + r() * 260, w = 60 + r() * 70;
      back += `<path d="M${x} ${y} C${x - w} ${y - h * 0.35} ${x - w * 0.4} ${y - h * 0.7} ${x} ${y - h} C${x + w * 0.1} ${y - h * 0.6} ${x + w} ${y - h * 0.45} ${x + w * 0.7} ${y - h * 0.2} C${x + w * 0.6} ${y - h * 0.05} ${x + w * 0.3} ${y} ${x} ${y}Z" fill="url(#fxFire)" opacity=".92"/>` +
        `<path d="M${x} ${y} C${x - w * 0.5} ${y - h * 0.2} ${x - w * 0.2} ${y - h * 0.5} ${x} ${y - h * 0.62} C${x + w * 0.45} ${y - h * 0.4} ${x + w * 0.4} ${y - h * 0.1} ${x} ${y}Z" fill="#fff0a0" opacity=".85"/>`;
    }
    for (let i = 0; i < 34; i++) { const [x, y] = spot(r, side); front += `<circle cx="${x}" cy="${y}" r="${2 + r() * 5}" fill="${r() < 0.5 ? "#ffb347" : "#ff6a1a"}" opacity="${0.5 + r() * 0.5}"/>`; }
    return { back: glowOrb(512, 700, 330, "#ff6a1a", 0.35) + back, front };
  },
  water(r, side) {
    let back = "", front = "";
    for (let i = 0; i < 4; i++) { const y = 700 + i * 70, o = side === "R" ? 1 : 0; back += `<path d="M-40 ${y} Q180 ${y - 70} 380 ${y} T770 ${y} T1100 ${y} V1100 H-40Z" fill="#3fb4ff" opacity="${0.16 + i * 0.07}"/>`; }
    for (let i = 0; i < 5; i++) { const [x] = spot(r, side), y = 200 + r() * 600; back += `<path d="M${x} ${y} q${(r() - 0.5) * 200} -120 ${(r() - 0.5) * 120} -240" stroke="#bfeaff" stroke-width="${10 + r() * 14}" fill="none" stroke-linecap="round" opacity=".45"/>`; }
    for (let i = 0; i < 26; i++) { const [x, y] = spot(r, side), k = 6 + r() * 30; front += `<circle cx="${x}" cy="${y}" r="${k}" fill="#aee4ff" fill-opacity=".18" stroke="#e8f8ff" stroke-width="3" opacity=".9"/><circle cx="${x - k * 0.35}" cy="${y - k * 0.35}" r="${k * 0.2}" fill="#fff" opacity=".85"/>`; }
    return { back: glowOrb(512, 600, 340, "#3fb4ff", 0.3) + back, front };
  },
  plant(r, side) {
    let back = "", front = "";
    const leaf = (x, y, a, k, col) => `<path d="M0 0 Q${k * 0.5} ${-k * 0.55} ${k} 0 Q${k * 0.5} ${k * 0.55} 0 0Z" fill="${col}" stroke="#1f6b2a" stroke-width="2.5" transform="translate(${x} ${y}) rotate(${a})"/><path d="M0 0 H${k * 0.9}" stroke="#1f6b2a" stroke-width="2" transform="translate(${x} ${y}) rotate(${a})" opacity=".6"/>`;
    for (const s of side === "L" ? [0] : side === "R" ? [1] : [0, 1]) {
      const sx = s ? 1024 : 0, dir = s ? -1 : 1;
      let d = `M${sx} 1000`; let px = sx, py = 1000;
      back += `<path d="M${sx} 1020 Q${sx + dir * 140} 760 ${sx + dir * 60} 520 T${sx + dir * 120} 140" stroke="#2c8a3a" stroke-width="22" fill="none" stroke-linecap="round"/>`;
      for (let i = 0; i < 11; i++) back += leaf(sx + dir * (30 + r() * 150), 140 + i * 78, (s ? 180 : 0) + (r() - 0.5) * 90, 60 + r() * 50, r() < 0.5 ? "#58d65f" : "#3fb34d");
    }
    for (let i = 0; i < 16; i++) { const [x, y] = spot(r, side); front += leaf(x, y, r() * 360, 22 + r() * 22, "#8ff08a"); }
    return { back: glowOrb(512, 620, 320, "#5fd95f", 0.28) + back, front };
  },
  earth(r, side) {
    let back = "", front = "";
    const rock = (x, y, k, col) => { const pts = Array.from({ length: 7 }, (_, i) => { const a = (i / 7) * Math.PI * 2, rr = k * (0.7 + r() * 0.4); return `${x + Math.cos(a) * rr},${y + Math.sin(a) * rr * 0.8}`; }).join(" "); return `<polygon points="${pts}" fill="${col}" stroke="#4d3517" stroke-width="5" stroke-linejoin="round"/>`; };
    for (let i = 0; i < 8; i++) { const [x] = spot(r, side); back += rock(x, 900 - r() * 60, 60 + r() * 70, r() < 0.5 ? "#9a7440" : "#7d5c30"); }
    const crystal = (x, y, k) => `<g transform="translate(${x} ${y})"><path d="M0 ${-k * 1.7} L${k * 0.55} ${-k * 0.4} L${k * 0.4} ${k * 0.5} L${-k * 0.4} ${k * 0.5} L${-k * 0.55} ${-k * 0.4}Z" fill="#ffc56a" stroke="#7a4a10" stroke-width="4"/><path d="M0 ${-k * 1.7} L${k * 0.2} ${-k * 0.3} L0 ${k * 0.5} L${-k * 0.2} ${-k * 0.3}Z" fill="#fff0c4" opacity=".7"/></g>`;
    for (let i = 0; i < 5; i++) { const [x] = spot(r, side); back += crystal(x, 880, 26 + r() * 26); }
    for (let i = 0; i < 14; i++) { const [x, y] = spot(r, side); front += rock(x, y, 6 + r() * 12, "#b98f55"); }
    return { back: glowOrb(512, 780, 320, "#c99a52", 0.3) + back, front };
  },
  thunder(r, side) {
    let back = "", front = "";
    const bolt = (x, y, len, w) => { let d = `M${x} ${y}`, px = x, py = y; for (let i = 0; i < 7; i++) { px += (r() - 0.5) * 120; py += len / 7; d += ` L${px} ${py}`; } return `<path d="${d}" stroke="#ffe53d" stroke-width="${w * 2.4}" fill="none" stroke-linejoin="round" filter="url(#fxb)"/><path d="${d}" stroke="#fffbd0" stroke-width="${w}" fill="none" stroke-linejoin="round" stroke-linecap="round"/>`; };
    for (let i = 0; i < 5; i++) { const [x] = spot(r, side, 60); back += bolt(x, -20 + r() * 80, 700 + r() * 250, 6 + r() * 4); }
    for (let i = 0; i < 12; i++) { const [x, y] = spot(r, side); front += `<path d="M${x} ${y} l14 -22 l-6 0 l14 -26" stroke="#fff6a0" stroke-width="4" fill="none" stroke-linecap="round" opacity=".9"/>`; }
    return { back: glowOrb(512, 560, 340, "#ffe53d", 0.3) + back, front };
  },
  light(r, side) {
    let back = "", front = "";
    back += glowOrb(512, 470, 330, "#fff2a6", 0.55) + `<circle cx="512" cy="470" r="330" fill="none" stroke="#fff6c2" stroke-width="12" opacity=".7"/><circle cx="512" cy="470" r="380" fill="none" stroke="#fff6c2" stroke-width="4" opacity=".5"/>`;
    for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2; back += `<path d="M512 470 L${512 + Math.cos(a) * 560} ${470 + Math.sin(a) * 560}" stroke="#fff6c2" stroke-width="${i % 2 ? 6 : 14}" opacity=".35" filter="url(#fxs)"/>`; }
    for (let i = 0; i < 30; i++) { const [x, y] = spot(r, side), k = 4 + r() * 10; front += `<circle cx="${x}" cy="${y}" r="${k * 2.4}" fill="#fff6c2" opacity=".35" filter="url(#fxs)"/><circle cx="${x}" cy="${y}" r="${k * 0.7}" fill="#fff" opacity=".95"/>`; }
    return { back, front };
  },
  dark(r, side) {
    let back = "", front = "";
    for (let i = 0; i < 12; i++) { const [x, y] = spot(r, side); back += `<ellipse cx="${x}" cy="${y}" rx="${70 + r() * 90}" ry="${50 + r() * 60}" fill="${r() < 0.5 ? "#2a1450" : "#4a2a8a"}" opacity="${0.35 + r() * 0.25}" filter="url(#fxb)"/>`; }
    for (let i = 0; i < 6; i++) { const [x] = spot(r, side), y = 900; back += `<path d="M${x} ${y} q${(r() - 0.5) * 160} -200 ${(r() - 0.5) * 80} -420" stroke="#1b0b36" stroke-width="${14 + r() * 14}" fill="none" stroke-linecap="round" opacity=".55" filter="url(#fxs)"/>`; }
    for (let i = 0; i < 24; i++) { const [x, y] = spot(r, side); front += `<circle cx="${x}" cy="${y}" r="${2 + r() * 5}" fill="#b69aff" opacity="${0.4 + r() * 0.5}"/>`; }
    return { back: glowOrb(512, 600, 340, "#8d5bff", 0.32) + back, front };
  },
  ice(r, side) {
    let back = "", front = "";
    const shard = (x, y, k, a) => `<g transform="translate(${x} ${y}) rotate(${a})"><path d="M0 ${-k * 1.8} L${k * 0.45} ${-k * 0.3} L${k * 0.35} ${k * 0.4} L${-k * 0.35} ${k * 0.4} L${-k * 0.45} ${-k * 0.3}Z" fill="#c9f4ff" stroke="#4aa3d9" stroke-width="4" opacity=".95"/><path d="M0 ${-k * 1.8} L${k * 0.18} ${-k * 0.3} L0 ${k * 0.4}Z" fill="#fff" opacity=".7"/></g>`;
    for (let i = 0; i < 9; i++) { const [x] = spot(r, side); back += shard(x, 900, 30 + r() * 40, (r() - 0.5) * 30); }
    back += `<ellipse cx="512" cy="900" rx="430" ry="90" fill="#e6fbff" opacity=".45" filter="url(#fxb)"/>`;
    const flake = (x, y, k) => `<g transform="translate(${x} ${y})" stroke="#f2fdff" stroke-width="${Math.max(2, k * 0.12)}" stroke-linecap="round" opacity=".92">${[0, 60, 120].map(a => `<path d="M${-k} 0 H${k}" transform="rotate(${a})"/>`).join("")}</g>`;
    for (let i = 0; i < 16; i++) { const [x, y] = spot(r, side); front += flake(x, y, 8 + r() * 18); }
    return { back: glowOrb(512, 620, 330, "#a8ecff", 0.35) + back, front };
  },
  wind(r, side) {
    let back = "", front = "";
    for (let i = 0; i < 7; i++) { const [x, y] = spot(r, side), k = 70 + r() * 90; back += `<path d="M${x} ${y} c${k} ${-k * 0.5} ${k * 1.6} ${k * 0.4} ${k * 0.8} ${k * 0.9} c${-k * 0.5} ${k * 0.4} ${-k * 0.9} ${-k * 0.3} ${-k * 0.2} ${-k * 0.7}" stroke="#e5fff5" stroke-width="${6 + r() * 8}" fill="none" stroke-linecap="round" opacity=".6"/>`; }
    for (let i = 0; i < 14; i++) { const [x, y] = spot(r, side); front += `<path d="M${x} ${y} q40 -22 90 0" stroke="#f4fffa" stroke-width="5" fill="none" stroke-linecap="round" opacity=".75"/><path d="M${x} ${y} q16 -10 0 -24 q16 6 18 -6" fill="#9ff0d0" opacity=".5" transform="translate(${r() * 30} ${r() * 20})"/>`; }
    return { back: glowOrb(512, 600, 330, "#9ff0d0", 0.28) + back, front };
  },
  poison(r, side) {
    let back = "", front = "";
    for (let i = 0; i < 12; i++) { const [x, y] = spot(r, side); back += `<ellipse cx="${x}" cy="${y}" rx="${60 + r() * 90}" ry="${44 + r() * 60}" fill="${r() < 0.5 ? "#6fb81f" : "#9be02a"}" opacity="${0.28 + r() * 0.22}" filter="url(#fxb)"/>`; }
    for (let i = 0; i < 22; i++) { const [x, y] = spot(r, side), k = 6 + r() * 26; front += `<circle cx="${x}" cy="${y}" r="${k}" fill="#b6f040" fill-opacity=".25" stroke="#e8ffa0" stroke-width="3" opacity=".9"/><circle cx="${x - k * 0.3}" cy="${y - k * 0.3}" r="${k * 0.2}" fill="#fff" opacity=".7"/>`; }
    return { back: glowOrb(512, 640, 330, "#aef23a", 0.3) + back, front };
  },
  metal(r, side) {
    let back = "", front = "";
    const gear = (x, y, k, col) => { const n = 10; let p = ""; for (let i = 0; i < n * 2; i++) { const a = (i / (n * 2)) * Math.PI * 2, rr = i % 2 ? k : k * 1.22; p += `${x + Math.cos(a) * rr},${y + Math.sin(a) * rr} `; } return `<polygon points="${p}" fill="${col}" stroke="#3a424c" stroke-width="5" stroke-linejoin="round"/><circle cx="${x}" cy="${y}" r="${k * 0.42}" fill="#2a3038" stroke="#3a424c" stroke-width="4"/><circle cx="${x - k * 0.1}" cy="${y - k * 0.1}" r="${k * 0.12}" fill="#fff" opacity=".6"/>`; };
    const gs = side === "R" ? [[860, 330, 90], [930, 560, 55], [800, 760, 70]] : side === "L" ? [[170, 330, 90], [90, 560, 55], [230, 760, 70]] : [[170, 330, 90], [90, 560, 55], [860, 330, 90], [930, 560, 55], [230, 800, 70], [800, 800, 70]];
    gs.forEach(([x, y, k], i) => { back += gear(x, y, k, i % 2 ? "#aab4c0" : "#c9d1da"); });
    for (let i = 0; i < 26; i++) { const [x, y] = spot(r, side); const a = r() * Math.PI * 2, l = 14 + r() * 24; front += `<path d="M${x} ${y} l${Math.cos(a) * l} ${Math.sin(a) * l}" stroke="${r() < 0.5 ? "#ffe27a" : "#fff6c4"}" stroke-width="4" stroke-linecap="round" opacity=".95"/>`; }
    return { back: glowOrb(512, 640, 330, "#c3ccd6", 0.3) + back, front };
  }
};

const DEFS = `<defs>
  <linearGradient id="fxFire" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#ffd54a"/><stop offset=".5" stop-color="#ff8a2a"/><stop offset="1" stop-color="#e5301e"/></linearGradient>
  <filter id="fxb" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="26"/></filter>
  <filter id="fxs" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="8"/></filter>
</defs>`;

// els: [primary] أو [primary, secondary]
function layers(els, seed) {
  const list = (els || []).filter(e => GEN[e]).slice(0, 2);
  if (!list.length) return { back: "", front: "", defs: DEFS };
  if (list.length === 1) { const o = GEN[list[0]](rng(seed * 17 + 3), "B"); return { back: o.back, front: o.front, defs: DEFS }; }
  const a = GEN[list[0]](rng(seed * 17 + 3), "L"), b = GEN[list[1]](rng(seed * 29 + 5), "R");
  return { back: a.back + b.back, front: a.front + b.front, defs: DEFS };
}
module.exports = { layers, COLORS, GEN };
