// القطة: ثلاث مراحل (baby / young / adult) بنفس الهوية (فرو برتقالي مخطط، صدر كريمي، عيون فيروزية)
// كل مرحلة رسم مستقل: تتغير النسب والملامح والتفاصيل وتظهر السمات السحرية تدريجيًا. كل شيء على خلفية شفافة 1024×1024.
const OUT = "#4a2209";

const defs = `
<defs>
  <linearGradient id="fur" x1="0" y1="0" x2="0.25" y2="1"><stop offset="0" stop-color="#ffc062"/><stop offset=".55" stop-color="#f0922f"/><stop offset="1" stop-color="#cf6a1a"/></linearGradient>
  <linearGradient id="furD" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e8842a"/><stop offset="1" stop-color="#b95712"/></linearGradient>
  <radialGradient id="cream" cx=".5" cy=".35" r=".8"><stop offset="0" stop-color="#fffaf0"/><stop offset="1" stop-color="#ffe3b0"/></radialGradient>
  <radialGradient id="iris" cx=".42" cy=".38" r=".75"><stop offset="0" stop-color="#b6fff2"/><stop offset=".45" stop-color="#2fd0c4"/><stop offset="1" stop-color="#0f6f86"/></radialGradient>
  <radialGradient id="hl" cx=".3" cy=".25" r=".7"><stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
  <radialGradient id="sh" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#6b2c05" stop-opacity=".38"/><stop offset="1" stop-color="#6b2c05" stop-opacity="0"/></radialGradient>
  <linearGradient id="gem" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fffbe0"/><stop offset=".5" stop-color="#ffd24d"/><stop offset="1" stop-color="#ff9d2e"/></linearGradient>
  <filter id="glow" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="9"/></filter>
  <filter id="soft" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="3"/></filter>
</defs>`;

const mirror = body => `<g>${body}</g><g transform="translate(1024 0) scale(-1 1)">${body}</g>`;
const P = { fill: "none", stroke: OUT, "stroke-width": 7, "stroke-linejoin": "round", "stroke-linecap": "round" };
const attrs = (o) => Object.entries(o).map(([k, v]) => `${k}="${v}"`).join(" ");
const ol = (extra) => attrs(Object.assign({}, P, extra || {}));

// خصلات الفرو على حافة الشكل (لمسة تفصيل)
function tufts(pts, color, w) {
  return pts.map(([x, y, dx, dy]) => `<path d="M${x} ${y} q${dx * 0.5} ${dy * 0.2} ${dx} ${dy}" stroke="${color}" stroke-width="${w || 5}" fill="none" stroke-linecap="round" opacity=".75"/>`).join("");
}

function eye(cx, cy, r, tilt) {
  return `<g transform="translate(${cx} ${cy}) rotate(${tilt})">
    <ellipse rx="${r}" ry="${r * 1.12}" fill="#fffdf6" stroke="${OUT}" stroke-width="6"/>
    <circle r="${r * 0.86}" fill="url(#iris)"/>
    <circle r="${r * 0.86}" fill="none" stroke="#0b4a5c" stroke-width="3" opacity=".55"/>
    <ellipse rx="${r * 0.3}" ry="${r * 0.66}" fill="#10202b"/>
    <circle cx="${-r * 0.3}" cy="${-r * 0.34}" r="${r * 0.3}" fill="#fff"/>
    <circle cx="${r * 0.28}" cy="${r * 0.3}" r="${r * 0.14}" fill="#fff" opacity=".9"/>
    <path d="M${-r} ${-r * 0.1} Q0 ${-r * 1.28} ${r} ${-r * 0.1}" fill="none" stroke="${OUT}" stroke-width="9" stroke-linecap="round"/>
  </g>`;
}

