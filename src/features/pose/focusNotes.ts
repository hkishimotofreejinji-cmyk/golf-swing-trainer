import type { SwingIssue } from '../../types'
import { SELF_CHECK_CONTENT } from './selfChecks'

// Simple substring keyword matching from the user's free-text focus note to a
// swing concept. Keys that match a computed metric (see scoring.ts) or a
// self-check item (see selfChecks.ts) reuse that same key so knowledge tagged
// with it, and any matching low-score issue, line up automatically.
const FOCUS_KEYWORDS: Record<string, string[]> = {
  sway: ['スウェー', '腰が流れ', '腰が右に'],
  right_elbow: ['右わき', '右脇', 'フライングエルボー'],
  x_factor: ['捻転', 'Xファクター', '手打ち'],
  transition_pause: ['切り返し', 'タメ', '間(ま)', '急いで', 'テンポ', 'リズム'],
  early_extension: ['前傾', '起き上がり', 'アーリーエクステンション', '伸び上がり'],
  head_impact: ['頭', 'あたま'],
  early_opening: ['開き', '開いて', 'ルックアップ'],
  heel_lift: ['かかと', '踵'],
  chicken_wing: ['チキンウィング', '左肘が引け', '左肘'],
  finish_balance: ['フィニッシュ', 'バランス'],
  swing_plane: ['プレーン', 'アップライト'],
  top_elbow: ['右肘', 'お盆'],
  lower_body_lead: ['下半身リード', '下半身から'],
  early_release: ['アーリーリリース', 'すくい打ち'],
  hand_path: ['ハンドパス', 'インサイド', 'アウトサイド', 'アウトサイドイン'],
  hands_first: ['ハンドファースト'],
  weight_distribution: ['体重配分', '右に乗り', '右足に乗り'],
  wrist_condition: ['掌屈', '背屈', '甲折れ'],
  grip_pressure: ['グリップ圧', 'グリップの支え'],
  contact_quality: ['シャンク', 'ダフリ', 'ダフる'],
  face_angle: ['スライス', 'フック', 'チーピン', 'フェースが開', 'フェースが閉'],
}

