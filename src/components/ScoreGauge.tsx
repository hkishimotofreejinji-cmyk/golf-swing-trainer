export default function ScoreGauge({ score }: { score: number }) {
  const color = score >= 75 ? 'var(--good)' : score >= 50 ? 'var(--warn)' : 'var(--bad)'
  const circumference = 2 * Math.PI * 54
  const offset = circumference * (1 - score / 100)

  return (
    <div style={{ position: 'relative', width: 148, height: 148, margin: '0 auto' }}>
      <svg width="148" height="148" viewBox="0 0 148 148" style={{ filter: `drop-shadow(0 0 10px color-mix(in srgb, ${color} 35%, transparent))` }}>
        <circle cx="74" cy="74" r="58" fill="none" stroke="var(--border)" strokeWidth="9" />
        <circle
          cx="74"
          cy="74"
          r="58"
          fill="none"
          stroke={color}
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform="rotate(-90 74 74)"
        />
      </svg>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <span style={{ fontFamily: 'var(--mono)', fontSize: 38, fontWeight: 700, color, letterSpacing: '-0.02em' }}>{score}</span>
        <span style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 2 }}>
          / 100点
        </span>
      </div>
    </div>
  )
}
