import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Card } from '../Card'
import { MarkdownContent } from '../MarkdownContent'
import { useAuth } from '../../context/AuthContext'
import { aiApi, type WeeklyReport } from '../../lib/api'

const DEMO_SUMMARY_PL = `## Podsumowanie tygodnia (demo)

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

_Tryb demo — w wersji z kontem raport powstaje z Twoich realnych danych._`

const DEMO_SUMMARY_EN = `## Weekly summary (demo)

### Finances (30 days)
- Income: **8,500 zł**
- Expenses: **5,240 zł**
- Balance: **3,260 zł**
- Top categories: Housing (1,800 zł), Food (1,120 zł)

### Productivity
- Open tasks: **6** (overdue: 1)
- Completed tasks: **14**

### Habits
- Active habits: **4** — consistency ~78%

### Learning
- Time in 7 days: **6 h 30 min** out of 10 h goal (65%)

### Suggestions
- Close 1 overdue task so it doesn't pile up.
- ~3.5 h left to reach your learning goal — plan 2 short sessions.

_Demo mode — with an account the report is generated from your real data._`

function buildDemoReport(language: string): WeeklyReport {
  return {
    source: 'fallback',
    model: 'demo',
    generatedAt: new Date().toISOString(),
    summary: language === 'pl' ? DEMO_SUMMARY_PL : DEMO_SUMMARY_EN,
  }
}

export function AiWeeklyReport() {
  const { t, i18n } = useTranslation('dashboard')
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
        setReport(buildDemoReport(i18n.language))
      } else {
        setReport(await aiApi.weeklyReport())
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : t('aiReport.error'))
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
      {loading ? t('aiReport.generating') : report ? t('aiReport.refresh') : t('aiReport.generate')}
    </button>
  )

  return (
    <Card title={t('aiReport.title')} action={action} animateEntrance={false}>
      {error && (
        <p className="rounded-lg border border-(--accent-pink)/40 bg-(--accent-pink)/10 px-3 py-2 text-sm text-(--accent-pink)">
          {error}
        </p>
      )}

      {!report && !error && (
        <p className="text-base text-(--text-muted)">{t('aiReport.description')}</p>
      )}

      {report && (
        <div className="space-y-3">
          <MarkdownContent content={report.summary} />
          <p className="text-xs text-(--text-muted)">
            {report.source === 'ai'
              ? t('aiReport.generatedByAi', { model: report.model })
              : t('aiReport.localReport')}{' '}
            · {new Date(report.generatedAt).toLocaleString(i18n.language === 'pl' ? 'pl-PL' : 'en-US')}
          </p>
        </div>
      )}
    </Card>
  )
}
