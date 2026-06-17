import { useState } from 'react'
import { Card } from '../Card'
import { MarkdownContent } from '../MarkdownContent'
import { useAuth } from '../../context/AuthContext'
import { aiApi, type WeeklyReport } from '../../lib/api'

const DEMO_REPORT: WeeklyReport = {
  source: 'fallback',
  model: 'demo',
  generatedAt: new Date().toISOString(),
  summary: `## Podsumowanie tygodnia (demo)

### Finanse (30 dni)
- Przychody: **8 500 zł**
- Wydatki: **5 240 zł**
- Bilans: **3 260 zł**
- Największe kategorie: Mieszkanie (1 800 zł), Jedzenie (1 120 zł)

### Produktywność
- Zadania otwarte: **6** (po terminie: 1)
- Zadania ukończone: **14**

### Nawyki
- Aktywne nawyki: **4** — regularność ~78%

### Nauka
- Czas w 7 dni: **6 h 30 min** z celu 10 h (65%)

### Sugestie
- Domknij 1 zadanie po terminie, żeby nie rosła zaległość.
- Do celu nauki brakuje ~3,5 h — zaplanuj 2 krótkie sesje.

_Tryb demo — w wersji z kontem raport powstaje z Twoich realnych danych._`,
}

export function AiWeeklyReport() {
  const { isDemoMode } = useAuth()
  const [report, setReport] = useState<WeeklyReport | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generate = async () => {
    setError(null)
    setLoading(true)
    try {
      if (isDemoMode) {
        await new Promise((r) => setTimeout(r, 500))
        setReport(DEMO_REPORT)
      } else {
        setReport(await aiApi.weeklyReport())
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Nie udało się wygenerować raportu')
    } finally {
      setLoading(false)
    }
  }

  const action = (
    <button
      type="button"
      onClick={generate}
      disabled={loading}
      className="rounded-lg border border-(--accent-cyan)/40 bg-(--accent-cyan)/10 px-3 py-1.5 text-sm font-medium text-(--accent-cyan) transition-colors hover:bg-(--accent-cyan)/20 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {loading ? 'Generuję…' : report ? 'Odśwież raport' : 'Wygeneruj raport'}
    </button>
  )

  return (
    <Card title="Asystent AI — raport tygodniowy" action={action} animateEntrance={false}>
      {error && (
        <p className="rounded-lg border border-(--accent-pink)/40 bg-(--accent-pink)/10 px-3 py-2 text-sm text-(--accent-pink)">
          {error}
        </p>
      )}

      {!report && !error && (
        <p className="text-base text-(--text-muted)">
          Wygeneruj zwięzłe podsumowanie ostatniego tygodnia: finanse, produktywność, nawyki i nauka — z sugestiami następnych kroków.
        </p>
      )}

      {report && (
        <div className="space-y-3">
          <MarkdownContent content={report.summary} />
          <p className="text-xs text-(--text-muted)">
            {report.source === 'ai'
              ? `Wygenerowano przez AI (${report.model})`
              : 'Raport lokalny (bez AI)'}{' '}
            · {new Date(report.generatedAt).toLocaleString('pl-PL')}
          </p>
        </div>
      )}
    </Card>
  )
}
