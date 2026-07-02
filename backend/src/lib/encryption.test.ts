import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

// encryptField/decryptField read config.ts's isEncryptionEnabled()/getEncryptionKey(),
// which depend on process.env — reset modules and re-import per test so each test
// gets a clean read of the env vars set just before importing.
const VALID_ENCRYPTION_KEY = Buffer.alloc(32, 9).toString('base64')

let envBackup: NodeJS.ProcessEnv

beforeEach(() => {
  envBackup = { ...process.env }
})

afterEach(() => {
  process.env = { ...envBackup }
  vi.resetModules()
})

async function loadEncryptionEnabled() {
  vi.resetModules()
  process.env.ENCRYPTION_ENABLED = 'true'
  process.env.ENCRYPTION_KEY = VALID_ENCRYPTION_KEY
  return import('./encryption.js')
}

async function loadEncryptionDisabled() {
  vi.resetModules()
  delete process.env.ENCRYPTION_ENABLED
  delete process.env.ENCRYPTION_KEY
  return import('./encryption.js')
}

describe('encryptField / decryptField (encryption enabled)', () => {
  it('round-trips plaintext', async () => {
    const { encryptField, decryptField } = await loadEncryptionEnabled()
    const encrypted = encryptField('sensitive value')
    expect(decryptField(encrypted)).toBe('sensitive value')
  })

  it('prefixes encrypted values with enc:v1:', async () => {
    const { encryptField } = await loadEncryptionEnabled()
    expect(encryptField('hello')).toMatch(/^enc:v1:/)
  })

  it('is idempotent on an already-encrypted value', async () => {
    const { encryptField } = await loadEncryptionEnabled()
    const once = encryptField('hello')
    const twice = encryptField(once)
    expect(twice).toBe(once)
  })

  it('decryptField returns unprefixed (legacy plaintext) values unchanged', async () => {
    const { decryptField } = await loadEncryptionEnabled()
    expect(decryptField('legacy plain text')).toBe('legacy plain text')
  })

  it('nullable variants pass through null/undefined/empty string', async () => {
    const { encryptFieldNullable, decryptFieldNullable } = await loadEncryptionEnabled()
    expect(encryptFieldNullable(null)).toBeNull()
    expect(encryptFieldNullable(undefined)).toBeNull()
    expect(encryptFieldNullable('')).toBe('')
    expect(decryptFieldNullable(null)).toBeNull()
    expect(decryptFieldNullable(undefined)).toBeNull()
    expect(decryptFieldNullable('')).toBe('')
  })
})

describe('encryptField (encryption disabled)', () => {
  it('is a no-op passthrough', async () => {
    const { encryptField, decryptField } = await loadEncryptionDisabled()
    expect(encryptField('plain text')).toBe('plain text')
    expect(decryptField('plain text')).toBe('plain text')
  })
})