function head(c) {
  const { cx, cy, rx, ry, er, ear, stage } = c;
  // الأذن (اليسرى) وتُعكس لليمين
  const ex = cx - rx * 0.86, ey = cy - ry * 0.3, ax = cx - rx * 0.72, ay = cy - ry * (1 + ear), ix = cx - rx * 0.12, iy = cy - ry * 0.82;
  const earL = `
    <path d="M${ex} ${ey} Q${ex - 6} ${ay + (ey - ay) * 0.35} ${ax} ${ay} Q${ix - (ix - ax) * 0.25} ${ay + 20} ${ix} ${iy} Z" fill="url(#furD)" ${ol()}/>
    <path d="M${ex + 26} ${ey - 14} Q${ex + 18} ${ay + (ey - ay) * 0.45} ${ax + 6} ${ay + 52} Q${ix - (ix - ax) * 0.3} ${ay + 70} ${ix - 30} ${iy - 8} Z" fill="#ffb3a8" stroke="#d98075" stroke-width="3"/>
    ${stage !== "baby" ? `<path d="M${ax + 10} ${ay + 12} Q${ax - 4} ${ay - (stage === "adult" ? 38 : 20)} ${ax - 16} ${ay - (stage === "adult" ? 66 : 34)} Q${ax - 22} ${ay - 6} ${ax - 12} ${ay + 26} Z" fill="url(#furD)" ${ol({ "stroke-width": 5 })}/>` : ""}`;
  // خدود منفوخة
  const cheek = `<path d="M${cx - rx} ${cy + ry * 0.1} q-${rx * 0.12} ${ry * 0.3} ${rx * 0.02} ${ry * 0.52} l${rx * 0.1} -${ry * 0.04} l${rx * 0.05} ${ry * 0.12} l${rx * 0.1} -${ry * 0.1} l${rx * 0.1} ${ry * 0.1} Z" fill="url(#cream)" ${ol({ "stroke-width": 5 })}/>`;
  const stripesF = [[-34, 0], [0, -6], [34, 0]].map(([dx, dy]) => `<path d="M${cx + dx} ${cy - ry * 0.98 + dy} q${dx * 0.1} ${ry * 0.22} ${-dx * 0.08} ${ry * 0.38}" stroke="#a8480f" stroke-width="${stage === "baby" ? 9 : 11}" fill="none" stroke-linecap="round"/>`).join("");
  const stripesC = mirror(`<path d="M${cx - rx * 0.98} ${cy - ry * 0.05} q${rx * 0.22} ${ry * 0.04} ${rx * 0.3} ${ry * 0.14}" stroke="#a8480f" stroke-width="9" fill="none" stroke-linecap="round"/><path d="M${cx - rx * 0.96} ${cy + ry * 0.22} q${rx * 0.2} -${ry * 0.02} ${rx * 0.28} ${ry * 0.06}" stroke="#a8480f" stroke-width="8" fill="none" stroke-linecap="round"/>`);
  const eyes = eye(cx - rx * 0.42, cy + ry * 0.08, er, -6) + eye(cx + rx * 0.42, cy + ry * 0.08, er, 6);
  const muzzle = `<ellipse cx="${cx}" cy="${cy + ry * 0.46}" rx="${rx * 0.34}" ry="${ry * 0.27}" fill="url(#cream)" stroke="#d9b98a" stroke-width="3"/>`;
  const nose = `<path d="M${cx - 22} ${cy + ry * 0.33} Q${cx} ${cy + ry * 0.29} ${cx + 22} ${cy + ry * 0.33} Q${cx + 14} ${cy + ry * 0.45} ${cx} ${cy + ry * 0.48} Q${cx - 14} ${cy + ry * 0.45} ${cx - 22} ${cy + ry * 0.33} Z" fill="#ff8aa0" stroke="${OUT}" stroke-width="5" stroke-linejoin="round"/>
    <ellipse cx="${cx - 7}" cy="${cy + ry * 0.35}" rx="6" ry="3" fill="#fff" opacity=".7"/>`;
  const mouth = `<path d="M${cx} ${cy + ry * 0.48} v${ry * 0.07} M${cx} ${cy + ry * 0.55} q-${rx * 0.1} ${ry * 0.11} -${rx * 0.2} ${ry * 0.02} M${cx} ${cy + ry * 0.55} q${rx * 0.1} ${ry * 0.11} ${rx * 0.2} ${ry * 0.02}" ${ol({ "stroke-width": 5 })}/>`;
  const blush = `<ellipse cx="${cx - rx * 0.68}" cy="${cy + ry * 0.36}" rx="${rx * 0.12}" ry="${ry * 0.07}" fill="#ff7f8f" opacity=".45"/><ellipse cx="${cx + rx * 0.68}" cy="${cy + ry * 0.36}" rx="${rx * 0.12}" ry="${ry * 0.07}" fill="#ff7f8f" opacity=".45"/>`;
  const whisk = mirror([[-0.2, 0.46, -0.78, 0.4], [-0.2, 0.52, -0.85, 0.55], [-0.2, 0.58, -0.76, 0.7]].map(([x1, y1, x2, y2]) => `<path d="M${cx + rx * x1} ${cy + ry * y1} Q${cx + rx * (x1 + x2) / 2} ${cy + ry * (y1 + y2) / 2 - 12} ${cx + rx * x2 - 20} ${cy + ry * y2}" stroke="#fffaf0" stroke-width="3.5" fill="none" stroke-linecap="round" opacity=".95"/>`).join(""));
  const skull = `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="url(#fur)" ${ol({ "stroke-width": 8 })}/>`;
  const light = `<ellipse cx="${cx - rx * 0.2}" cy="${cy - ry * 0.45}" rx="${rx * 0.6}" ry="${ry * 0.38}" fill="url(#hl)"/>`;
  const fuzz = tufts([[cx - rx * 0.95, cy - ry * 0.2, -16, -4], [cx - rx * 0.99, cy + ry * 0.05, -18, 2], [cx + rx * 0.95, cy - ry * 0.2, 16, -4], [cx + rx * 0.99, cy + ry * 0.05, 18, 2]], "#ffc062", 6);
  return mirror(earL) + skull + light + cheek.replace(/^/, "") + mirrorCheek(c) + stripesF + stripesC + blush + muzzle + eyes + nose + mouth + whisk + fuzz;
}
function mirrorCheek(c) { const { cx, cy, rx, ry } = c; return `<g transform="translate(${2 * cx} 0) scale(-1 1)"><path d="M${cx - rx} ${cy + ry * 0.1} q-${rx * 0.12} ${ry * 0.3} ${rx * 0.02} ${ry * 0.52} l${rx * 0.1} -${ry * 0.04} l${rx * 0.05} ${ry * 0.12} l${rx * 0.1} -${ry * 0.1} l${rx * 0.1} ${ry * 0.1} Z" fill="url(#cream)" ${ol({ "stroke-width": 5 })}/></g>`; }

