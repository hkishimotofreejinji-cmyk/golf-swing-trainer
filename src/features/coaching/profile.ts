export interface CoachingProfile {
  goal: string
  tendencies: string[] // metric/self-check keys, e.g. 'sway', 'face_angle'
  idealMovementNotes: string
}

const STORAGE_KEY = 'golf-trainer:coaching-profile'

const DEFAULT_PROFILE: CoachingProfile = {
  goal: '100切り達成',
  tendencies: ['face_angle', 'contact_quality', 'right_elbow', 'early_release', 'sway', 'early_extension'],
  idealMovementNotes:
    '腰先・グリップ先行で引き下ろすスイング。トップで左手親指にクラブの重みを乗せる形。掌屈の意識。ベタ足キープ。',
}

export function getCoachingProfile(): CoachingProfile {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return DEFAULT_PROFILE
  try {
    return { ...DEFAULT_PROFILE, ...JSON.parse(raw) }
  } catch {
    return DEFAULT_PROFILE
  }
}

export function setCoachingProfile(profile: CoachingProfile) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profile))
}
