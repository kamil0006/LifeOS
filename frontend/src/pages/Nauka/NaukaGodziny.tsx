import { useState, useMemo } from 'react'
import { Card } from '../../components/Card'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { Plus, Trash2 } from 'lucide-react'
import { useNauka } from '../../context/NaukaContext'
import { ChartPeriodSelector } from '../../components/ChartPeriodSelector'
import { useChartPeriod, getMonthsInQuarter } from '../../context/ChartPeriodContext'

const monthNames = ['Sty', 'Lut', 'Mar', 'Kwi', 'Maj', 'Cze', 'Lip', 'Sie', 'Wrz', 'Paź', 'Lis', 'Gru']

export function NaukaGodziny() {
  const nauka = useNauka()
  const chartPeriod = useChartPeriod()
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0])
  const [hours, setHours] = useState('')
  const [note, setNote] = useState('')

  if (!nauka) return null

  const { codingHours, addCodingHour, deleteCodingHour } = nauka

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const h = parseFloat(hours.replace(',', '.'))
    if (isNaN(h) || h <= 0) return
    addCodingHour({ date, hours: h, note: note.trim() || undefined })
    setHours('')
    setNote('')
  }

  const sorted = [...codingHours].sort((a, b) => b.date.localeCompare(a.date))

  const trendData = useMemo(() => {
    if (chartPeriod?.period.type === 'year') {
      const y = chartPeriod.period.year
      return Array.from({ length: 12 }, (_, m) => {
        const hours = codingHours
          .filter((h) => {
            const [hy, hm] = h.date.split('-').map(Number)
            return hy === y && hm - 1 === m
          })
          .reduce((s, h) => s + h.hours, 0)
        return { label: monthNames[m], godziny: hours }
      })
    }
    if (chartPeriod?.period.type === 'quarter') {
      const { quarter, year } = chartPeriod.period
      const months = getMonthsInQuarter(quarter, year)
      return months.map(({ month: m, year: y }) => {
        const hours = codingHours
          .filter((h) => {
            const [hy, hm] = h.date.split('-').map(Number)
            return hy === y && hm - 1 === m
          })
          .reduce((s, h) => s + h.hours, 0)
        return { label: `${monthNames[m]} ${y}`, godziny: hours }
      })
    }
    if (chartPeriod?.period.type === 'month') {
      const m = chartPeriod.period.month
      const y = chartPeriod.period.year
      const daysInMonth = new Date(y, m + 1, 0).getDate()
      const result: { label: string; godziny: number }[] = []
      for (let d = 1; d <= daysInMonth; d++) {
        const dayStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
        const hours = codingHours
          .filter((h) => h.date === dayStr)
          .reduce((s, h) => s + h.hours, 0)
        result.push({ label: String(d), godziny: hours })
      }
      return result
    }
    const now = new Date()
    const m = now.getMonth()
    const y = now.getFullYear()
    const result: { label: string; godziny: number }[] = []
    for (let i = 0; i <= m; i++) {
      const monthKey = `${monthNames[i]}-${y}`
      const hours = codingHours
        .filter((h) => {
          const [year, month] = h.date.split('-').map(Number)
          return year === y && month - 1 === i
        })
        .reduce((s, h) => s + h.hours, 0)
      result.push({ label: monthKey, godziny: hours })
    }
    return result
  }, [codingHours, chartPeriod])

  return (
    <div className="space-y-6">
      <Card title="Dodaj godziny">
        <form onSubmit={handleSubmit} className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-base text-(--text-muted) font-gaming mb-1">Data</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="px-3 py-2 rounded-lg bg-(--bg-dark) border border-(--border) text-(--text-primary) font-gaming focus:border-(--accent-cyan) focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-base text-(--text-muted) font-gaming mb-1">Godziny</label>
            <input
              type="text"
              inputMode="decimal"
              value={hours}
              onChange={(e) => setHours(e.target.value.replace(/[^0-9,.-]/g, ''))}
              className="px-3 py-2 rounded-lg bg-(--bg-dark) border border-(--border) text-(--text-primary) font-mono w-24 focus:border-(--accent-cyan) focus:outline-none"
            />
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-base text-(--text-muted) font-gaming mb-1">Notatka (opcjonalnie)</label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-(--bg-dark) border border-(--border) text-(--text-primary) font-gaming focus:border-(--accent-cyan) focus:outline-none"
            />
          </div>
          <button
            type="submit"
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-(--accent-cyan) text-(--bg-dark) font-gaming font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
            disabled={!hours.trim() || parseFloat(hours.replace(',', '.')) <= 0}
          >
            <Plus className="w-4 h-4" />
            Dodaj
          </button>
        </form>
      </Card>

      <Card title="Historia">
        {sorted.length === 0 ? (
          <p className="text-base text-(--text-muted)">Brak wpisów. Dodaj pierwsze godziny.</p>
        ) : (
          <div className="space-y-2">
            {sorted.map((h) => (
              <div
                key={h.id}
                className="flex items-center justify-between py-2 px-3 rounded-lg bg-(--bg-dark)/50 border border-(--border)"
              >
                <div>
                  <span className="font-mono text-(--accent-cyan)">{h.hours} h</span>
                  <span className="text-(--text-muted) ml-2">{h.date}</span>
                  {h.note && <span className="text-(--text-muted) ml-2">• {h.note}</span>}
                </div>
                <button
                  onClick={() => deleteCodingHour(h.id)}
                  className="p-1.5 rounded-lg text-(--text-muted) hover:text-[#e74c3c] hover:bg-[#e74c3c]/10 transition-colors"
                  aria-label="Usuń"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>

      {trendData.length > 0 && (
        <Card
          title={`Trend godzin${
            chartPeriod?.period.type === 'quarter'
              ? ` (Q${chartPeriod.period.quarter} ${chartPeriod.period.year})`
              : chartPeriod?.period.type === 'year'
                ? ` (${chartPeriod.period.year})`
                : chartPeriod?.period.type === 'month'
                  ? ` (${monthNames[chartPeriod.period.month]} ${chartPeriod.period.year})`
                  : ' (ten rok)'
          }`}
          action={chartPeriod ? <ChartPeriodSelector /> : undefined}
        >
          <div className="h-60 w-full min-h-[200px]">
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="colorGodziny" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00e5ff" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#00e5ff" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="label" stroke="var(--text-muted)" />
                <YAxis stroke="var(--text-muted)" tickFormatter={(v) => `${v} h`} />
                <Tooltip
                  cursor={false}
                  contentStyle={{
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                  }}
                  formatter={(value: number | undefined) => [value != null ? `${value} h` : '', 'Godziny']}
                />
                <Area
                  type="monotone"
                  dataKey="godziny"
                  stroke="#00e5ff"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorGodziny)"
                  name="Godziny"
                  baseValue={0}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}
    </div>
  )
}
