import { useState } from 'react'
import { db, getGeminiApiKey } from '../db'
import type { SwingSession } from '../types'
import { generateCoachingFeedback } from '../features/coaching/geminiApi'
import { getCoachingProfile } from '../features/coaching/profile'

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
      <div className="card">
        <h3 style={{ fontSize: 16, marginBottom: 8 }}>🏌️‍♂️ AIコーチ</h3>
        <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
          設定画面でGemini APIキー(無料で取得可能)を登録すると、原因と対策・ドリルまで詳しく解説するAIコーチが使えます。
        </p>
      </div>
    )
  }

  return (
    <div className="card">
      <h3 style={{ fontSize: 16, marginBottom: 12 }}>🏌️‍♂️ AIコーチ</h3>

      {!feedback && (
        <button className="btn btn-primary" onClick={handleGenerate} disabled={loading}>
          {loading ? '生成中...(数秒かかります)' : 'AIコーチのフィードバックを生成する'}
        </button>
      )}

      {error && <p style={{ color: 'var(--danger)', fontSize: 13, marginTop: 10 }}>{error}</p>}

      {feedback && (
        <div>
          <p style={{ fontSize: 14, lineHeight: 1.7, marginBottom: 18 }}>{feedback.overallSummary}</p>

          <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--primary)', marginBottom: 10 }}>
            💡 優先して改善すべきポイント
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 18 }}>
            {feedback.priorities.map((p, i) => (
              <div key={i} style={{ background: 'var(--surface-2)', borderRadius: 12, padding: 14 }}>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>
                  【{p.majorCategory}】＞【{p.midCategory}】＞【{p.minorCategory}】
                </p>
                <p style={{ fontSize: 13, marginBottom: 6 }}>
                  <strong style={{ color: 'var(--text)' }}>起きている現象: </strong>
                  {p.symptom}
                </p>
                <p style={{ fontSize: 13, marginBottom: 6 }}>
                  <strong style={{ color: 'var(--text)' }}>なぜ起こるのか: </strong>
                  {p.cause}
                </p>
                <p style={{ fontSize: 13 }}>
                  <strong style={{ color: 'var(--text)' }}>どう改善するか: </strong>
                  {p.fix}
                </p>
              </div>
            ))}
          </div>

          <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--primary)', marginBottom: 8 }}>
            🛠️ 次回の練習で試してほしいドリル
          </p>
          <div style={{ background: 'var(--surface-2)', borderRadius: 12, padding: 14 }}>
            <p style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>{feedback.drill.name}</p>
            <ol style={{ paddingLeft: 18, margin: '0 0 8px' }}>
              {feedback.drill.steps.map((s, i) => (
                <li key={i} style={{ fontSize: 13, marginBottom: 4 }}>
                  {s}
                </li>
              ))}
            </ol>
            <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{feedback.drill.effect}</p>
          </div>

          <button className="btn btn-secondary" onClick={handleGenerate} disabled={loading} style={{ marginTop: 14 }}>
            {loading ? '再生成中...' : 'もう一度生成する'}
          </button>
        </div>
      )}
    </div>
  )
}
