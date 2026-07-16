import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { analyzeSwingVideo } from '../features/pose/swingAnalysis'
import { db } from '../db'
import { CLUB_BAG } from '../features/clubs/clubs'
import { SELF_CHECK_ITEMS } from '../features/pose/selfChecks'

export default function Record() {
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [club, setClub] = useState('')
  const [focusNote, setFocusNote] = useState('')
  const [selfChecks, setSelfChecks] = useState<string[]>([])
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  function toggleSelfCheck(key: string) {
    setSelfChecks((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]))
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    setFile(f)
    setError(null)
    setPreviewUrl(URL.createObjectURL(f))
  }

  async function handleAnalyze() {
    if (!file || !club) return
    setAnalyzing(true)
    setError(null)
    setProgress(0)
    try {
      const result = await analyzeSwingVideo(file, club, focusNote, selfChecks, setProgress)
      const id = await db.swingSessions.add(result)
      navigate(`/analyze/${id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : '解析中にエラーが発生しました')
    } finally {
      setAnalyzing(false)
    }
  }

  return (
    <div>
      <h1 className="page-title">スイングを記録</h1>
      <p className="page-subtitle">正面から全身が映るように撮影・アップロードしてください</p>

      <div className="card">
        <h3 style={{ fontSize: 16, marginBottom: 10 }}>使用クラブ</h3>
        <select
          className="input"
          value={club}
          onChange={(e) => setClub(e.target.value)}
          disabled={analyzing}
        >
          <option value="" disabled>
            クラブを選択してください
          </option>
          {CLUB_BAG.map((group) => (
            <optgroup key={group.group} label={group.group}>
              {group.clubs.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>

      <div className="card">
        <h3 style={{ fontSize: 16, marginBottom: 10 }}>気になっている点(任意)</h3>
        <textarea
          className="input"
          placeholder="例: 右わきが開いている気がする、テンポが速くなりがち、など"
          value={focusNote}
          onChange={(e) => setFocusNote(e.target.value)}
          disabled={analyzing}
          rows={3}
          style={{ resize: 'vertical', fontFamily: 'inherit' }}
        />
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>
          自由に記入してください。解析結果で重点的に取り上げます。
        </p>
      </div>

      <div className="card">
        <h3 style={{ fontSize: 16, marginBottom: 4 }}>今回のショットで当てはまるもの(任意)</h3>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10 }}>
          動画だけでは判定できない項目です。打った直後の感覚・弾道で選んでください。
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {SELF_CHECK_ITEMS.map((item) => {
            const active = selfChecks.includes(item.key)
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => toggleSelfCheck(item.key)}
                disabled={analyzing}
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
                {item.label}
              </button>
            )
          })}
        </div>
      </div>

      <div className="card">
        {previewUrl ? (
          <video src={previewUrl} controls playsInline style={{ width: '100%', borderRadius: 12 }} />
        ) : (
          <div
            style={{
              border: '1.5px dashed var(--border-strong)',
              borderRadius: 12,
              padding: '40px 16px',
              textAlign: 'center',
              color: 'var(--text-faint)',
              background: 'var(--surface-2)',
              fontSize: 13,
            }}
          >
            動画が選択されていません
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="video/*"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />

        <button
          className="btn btn-secondary"
          style={{ marginTop: 12 }}
          onClick={() => fileInputRef.current?.click()}
          disabled={analyzing}
        >
          📹 動画を撮影 / 選択する
        </button>
      </div>

      {file && (
        <button className="btn btn-primary" onClick={handleAnalyze} disabled={analyzing || !club}>
          {analyzing ? `解析中... ${progress}%` : !club ? 'クラブを選択してください' : 'このスイングを解析する'}
        </button>
      )}

      {error && (
        <p style={{ color: 'var(--danger)', marginTop: 12 }}>{error}</p>
      )}

      <p style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 20 }}>
        ※ 解析はすべて端末内(ブラウザ)で行われ、動画が外部に送信されることはありません。
      </p>
    </div>
  )
}
