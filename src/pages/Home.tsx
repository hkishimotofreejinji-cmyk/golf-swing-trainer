import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { db } from '../db'
import type { RoundScore, SwingSession } from '../types'
import ScoreGauge from '../components/ScoreGauge'

export default function Home() {
  const [latestSwing, setLatestSwing] = useState<SwingSession | null>(null)
  const [rounds, setRounds] = useState<RoundScore[]>([])

  useEffect(() => {
    db.swingSessions.orderBy('date').reverse().limit(1).toArray().then((r) => setLatestSwing(r[0] ?? null))
    db.roundScores.orderBy('date').reverse().toArray().then(setRounds)
  }, [])

  const average = rounds.length ? Math.round(rounds.reduce((a, r) => a + r.score, 0) / rounds.length) : null
  const last = rounds[0]?.score ?? null

  return (
    <div>
      <h1 className="page-title">⛳ ゴルフスイングトレーナー</h1>
      <p className="page-subtitle">100切りに向けて今日も練習しましょう</p>

      <div className="stat-row" style={{ marginBottom: 16 }}>
        <div className="stat-box">
          <div className="stat-value">{average ?? '-'}</div>
          <div className="stat-label">アベレージ</div>
        </div>
        <div className="stat-box">
          <div className="stat-value">{last ?? '-'}</div>
          <div className="stat-label">前回スコア</div>
        </div>
      </div>

      <Link to="/record" className="btn btn-primary" style={{ marginBottom: 20 }}>
        🎥 スイングを撮影して解析する
      </Link>

      <div className="card">
        <h3 style={{ fontSize: 16, marginBottom: 12 }}>最新のスイングスコア</h3>
        {latestSwing ? (
          <>
            <ScoreGauge score={latestSwing.overallScore} />
            <Link to={`/analyze/${latestSwing.id}`} className="btn btn-secondary" style={{ marginTop: 16 }}>
              詳細を見る
            </Link>
          </>
        ) : (
          <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
            まだ解析データがありません。最初のスイングを撮影してみましょう。
          </p>
        )}
      </div>
    </div>
  )
}
