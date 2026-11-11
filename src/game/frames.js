// إطارات صورة الحساب (تُرسم بالكود، لا تحتاج ملفات صور).
// كل إطار دالة ترجع SVG للحلقة حول الصورة عند لحظة t (من 0 إلى 1)، والحركة تدور وتعود لبدايتها.
// لإضافة إطار جديد: أضف عنصرًا في FRAMES (id فريد، اسم، شرط الفتح، دالة الرسم).
const SIZE = 400;           // حجم البطاقة بالبكسل
const C = SIZE / 2;         // المركز
const R = 150;              // نصف قطر الصورة (الحلقة تبدأ بعده)
const TAU = Math.PI * 2;

const pt = (r, deg) => [C + r * Math.cos(deg * Math.PI / 180), C + r * Math.sin(deg * Math.PI / 180)];
const f = n => Number(n.toFixed(2));
function arc(r, a0, a1) {
    const [x0, y0] = pt(r, a0), [x1, y1] = pt(r, a1);
    return `M${f(x0)} ${f(y0)} A${r} ${r} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${f(x1)} ${f(y1)}`;
}
// أرقام شبه عشوائية ثابتة لنفس المدخل
const rnd = n => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
function star(x, y, s, color, op = 1) {
    if (s <= 0.05) return "";
    const a = s * 9, b = s * 2;
    return `<path d="M${f(x)} ${f(y - a)} L${f(x + b)} ${f(y - b)} L${f(x + a)} ${f(y)} L${f(x + b)} ${f(y + b)} L${f(x)} ${f(y + a)} L${f(x - b)} ${f(y + b)} L${f(x - a)} ${f(y)} L${f(x - b)} ${f(y - b)} Z" fill="${color}" opacity="${op}"/>`;
}
const svg = body => `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}">${body}</svg>`;
const glow = (id, d) => `<filter id="${id}" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="${d}"/></filter>`;

// ---------- الرسم ----------
function classic() {
    return svg(`<circle cx="${C}" cy="${C}" r="${R + 8}" fill="none" stroke="#f4c2d7" stroke-width="10"/>
        <circle cx="${C}" cy="${C}" r="${R + 15}" fill="none" stroke="#ffffff" stroke-opacity=".5" stroke-width="2"/>`);
}

function ice(t) {
    let s = `<defs>${glow("g", 5)}<linearGradient id="i" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e8fbff"/><stop offset="1" stop-color="#4fc3f7"/></linearGradient></defs>`;
    s += `<circle cx="${C}" cy="${C}" r="${R + 10}" fill="none" stroke="#7fdcff" stroke-width="14" filter="url(#g)" opacity=".8"/>`;
    s += `<circle cx="${C}" cy="${C}" r="${R + 10}" fill="none" stroke="url(#i)" stroke-width="10"/>`;
    for (let i = 0; i < 24; i++) {          // بلورات جليد حول الحلقة
        const a = i * 15, h = 14 + rnd(i) * 16;
        const [x0, y0] = pt(R + 14, a - 4), [x1, y1] = pt(R + 14, a + 4), [x2, y2] = pt(R + 14 + h, a);
        s += `<path d="M${f(x0)} ${f(y0)} L${f(x2)} ${f(y2)} L${f(x1)} ${f(y1)} Z" fill="#dff6ff" opacity=".85"/>`;
    }
    for (let i = 0; i < 14; i++) {          // لمعان متقطع
        const [x, y] = pt(R + 22 + rnd(i + 50) * 14, i * 25.7);
        s += star(x, y, Math.max(0, Math.sin(TAU * (t + rnd(i + 9)))) * 1.4, "#ffffff");
    }
    return svg(s);
}

function sakura(t) {
    let s = `<defs>${glow("g", 4)}</defs>`;
    s += `<circle cx="${C}" cy="${C}" r="${R + 9}" fill="none" stroke="#ff9ec7" stroke-width="12" filter="url(#g)" opacity=".7"/>`;
    s += `<circle cx="${C}" cy="${C}" r="${R + 9}" fill="none" stroke="#ffc9de" stroke-width="8"/>`;
    for (let i = 0; i < 16; i++) {          // بتلات تدور حول الحلقة
        const dir = i % 2 ? 1 : -1;
        const a = i * 22.5 + dir * t * 360;
        const r = R + 20 + rnd(i) * 22;
        const [x, y] = pt(r, a);
        const rot = a + t * 720 * dir;
        s += `<ellipse cx="${f(x)}" cy="${f(y)}" rx="9" ry="5" fill="${i % 3 ? "#ffb7d5" : "#ff8fbf"}" transform="rotate(${f(rot)} ${f(x)} ${f(y)})" opacity=".95"/>`;
    }
    return svg(s);
}

