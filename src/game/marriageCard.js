
/**
 * ╔══════════════════════════════════════╗
 * ║       AYLA NEON MARRIAGE CARD         ║
 * ║                 v2.0                 ║
 * ╚══════════════════════════════════════╝
 *
 * الصور الشخصية من Telegram.
 * القلب والتاريخ مرسومان هندسياً دون خطوط.
 */

const sharp = require("sharp");

const WIDTH = 1000;
const HEIGHT = 600;
const AVATAR_SIZE = 220;

function dateDigits(value) {
    const d = new Date(value);

    if (Number.isNaN(d.getTime())) {
        return "00/00/0000";
    }

    const day = String(d.getUTCDate()).padStart(2, "0");
    const month = String(d.getUTCMonth() + 1).padStart(2, "0");
    const year = String(d.getUTCFullYear());

    return `${day}/${month}/${year}`;
}

// رسم الأرقام باستخدام سبعة مقاطع هندسية
function drawDate(value) {
    const digits = {
        "0": "abcdef",
        "1": "bc",
        "2": "abged",
        "3": "abgcd",
        "4": "fgbc",
        "5": "afgcd",
        "6": "afgecd",
        "7": "abc",
        "8": "abcdefg",
        "9": "abfgcd"
    };

    const segments = {
        a: [8, 0, 22, 6],
        b: [30, 6, 6, 21],
        c: [30, 31, 6, 21],
        d: [8, 52, 22, 6],
        e: [2, 31, 6, 21],
        f: [2, 6, 6, 21],
        g: [8, 26, 22, 6]
    };

    let x = 0;
    let output = "";

    for (const char of value) {
        if (char === "/") {
            output += `
                <path d="M ${x + 8} 53 L ${x + 25} 5"
                    stroke="#e9c5ff"
                    stroke-width="5"
                    stroke-linecap="round"
                    opacity=".85"/>
            `;
            x += 40;
            continue;
        }

        const active = digits[char] || "";

        for (const key of active) {
            const [sx, sy, sw, sh] = segments[key];

            output += `
                <rect
                    x="${x + sx}"
                    y="${sy}"
                    width="${sw}"
                    height="${sh}"
                    rx="3"
                    fill="#f0caff"
                />
            `;
        }

        x += 42;
    }

    return `
        <svg xmlns="http://www.w3.org/2000/svg"
             width="${x}" height="58">
            <g filter="url(#glow)">
                ${output}
            </g>
            <defs>
                <filter id="glow" x="-50%" y="-50%"
                        width="200%" height="200%">
                    <feGaussianBlur stdDeviation="5"/>
                </filter>
            </defs>
            ${output}
        </svg>
    `;
}

function backgroundSvg() {
    return `
    <svg xmlns="http://www.w3.org/2000/svg"
         width="1000" height="600">

        <defs>
            <linearGradient id="bg" x1="0" y1="0"
                            x2="1" y2="1">
                <stop offset="0%" stop-color="#080611"/>
                <stop offset="50%" stop-color="#1b1030"/>
                <stop offset="100%" stop-color="#080611"/>
            </linearGradient>

            <linearGradient id="border" x1="0" y1="0"
                            x2="1" y2="1">
                <stop offset="0%" stop-color="#9d4edd"/>
                <stop offset="50%" stop-color="#f0abfc"/>
                <stop offset="100%" stop-color="#7b2cbf"/>
            </linearGradient>

            <linearGradient id="heart" x1="0" y1="0"
                            x2="1" y2="1">
                <stop offset="0%" stop-color="#ff8bea"/>
                <stop offset="50%" stop-color="#d946ef"/>
                <stop offset="100%" stop-color="#9333ea"/>
            </linearGradient>

            <radialGradient id="light">
                <stop offset="0%" stop-color="#a855f7"
                       stop-opacity=".28"/>
                <stop offset="100%" stop-color="#a855f7"
                       stop-opacity="0"/>
            </radialGradient>
        </defs>

        <rect width="1000" height="600"
              rx="38" fill="url(#bg)"/>

        <circle cx="280" cy="260" r="220"
                fill="url(#light)"/>

        <circle cx="720" cy="260" r="220"
                fill="url(#light)"/>

        <circle cx="500" cy="260" r="200"
                fill="url(#light)"/>

        <rect x="18" y="18" width="964" height="564"
              rx="30" fill="none"
              stroke="url(#border)" stroke-width="3"/>

        <rect x="30" y="30" width="940" height="540"
              rx="24" fill="none"
              stroke="#ffffff" stroke-opacity=".09"/>

        <!-- إطار الزوج -->
        <circle cx="280" cy="260" r="119"
                fill="none" stroke="#c084fc"
                stroke-width="5"/>

        <circle cx="280" cy="260" r="126"
                fill="none" stroke="#c084fc"
                stroke-width="2" opacity=".35"/>

        <!-- إطار الزوجة -->
        <circle cx="720" cy="260" r="119"
                fill="none" stroke="#f0abfc"
                stroke-width="5"/>

        <circle cx="720" cy="260" r="126"
                fill="none" stroke="#f0abfc"
                stroke-width="2" opacity=".35"/>

        <!-- القلب -->
        <g transform="translate(500 260) scale(1.15)">
            <path
                d="M0 65
                   C-25 42 -85 -5 -85 -42
                   C-85 -85 -25 -91 0 -48
                   C25 -91 85 -85 85 -42
                   C85 -5 25 42 0 65Z"
                fill="url(#heart)"
                stroke="#ffd6ff"
                stroke-width="3"
            />

            <path
                d="M0 65
                   C-25 42 -85 -5 -85 -42
                   C-85 -85 -25 -91 0 -48
                   C25 -91 85 -85 85 -42
                   C85 -5 25 42 0 65Z"
                fill="none"
                stroke="#f0abfc"
                stroke-width="8"
                opacity=".35"
            />
        </g>

        <!-- الخط الفاصل -->
        <path d="M260 435 H740"
              stroke="url(#border)"
              stroke-width="2"
              opacity=".6"/>

        <!-- توهج التاريخ -->
        <rect x="270" y="466" width="460" height="90"
              rx="20" fill="#a855f7" opacity=".07"/>

    </svg>`;
}

