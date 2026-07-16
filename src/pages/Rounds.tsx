import { useEffect, useState } from 'react'
import { db } from '../db'
import type { RoundScore } from '../types'

export default function Rounds() {
  const [rounds, setRounds] = useState<RoundScore[]>([])
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [score, setScore] = useState('')
  const [courseName, setCourseName] = useState('')

  function reload() {
    db.roundScores.orderBy('date').reverse().toArray().then(setRounds)
  }

  useEffect(reload, [])

  async function handleAdd() {
    const scoreNum = Number(score)
    if (!scoreNum || scoreNum < 50 || scoreNum > 200) return
    await db.roundScores.add({
      date: new Date(date).toISOString(),
      score: scoreNum,
      courseName: courseName || undefined,
      source: 'manual',
    })
    setScore('')
    setCourseName('')
    reload()
  }

  async function handleDelete(id?: number) {
    if (id === undefined) return
    await db.roundScores.delete(id)
    reload()
  }

  const average = rounds.length ? Math.round(rounds.reduce((a, r) => a + r.score, 0) / rounds.length) : null
  const last = rounds[0]?.score ?? null

  return (
    <div>
      <h1 className="page-title">ラウンドスコア</h1>
      <p className="page-subtitle">100切りに向けた進捗管理</p>

      <div className="stat-row" style={{ marginBottom: 16 }}>
        <div className="stat-box">
          <div className="stat-value">{average ?? '-'}</div>
          <div className="stat-label">アベレージ</div>
        </div>
        <div className="stat-box">
          <div className="stat-value">{last ?? '-'}</div>
          <div className="stat-label">前回スコア</div>
        </div>
        <div className="stat-box">
          <div className="stat-value" style={{ color: average && average < 100 ? 'var(--good)' : 'var(--bad)' }}>
            {average ? Math.max(0, average - 99) : '-'}
          </div>
          <div className="stat-label">100切りまで</div>
        </div>
      </div>

      <div className="card" style={{ background: 'transparent', border: '1px dashed var(--border-strong)' }}>
        <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
          🔗 楽天GORA連携は準備中です。現在はラウンド結果を手動で記録してください。
        </p>
      </div>

      <div className="card">
        <h3 style={{ fontSize: 16, marginBottom: 12 }}>ラウンドを記録</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <input type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} />
          <input
            type="number"
            className="input"
            placeholder="スコア (例: 98)"
            value={score}
            onChange={(e) => setScore(e.target.value)}
          />
          <input
            type="text"
            className="input"
            placeholder="コース名 (任意)"
            value={courseName}
            onChange={(e) => setCourseName(e.target.value)}
          />
          <button className="btn btn-primary" onClick={handleAdd}>
            記録する
          </button>
        </div>
      </div>

      {rounds.map((r) => (
        <div key={r.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700 }}>{new Date(r.date).toLocaleDateString('ja-JP')}</div>
            {r.courseName && <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{r.courseName}</div>}
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, color: r.score < 100 ? 'var(--good)' : 'var(--text)' }}>
            {r.score}
          </div>
          <button
            onClick={() => handleDelete(r.id)}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 18 }}
            aria-label="削除"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  )
}
