import type { SwingMetric } from '../types'

const SHORT_LABEL: Record<string, string> = {
  sway: 'スウェー',
  right_elbow: '右肘',
  x_factor: 'Xファクター',
  transition_pause: 'タメ',
  early_extension: '起き上がり',
  head_impact: '頭の上下',
  early_opening: '早開き',
  heel_lift: 'かかと',
  chicken_wing: '左肘',
  finish_balance: 'フィニッシュ',
}

const CX = 110
const CY = 110
const R = 78

export default function RadarChart({ metrics }: { metrics: SwingMetric[] }) {
  const data = metrics.filter((m) => m.tier === 'primary')
  const n = data.length
  if (n < 3) return null

  const points = data.map((d, i) => {
    const angle = (-90 + i * (360 / n)) * (Math.PI / 180)
    const cos = Math.cos(angle)
    const sin = Math.sin(angle)
    return {
      ...d,
      angle,
      axisX: CX + R * cos,
      axisY: CY + R * sin,
      labelX: CX + (R + 13) * cos,
      labelY: CY + (R + 13) * sin,
      vx: CX + (R * d.score) / 100 * cos,
      vy: CY + (R * d.score) / 100 * sin,
      anchor: (cos > 0.3 ? 'start' : cos < -0.3 ? 'end' : 'middle') as 'start' | 'end' | 'middle',
    }
  })

  return (
    <svg className="radar-svg" viewBox="0 0 220 220">
      {[0.33, 0.66, 1].map((f) => (
        <circle key={f} cx={CX} cy={CY} r={R * f} className="radar-grid" />
      ))}
      {points.map((p) => (
        <line key={`axis-${p.key}`} x1={CX} y1={CY} x2={p.axisX} y2={p.axisY} className="radar-axis" />
      ))}
      <polygon className="radar-fill" points={points.map((p) => `${p.vx},${p.vy}`).join(' ')} />
      {points.map((p) => (
        <circle
          key={`dot-${p.key}`}
          cx={p.vx}
          cy={p.vy}
          r={2.8}
          fill={p.score < 55 ? 'var(--bad)' : p.score < 70 ? 'var(--warn)' : 'var(--primary)'}
          stroke="none"
        />
      ))}
      {points.map((p) => (
        <text
          key={`label-${p.key}`}
          x={p.labelX}
          y={p.labelY}
          className="radar-label"
          textAnchor={p.anchor}
          dominantBaseline="middle"
        >
          {SHORT_LABEL[p.key] ?? p.label.slice(0, 4)}
        </text>
      ))}
    </svg>
  )
}
