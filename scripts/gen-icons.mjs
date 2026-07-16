import { deflateSync } from 'node:zlib'
import { writeFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const outDir = join(__dirname, '..', 'public', 'icons')
mkdirSync(outDir, { recursive: true })

function crc32(buf) {
  let c
  const table = crc32.table || (crc32.table = (() => {
    const t = new Uint32Array(256)
    for (let n = 0; n < 256; n++) {
      c = n
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
      t[n] = c
    }
    return t
  })())
  let crc = 0xffffffff
  for (let i = 0; i < buf.length; i++) crc = table[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8)
  return (crc ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii')
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length, 0)
  const crcBuf = Buffer.alloc(4)
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0)
  return Buffer.concat([len, typeBuf, data, crcBuf])
}

// draws a golf-themed icon: dark green background, white ball with dimples, red swing arc
function makePng(size) {
  const width = size
  const height = size
  const raw = Buffer.alloc((width * 3 + 1) * height)

  const bg = [17, 58, 38] // deep green
  const ball = [245, 245, 240]
  const accent = [200, 60, 40]
  const dimple = [200, 210, 200]

  const cx = width / 2
  const cy = height * 0.56
  const r = width * 0.24

  for (let y = 0; y < height; y++) {
    const rowStart = y * (width * 3 + 1)
    raw[rowStart] = 0 // filter type: none
    for (let x = 0; x < width; x++) {
      let col = bg
      const dx = x - cx
      const dy = y - cy
      const dist = Math.sqrt(dx * dx + dy * dy)

      // swing arc (simple curved stroke) above the ball
      const arcCx = width * 0.5
      const arcCy = height * 0.34
      const arcR = width * 0.30
      const arcDist = Math.sqrt((x - arcCx) ** 2 + (y - arcCy) ** 2)
      const angle = Math.atan2(y - arcCy, x - arcCx)
      const inArcAngle = angle > -2.6 && angle < -0.5
      if (Math.abs(arcDist - arcR) < width * 0.018 && inArcAngle) {
        col = accent
      } else if (dist < r) {
        col = ball
        // small dimples pattern
        const gx = Math.floor((x / width) * 10)
        const gy = Math.floor((y / height) * 10)
        if ((gx + gy) % 2 === 0 && dist < r * 0.85) col = dimple
      }

      const idx = rowStart + 1 + x * 3
      raw[idx] = col[0]
      raw[idx + 1] = col[1]
      raw[idx + 2] = col[2]
    }
  }

  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 2 // color type: truecolor
  ihdr[10] = 0
  ihdr[11] = 0
  ihdr[12] = 0

  const idat = deflateSync(raw)
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])

  return Buffer.concat([
    signature,
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

for (const size of [192, 512]) {
  const png = makePng(size)
  writeFileSync(join(outDir, `icon-${size}.png`), png)
  console.log(`wrote icon-${size}.png (${png.length} bytes)`)
}