const FOCUS_CONTENT: Record<string, Omit<SwingIssue, 'source'>> = {
  sway: {
    key: 'sway',
    title: 'スウェーが気になっているそうです',
    advice: 'バックスイングで腰が右に流れないよう、右足内側の踏ん張りを意識しましょう。',
    searchQuery: 'ゴルフ スウェー 防止 練習方法',
  },
  right_elbow: {
    key: 'right_elbow',
    title: '右わき(フライングエルボー)が気になっているそうです',
    advice: 'テークバックからトップにかけて右わきが開かないよう、体の近くで腕を振る感覚を練習しましょう。',
    searchQuery: 'ゴルフ 右わき 締める 練習方法',
  },
  x_factor: {
    key: 'x_factor',
    title: '体の捻転差(Xファクター)が気になっているそうです',
    advice: '腰の回転を抑えつつ、肩をしっかり回して体の捻転差を作りましょう。',
    searchQuery: 'ゴルフ 捻転差 Xファクター 作り方',
  },
  transition_pause: {
    key: 'transition_pause',
    title: '切り返しのタイミングが気になっているそうです',
    advice: 'トップで一瞬の間を作ってから切り返す意識を持ちましょう。',
    searchQuery: 'ゴルフ 切り返し 間 タメ 作り方',
  },
  early_extension: {
    key: 'early_extension',
    title: '前傾角度・アーリーエクステンションが気になっているそうです',
    advice: 'アドレス時の前傾角度をインパクトまでキープする練習をしましょう。',
    searchQuery: 'ゴルフ アーリーエクステンション 直し方',
  },
  head_impact: {
    key: 'head_impact',
    title: '頭の動きが気になっているそうです',
    advice: 'アドレスからインパクトまで、頭の位置をできるだけ動かさないよう意識しましょう。',
    searchQuery: 'ゴルフ スイング 頭 動かない 直し方',
  },
  early_opening: {
    key: 'early_opening',
    title: '体の開きが気になっているそうです',
    advice: 'インパクトまで胸を開きすぎないよう、我慢して振り抜く練習をしましょう。',
    searchQuery: 'ゴルフ インパクト 体 開く 直し方',
  },
  heel_lift: {
    key: 'heel_lift',
    title: '右かかとの浮き上がりが気になっているそうです',
    advice: 'インパクト直後まで右足をベタ足でキープする意識を持ちましょう。',
    searchQuery: 'ゴルフ 右かかと ベタ足 練習',
  },
  chicken_wing: {
    key: 'chicken_wing',
    title: 'チキンウィングが気になっているそうです',
    advice: 'インパクト後も左腕を伸ばし切る意識で振り抜きましょう。',
    searchQuery: 'ゴルフ チキンウィング 直し方',
  },
  finish_balance: {
    key: 'finish_balance',
    title: 'フィニッシュのバランスが気になっているそうです',
    advice: '左足一本で3秒静止できるバランスを目標に、フィニッシュを最後まで作りましょう。',
    searchQuery: 'ゴルフ フィニッシュ バランス 練習',
  },
  swing_plane: {
    key: 'swing_plane',
    title: 'スイングプレーンが気になっているそうです',
    advice: 'テークバックの最初の軌道を体の近くに保つ意識をしてみましょう。',
    searchQuery: 'ゴルフ スイングプレーン 安定 練習',
  },
  top_elbow: {
    key: 'top_elbow',
    title: 'トップでの右肘の向きが気になっているそうです',
    advice: 'トップで右肘が下(お盆を持つような角度)を向くよう意識しましょう。',
    searchQuery: 'ゴルフ トップ 右肘 下向き コツ',
  },
  lower_body_lead: {
    key: 'lower_body_lead',
    title: '下半身リードが気になっているそうです',
    advice: '切り返しは腰(下半身)から先に動かす意識を持ちましょう。',
    searchQuery: 'ゴルフ 切り返し 下半身リード 練習',
  },
  early_release: {
    key: 'early_release',
    title: 'アーリーリリースが気になっているそうです',
    advice: 'ダウンスイングで手首の角度(タメ)を我慢し、インパクト直前までコックを保つ練習をしましょう。',
    searchQuery: 'ゴルフ アーリーリリース 直し方 タメ',
  },
  hand_path: {
    key: 'hand_path',
    title: 'ハンドパスが気になっているそうです',
    advice: '切り返しからインパクトにかけて、手元がまっすぐ落ちてくる感覚を素振りで確認しましょう。',
    searchQuery: 'ゴルフ ダウンスイング 手元 軌道 練習',
  },
  hands_first: {
    key: 'hands_first',
    title: 'ハンドファーストが気になっているそうです',
    advice: 'インパクトで手がクラブヘッドより先行する感覚を、素振りやハーフスイングで確認しましょう。',
    searchQuery: 'ゴルフ ハンドファースト 作り方 コツ',
  },
  weight_distribution: { ...SELF_CHECK_CONTENT.weight_distribution },
  wrist_condition: { ...SELF_CHECK_CONTENT.wrist_condition },
  grip_pressure: { ...SELF_CHECK_CONTENT.grip_pressure },
  contact_quality: { ...SELF_CHECK_CONTENT.contact_quality },
  face_angle: { ...SELF_CHECK_CONTENT.face_angle },
}

export function buildFocusIssues(focusNote: string | undefined, existingIssues: SwingIssue[]): SwingIssue[] {
  if (!focusNote?.trim()) return []
  const existingKeys = new Set(existingIssues.map((i) => i.key))
  const matchedKeys = new Set<string>()

  for (const [key, keywords] of Object.entries(FOCUS_KEYWORDS)) {
    if (existingKeys.has(key)) continue
    if (keywords.some((kw) => focusNote.includes(kw))) {
      matchedKeys.add(key)
    }
  }

  return [...matchedKeys].map((key) => ({ ...FOCUS_CONTENT[key], source: 'focus' as const }))
}
