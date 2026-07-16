import type { SwingIssue } from '../../types'

// These concepts can't be measured from body-pose video at all — they need force
// plates, hand/finger tracking, or club-and-ball tracking. So instead of a score,
// the user self-reports right after hitting the shot (while it's still fresh).
export const SELF_CHECK_ITEMS = [
  { key: 'weight_distribution', label: '体重配分(右に乗りすぎ)' },
  { key: 'wrist_condition', label: '手首の掌屈・背屈' },
  { key: 'grip_pressure', label: 'グリップ・トップでの支え' },
  { key: 'contact_quality', label: '打点(シャンク・ダフリ)' },
  { key: 'face_angle', label: 'フェース角度(スライス・チーピン)' },
] as const

export type SelfCheckKey = (typeof SELF_CHECK_ITEMS)[number]['key']

export const SELF_CHECK_CONTENT: Record<SelfCheckKey, Omit<SwingIssue, 'source'>> = {
  weight_distribution: {
    key: 'weight_distribution',
    title: '体重配分が気になったショットでした',
    advice: '右サイドに乗りすぎないよう、アドレスから切り返しにかけて体重配分を意識しましょう。',
    searchQuery: 'ゴルフ 体重配分 アドレス 練習',
  },
  wrist_condition: {
    key: 'wrist_condition',
    title: '手首の使い方(掌屈・背屈)が気になったショットでした',
    advice: '左手首を甲折れさせず、フラットに保つ意識でフェースを管理しましょう。',
    searchQuery: 'ゴルフ 左手首 甲折れ 直し方',
  },
  grip_pressure: {
    key: 'grip_pressure',
    title: 'グリップ・トップでの支え方が気になったショットでした',
    advice: 'トップで左手親指にクラブの重みを感じられるグリップ・コックを意識しましょう。',
    searchQuery: 'ゴルフ グリップ トップ 手首 コツ',
  },
  contact_quality: {
    key: 'contact_quality',
    title: '打点(シャンク・ダフリ)が気になったショットでした',
    advice: 'ボールとの距離感、前傾角度の再現性を素振りで確認しましょう。',
    searchQuery: 'ゴルフ シャンク ダフリ 直し方',
  },
  face_angle: {
    key: 'face_angle',
    title: 'フェース角度(スライス・チーピン)が気になったショットでした',
    advice: 'インパクトでのフェースの向きを、グリップやフォロースルーの動きから見直しましょう。',
    searchQuery: 'ゴルフ スライス チーピン 直し方',
  },
}

export function buildSelfCheckIssues(selfChecks: string[]): SwingIssue[] {
  return selfChecks
    .filter((key): key is SelfCheckKey => key in SELF_CHECK_CONTENT)
    .map((key) => ({ ...SELF_CHECK_CONTENT[key], source: 'selfcheck' as const }))
}
