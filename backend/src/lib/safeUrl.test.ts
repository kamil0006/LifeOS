import { describe, it, expect } from 'vitest'
import { sanitizeHttpUrl } from './safeUrl.js'

describe('sanitizeHttpUrl', () => {
  it('passes through valid http(s) URLs, normalized', () => {
    expect(sanitizeHttpUrl('https://example.com/path')).toBe('https://example.com/path')
    expect(sanitizeHttpUrl('http://example.com')).toBe('http://example.com/')
  })

  it('rejects disallowed protocols', () => {
    expect(sanitizeHttpUrl('javascript:alert(1)')).toBeNull()
    expect(sanitizeHttpUrl('data:text/html,<script>alert(1)</script>')).toBeNull()
    expect(sanitizeHttpUrl('ftp://example.com/file')).toBeNull()
  })

  it('rejects null, undefined and blank input', () => {
    expect(sanitizeHttpUrl(null)).toBeNull()
    expect(sanitizeHttpUrl(undefined)).toBeNull()
    expect(sanitizeHttpUrl('')).toBeNull()
    expect(sanitizeHttpUrl('   ')).toBeNull()
  })

  it('rejects malformed URLs', () => {
    expect(sanitizeHttpUrl('not a url')).toBeNull()
  })
})
