import { useState } from 'react'
import { getYoutubeApiKey, setYoutubeApiKey, getGeminiApiKey, setGeminiApiKey } from '../db'
import { getCoachingProfile, setCoachingProfile } from '../features/coaching/profile'
import { KNOWLEDGE_TAG_GROUPS } from '../features/knowledge/constants'

export default function Settings() {
  const [key, setKey] = useState(getYoutubeApiKey())
  const [saved, setSaved] = useState(false)

  const [geminiKey, setGeminiKey] = useState(getGeminiApiKey())
  const [geminiSaved, setGeminiSaved] = useState(false)

  const [profile, setProfile] = useState(getCoachingProfile())
  const [profileSaved, setProfileSaved] = useState(false)

  function handleSave() {
    setYoutubeApiKey(key.trim())
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function handleGeminiSave() {
    setGeminiApiKey(geminiKey.trim())
    setGeminiSaved(true)
    setTimeout(() => setGeminiSaved(false), 2000)
  }

  function toggleTendency(tKey: string) {
    setProfile((prev) => ({
      ...prev,
      tendencies: prev.tendencies.includes(tKey) ? prev.tendencies.filter((t) => t !== tKey) : [...prev.tendencies, tKey],
    }))
  }

  function handleProfileSave() {
    setCoachingProfile(profile)
    setProfileSaved(true)
    setTimeout(() => setProfileSaved(false), 2000)
  }

  return (
    <div>
      <h1 className="page-title">設定</h1>
      <p className="page-subtitle">アプリの各種設定</p>

      <div className="card">
        <h3 style={{ fontSize: 16, marginBottom: 8 }}>コーチングプロフィール</h3>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>
          AIコーチが解析結果を見る際に参照する、あなたの目標・慢性的な傾向・理想の動きです。
        </p>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>目標</p>
        <input
          type="text"
          className="input"
          value={profile.goal}
          onChange={(e) => setProfile((p) => ({ ...p, goal: e.target.value }))}
          style={{ marginBottom: 14 }}
        />
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>慢性的な傾向・過去の課題(複数選択可)</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
          {KNOWLEDGE_TAG_GROUPS.map((group) => (
            <div key={group.group}>
              <p style={{ fontSize: 11, color: 'var(--text-faint)', marginBottom: 4 }}>{group.group}</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {group.tags.map((t) => {
                  const active = profile.tendencies.includes(t.key)
                  return (
                    <button
                      key={t.key}
                      type="button"
                      onClick={() => toggleTendency(t.key)}
                      style={{
                        border: `1px solid ${active ? 'var(--primary)' : 'var(--border-strong)'}`,
                        background: active ? 'rgba(200, 255, 77, 0.12)' : 'transparent',
                        color: active ? 'var(--primary)' : 'var(--text-muted)',
                        borderRadius: 999,
                        padding: '5px 10px',
                        fontSize: 11,
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
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>理想とする動き(自由記述)</p>
        <textarea
          className="input"
          value={profile.idealMovementNotes}
          onChange={(e) => setProfile((p) => ({ ...p, idealMovementNotes: e.target.value }))}
          rows={3}
          style={{ resize: 'vertical', fontFamily: 'inherit', marginBottom: 12 }}
        />
        <button className="btn btn-primary" onClick={handleProfileSave}>
          {profileSaved ? '保存しました ✓' : 'プロフィールを保存する'}
        </button>
      </div>

      <div className="card">
        <h3 style={{ fontSize: 16, marginBottom: 8 }}>Gemini API キー(AIコーチ用・無料)</h3>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>
          解析結果をもとに、原因と対策・ドリルを詳しく解説するAIコーチ機能に使用します。
          Google AI Studio(aistudio.google.com)で無料で取得できるAPIキーを入力してください。クレジットカード登録は不要です。
        </p>
        <input
          type="text"
          className="input"
          value={geminiKey}
          onChange={(e) => setGeminiKey(e.target.value)}
          placeholder="AIzaSy..."
          style={{ marginBottom: 12 }}
        />
        <button className="btn btn-primary" onClick={handleGeminiSave}>
          {geminiSaved ? '保存しました ✓' : '保存する'}
        </button>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 10 }}>
          ※ キーはこの端末のブラウザ内にのみ保存されます。解析結果の点数・詳細はGoogleのAPIに送信されますが、動画自体は送信されません。
        </p>
      </div>

      <div className="card">
        <h3 style={{ fontSize: 16, marginBottom: 8 }}>YouTube Data API キー</h3>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>
          改善点に関連するYouTube動画を検索するために使用します。Google Cloud Consoleで
          「YouTube Data API v3」を有効化して取得したAPIキーを入力してください。
        </p>
        <input
          type="text"
          className="input"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          placeholder="AIzaSy..."
          style={{ marginBottom: 12 }}
        />
        <button className="btn btn-primary" onClick={handleSave}>
          {saved ? '保存しました ✓' : '保存する'}
        </button>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 10 }}>
          ※ キーはこの端末のブラウザ内にのみ保存され、サーバーには送信されません。
        </p>
      </div>

      <div className="card" style={{ background: 'transparent', border: '1px dashed var(--border-strong)' }}>
        <h3 style={{ fontSize: 16, marginBottom: 8 }}>楽天GORA連携</h3>
        <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
          楽天GORAには外部アプリ向けの公開APIが提供されていないため、現在は自動連携に対応していません。
          「スコア」タブから手動でラウンド結果を記録してください。
        </p>
      </div>
    </div>
  )
}
