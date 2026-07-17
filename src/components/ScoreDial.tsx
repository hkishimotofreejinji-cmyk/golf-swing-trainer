const R = 90
const CX = 110
const CY = 110
const CIRCUMFERENCE = 2 * Math.PI * R
const GAUGE_LEN = CIRCUMFERENCE * 0.75 // 270° sweep, 90° gap at the bottom
const TICK_COUNT = 10

const ticks = Array.from({ length: TICK_COUNT + 1 }, (_, i) => {
  const deg = 135 + i * (270 / TICK_COUNT)
  const rad = (deg * Math.PI) / 180
  return {
    x1: CX + (R - 15) * Math.cos(rad),
    y1: CY + (R - 15) * Math.sin(rad),
    x2: CX + (R - 6) * Math.cos(rad),
    y2: CY + (R - 6) * Math.sin(rad),
  }
})

interface ScoreDialStat {
  value: string | number
  label: string
}

export default function ScoreDial({
  score,
  label = 'SCORE',
  stats,
  size = 168,
}: {
  score: number
  label?: string
  stats?: ScoreDialStat[]
  size?: number
}) {
  const clamped = Math.max(0, Math.min(100, score))
  const color = clamped >= 75 ? 'var(--good)' : clamped >= 50 ? 'var(--warn)' : 'var(--bad)'
  const scoreLen = GAUGE_LEN * (clamped / 100)

  return (
    <div className="dial-wrap">
      <div className="dial-svg-box" style={{ width: size, height: size }}>
        <svg viewBox="0 0 220 220" width={size} height={size}>
          <circle
            className="dial-arc-track"
            cx={CX}
            cy={CY}
            r={R}
            strokeDasharray={`${GAUGE_LEN} ${CIRCUMFERENCE}`}
            transform={`rotate(-135 ${CX} ${CY})`}
          />
          <circle
            className="dial-arc-progress"
            cx={CX}
            cy={CY}
            r={R}
            stroke={color}
            strokeDasharray={`${scoreLen} ${CIRCUMFERENCE}`}
            transform={`rotate(-135 ${CX} ${CY})`}
            style={{ '--dial-offset': scoreLen } as React.CSSProperties}
          />
          <g className="dial-ticks">
            {ticks.map((t, i) => (
              <line key={i} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2} className="dial-tick" />
            ))}
          </g>
        </svg>
        <div className="dial-center">
          <div className="dial-score" style={{ color }}>
            {clamped}
            <span>/100</span>
          </div>
          <div className="dial-label">{label}</div>
        </div>
      </div>
      {stats && stats.length > 0 && (
        <div className="dial-stats">
          {stats.map((s, i) => (
            <div key={i} className="dial-stat">
              <b>{s.value}</b>
              <small>{s.label}</small>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
