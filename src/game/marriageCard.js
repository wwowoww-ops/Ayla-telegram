
/**
 * ╔══════════════════════════════════════╗
 * ║          AYLA MARRIAGE CARD          ║
 * ║                 v1.0                 ║
 * ╚══════════════════════════════════════╝
 */

const sharp = require("sharp");

function xml(value) {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;");
}

function date(value) {
    return new Date(value).toLocaleDateString("en-GB");
}

module.exports = async function makeMarriageCard(marriage) {
    const husband = xml(marriage.husbandName);
    const wife = xml(marriage.wifeName);
    const dowry = Number(marriage.dowry).toLocaleString("en-US");
    const created = date(marriage.createdAt);

    const svg = `
    <svg width="1000" height="600" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#171321"/>
          <stop offset="100%" stop-color="#302344"/>
        </linearGradient>
        <linearGradient id="line" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="#8d6cc5"/>
          <stop offset="100%" stop-color="#c2a7ee"/>
        </linearGradient>
      </defs>

      <rect width="1000" height="600" rx="34" fill="url(#bg)"/>
      <rect x="24" y="24" width="952" height="552"
            rx="26" fill="none" stroke="url(#line)" stroke-width="3"/>

      <text x="500" y="100" text-anchor="middle"
            font-size="34" fill="#d8c7f5"
            font-family="Arial">AYLA  /  MARRIAGE</text>

      <line x1="250" y1="135" x2="750" y2="135"
            stroke="#8d6cc5" stroke-width="2"/>

      <text x="500" y="225" text-anchor="middle"
            font-size="68" fill="#ffffff"
            font-family="Arial">Marriage Certificate</text>

      <text x="500" y="320" text-anchor="middle"
            font-size="44" fill="#e5d7fa"
            font-family="Arial">${husband}  ×  ${wife}</text>

      <text x="500" y="400" text-anchor="middle"
            font-size="30" fill="#c9b6e8"
            font-family="Arial">Dowry: ${dowry} VLT</text>

      <text x="500" y="455" text-anchor="middle"
            font-size="25" fill="#bca8dc"
            font-family="Arial">Date: ${created}</text>

      <line x1="250" y1="495" x2="750" y2="495"
            stroke="#8d6cc5" stroke-width="2"/>

      <text x="500" y="540" text-anchor="middle"
            font-size="25" fill="#d8c7f5"
            font-family="Arial">Registered by AYLA</text>
    </svg>`;

    return sharp(Buffer.from(svg))
        .png()
        .toBuffer();
};
