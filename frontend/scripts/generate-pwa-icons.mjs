/**
 * Generuje PNG z SVG dla PWA / iOS (Orbitron fallback → Arial Black w rasterze).
 * Uruchom: node scripts/generate-pwa-icons.mjs
 */
import sharp from 'sharp'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const iconsDir = join(__dirname, '..', 'public', 'icons')

const iconSvg = readFileSync(join(iconsDir, 'icon.svg'))
const maskableSvg = readFileSync(join(iconsDir, 'icon-maskable.svg'))

const jobs = [
  { input: iconSvg, out: 'icon-192.png', size: 192 },
  { input: iconSvg, out: 'icon-512.png', size: 512 },
  { input: iconSvg, out: 'apple-touch-icon.png', size: 180 },
  { input: maskableSvg, out: 'icon-maskable-512.png', size: 512 },
]

for (const { input, out, size } of jobs) {
  await sharp(input, { density: 300 })
    .resize(size, size)
    .png({ compressionLevel: 9 })
    .toFile(join(iconsDir, out))
  console.log(`✓ ${out} (${size}×${size})`)
}