function fire(t) {
    let s = `<defs>${glow("g", 6)}<linearGradient id="fl" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#ff3d00"/><stop offset=".6" stop-color="#ff9100"/><stop offset="1" stop-color="#ffee58"/></linearGradient></defs>`;
    s += `<circle cx="${C}" cy="${C}" r="${R + 8}" fill="none" stroke="#ff5722" stroke-width="12" filter="url(#g)" opacity=".9"/>`;
    for (let i = 0; i < 36; i++) {
        const a = i * 10;
        const h = 24 + 14 * Math.sin(TAU * (2 * t + i * 0.37)) + 9 * Math.sin(TAU * (3 * t + i * 0.11));
        const sway = 4 * Math.sin(TAU * (t + i * 0.2));
        const [bx0, by0] = pt(R + 6, a - 5), [bx1, by1] = pt(R + 6, a + 5);
        const [tx, ty] = pt(R + 6 + h, a + sway);
        const [cx0, cy0] = pt(R + 6 + h * 0.5, a - 7), [cx1, cy1] = pt(R + 6 + h * 0.5, a + 7);
        s += `<path d="M${f(bx0)} ${f(by0)} Q${f(cx0)} ${f(cy0)} ${f(tx)} ${f(ty)} Q${f(cx1)} ${f(cy1)} ${f(bx1)} ${f(by1)} Z" fill="url(#fl)" opacity=".95"/>`;
    }
    s += `<circle cx="${C}" cy="${C}" r="${R + 6}" fill="none" stroke="#ff7043" stroke-width="6"/>`;
    return svg(s);
}

function neon(t) {
    let s = `<defs>${glow("g", 7)}</defs>`;
    let seg = "";
    for (let i = 0; i < 36; i++) {
        seg += `<path d="${arc(R + 10, i * 10, i * 10 + 11)}" fill="none" stroke="hsl(${Math.round((i * 10 + t * 360) % 360)},100%,60%)" stroke-width="14" stroke-linecap="butt"/>`;
    }
    s += `<g filter="url(#g)" opacity=".9">${seg}</g>${seg}`;
    s += `<circle cx="${C}" cy="${C}" r="${R + 10}" fill="none" stroke="#ffffff" stroke-opacity=".65" stroke-width="2"/>`;
    return svg(s);
}

function thunder(t, idx = 0) {
    const pulse = 0.65 + 0.35 * Math.sin(TAU * t * 2);
    let s = `<defs>${glow("g", 6)}</defs>`;
    s += `<circle cx="${C}" cy="${C}" r="${R + 9}" fill="none" stroke="#ffe600" stroke-width="14" filter="url(#g)" opacity="${f(pulse)}"/>`;
    s += `<circle cx="${C}" cy="${C}" r="${R + 9}" fill="none" stroke="#fff59d" stroke-width="6"/>`;
    for (let k = 0; k < 7; k++) {            // صواعق تتبدل مواضعها كل لقطة
        const a = rnd(idx * 7 + k) * 360, len = 20 + rnd(idx * 13 + k) * 24;
        let d = "", r = R + 14, ang = a;
        const [x0, y0] = pt(r, ang); d += `M${f(x0)} ${f(y0)}`;
        for (let j = 0; j < 4; j++) { r += len / 4; ang += (rnd(idx * 31 + k * 5 + j) - 0.5) * 16; const [x, y] = pt(r, ang); d += ` L${f(x)} ${f(y)}`; }
        s += `<path d="${d}" fill="none" stroke="#fffde7" stroke-width="3" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="#ffd600" stroke-width="7" opacity=".35" filter="url(#g)"/>`;
    }
    return svg(s);
}

function gold(t) {
    let s = `<defs>${glow("g", 5)}<linearGradient id="gd" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff3b0"/><stop offset=".5" stop-color="#e0a800"/><stop offset="1" stop-color="#8a5a00"/></linearGradient></defs>`;
    s += `<circle cx="${C}" cy="${C}" r="${R + 11}" fill="none" stroke="#ffcc33" stroke-width="20" filter="url(#g)" opacity=".5"/>`;
    s += `<circle cx="${C}" cy="${C}" r="${R + 11}" fill="none" stroke="url(#gd)" stroke-width="16"/>`;
    s += `<circle cx="${C}" cy="${C}" r="${R + 20}" fill="none" stroke="#fff3b0" stroke-opacity=".7" stroke-width="2"/>`;
    const a = t * 360;                       // لمعة تدور
    s += `<path d="${arc(R + 11, a, a + 40)}" fill="none" stroke="#ffffff" stroke-width="12" stroke-linecap="round" filter="url(#g)" opacity=".9"/>`;
    s += `<path d="${arc(R + 11, a + 8, a + 32)}" fill="none" stroke="#ffffff" stroke-width="6" stroke-linecap="round"/>`;
    for (let i = 0; i < 10; i++) {
        const [x, y] = pt(R + 30, i * 36 + 10);
        s += star(x, y, Math.max(0, Math.sin(TAU * (t + i * 0.1))) * 1.3, "#fff8d6");
    }
    return svg(s);
}

