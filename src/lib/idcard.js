// يركّب صورة الحساب داخل إطار (ثابت أو متحرك) ويرجع صورة جاهزة للإرسال
const sharp = require("sharp");
const { SIZE, C, R } = require("../game/frames");

const BG = "#15121f";
const FRAME_DELAY_MS = 70;

// الصورة الشخصية: دائرة للإطارات القديمة، ومربع بزوايا مدوّرة للمزخرفة (frame.win)
async function circlePhoto(photo, frame) {
    if (frame && frame.win) {
        const w = frame.win;
        const m = Buffer.from(`<svg width="${w.w}" height="${w.h}"><rect width="${w.w}" height="${w.h}" rx="${w.r}" fill="#fff"/></svg>`);
        return sharp(photo).resize(w.w, w.h, { fit: "cover" }).ensureAlpha().composite([{ input: m, blend: "dest-in" }]).png().toBuffer();
    }
    const d = R * 2;
    const mask = Buffer.from(`<svg width="${d}" height="${d}"><circle cx="${R}" cy="${R}" r="${R}" fill="#fff"/></svg>`);
    return sharp(photo)
        .resize(d, d, { fit: "cover" })
        .ensureAlpha()
        .composite([{ input: mask, blend: "dest-in" }])
        .png()
        .toBuffer();
}

const background = () => sharp({ create: { width: SIZE, height: SIZE, channels: 4, background: BG } });

// frame: عنصر من FRAMES في game/frames.js
// يرجع { buffer, animated }
async function renderCard(photo, frame) {
    const circle = await circlePhoto(photo, frame);
    const at = frame.win ? { left: frame.win.x, top: frame.win.y } : { left: C - R, top: C - R };
    const base = await background().composite([{ input: circle, ...at }]).png().toBuffer();

    const layer = i => sharp(base)
        .composite([{ input: Buffer.from(frame.draw(i / frame.frames, i)), left: 0, top: 0 }])
        .png();

    if (frame.frames <= 1) {
        return { buffer: await layer(0).jpeg({ quality: 90 }).toBuffer(), animated: false };
    }

    const shots = [];
    for (let i = 0; i < frame.frames; i++) shots.push(await layer(i).toBuffer());
    try {
        const gif = await sharp(shots, { join: { animated: true } })
            .gif({ delay: new Array(shots.length).fill(FRAME_DELAY_MS), loop: 0, effort: 3 })
            .toBuffer();
        return { buffer: gif, animated: true };
    } catch (e) {
        // إن لم تدعم نسخة sharp الحركة نرسل لقطة ثابتة بدل أن يفشل الأمر
        console.error("[IDCARD] تعذر إنشاء الحركة:", e.message);
        return { buffer: await sharp(shots[0]).jpeg({ quality: 90 }).toBuffer(), animated: false };
    }
}

module.exports = { renderCard };