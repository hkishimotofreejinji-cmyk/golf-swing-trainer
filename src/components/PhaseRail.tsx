import { PHASE } from '../features/pose/scoring'
import type { SwingMetric } from '../types'

const PHASE_META = [
  { key: PHASE.address, roman: 'Ⅰ', label: '準備' },
  { key: PHASE.top, roman: 'Ⅱ', label: '切り返し' },
  { key: PHASE.impact, roman: 'Ⅲ', label: 'インパクト' },
  { key: PHASE.finish, roman: 'Ⅳ', label: 'フォロー' },
]

// Highlights whichever phase is currently dragging the score down the most,
// so the rail doubles as a "where to focus" summary instead of plain nav.
export default function PhaseRail({ metrics }: { metrics: SwingMetric[] }) {
  const totals = new Map<string, { sum: number; count: number }>()
  for (const m of metrics) {
    if (m.tier !== 'primary') continue
    const entry = totals.get(m.phase) ?? { sum: 0, count: 0 }
    entry.sum += m.score
    entry.count += 1
    totals.set(m.phase, entry)
  }

  let weakest: string | null = null
  let weakestAvg = Infinity
  for (const [phase, { sum, count }] of totals) {
    const avg = sum / count
    if (avg < weakestAvg) {
      weakestAvg = avg
      weakest = phase
    }
  }

  return (
    <div className="phase-rail">
      {PHASE_META.map((p) => (
        <div key={p.key} className={`phase-step${p.key === weakest ? ' active' : ''}`}>
          <b>{p.roman}</b>
          {p.label}
        </div>
      ))}
    </div>
  )
}
