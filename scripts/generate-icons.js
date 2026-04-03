/**
 * generate-icons.js
 * Creates simple solid-colour PNG icons for the extension.
 * Pure Node.js — no external dependencies needed.
 *
 * Usage: node scripts/generate-icons.js
 */

"use strict";

const fs   = require("fs");
const path = require("path");
const zlib = require("zlib");

// ── CRC32 (required by PNG spec) ───────────────────────────────────────────
function makeCrcTable() {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[n] = c;
  }
  return table;
}
const CRC_TABLE = makeCrcTable();

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ CRC_TABLE[(crc ^ buf[i]) & 0xff];
  }
  return (crc ^ 0xffffffff) >>> 0;
}

// ── PNG chunk builder ──────────────────────────────────────────────────────
function chunk(type, data) {
  const typeBytes = Buffer.from(type, "ascii");
  const lenBuf    = Buffer.alloc(4);
  const crcBuf    = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBytes, data])), 0);
  return Buffer.concat([lenBuf, typeBytes, data, crcBuf]);
}

// ── Solid-colour PNG generator ─────────────────────────────────────────────
function createSolidPNG(size, r, g, b) {
  // IHDR: width, height, 8-bit, RGB colour type (2), no interlace
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(size, 0);
  ihdrData.writeUInt32BE(size, 4);
  ihdrData[8]  = 8; // bit depth
  ihdrData[9]  = 2; // colour type RGB
  ihdrData[10] = 0; // compression
  ihdrData[11] = 0; // filter method
  ihdrData[12] = 0; // interlace

  // Raw scanlines: [filter-byte=0] + [R G B ...] × width, repeated height times
  const rowBytes  = 1 + size * 3;
  const rawPixels = Buffer.alloc(size * rowBytes);
  for (let y = 0; y < size; y++) {
    const base = y * rowBytes;
    rawPixels[base] = 0; // no filter
    for (let x = 0; x < size; x++) {
      rawPixels[base + 1 + x * 3]     = r;
      rawPixels[base + 1 + x * 3 + 1] = g;
      rawPixels[base + 1 + x * 3 + 2] = b;
    }
  }

  const idat = zlib.deflateSync(rawPixels);

  const PNG_SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  return Buffer.concat([
    PNG_SIGNATURE,
    chunk("IHDR", ihdrData),
    chunk("IDAT", idat),
    chunk("IEND", Buffer.alloc(0))
  ]);
}

// ── Main ───────────────────────────────────────────────────────────────────
const ICONS_DIR = path.join(__dirname, "..", "icons");
fs.mkdirSync(ICONS_DIR, { recursive: true });

// Icon colours: deep indigo-to-black gradient approximated as solid #1a0a2e
// (distinctive dark purple — stands out on both light & dark browser toolbars)
const ICON_COLOR = { r: 26, g: 10, b: 46 };

for (const size of [16, 48, 128]) {
  const buf     = createSolidPNG(size, ICON_COLOR.r, ICON_COLOR.g, ICON_COLOR.b);
  const outPath = path.join(ICONS_DIR, `icon${size}.png`);
  fs.writeFileSync(outPath, buf);
  console.log(`  Created ${outPath}  (${size}×${size}, ${buf.length} bytes)`);
}

console.log("Icons generated.");
