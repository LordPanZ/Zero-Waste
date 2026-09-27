// Generates simple flat-color PNG app icons without any image-library dependency.
import { deflateSync } from 'node:zlib'
import { writeFileSync, mkdirSync } from 'node:fs'

const CRC_TABLE = (() => {
  const table = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    table[n] = c >>> 0
  }
  return table
})()

function crc32(buf) {
  let c = 0xffffffff
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii')
  const lenBuf = Buffer.alloc(4)
  lenBuf.writeUInt32BE(data.length, 0)
  const crcBuf = Buffer.alloc(4)
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0)
  return Buffer.concat([lenBuf, typeBuf, data, crcBuf])
}

function encodePNG(width, height, rgba) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  const ihdrData = Buffer.alloc(13)
  ihdrData.writeUInt32BE(width, 0)
  ihdrData.writeUInt32BE(height, 4)
  ihdrData[8] = 8 // bit depth
  ihdrData[9] = 6 // color type RGBA
  ihdrData[10] = 0
  ihdrData[11] = 0
  ihdrData[12] = 0
  const ihdr = chunk('IHDR', ihdrData)

  const stride = width * 4
  const raw = Buffer.alloc((stride + 1) * height)
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0 // filter: none
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride)
  }
  const idat = chunk('IDAT', deflateSync(raw, { level: 9 }))
  const iend = chunk('IEND', Buffer.alloc(0))
  return Buffer.concat([signature, ihdr, idat, iend])
}

function setPixel(rgba, width, x, y, [r, g, b, a]) {
  if (x < 0 || y < 0 || x >= width || y >= width) return
  const i = (y * width + x) * 4
  rgba[i] = r
  rgba[i + 1] = g
  rgba[i + 2] = b
  rgba[i + 3] = a
}

// Draws the Zero Waste mark: rounded square background + leaf-in-circle glyph.
function drawIcon(size, { padding = 0 } = {}) {
  const rgba = Buffer.alloc(size * size * 4)
  const bg = [22, 101, 52, 255] // green-800
  const bg2 = [34, 197, 94, 255] // green-500
  const white = [255, 255, 255, 255]
  const cx = size / 2
  const cy = size / 2
  const r = size / 2 - padding

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = x - cx
      const dy = y - cy
      const dist = Math.sqrt(dx * dx + dy * dy)
      const t = Math.max(0, Math.min(1, (y / size)))
      const bgColor = [
        Math.round(bg[0] + (bg2[0] - bg[0]) * t),
        Math.round(bg[1] + (bg2[1] - bg[1]) * t),
        Math.round(bg[2] + (bg2[2] - bg[2]) * t),
        255,
      ]
      if (padding > 0) {
        // maskable icon: fill full square with background (safe zone)
        setPixel(rgba, size, x, y, bgColor)
      } else if (dist <= r) {
        setPixel(rgba, size, x, y, bgColor)
      } else {
        setPixel(rgba, size, x, y, [0, 0, 0, 0])
      }
    }
  }

  // Leaf glyph made of two overlapping circles (simple, recognizable at small sizes)
  const leafR = size * 0.24
  const c1x = cx - size * 0.06
  const c1y = cy - size * 0.02
  const c2x = cx + size * 0.1
  const c2y = cy + size * 0.08

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const d1 = Math.hypot(x - c1x, y - c1y)
      const d2 = Math.hypot(x - c2x, y - c2y)
      if (d1 <= leafR && d2 > leafR * 0.55) {
        setPixel(rgba, size, x, y, white)
      }
    }
  }
  // stem
  const stemW = Math.max(2, size * 0.035)
  for (let y = Math.floor(cy - size * 0.02); y < cy + size * 0.22; y++) {
    for (let x = cx + size * 0.16; x < cx + size * 0.16 + stemW; x++) {
      setPixel(rgba, size, Math.round(x), Math.round(y), white)
    }
  }

  return rgba
}

mkdirSync('public/icons', { recursive: true })

const targets = [
  { size: 192, file: 'public/icons/icon-192.png', padding: 0 },
  { size: 512, file: 'public/icons/icon-512.png', padding: 0 },
  { size: 512, file: 'public/icons/icon-maskable-512.png', padding: 512 * 0.12 },
  { size: 180, file: 'public/icons/apple-touch-icon.png', padding: 0 },
]

for (const t of targets) {
  const rgba = drawIcon(t.size, { padding: t.padding })
  const png = encodePNG(t.size, t.size, rgba)
  writeFileSync(t.file, png)
  console.log('wrote', t.file, png.length, 'bytes')
}
