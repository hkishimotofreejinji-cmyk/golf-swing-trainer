export type ClubType = 'wood' | 'iron'

export interface ClubOption {
  value: string
  label: string
  type: ClubType
}

export interface ClubGroup {
  group: string
  clubs: ClubOption[]
}

// Utility clubs are grouped with woods for bag organization, but swung more like a
// shallow iron (ball further back, more descending strike) — so they're scored as 'iron'.
export const CLUB_BAG: ClubGroup[] = [
  {
    group: 'ウッド',
    clubs: [
      { value: 'driver', label: 'ドライバー', type: 'wood' },
      { value: '5w', label: '5番フェアウェイウッド', type: 'wood' },
      { value: '7u', label: '7番ユーティリティ', type: 'iron' },
    ],
  },
  {
    group: 'アイアン',
    clubs: [
      { value: '6i', label: '6番アイアン', type: 'iron' },
      { value: '7i', label: '7番アイアン', type: 'iron' },
      { value: '8i', label: '8番アイアン', type: 'iron' },
      { value: '9i', label: '9番アイアン', type: 'iron' },
      { value: 'w', label: 'W(ピッチングウェッジ)', type: 'iron' },
      { value: 's', label: 'S(サンドウェッジ)', type: 'iron' },
    ],
  },
]

const CLUB_MAP = new Map(CLUB_BAG.flatMap((g) => g.clubs).map((c) => [c.value, c]))

export function getClubLabel(value: string): string {
  return CLUB_MAP.get(value)?.label ?? value
}

export function getClubType(value: string): ClubType {
  return CLUB_MAP.get(value)?.type ?? 'iron'
}
