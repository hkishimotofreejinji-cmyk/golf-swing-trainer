export interface KnowledgeTag {
  key: string
  label: string
}

export interface KnowledgeTagGroup {
  group: string
  tags: KnowledgeTag[]
}

// Tag keys mirror scoring.ts metric keys and selfChecks.ts item keys, so knowledge
// tagged with them surfaces automatically on the matching analysis issue.
export const KNOWLEDGE_TAG_GROUPS: KnowledgeTagGroup[] = [
  {
    group: 'Ⅰ. アドレス・バックスイング',
    tags: [
      { key: 'sway', label: 'スウェー(腰の左右ブレ)' },
      { key: 'right_elbow', label: '右脇の管理' },
    ],
  },
  {
    group: 'Ⅱ. トップ・切り返し',
    tags: [
      { key: 'x_factor', label: '体の捻転差(Xファクター)' },
      { key: 'transition_pause', label: '切り返しのタイミング' },
    ],
  },
  {
    group: 'Ⅲ. ダウンスイング・インパクト',
    tags: [
      { key: 'early_extension', label: '前傾角度の維持' },
      { key: 'head_impact', label: '頭の位置' },
      { key: 'early_opening', label: '体の開き制御' },
    ],
  },
  {
    group: 'Ⅳ. フォロースルー・フィニッシュ',
    tags: [
      { key: 'heel_lift', label: '足元の粘り' },
      { key: 'chicken_wing', label: 'アームローテーション' },
      { key: 'finish_balance', label: 'フィニッシュのバランス' },
    ],
  },
  {
    group: '参考値項目(精度は低め)',
    tags: [
      { key: 'swing_plane', label: 'スイングプレーン' },
      { key: 'top_elbow', label: 'トップでの右肘の向き' },
      { key: 'lower_body_lead', label: '下半身リード' },
      { key: 'early_release', label: 'アーリーリリース' },
      { key: 'hand_path', label: 'ハンドパス' },
    ],
  },
  {
    group: '自己チェック項目(動画では測定不可)',
    tags: [
      { key: 'weight_distribution', label: '体重配分' },
      { key: 'wrist_condition', label: '手首の掌屈・背屈' },
      { key: 'grip_pressure', label: 'グリップ・親指の支え' },
      { key: 'contact_quality', label: '打点(シャンク・ダフリ)' },
      { key: 'face_angle', label: 'フェース角度(スライス・チーピン)' },
    ],
  },
  {
    group: 'その他',
    tags: [
      { key: 'hands_first', label: 'ハンドファースト' },
      { key: 'general', label: '全般・その他' },
    ],
  },
]

export const KNOWLEDGE_TAGS: KnowledgeTag[] = KNOWLEDGE_TAG_GROUPS.flatMap((g) => g.tags)

const TAG_LABEL_MAP = new Map(KNOWLEDGE_TAGS.map((t) => [t.key, t.label]))

export function getTagLabel(key: string): string {
  return TAG_LABEL_MAP.get(key) ?? key
}

export function detectPlatform(url: string): 'youtube' | 'tiktok' | 'other' {
  try {
    const host = new URL(url).hostname.replace(/^www\./, '')
    if (host.includes('tiktok.com')) return 'tiktok'
    if (host.includes('youtube.com') || host.includes('youtu.be')) return 'youtube'
    return 'other'
  } catch {
    return 'other'
  }
}

export const PLATFORM_ICON: Record<'youtube' | 'tiktok' | 'other', string> = {
  youtube: '▶️',
  tiktok: '🎵',
  other: '🔗',
}