const sparkle = (x, y, s, o) => `<g transform="translate(${x} ${y}) scale(${s})" opacity="${o || 1}"><path d="M0 -20 Q2 -2 20 0 Q2 2 0 20 Q-2 2 -20 0 Q-2 -2 0 -20Z" fill="#fff"/></g>`;

function body(c) {
  const { bx, by, brx, bry, stage } = c;
  const haunch = mirror(`<ellipse cx="${bx - brx * 0.78}" cy="${by + bry * 0.42}" rx="${brx * 0.5}" ry="${bry * 0.55}" fill="url(#fur)" ${ol()}/><ellipse cx="${bx - brx * 0.84}" cy="${by + bry * 0.34}" rx="${brx * 0.26}" ry="${bry * 0.3}" fill="url(#hl)"/>`);
  const torso = `<path d="M${bx - brx * 0.55} ${by - bry} Q${bx - brx} ${by - bry * 0.2} ${bx - brx * 0.92} ${by + bry * 0.75} Q${bx} ${by + bry * 1.1} ${bx + brx * 0.92} ${by + bry * 0.75} Q${bx + brx} ${by - bry * 0.2} ${bx + brx * 0.55} ${by - bry} Z" fill="url(#fur)" ${ol({ "stroke-width": 8 })}/>`;
  const belly = `<path d="M${bx - brx * 0.3} ${by - bry * 0.9} Q${bx - brx * 0.52} ${by + bry * 0.1} ${bx - brx * 0.36} ${by + bry * 0.9} L${bx + brx * 0.36} ${by + bry * 0.9} Q${bx + brx * 0.52} ${by + bry * 0.1} ${bx + brx * 0.3} ${by - bry * 0.9} Z" fill="url(#cream)" stroke="#d9b98a" stroke-width="3"/>`;
  const legs = [-1, 1].map(s => {
    const lx = bx + s * brx * 0.26, top = by + bry * 0.15, bot = by + bry * 1.0, w = brx * 0.2;
    return `<path d="M${lx - w} ${top} Q${lx - w - 6} ${(top + bot) / 2} ${lx - w * 1.1} ${bot - 20} Q${lx - w * 1.3} ${bot + 22} ${lx} ${bot + 22} Q${lx + w * 1.3} ${bot + 22} ${lx + w * 1.1} ${bot - 20} Q${lx + w + 6} ${(top + bot) / 2} ${lx + w} ${top} Z" fill="url(#cream)" ${ol({ "stroke-width": 7 })}/>` +
      [-0.4, 0.4].map(t => `<path d="M${lx + t * w} ${bot + 4} v16" ${ol({ "stroke-width": 4 })}/>`).join("") +
      `<path d="M${lx - w * 0.9} ${top + 40} h${w * 0.55} M${lx - w * 0.95} ${top + 80} h${w * 0.5}" stroke="#a8480f" stroke-width="8" fill="none" stroke-linecap="round" opacity=".9"/>`;
  }).join("");
  const stripes = `<path d="M${bx - brx * 0.78} ${by - bry * 0.25} q${brx * 0.16} ${bry * 0.05} ${brx * 0.2} ${bry * 0.18} M${bx - brx * 0.84} ${by + bry * 0.1} q${brx * 0.16} ${bry * 0.02} ${brx * 0.22} ${bry * 0.16} M${bx - brx * 0.8} ${by + bry * 0.45} q${brx * 0.15} -${bry * 0.02} ${brx * 0.2} ${bry * 0.1}" stroke="#a8480f" stroke-width="10" fill="none" stroke-linecap="round"/>` +
    `<g transform="translate(${2 * bx} 0) scale(-1 1)"><path d="M${bx - brx * 0.78} ${by - bry * 0.25} q${brx * 0.16} ${bry * 0.05} ${brx * 0.2} ${bry * 0.18} M${bx - brx * 0.84} ${by + bry * 0.1} q${brx * 0.16} ${bry * 0.02} ${brx * 0.22} ${bry * 0.16} M${bx - brx * 0.8} ${by + bry * 0.45} q${brx * 0.15} -${bry * 0.02} ${brx * 0.2} ${bry * 0.1}" stroke="#a8480f" stroke-width="10" fill="none" stroke-linecap="round"/></g>`;
  const light = `<ellipse cx="${bx - brx * 0.3}" cy="${by - bry * 0.4}" rx="${brx * 0.5}" ry="${bry * 0.35}" fill="url(#hl)"/>`;
  return haunch + torso + light + stripes + belly + legs;
}

