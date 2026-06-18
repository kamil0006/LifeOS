import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto'
import { getEncryptionKey, isEncryptionEnabled } from './config.js'

const PREFIX = 'enc:v1:'
const ALGO = 'aes-256-gcm'
const IV_LEN = 12
const TAG_LEN = 16

/** Szyfruje tekst przed zapisem do bazy (gdy ENCRYPTION_ENABLED=true). */
export function encryptField(plaintext: string): string {
  if (!isEncryptionEnabled()) return plaintext
  if (plaintext.startsWith(PREFIX)) return plaintext
  const key = getEncryptionKey()
  if (!key) return plaintext
  const iv = randomBytes(IV_LEN)
  const cipher = createCipheriv(ALGO, key, iv)
  const enc = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  const blob = Buffer.concat([iv, tag, enc]).toString('base64url')
  return `${PREFIX}${blob}`
}

/** Odszyfrowuje pole z bazy; plaintext bez prefiksu przechodzi bez zmian (stare wpisy). */
export function decryptField(stored: string): string {
  if (!stored.startsWith(PREFIX)) return stored
  const key = getEncryptionKey()
  if (!key) return stored
  const raw = Buffer.from(stored.slice(PREFIX.length), 'base64url')
  const iv = raw.subarray(0, IV_LEN)
  const tag = raw.subarray(IV_LEN, IV_LEN + TAG_LEN)
  const enc = raw.subarray(IV_LEN + TAG_LEN)
  const decipher = createDecipheriv(ALGO, key, iv)
  decipher.setAuthTag(tag)
  return Buffer.concat([decipher.update(enc), decipher.final()]).toString('utf8')
}

export function decryptFieldNullable(stored: string | null | undefined): string | null {
  if (stored == null || stored === '') return stored ?? null
  return decryptField(stored)
}

export function encryptFieldNullable(value: string | null | undefined): string | null {
  if (value == null || value === '') return value ?? null
  return encryptField(value)
}
