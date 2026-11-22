// يولّد بطاقات الأنواع images/<id>.jpg (إيموجي + خلفية بلون العنصر + إطار بلون الندرة + الاسم).
// الاستخدام: node tools/gen-species-img.js [id ...]   (بلا معاملات: يولّد الأنواع التي ليس لها صورة)
// يحتاج playwright (محلي للتطوير فقط، ليس من اعتماديات التشغيل).
const fs = require("fs"), path = require("path");
const D = require("../src/game/data");
const OUT = path.join(__dirname, "..", "images");
const EL = { fire: ["#ff7a3a", "#a82a22"], water: ["#4aa8ff", "#1a4a9a"], plant: ["#6ad06a", "#1f6a3a"], earth: ["#c9955a", "#6a4a2a"], thunder: ["#ffe45a", "#b07a10"], light: ["#fff0a0", "#e09a30"], dark: ["#7a5ac0", "#1a1233"], ice: ["#9ae0ff", "#2a6ab0"], wind: ["#b8f0e0", "#3a9aa0"], poison: ["#c07aff", "#5a2a8a"], metal: ["#b8c4d4", "#4a5668"] };
const FR = ["#cbd5e1", "#4ade80", "#60a5fa", "#c084fc", "#fb923c", "#f87171", "#ffd24d", "#a78bfa", "#fff1a8"];
const EXTRA = { 56: "⏳", 57: "☄️", 59: "❄️", 68: "🌿" };   // رمز صغير يميّز النوع عن إيموجي مشابه
const TINT = { 56: "sepia(1) saturate(2.2) hue-rotate(-5deg) brightness(1.1)", 57: "hue-rotate(230deg) saturate(1.6) brightness(1.1)", 59: "hue-rotate(55deg) saturate(.9) brightness(1.3)", 68: "hue-rotate(-20deg)" };   // تلوين الإيموجي ليوافق النوع
const ids = process.argv.slice(2).map(Number).filter(Boolean);
const todo = ids.length ? ids : Object.keys(D.SPECIES).map(Number).filter(i => !fs.existsSync(path.join(OUT, i + ".jpg")));
(async () => {
  const { chromium } = require("playwright");
  const b = await chromium.launch(), pg = await b.newPage({ viewport: { width: 640, height: 640 } });
  for (const id of todo) {
    const s = D.SPECIES[id]; if (!s) continue;
    const [c1, c2] = [EL[s.els[0]] || EL.light, EL[s.els[1]] || EL[s.els[0]] || EL.light];
    const fr = FR[s.r] || "#fff", ex = EXTRA[id] ? `<div class="ex">${EXTRA[id]}</div>` : "";
    const dots = Array.from({ length: 14 }, (_, i) => `<i style="left:${(i * 137) % 100}%;top:${(i * 59 + 11) % 100}%;width:${4 + (i % 3) * 3}px;height:${4 + (i % 3) * 3}px"></i>`).join("");
    await pg.setContent(`<style>*{margin:0}body{width:640px;height:640px;background:radial-gradient(circle at 50% 35%,${c1[0]},${c1[1]} 85%);position:relative;overflow:hidden;font-family:'DejaVu Sans',sans-serif}
    .g{position:absolute;inset:0;background:radial-gradient(circle at 80% 80%,${c2[0]}66,transparent 55%)}
    .f{position:absolute;inset:18px;border:6px solid ${fr};border-radius:34px;box-shadow:0 0 22px ${fr}aa,inset 0 0 22px ${fr}55}
    .e{position:absolute;left:0;right:0;top:110px;text-align:center;font-family:'Noto Color Emoji';font-size:270px;line-height:300px;filter:drop-shadow(0 14px 10px rgba(0,0,0,.35))}
    .ex{position:absolute;right:130px;top:120px;font-family:'Noto Color Emoji';font-size:90px;filter:drop-shadow(0 4px 6px rgba(0,0,0,.4))}
    .sh{position:absolute;left:190px;right:190px;top:455px;height:26px;border-radius:50%;background:rgba(0,0,0,.28);filter:blur(8px)}
    .n{position:absolute;left:0;right:0;bottom:52px;text-align:center;color:#fff;font-weight:bold;font-size:50px;text-shadow:0 3px 8px rgba(0,0,0,.6)}
    i{position:absolute;border-radius:50%;background:rgba(255,255,255,.55)}</style>
    <div class="g"></div>${dots}<div class="f"></div><div class="sh"></div><div class="e" style="${TINT[id] ? `filter:${TINT[id]} drop-shadow(0 14px 10px rgba(0,0,0,.35))` : ""}">${s.e}</div>${ex}<div class="n" dir="rtl">${s.n}</div>`);
    await pg.waitForTimeout(150);
    await pg.screenshot({ path: path.join(OUT, id + ".jpg"), type: "jpeg", quality: 88 });
    console.log("ok", id, s.n);
  }
  await b.close();
})();