// إنشاء صورة افتراضية عند عدم وجود صورة شخصية
async function fallbackAvatar() {
    const svg = `
    <svg xmlns="http://www.w3.org/2000/svg"
         width="220" height="220">
        <defs>
            <linearGradient id="f" x1="0" y1="0"
                            x2="1" y2="1">
                <stop offset="0%" stop-color="#48236d"/>
                <stop offset="100%" stop-color="#130c25"/>
            </linearGradient>
        </defs>

        <rect width="220" height="220"
              fill="url(#f)"/>

        <circle cx="110" cy="82" r="43"
                fill="#d8b4fe"/>

        <path d="M30 220
                 C35 145 75 130 110 130
                 C145 130 185 145 190 220Z"
              fill="#d8b4fe"/>
    </svg>`;

    return Buffer.from(svg);
}

// جلب صورة تيليجرام الشخصية
async function getTelegramAvatar(api, userId) {
    try {
        if (!api || !userId || !api.token) {
            return fallbackAvatar();
        }

        const result = await api.getUserProfilePhotos(
            userId,
            { limit: 1 }
        );

        const photos = result.photos || [];

        if (!photos.length) {
            return fallbackAvatar();
        }

        const sizes = photos[0];
        const photo = sizes[sizes.length - 1];

        if (!photo || !photo.file_id) {
            return fallbackAvatar();
        }

        const file = await api.getFile(photo.file_id);

        if (!file.file_path) {
            return fallbackAvatar();
        }

        const url =
            `https://api.telegram.org/file/bot${api.token}/${file.file_path}`;

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error("تعذر تحميل الصورة الشخصية.");
        }

        const buffer = Buffer.from(
            await response.arrayBuffer()
        );

        return buffer;

    } catch (error) {
        console.error(
            "[AYLA CARD AVATAR]",
            error.message || error
        );

        return fallbackAvatar();
    }
}

// قص الصورة بشكل دائري
async function circularAvatar(buffer) {
    const image = await sharp(buffer)
        .rotate()
        .resize(AVATAR_SIZE, AVATAR_SIZE, {
            fit: "cover",
            position: "centre"
        })
        .png()
        .toBuffer();

    const mask = Buffer.from(`
        <svg xmlns="http://www.w3.org/2000/svg"
             width="${AVATAR_SIZE}"
             height="${AVATAR_SIZE}">
            <circle cx="110" cy="110" r="110"
                    fill="white"/>
        </svg>
    `);

    return sharp(image)
        .composite([{
            input: mask,
            blend: "dest-in"
        }])
        .png()
        .toBuffer();
}

module.exports = async function makeMarriageCard(marriage, api) {
    if (!marriage) {
        throw new Error("بيانات الزواج غير موجودة.");
    }

    if (!marriage.husband || !marriage.wife) {
        throw new Error("معرّفات الزوجين غير موجودة في سجل الزواج.");
    }

    const [husbandRaw, wifeRaw] = await Promise.all([
        getTelegramAvatar(api, marriage.husband),
        getTelegramAvatar(api, marriage.wife)
    ]);

    const [husbandImage, wifeImage] = await Promise.all([
        circularAvatar(husbandRaw),
        circularAvatar(wifeRaw)
    ]);

    const dateSvg = Buffer.from(
        drawDate(dateDigits(marriage.createdAt))
    );

    const dateImage = await sharp(dateSvg)
        .png()
        .toBuffer();

    const dateMeta = await sharp(dateImage).metadata();

    const dateX = Math.round((WIDTH - dateMeta.width) / 2);

    const base = Buffer.from(backgroundSvg());

    return sharp(base)
        .composite([
            {
                input: husbandImage,
                left: 170,
                top: 150
            },
            {
                input: wifeImage,
                left: 610,
                top: 150
            },
            {
                input: dateImage,
                left: dateX,
                top: 482
            }
        ])
        .png()
        .toBuffer();
};
