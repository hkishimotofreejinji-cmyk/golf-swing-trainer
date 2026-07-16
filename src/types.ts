export interface SwingMetric {
  key: string
  label: string
  phase: string // swing-phase grouping, e.g. 'アドレス・バックスイング', or '参考値' for low-confidence extras
  tier: 'primary' | 'reference' // 'reference' metrics are shown separately and excluded from overallScore
  score: number // 0-100
  detail: string
}

export interface SwingIssue {
  key: string
  title: string
  advice: string
  searchQuery: string
  source?: 'metric' | 'focus' | 'selfcheck' // 'focus'/'selfcheck' aren't triggered by a low score
  tier?: 'primary' | 'reference' // mirrors SwingMetric.tier when source is 'metric'
}

export interface CoachingPriority {
  majorCategory: string // e.g. 'Ⅲ. ダウンスイング・インパクト'
  midCategory: string // e.g. '前傾軸(背骨の角度)'
  minorCategory: string // e.g. '上体の早期起き上がり'
  symptom: string // 起きている現象
  cause: string // なぜ起こるのか
  fix: string // どう改善するか
}

export interface CoachingDrill {
  name: string
  steps: string[]
  effect: string
}

export interface CoachingFeedback {
  overallSummary: string
  priorities: CoachingPriority[]
  drill: CoachingDrill
  generatedAt: string // ISO string
}

export interface SwingSession {
  id?: number
  date: string // ISO string
  club: string // ClubOption value, e.g. 'driver', '7i'
  overallScore: number
  metrics: SwingMetric[]
  issues: SwingIssue[]
  thumbnail?: string // data URL snapshot of address position
  focusNote?: string // free-text: what the user was worried about / wanted feedback on
  selfChecks?: string[] // SelfCheckKey values the user flagged right after hitting (shank, slice, etc.)
  coachingFeedback?: CoachingFeedback // AI-generated deep-dive, cached so it's only generated once
}

export interface RoundScore {
  id?: number
  date: string // ISO string, round date
  score: number // 18-hole total strokes
  courseName?: string
  note?: string
  source: 'manual' | 'rakuten_gora'
}

export interface KnowledgeEntry {
  id?: number
  createdAt: string // ISO string
  title: string
  url: string
  platform: 'youtube' | 'tiktok' | 'other'
  tags: string[] // KnowledgeTagKey values, e.g. 'head_stability', 'general'
  note?: string
}
