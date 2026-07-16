import { useEffect, useState } from 'react'
import type { SwingIssue, KnowledgeEntry } from '../types'
import { searchYoutubeVideos, type YoutubeVideo } from '../features/youtube/youtubeApi'
import { getYoutubeApiKey, db } from '../db'
import { PLATFORM_ICON } from '../features/knowledge/constants'

export default function IssueCard({ issue }: { issue: SwingIssue }) {
  const [videos, setVideos] = useState<YoutubeVideo[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [knowledge, setKnowledge] = useState<KnowledgeEntry[]>([])
  const hasKey = !!getYoutubeApiKey()

  useEffect(() => {
    if (!hasKey) return
    searchYoutubeVideos(issue.searchQuery, 3)
      .then(setVideos)
      .catch((err) => setError(err.message))
  }, [issue.searchQuery, hasKey])

  useEffect(() => {
    db.knowledgeEntries.where('tags').equals(issue.key).toArray().then(setKnowledge)
  }, [issue.key])

  const ICON =
    issue.source === 'focus' ? '🎯' : issue.source === 'selfcheck' ? '📝' : issue.tier === 'reference' ? '🧭' : '⚠️'

  return (
    <div className="card">
      <h3 style={{ fontSize: 16, marginBottom: 6 }}>
        {ICON} {issue.title}
      </h3>
      <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 12 }}>{issue.advice}</p>

      {knowledge.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <p style={{ fontSize: 12, color: 'var(--primary)', fontWeight: 700, marginBottom: 8 }}>
            📚 あなたが保存したナレッジ
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {knowledge.map((k) => (
              <a
                key={k.id}
                href={k.url}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: 'block',
                  textDecoration: 'none',
                  color: 'var(--text)',
                  background: 'var(--surface-2)',
                  borderRadius: 10,
                  padding: '10px 12px',
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 600 }}>
                  {PLATFORM_ICON[k.platform]} {k.title}
                </div>
                {k.note && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{k.note}</div>}
              </a>
            ))}
          </div>
        </div>
      )}

      {!hasKey && (
        <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          設定画面でYouTube APIキーを登録すると、関連動画が表示されます。
        </p>
      )}
      {error && <p style={{ fontSize: 12, color: 'var(--danger)' }}>{error}</p>}
      {videos && videos.length === 0 && hasKey && (
        <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>関連動画が見つかりませんでした。</p>
      )}

      {videos && videos.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {videos.map((v) => (
            <a
              key={v.videoId}
              href={`https://www.youtube.com/watch?v=${v.videoId}`}
              target="_blank"
              rel="noreferrer"
              style={{ display: 'flex', gap: 10, textDecoration: 'none', color: 'var(--text)' }}
            >
              <img src={v.thumbnail} alt="" width={100} height={56} style={{ borderRadius: 8, objectFit: 'cover' }} />
              <div style={{ fontSize: 13 }}>
                <div style={{ fontWeight: 600, lineHeight: 1.3 }}>{v.title}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 2 }}>{v.channelTitle}</div>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
