import { useState } from 'react'
import { db, getGeminiApiKey } from '../db'
import type { SwingSession } from '../types'
import { generateCoachingFeedback } from '../features/coaching/geminiApi'
import { getCoachingProfile } from '../features/coaching/profile'
import { IconAim, IconCoach } from './icons'

export default function CoachingFeedbackCard({ session }: { session: SwingSession }) {
  const [feedback, setFeedback] = useState(session.coachingFeedback)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const hasKey = !!getGeminiApiKey()

  async function handleGenerate() {
    setLoading(true)
    setError(null)
    try {
      const profile = getCoachingProfile()
      const result = await generateCoachingFeedback(session, profile)
      setFeedback(result)
      if (session.id !== undefined) {
        await db.swingSessions.update(session.id, { coachingFeedback: result })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'AIコーチの生成に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  if (!hasKey) {
    return (
      <div className="coach-card">
        <div className="coach-meta"><span className="coach-tag">AI コーチ</span></div>
        <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
          設定画面でGemini APIキー(無料で取得可能)を登録すると、原因と対策・ドリルまで詳しく解説するAIコーチが使えます。
        </p>
      </div>
    )
  }

  return (
    <div className="coach-card">
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: feedback ? 14 : 4 }}>
        <IconCoach width={17} height={17} style={{ color: 'var(--primary)' }} />
        <h3 style={{ fontSize: 15, fontWeight: 700 }}>AIコーチ</h3>
      </div>

      {!feedback && (
        <button className="btn btn-primary" onClick={handleGenerate} disabled={loading}>
          {loading ? '生成中...(数秒かかります)' : 'AIコーチのフィードバックを生成する'}
        </button>
      )}

      {error && <p style={{ color: 'var(--danger)', fontSize: 13, marginTop: 10 }}>{error}</p>}

      {feedback && (
        <div>
          <p className="coach-quote">{feedback.overallSummary}</p>

          {feedback.priorities.map((p, i) => (
            <div key={i} style={{ marginBottom: 16, paddingTop: i > 0 ? 14 : 0, borderTop: i > 0 ? '1px dashed var(--border-strong)' : 'none' }}>
              <div className="coach-meta">
                <span className="coach-tag">{p.majorCategory}</span>
                <span className="coach-tag">{p.midCategory}</span>
                <span className="coach-tag">{p.minorCategory}</span>
              </div>
              <p className="coach-row"><b>症状 — </b>{p.symptom}</p>
              <p className="coach-row"><b>原因 — </b>{p.cause}</p>
              <p className="coach-row"><b>改善 — </b>{p.fix}</p>
            </div>
          ))}

          <div className="coach-drill">
            <IconAim />
            <div>
              <p style={{ fontWeight: 700, fontSize: 13.5, marginBottom: 6 }}>{feedback.drill.name}</p>
              <ol style={{ paddingLeft: 18, margin: '0 0 6px' }}>
                {feedback.drill.steps.map((s, i) => (
                  <li key={i} style={{ fontSize: 12.5, marginBottom: 3, color: 'var(--text-muted)' }}>
                    {s}
                  </li>
                ))}
              </ol>
              <p style={{ fontSize: 12, color: 'var(--text-faint)' }}>{feedback.drill.effect}</p>
            </div>
          </div>

          <button className="btn btn-secondary" onClick={handleGenerate} disabled={loading} style={{ marginTop: 14 }}>
            {loading ? '再生成中...' : 'もう一度生成する'}
          </button>
        </div>
      )}
    </div>
  )
}
