import { useEffect, useState } from 'react'
import { db } from '../db'
import type { KnowledgeEntry } from '../types'
import { KNOWLEDGE_TAG_GROUPS, detectPlatform, getTagLabel, PLATFORM_ICON } from '../features/knowledge/constants'

export default function Knowledge() {
  const [entries, setEntries] = useState<KnowledgeEntry[]>([])
  const [url, setUrl] = useState('')
  const [title, setTitle] = useState('')
  const [note, setNote] = useState('')
  const [tags, setTags] = useState<string[]>([])

  function reload() {
    db.knowledgeEntries.orderBy('createdAt').reverse().toArray().then(setEntries)
  }

  useEffect(reload, [])

  function toggleTag(key: string) {
    setTags((prev) => (prev.includes(key) ? prev.filter((t) => t !== key) : [...prev, key]))
  }

  async function handleAdd() {
    if (!url.trim() || !title.trim() || tags.length === 0) return
    await db.knowledgeEntries.add({
      createdAt: new Date().toISOString(),
      title: title.trim(),
      url: url.trim(),
      platform: detectPlatform(url.trim()),
      tags,
      note: note.trim() || undefined,
    })
    setUrl('')
    setTitle('')
    setNote('')
    setTags([])
    reload()
  }

  async function handleDelete(id?: number) {
    if (id === undefined) return
    await db.knowledgeEntries.delete(id)
    reload()
  }

  return (
    <div>
      <h1 className="page-title">ナレッジ</h1>
      <p className="page-subtitle">TikTok/YouTubeで見つけた参考アドバイスを保存</p>

      <div className="card">
        <h3 style={{ fontSize: 16, marginBottom: 12 }}>新しく保存する</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <input
            type="url"
            className="input"
            placeholder="TikTok / YouTubeのURL"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
          <input
            type="text"
            className="input"
            placeholder="タイトル・要約"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <textarea
            className="input"
            placeholder="メモ (任意)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            style={{ resize: 'vertical', fontFamily: 'inherit' }}
          />
          <div>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>関連する項目(複数選択可)</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {KNOWLEDGE_TAG_GROUPS.map((group) => (
                <div key={group.group}>
                  <p style={{ fontSize: 11, color: 'var(--text-faint)', marginBottom: 5 }}>{group.group}</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {group.tags.map((t) => {
                      const active = tags.includes(t.key)
                      return (
                        <button
                          key={t.key}
                          type="button"
                          onClick={() => toggleTag(t.key)}
                          style={{
                            border: `1px solid ${active ? 'var(--primary)' : 'var(--border-strong)'}`,
                            background: active ? 'rgba(200, 255, 77, 0.12)' : 'transparent',
                            color: active ? 'var(--primary)' : 'var(--text-muted)',
                            borderRadius: 999,
                            padding: '6px 12px',
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          {t.label}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <button className="btn btn-primary" onClick={handleAdd} disabled={!url.trim() || !title.trim() || tags.length === 0}>
            保存する
          </button>
        </div>
      </div>

      {entries.length === 0 && (
        <div className="card" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
          まだ保存したナレッジがありません。
        </div>
      )}

      {entries.map((entry) => (
        <div key={entry.id} className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
            <a
              href={entry.url}
              target="_blank"
              rel="noreferrer"
              style={{ color: 'var(--text)', textDecoration: 'none', fontWeight: 700, fontSize: 15 }}
            >
              {PLATFORM_ICON[entry.platform]} {entry.title}
            </a>
            <button
              onClick={() => handleDelete(entry.id)}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 18, lineHeight: 1 }}
              aria-label="削除"
            >
              ×
            </button>
          </div>
          {entry.note && <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 6 }}>{entry.note}</p>}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
            {entry.tags.map((tag) => (
              <span
                key={tag}
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: 'var(--primary)',
                  background: 'rgba(200, 255, 77, 0.1)',
                  borderRadius: 999,
                  padding: '3px 10px',
                }}
              >
                {getTagLabel(tag)}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
