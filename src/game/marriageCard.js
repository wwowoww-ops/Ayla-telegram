
/**
 * ╔══════════════════════════════════════╗
 * ║          AYLA MARRIAGE CARD           ║
 * ║                 v1.1                 ║
 * ╚══════════════════════════════════════╝
 */

const sharp = require("sharp");

function xml(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;");
}

function date(value) {
    const d = new Date(value);

    if (Number.isNaN(d.getTime())) {
        return "Unknown";
    }

    return d.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "long",
        year: "numeric",
        timeZone: "UTC"
    });
}

module.exports = async function makeMarriageCard(marriage) {
    if (!marriage || !marriage.husbandName || !marriage.wifeName) {
        throw new Error("بيانات بطاقة الزواج غير مكتملة.");
    }

    const husband = xml(marriage.husbandName);
    const wife = xml(marriage.wifeName);

    const dowryValue = Number(marriage.dowry);

    if (!Number.isSafeInteger(dowryValue) || dowryValue < 0) {
        throw new Error("قيمة المهر غير صالحة.");
    }

    const dowry = dowryValue.toLocaleString("en-US");
    const created = date(marriage.createdAt);

    const svg = `
    <svg width="1000" height="600"
         xmlns="http://www.w3.org/2000/svg">

      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#111019"/>
          <stop offset="55%" stop-color="#21192f"/>
          <stop offset="100%" stop-color="#38264e"/>
        </linearGradient>

        <linearGradient id="line" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="#7652a8"/>
          <stop offset="50%" stop-color="#d6b8ff"/>
          <stop offset="100%" stop-color="#7652a8"/>
        </linearGradient>

        <radialGradient id="glow">
          <stop offset="0%" stop-color="#9c72d2" stop-opacity=".22"/>
          <stop offset="100%" stop-color="#9c72d2" stop-opacity="0"/>
        </radialGradient>
      </defs>

      <rect width="1000" height="600" rx="34" fill="url(#bg)"/>

      <circle cx="500" cy="290" r="360" fill="url(#glow)"/>

      <rect x="24" y="24" width="952" height="552"
            rx="26" fill="none"
            stroke="url(#line)" stroke-width="3"/>

      <rect x="38" y="38" width="924" height="524"
            rx="20" fill="none"
            stroke="#ffffff" stroke-opacity=".08"
            stroke-width="1"/>

      <text x="500" y="94"
            text-anchor="middle"
            font-size="34"
            letter-spacing="5"
            fill="#d8c7f5"
            font-family="Arial, sans-serif">
        AYLA
      </text>

      <text x="500" y="128"
            text-anchor="middle"
            font-size="17"
            letter-spacing="4"
            fill="#a992c8"
            font-family="Arial, sans-serif">
        MARRIAGE RECORD
      </text>

      <line x1="250" y1="155" x2="750" y2="155"
            stroke="url(#line)" stroke-width="2"/>

      <text x="500" y="235"
            text-anchor="middle"
            font-size="58"
            fill="#ffffff"
            font-family="Arial, sans-serif">
        Marriage Certificate
      </text>

      <text x="500" y="320"
            text-anchor="middle"
            font-size="43"
            fill="#eadcfb"
            font-family="Arial, sans-serif">
        ${husband}  ×  ${wife}
      </text>

      <line x1="320" y1="365" x2="680" y2="365"
            stroke="#8d6cc5"
            stroke-opacity=".65"
            stroke-width="1.5"/>

      <text x="500" y="415"
            text-anchor="middle"
            font-size="29"
            fill="#d6c2f0"
            font-family="Arial, sans-serif">
        Dowry: ${dowry} VLT
      </text>

      <text x="500" y="463"
            text-anchor="middle"
            font-size="23"
            fill="#bca8dc"
            font-family="Arial, sans-serif">
        Date: ${xml(created)}
      </text>

      <line x1="250" y1="495" x2="750" y2="495"
            stroke="url(#line)" stroke-width="2"/>

      <text x="500" y="535"
            text-anchor="middle"
            font-size="21"
            letter-spacing="2"
            fill="#d8c7f5"
            font-family="Arial, sans-serif">
        REGISTERED BY AYLA
      </text>

    </svg>`;

    return sharp(Buffer.from(svg))
        .png()
        .toBuffer();
};