function galaxy(t) {
    let s = `<defs>${glow("g", 7)}<linearGradient id="gx" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7c4dff"/><stop offset="1" stop-color="#1a237e"/></linearGradient></defs>`;
    s += `<circle cx="${C}" cy="${C}" r="${R + 12}" fill="none" stroke="#b388ff" stroke-width="${f(16 + 4 * Math.sin(TAU * t))}" filter="url(#g)" opacity=".7"/>`;
    s += `<circle cx="${C}" cy="${C}" r="${R + 10}" fill="none" stroke="url(#gx)" stroke-width="14"/>`;
    const orbits = [[R + 24, 1, 6], [R + 33, -2, 5], [R + 42, 3, 4]];
    orbits.forEach(([r, speed, n], oi) => {
        for (let i = 0; i < n; i++) {
            const [x, y] = pt(r, i * (360 / n) + speed * t * 360 + oi * 20);
            s += `<circle cx="${f(x)}" cy="${f(y)}" r="${oi === 0 ? 3.2 : 2.4}" fill="${i % 2 ? "#e1bee7" : "#ffffff"}"/>`;
        }
    });
    for (let i = 0; i < 8; i++) { const [x, y] = pt(R + 50 + rnd(i) * 6, i * 45 + 20); s += star(x, y, Math.max(0, Math.sin(TAU * (t + rnd(i + 3)))) * 1.1, "#ede7f6"); }
    return svg(s);
}

// ---------- القائمة ----------
// ach: مفتاح الإنجاز الذي يفتح الإطار (انظر game/quests.js)، text: وصف الشرط للاعب.
// frames: عدد لقطات الحركة (1 = ثابت)
const FRAMES = [
    { id: "classic",  name: "كلاسيكي",   e: "🌸", ach: null,        text: "مفتوح للجميع", frames: 1,  draw: classic },
    { id: "ice",      name: "جليد",      e: "❄️", ach: "hatched:0", text: "افقس أول بيضة", frames: 12, draw: ice },
    { id: "sakura",   name: "زهر الكرز", e: "🌸", ach: "pets:0",    text: "املك 5 حيوانات", frames: 12, draw: sakura },
    { id: "fire",     name: "نار",       e: "🔥", ach: "hunts:1",   text: "100 مرة صيد", frames: 12, draw: fire },
    { id: "neon",     name: "نيون",      e: "🌈", ach: "wins:1",    text: "50 انتصار في الصيد", frames: 12, draw: neon },
    { id: "thunder",  name: "برق",       e: "⚡", ach: "duels:1",   text: "10 انتصارات في المبارزة", frames: 8, draw: thunder },
    { id: "gold",     name: "ذهب",       e: "👑", ach: "coins:1",   text: "اجمع مليار عملة", frames: 12, draw: gold },
    { id: "galaxy",   name: "مجرة",      e: "🌌", ach: "stars:0",   text: "ارقِ حيوانًا بنجمة", frames: 12, draw: galaxy }
];

// مجموعات الإطارات (كل مجموعة في ملف مستقل)
const withCat = (list, cat) => list.map(x => Object.assign({ cat }, x));
FRAMES.forEach(x => { x.cat = "classic"; });
FRAMES.push(
    ...withCat(require("./framesOrnate").ORNATE, "ornate"),
    ...withCat(require("./framesAnimal").ANIMAL, "animal"),
    ...require("./framesMore").MORE
);

// الفئات المعروضة في القائمة (بهذا الترتيب)
const CATS = [
    { id: "classic", name: "الكلاسيكية", e: "🌸" },
    { id: "ornate",  name: "المزخرفة",   e: "💜" },
    { id: "animal",  name: "الحيوانات",  e: "🐾" },
    { id: "element", name: "العناصر",    e: "🔥" },
    { id: "rarity",  name: "الندرة",     e: "💎" },
    { id: "special", name: "خاصة",       e: "🎆" },
    { id: "boss",    name: "الزعماء",    e: "👑" },
    { id: "legend",  name: "الأساطير",   e: "🏆" }
];

const byId = id => FRAMES.find(x => x.id === id) || null;
// مفتوح إن كان مجانيًا، أو اشتراه اللاعب أو نالَه (P.fown)، أو حقق إنجازه، أو تحقق شرطه (unlock)
// only = لا يُفتح إلا بالمنح (مثل جوائز الزعماء)
const isUnlocked = (P, fr) =>
    !!(P && P.fown && P.fown[fr.id]) ||
    (!fr.ach && !fr.price && !fr.unlock && !fr.only) ||
    !!(fr.ach && P && P.ach && P.ach[fr.ach]) ||
    !!(fr.unlock && fr.unlock(P));

module.exports = { SIZE, C, R, FRAMES, CATS, byId, isUnlocked };