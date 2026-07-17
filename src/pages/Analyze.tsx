import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { db } from '../db'
import type { SwingMetric, SwingSession } from '../types'
import ScoreDial from '../components/ScoreDial'
import PhaseRail from '../components/PhaseRail'
import RadarChart from '../components/RadarChart'
import IssueCard from '../components/IssueCard'
import CoachingFeedbackCard from '../components/CoachingFeedbackCard'
import { IconTarget } from '../components/icons'
import { getClubLabel } from '../features/clubs/clubs'

function groupMetricsByPhase(metrics: SwingMetric[]) {
  const groups: { phase: string; tier: SwingMetric['tier']; metrics: SwingMetric[] }[] = []
  for (const m of metrics) {
    let group = groups.find((g) => g.phase === m.phase)
    if (!group) {
      group = { phase: m.phase, tier: m.tier, metrics: [] }
      groups.push(group)
    }
    group.metrics.push(m)
  }
  return groups
}

function scoreColor(score: number) {
  return score < 55 ? 'var(--bad)' : score < 70 ? 'var(--warn)' : 'var(--primary)'
}

function TelemetryRow({ metric, expanded, onToggle }: { metric: SwingMetric; expanded: boolean; onToggle: () => void }) {
  const color = scoreColor(metric.score)
  return (
    <>
      <button className="tele-row" aria-expanded={expanded} onClick={onToggle}>
        <div className="tele-ring" style={{ '--pct': metric.score, '--ring-color': color } as React.CSSProperties} />
        <div className="tele-label">{metric.label}</div>
        <div className="tele-score" style={{ '--ring-color': color } as React.CSSProperties}>{metric.score}</div>
        <svg className="tele-chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4}>
          <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <div className="tele-detail">
        <div>
          <p>{metric.detail}</p>
        </div>
      </div>
    </>
  )
}

export default function Analyze() {
  const { sessionId } = useParams()
  const [session, setSession] = useState<SwingSession | null | undefined>(undefined)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!sessionId) return
    db.swingSessions.get(Number(sessionId)).then(setSession)
  }, [sessionId])

  if (session === undefined) return <p>読み込み中...</p>
  if (session === null) return <p>セッションが見つかりませんでした。</p>

  function toggle(key: string) {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const primaryMetrics = session.metrics.filter((m) => m.tier === 'primary')
  const groups = groupMetricsByPhase(session.metrics)

  return (
    <div>
      <h1 className="page-title">スイング解析</h1>
      <p className="page-subtitle">{new Date(session.date).toLocaleString('ja-JP')}</p>

      <div className="bracket-card" style={{ textAlign: 'center' }}>
        <div className="bc-a" /><div className="bc-b" /><div className="bc-c" /><div className="bc-d" />
        {session.thumbnail && (
          <img src={session.thumbnail} alt="アドレス" style={{ width: '100%', borderRadius: 8, marginBottom: 16 }} />
        )}
        {session.club && (
          <span className="coach-tag" style={{ display: 'inline-block', marginBottom: 14, color: 'var(--primary)', borderColor: 'var(--accent-line)' }}>
            {getClubLabel(session.club)}
          </span>
        )}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <ScoreDial score={session.overallScore} label="OVERALL SCORE" />
        </div>
      </div>

      {session.focusNote && (
        <div className="bracket-card">
          <div className="bc-a" /><div className="bc-b" /><div className="bc-c" /><div className="bc-d" />
          <p style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--primary)', fontWeight: 700, marginBottom: 8 }}>
            <IconTarget width={14} height={14} /> 気になっていたポイント
          </p>
          <p style={{ fontSize: 14, color: 'var(--text)' }}>{session.focusNote}</p>
        </div>
      )}

      <CoachingFeedbackCard session={session} />

      {primaryMetrics.length >= 3 && (
        <>
          <PhaseRail metrics={primaryMetrics} />
          <div className="bracket-card">
            <div className="bc-a" /><div className="bc-b" /><div className="bc-c" /><div className="bc-d" />
            <RadarChart metrics={primaryMetrics} />
          </div>
        </>
      )}

      {groups.map(({ phase, tier, metrics }) => (
        <div key={phase} className="bracket-card" style={tier === 'reference' ? { borderStyle: 'dashed', opacity: 0.85 } : undefined}>
          {tier !== 'reference' && <><div className="bc-a" /><div className="bc-b" /><div className="bc-c" /><div className="bc-d" /></>}
          <div className="bracket-eyebrow" style={tier === 'reference' ? { color: 'var(--text-muted)' } : undefined}>{phase}</div>
          {tier === 'reference' && (
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>
              正面映像だけでは精度が出にくい項目です。総合スコアには含めていません。
            </p>
          )}
          {metrics.map((m) => (
            <TelemetryRow key={m.key} metric={m} expanded={expanded.has(m.key)} onToggle={() => toggle(m.key)} />
          ))}
        </div>
      ))}

      {session.issues.length > 0 && (
        <>
          <h3 style={{ fontSize: 16, margin: '20px 0 12px' }}>改善ポイント & おすすめ動画</h3>
          {session.issues.map((issue) => (
            <IssueCard key={issue.key} issue={issue} />
          ))}
        </>
      )}

      <Link to="/record" className="btn btn-secondary" style={{ marginTop: 8 }}>
        もう一度撮影する
      </Link>
    </div>
  )
}
