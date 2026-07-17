import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { db } from '../db'
import type { RoundScore, SwingSession } from '../types'
import ScoreDial from '../components/ScoreDial'
import { IconAim, IconRecord } from '../components/icons'

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
      <div className="wordmark">
        <IconAim />
        <span>Swing Calibration</span>
      </div>
      <h1 className="page-title">おかえりなさい</h1>
      <p className="page-subtitle">100切りに向けて今日も練習しましょう</p>

      <div className="bracket-card">
        <div className="bc-a" /><div className="bc-b" /><div className="bc-c" /><div className="bc-d" />
        {latestSwing ? (
          <>
            <ScoreDial
              score={latestSwing.overallScore}
              label="LATEST SCORE"
              stats={[
                { value: average ?? '-', label: 'アベレージ' },
                { value: last ?? '-', label: '前回スコア' },
              ]}
            />
            <Link to={`/analyze/${latestSwing.id}`} className="btn btn-secondary" style={{ marginTop: 18 }}>
              詳細を見る
            </Link>
          </>
        ) : (
          <>
            <div style={{ display: 'flex', gap: 20, marginBottom: 4 }}>
              <div className="dial-stat"><b>{average ?? '-'}</b><small>アベレージ</small></div>
              <div className="dial-stat"><b>{last ?? '-'}</b><small>前回スコア</small></div>
            </div>
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 13, marginTop: 14 }}>
              まだ解析データがありません。最初のスイングを撮影してみましょう。
            </p>
          </>
        )}
      </div>

      <Link to="/record" className="btn btn-primary">
        <IconRecord width={17} height={17} />
        スイングを撮影して解析する
      </Link>
    </div>
  )
}
