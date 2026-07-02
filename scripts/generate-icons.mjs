import { deflateSync } from 'node:zlib'
import { writeFileSync } from 'node:fs'
import { crc32 } from 'node:zlib'

function chunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii')
  const lenBuf = Buffer.alloc(4)
  lenBuf.writeUInt32BE(data.length, 0)
  const crcInput = Buffer.concat([typeBuf, data])
  const crcBuf = Buffer.alloc(4)
  crcBuf.writeUInt32BE(crc32(crcInput) >>> 0, 0)
  return Buffer.concat([lenBuf, typeBuf, data, crcBuf])
}

function makeIcon(size, outPath) {
  const bg = [10, 10, 18] // #0a0a12
  const gold = [201, 162, 75] // #c9a24b
  const border = Math.round(size * 0.16)
  const raw = Buffer.alloc(size * (size * 4 + 1))

  for (let y = 0; y < size; y++) {
    const rowStart = y * (size * 4 + 1)
    raw[rowStart] = 0 // filter type: none
    for (let x = 0; x < size; x++) {
      const onFrame =
        x >= border && x < size - border && y >= border && y < size - border &&
        (x < border + size * 0.03 || x >= size - border - size * 0.03 ||
         y < border + size * 0.03 || y >= size - border - size * 0.03)
      const color = onFrame ? gold : bg
      const px = rowStart + 1 + x * 4
      raw[px] = color[0]
      raw[px + 1] = color[1]
      raw[px + 2] = color[2]
      raw[px + 3] = 255
    }
  }

  const idat = deflateSync(raw)

  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // color type RGBA
  ihdr[10] = 0
  ihdr[11] = 0
  ihdr[12] = 0

  const png = Buffer.concat([
    signature,
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ])

  writeFileSync(outPath, png)
  console.log(`Wrote ${outPath}`)
}

makeIcon(192, 'public/pwa-192.png')
makeIcon(512, 'public/pwa-512.png')
