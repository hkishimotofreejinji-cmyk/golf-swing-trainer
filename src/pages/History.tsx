import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { db } from '../db'
import type { SwingSession } from '../types'
import { getClubLabel } from '../features/clubs/clubs'

export default function History() {
  const [sessions, setSessions] = useState<SwingSession[]>([])

  useEffect(() => {
    db.swingSessions.orderBy('date').reverse().toArray().then(setSessions)
  }, [])

  return (
    <div>
      <h1 className="page-title">スイング履歴</h1>
      <p className="page-subtitle">過去の解析結果一覧</p>

      {sessions.length === 0 && (
        <div className="card" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
          まだ記録がありません。「記録」タブからスイングを撮影しましょう。
        </div>
      )}

      {sessions.map((s) => (
        <Link
          key={s.id}
          to={`/analyze/${s.id}`}
          className="card"
          style={{ display: 'flex', gap: 12, alignItems: 'center', textDecoration: 'none', color: 'var(--text)' }}
        >
          {s.thumbnail ? (
            <img src={s.thumbnail} alt="" width={64} height={64} style={{ borderRadius: 10, objectFit: 'cover' }} />
          ) : (
            <div style={{ width: 64, height: 64, borderRadius: 10, background: 'var(--border)' }} />
          )}
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700 }}>{new Date(s.date).toLocaleDateString('ja-JP')}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              {new Date(s.date).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
              {s.club && ` ・ ${getClubLabel(s.club)}`}
            </div>
          </div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 22, fontWeight: 700, color: 'var(--primary)' }}>{s.overallScore}</div>
        </Link>
      ))}
    </div>
  )
}