function tail(c) {
  const { stage } = c;
  const d = stage === "baby" ? "M690 880 Q790 880 800 790 Q806 740 770 730"
    : stage === "young" ? "M720 880 Q880 900 900 760 Q912 660 850 620 Q820 600 790 620"
    : "M740 870 Q930 900 940 730 Q950 590 860 530 Q820 505 790 540";
  const w = stage === "baby" ? 44 : stage === "young" ? 52 : 70;
  const tip = stage === "baby" ? [770, 730] : stage === "young" ? [790, 620] : [790, 540];
  return `<path d="${d}" stroke="${OUT}" stroke-width="${w + 14}" fill="none" stroke-linecap="round"/><path d="${d}" stroke="url(#fur)" stroke-width="${w}" fill="none" stroke-linecap="round"/>
    <path d="${d}" stroke="#a8480f" stroke-width="${w}" fill="none" stroke-dasharray="${w * 0.45} ${w * 1.5}" opacity=".85"/>
    <path d="${d}" stroke="#ffe9bd" stroke-width="${w * 0.28}" fill="none" stroke-linecap="round" opacity=".45" transform="translate(-${w * 0.12} -${w * 0.12})"/>
    <circle cx="${tip[0]}" cy="${tip[1]}" r="${w * 0.52}" fill="#fff1d6" stroke="${OUT}" stroke-width="6"/>`;
}

