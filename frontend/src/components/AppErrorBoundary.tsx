import { Component, type ErrorInfo, type ReactNode } from 'react'

type Props = { children: ReactNode }
type State = { error: Error | null }

/**
 * Globalny error boundary. Zamiast czarnego ekranu (cała apka odmontowana)
 * pokazuje czytelny komunikat z treścią błędu — kluczowe na mobile,
 * gdzie nie ma konsoli deweloperskiej.
 */
export class AppErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[AppErrorBoundary]', error, info)
  }

  handleReset = () => {
    this.setState({ error: null })
  }

  render() {
    const { error } = this.state
    if (!error) return this.props.children

    return (
      <div className="flex min-h-svh items-center justify-center bg-(--bg-dark) p-6">
        <div className="w-full max-w-md rounded-xl border border-[#e74c3c]/40 bg-(--bg-card) p-6 shadow-xl">
          <h1 className="font-gaming text-lg font-bold text-[#e74c3c]">Coś poszło nie tak</h1>
          <p className="mt-2 text-base text-(--text-muted)">
            Aplikacja napotkała błąd i nie mogła się wyświetlić. Spróbuj ponownie.
          </p>
          <pre className="mt-3 max-h-40 overflow-auto rounded-lg border border-(--border) bg-(--bg-dark) p-3 text-xs text-(--text-muted)">
            {error.message}
          </pre>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="w-full rounded-lg border border-(--border) px-4 py-2.5 font-gaming text-(--text-muted) transition-colors hover:bg-(--bg-card-hover) hover:text-(--text-primary) sm:w-auto"
            >
              Odśwież stronę
            </button>
            <button
              type="button"
              onClick={this.handleReset}
              className="w-full rounded-lg border border-(--accent-cyan)/45 bg-(--accent-cyan)/15 px-4 py-2.5 font-gaming text-(--accent-cyan) transition-colors hover:bg-(--accent-cyan)/25 sm:w-auto"
            >
              Spróbuj ponownie
            </button>
          </div>
        </div>
      </div>
    )
  }
}
