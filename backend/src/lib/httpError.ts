/** Controlled HTTP error — handled by errorHandler. */
export class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string
  ) {
    super(message)
    this.name = 'HttpError'
  }
}
