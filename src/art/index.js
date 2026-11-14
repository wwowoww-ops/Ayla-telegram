// نظام الصور: الحيوان (طبقة شفافة) + خلفية الندرة + مؤثرات العنصر → صورة نهائية تُركَّب برمجيًا (sharp).
// تُحفَظ النتائج في ذاكرة/قرص كي لا تُرسم مرتين.
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const BG = require("./backgrounds");
const FX = require("./effects");

// الحيوانات المدعومة: معرّف النوع → مولّد { svg(stage), STAGES }. أضف مخلوقًا جديدًا بإضافة ملف هنا.
// الرسم البرمجي للقطة لم يُعتمد بعد: يُفعَّل للمعاينة فقط (ART_PREVIEW=1) حتى تصل صور المستخدم.
const ANIMALS = process.env.ART_PREVIEW === "1" ? { 1: require("./animals/cat") } : {};

// مراحل النمو من المستوى (سقف المستوى 50): صغير 1–14 · يافع 15–34 · بالغ 35+
const stageOf = lv => (lv >= 35 ? "adult" : lv >= 15 ? "young" : "baby");
const supports = spId => !!ANIMALS[spId];

const CACHE_DIR = path.join(__dirname, "..", "..", "data", "art-cache");
const mem = new Map();

const inner = s => s.replace(/^<svg[^>]*>/, "").replace(/<\/svg>\s*$/, "");

function composeSvg({ sp, stage, rarity, els, seed }) {
  const A = ANIMALS[sp];
  if (!A) return null;
  const fx = FX.layers(els, seed || sp);
  const animal = inner(A.svg(stage));
  // توهج بلون العنصر خلف الحيوان + إضاءة حافة
  const c1 = FX.COLORS[els && els[0]] || "#ffffff";
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024">
    ${BG.svg(rarity, seed || sp)}
    ${fx.defs}
    <g>${fx.back}</g>
    <ellipse cx="512" cy="560" rx="300" ry="360" fill="${c1}" opacity=".16" filter="url(#fxb)"/>
    <g>${animal}</g>
    <g>${fx.front}</g>
  </svg>`;
}

// يرجع Buffer لصورة JPEG نهائية. opts: { sp, lv, rarity, els:[el,el2?], size }
async function render(opts) {
  const stage = opts.stage || stageOf(opts.lv || 1);
  const els = (opts.els || []).filter(Boolean).slice(0, 2);   // حد أقصى نوعان
  const size = opts.size || 768;
  const key = [opts.sp, stage, opts.rarity, els.join("+"), size].join("_");
  if (mem.has(key)) return mem.get(key);
  const file = path.join(CACHE_DIR, key + ".jpg");
  try { if (fs.existsSync(file)) { const b = fs.readFileSync(file); mem.set(key, b); return b; } } catch (e) { /* لا كاش */ }
  const svg = composeSvg({ sp: opts.sp, stage, rarity: opts.rarity, els, seed: opts.sp });
  if (!svg) return null;
  const buf = await sharp(Buffer.from(svg)).resize(size, size).jpeg({ quality: 90 }).toBuffer();
  try { fs.mkdirSync(CACHE_DIR, { recursive: true }); fs.writeFileSync(file, buf); } catch (e) { /* لا كاش */ }
  if (mem.size > 300) mem.clear();
  mem.set(key, buf);
  return buf;
}
// الحيوان وحده بخلفية شفافة (PNG) لإعادة الاستخدام
async function animalPng(sp, stage, size) {
  const A = ANIMALS[sp];
  return A ? sharp(Buffer.from(A.svg(stage))).resize(size || 1024, size || 1024).png().toBuffer() : null;
}
module.exports = { render, animalPng, composeSvg, stageOf, supports, ANIMALS };