function magic(c) {
  const { stage, cx, cy, ry, bx, by, brx, bry } = c;
  if (stage === "baby") return sparkle(cx, cy - ry * 0.74, 0.9, 0.9);
  const mark = stage === "young"
    ? `<path d="M${cx - 22} ${cy - ry * 0.7} a26 26 0 1 0 44 0 a20 20 0 1 1 -44 0Z" fill="#7ff3ff" filter="url(#glow)" opacity=".8"/><path d="M${cx - 16} ${cy - ry * 0.7} a20 20 0 1 0 32 0 a15 15 0 1 1 -32 0Z" fill="#d9fdff"/>`
    : `<path d="M${cx} ${cy - ry * 0.98} l32 38 l-32 54 l-32 -54 Z" fill="#ffd24d" filter="url(#glow)" opacity=".95"/><path d="M${cx} ${cy - ry * 0.98} l28 34 l-28 48 l-28 -48 Z" fill="url(#gem)" stroke="#fff5c4" stroke-width="3"/><path d="M${cx} ${cy - ry * 0.98} l-10 34 l10 14 l10 -14Z" fill="#fff" opacity=".7"/>`;
  if (stage === "young") return mark + sparkle(cx + 150, cy - 90, 0.8, 0.85) + sparkle(bx - 190, by - 120, 0.6, 0.8);
  // البالغ: رونات مضيئة على الكتفين والأرجل + ياقة فرو
  const rune = mirror(`<path d="M${bx - brx * 0.82} ${by - bry * 0.62} l24 -30 l24 30 l-24 22 Z M${bx - brx * 0.7} ${by - bry * 0.25} h50 M${bx - brx * 0.74} ${by - bry * 0.02} l30 -18 l30 18" stroke="#5deeff" stroke-width="16" fill="none" stroke-linecap="round" stroke-linejoin="round" filter="url(#glow)"/><path d="M${bx - brx * 0.82} ${by - bry * 0.62} l24 -30 l24 30 l-24 22 Z M${bx - brx * 0.7} ${by - bry * 0.25} h50 M${bx - brx * 0.74} ${by - bry * 0.02} l30 -18 l30 18" stroke="#f2ffff" stroke-width="6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`);
  return mark + rune + sparkle(cx + 260, cy - 40, 1, 0.9) + sparkle(cx - 280, cy + 40, 0.8, 0.85) + sparkle(bx + 300, by - 200, 0.7, 0.8);
}
// ياقة الفرو (البالغ فقط): خصلات كبيرة حول العنق
function ruff(c) {
  const { cx, cy, ry } = c, y = cy + ry * 0.78;
  const half = `<path d="M${cx} ${y - 40} L${cx - 150} ${y - 24} l-52 30 l40 12 l-46 40 l56 2 l-30 44 l64 -18 l22 38 l40 -44 l30 50 l24 -36 L${cx} ${y + 120} Z" fill="url(#cream)" ${ol({ "stroke-width": 6 })}/>`;
  return `<g>${half}</g><g transform="translate(${2 * cx} 0) scale(-1 1)">${half}</g>`;
}

const STAGES = {
  baby:  { cx: 512, cy: 520, rx: 255, ry: 215, er: 66, ear: 0.38, bx: 512, by: 800, brx: 160, bry: 130 },
  young: { cx: 512, cy: 430, rx: 200, ry: 170, er: 52, ear: 0.52, bx: 512, by: 740, brx: 190, bry: 200 },
  adult: { cx: 512, cy: 380, rx: 190, ry: 155, er: 47, ear: 0.6,  bx: 512, by: 720, brx: 250, bry: 235 }
};

function svg(stage) {
  const c = Object.assign({ stage }, STAGES[stage]);
  const shadow = `<ellipse cx="512" cy="${c.by + c.bry * 1.05 + 20}" rx="${c.brx * 1.15}" ry="26" fill="#000" opacity=".28" filter="url(#soft)"/>`;
  const out = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024">${defs}
    ${shadow}${tail(c)}${body(c)}${stage === "adult" ? ruff(c) : ""}${head(c)}${magic(c)}</svg>`;
  return out.replace(/(fill="[^"]*")([^>]*?)\sfill="none"/g, "$1$2");
}
module.exports = { svg, STAGES: ["baby", "young", "adult"] };
