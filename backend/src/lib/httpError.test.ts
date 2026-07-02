import { describe, it, expect } from 'vitest'
import { HttpError } from './httpError.js'

describe('HttpError', () => {
  it('stores status and message', () => {
    const err = new HttpError(404, 'Not found')
    expect(err.status).toBe(404)
    expect(err.message).toBe('Not found')
    expect(err.name).toBe('HttpError')
  })

  it('is an instance of Error and HttpError', () => {
    const err = new HttpError(400, 'Bad request')
    expect(err).toBeInstanceOf(Error)
    expect(err).toBeInstanceOf(HttpError)
  })
})
