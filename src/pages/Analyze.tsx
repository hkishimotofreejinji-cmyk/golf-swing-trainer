import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { db } from '../db'
import type { SwingMetric, SwingSession } from '../types'
import ScoreGauge from '../components/ScoreGauge'
import IssueCard from '../components/IssueCard'
import CoachingFeedbackCard from '../components/CoachingFeedbackCard'
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

export default function Analyze() {
  const { sessionId } = useParams()
  const [session, setSession] = useState<SwingSession | null | undefined>(undefined)

  useEffect(() => {
    if (!sessionId) return
    db.swingSessions.get(Number(sessionId)).then(setSession)
  }, [sessionId])

  if (session === undefined) return <p>読み込み中...</p>
  if (session === null) return <p>セッションが見つかりませんでした。</p>

  return (
    <div>
      <h1 className="page-title">解析結果</h1>
      <p className="page-subtitle">{new Date(session.date).toLocaleString('ja-JP')}</p>

      <div className="card" style={{ textAlign: 'center' }}>
        {session.thumbnail && (
          <img
            src={session.thumbnail}
            alt="アドレス"
            style={{ width: '100%', borderRadius: 12, marginBottom: 16 }}
          />
        )}
        {session.club && (
          <span
            style={{
              display: 'inline-block',
              fontSize: 12,
              fontWeight: 700,
              color: 'var(--primary)',
              background: 'rgba(200, 255, 77, 0.1)',
              borderRadius: 999,
              padding: '4px 12px',
              marginBottom: 14,
            }}
          >
            {getClubLabel(session.club)}
          </span>
        )}
        <ScoreGauge score={session.overallScore} />
      </div>

      {session.focusNote && (
        <div className="card" style={{ borderColor: 'var(--border-strong)' }}>
          <p style={{ fontSize: 12, color: 'var(--primary)', fontWeight: 700, marginBottom: 6 }}>
            🎯 気になっていたポイント
          </p>
          <p style={{ fontSize: 14, color: 'var(--text)' }}>{session.focusNote}</p>
        </div>
      )}

      <CoachingFeedbackCard session={session} />

      {groupMetricsByPhase(session.metrics).map(({ phase, tier, metrics }) => (
        <div key={phase} className="card" style={tier === 'reference' ? { border: '1px dashed var(--border-strong)' } : undefined}>
          <h3 style={{ fontSize: 16, marginBottom: tier === 'reference' ? 4 : 12, color: tier === 'reference' ? 'var(--text-muted)' : undefined }}>
            {phase}
          </h3>
          {tier === 'reference' && (
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10 }}>
              正面映像だけでは精度が出にくい項目です。総合スコアには含めていません。
            </p>
          )}
          {metrics.map((m) => (
            <div key={m.key} style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                <span>{m.label}</span>
                <span style={{ fontFamily: 'var(--mono)', fontWeight: 700 }}>{m.score}</span>
              </div>
              <div style={{ background: 'var(--surface-2)', borderRadius: 6, height: 6, marginTop: 4 }}>
                <div
                  style={{
                    width: `${m.score}%`,
                    background: m.score >= 75 ? 'var(--good)' : m.score >= 50 ? 'var(--warn)' : 'var(--bad)',
                    height: '100%',
                    borderRadius: 6,
                  }}
                />
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{m.detail}</p>
            </div>
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
