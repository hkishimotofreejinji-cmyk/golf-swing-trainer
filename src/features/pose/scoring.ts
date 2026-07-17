import type { Keypoints } from './poseDetector'
import type { SwingIssue, SwingMetric } from '../../types'
import type { ClubType } from '../clubs/clubs'

export interface FrameSample {
  time: number
  keypoints: Keypoints
}

type Point = { x: number; y: number }

function mid(a?: Point, b?: Point): Point | undefined {
  if (!a || !b) return undefined
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
}

function dist(a?: Point, b?: Point): number | undefined {
  if (!a || !b) return undefined
  return Math.hypot(a.x - b.x, a.y - b.y)
}

function clampScore(n: number) {
  if (Number.isNaN(n)) return 50
  return Math.max(0, Math.min(100, Math.round(n)))
}

// Angle at `vertex` between vertex->a and vertex->b, in degrees.
function angleAtVertex(a?: Point, vertex?: Point, b?: Point): number | undefined {
  if (!a || !vertex || !b) return undefined
  const v1 = { x: a.x - vertex.x, y: a.y - vertex.y }
  const v2 = { x: b.x - vertex.x, y: b.y - vertex.y }
  const len1 = Math.hypot(v1.x, v1.y)
  const len2 = Math.hypot(v2.x, v2.y)
  if (len1 === 0 || len2 === 0) return undefined
  const cos = Math.max(-1, Math.min(1, (v1.x * v2.x + v1.y * v2.y) / (len1 * len2)))
  return (Math.acos(cos) * 180) / Math.PI
}

// Perpendicular signed distance from point `p` to the line through `a`-`b`.
function perpDistance(p: Point, a: Point, b: Point): number {
  const dx = b.x - a.x
  const dy = b.y - a.y
  const len = Math.hypot(dx, dy)
  if (len === 0) return 0
  return ((p.x - a.x) * dy - (p.y - a.y) * dx) / len
}

// Club-specific evaluation targets, carried over from the earlier 4-metric design:
// woods (driver/fairway wood) are swung with a fuller turn and more natural tempo
// variance, while irons demand a more compact, repeatable motion for ball-first
// contact — so irons are scored more strictly on posture/head stability and
// transition crispness, and more leniently on rotation depth.
interface ClubProfile {
  headImpactPenalty: number
  earlyExtensionPenalty: number
  xFactorGain: number
  transitionPauseGain: number
}

const CLUB_PROFILES: Record<ClubType, ClubProfile> = {
  wood: { headImpactPenalty: 200, earlyExtensionPenalty: 200, xFactorGain: 340, transitionPauseGain: 110 },
  iron: { headImpactPenalty: 240, earlyExtensionPenalty: 240, xFactorGain: 420, transitionPauseGain: 140 },
}

export const PHASE = {
  address: 'Ⅰ. アドレス・バックスイング',
  top: 'Ⅱ. トップ・切り返し',
  impact: 'Ⅲ. ダウンスイング・インパクト',
  finish: 'Ⅳ. フォロースルー・フィニッシュ',
  reference: '参考値(正面映像のため精度は低め)',
} as const

interface DerivedFrame {
  time: number
  shoulderMid?: Point
  hipMid?: Point
  shoulderWidth?: number
  hipWidth?: number
  head?: Point
  wristMid?: Point
  leftElbow?: Point
  rightElbow?: Point
  leftShoulder?: Point
  rightShoulder?: Point
  leftWrist?: Point
  rightWrist?: Point
  leftAnkle?: Point
  rightAnkle?: Point
}

function deriveFrame(f: FrameSample): DerivedFrame {
  const k = f.keypoints
  return {
    time: f.time,
    shoulderMid: mid(k.left_shoulder, k.right_shoulder),
    hipMid: mid(k.left_hip, k.right_hip),
    shoulderWidth: dist(k.left_shoulder, k.right_shoulder),
    hipWidth: dist(k.left_hip, k.right_hip),
    head: mid(k.left_ear, k.right_ear) ?? k.nose,
    wristMid: mid(k.left_wrist, k.right_wrist),
    leftElbow: k.left_elbow,
    rightElbow: k.right_elbow,
    leftShoulder: k.left_shoulder,
    rightShoulder: k.right_shoulder,
    leftWrist: k.left_wrist,
    rightWrist: k.right_wrist,
    leftAnkle: k.left_ankle,
    rightAnkle: k.right_ankle,
  }
}

function metric(key: string, label: string, phase: string, tier: 'primary' | 'reference', score: number, detail: string): SwingMetric {
  return { key, label, phase, tier, score, detail }
}

// Frames are noisy real-world captures from a single face-on phone camera, so every
// metric below is a rough proxy, not a biomechanically exact measurement. Metrics
// tagged 'reference' are concepts that really need a down-the-line camera angle to
// measure properly — they're shown separately and excluded from the overall score.
export function computeMetrics(
  frames: FrameSample[],
  clubType: ClubType,
): { metrics: SwingMetric[]; issues: SwingIssue[] } {
  const profile = CLUB_PROFILES[clubType]
  const usable = frames
    .filter((f) => f.keypoints.left_shoulder && f.keypoints.right_shoulder && f.keypoints.left_hip && f.keypoints.right_hip)
    .map(deriveFrame)

  if (usable.length < 8) {
    return {
      metrics: [],
      issues: [
        {
          key: 'no_pose',
          title: '骨格を十分に検出できませんでした',
          advice: '全身が映るように、明るい場所で正面から撮影し直してみてください。',
          searchQuery: 'ゴルフ スイング 動画 撮り方 コツ',
        },
      ],
    }
  }

  const shoulderWidths = usable.map((f) => f.shoulderWidth).filter((w): w is number => w !== undefined)
  const avgShoulderWidth = shoulderWidths.reduce((a, b) => a + b, 0) / shoulderWidths.length

  const address = usable[0]

  // Top of backswing: frame with the highest hand position (min wrist y) in the first 75%.
  let topIdx = 0
  let minWristY = Infinity
  usable.forEach((f, i) => {
    if (f.wristMid && i < usable.length * 0.75 && f.wristMid.y < minWristY) {
      minWristY = f.wristMid.y
      topIdx = i
    }
  })

  // Impact/early-follow-through proxy: lowest hand position after the top (hands
  // bottom out around impact, then rise again through the follow-through).
  let impactIdx = topIdx
  let maxWristY = -Infinity
  for (let i = topIdx; i < usable.length; i++) {
    const y = usable[i].wristMid?.y
    if (y !== undefined && y > maxWristY) {
      maxWristY = y
      impactIdx = i
    }
  }
  const finishIdx = usable.length - 1
  const top = usable[topIdx]
  const impact = usable[impactIdx]
  const finish = usable[finishIdx]

  const metrics: SwingMetric[] = []
  const issues: SwingIssue[] = []

  function addPrimary(key: string, label: string, phase: string, score: number, detail: string, threshold: number, issueContent: Omit<SwingIssue, 'key' | 'source' | 'tier'>) {
    metrics.push(metric(key, label, phase, 'primary', score, detail))
    if (score < threshold) {
      issues.push({ key, ...issueContent, source: 'metric', tier: 'primary' })
    }
  }

  function addReference(key: string, label: string, score: number, detail: string, threshold: number, issueContent: Omit<SwingIssue, 'key' | 'source' | 'tier'>) {
    metrics.push(metric(key, label, PHASE.reference, 'reference', score, detail))
    if (score < threshold) {
      issues.push({ key, ...issueContent, source: 'metric', tier: 'reference' })
    }
  }

  // ---- I. アドレス・バックスイング ----

  // #2 sway: lateral hip drift during the backswing (address -> top)
  {
    const addressHipX = address.hipMid?.x
    let maxDrift = 0
    for (let i = 0; i <= topIdx; i++) {
      const x = usable[i].hipMid?.x
      if (x !== undefined && addressHipX !== undefined) {
        maxDrift = Math.max(maxDrift, Math.abs(x - addressHipX))
      }
    }
    const swayRatio = maxDrift / avgShoulderWidth
    const score = clampScore(100 - swayRatio * 260)
    addPrimary(
      'sway',
      'スウェー(腰の左右ブレ)',
      PHASE.address,
      score,
      `バックスイング中の腰の左右ブレは肩幅の約${(swayRatio * 100).toFixed(0)}%でした。`,
      65,
      {
        title: '腰が右に流れています(スウェー)',
        advice: 'バックスイングで腰が右に流れないよう、右足内側の踏ん張りを意識しましょう。',
        searchQuery: 'ゴルフ スウェー 防止 練習方法',
      },
    )
  }

  // #4 right elbow flare at the top (flying elbow), face-on horizontal proxy
  {
    const flareRatio =
      top.rightElbow && top.rightShoulder && top.shoulderWidth
        ? Math.abs(top.rightElbow.x - top.rightShoulder.x) / top.shoulderWidth
        : undefined
    const score = flareRatio !== undefined ? clampScore(100 - flareRatio * 140) : 50
    addPrimary(
      'right_elbow',
      '右脇の管理(フライングエルボー)',
      PHASE.address,
      score,
      flareRatio !== undefined
        ? `トップでの右肘と肩の横方向のズレは肩幅の約${(flareRatio * 100).toFixed(0)}%でした。`
        : '右肘を検出できませんでした。',
      65,
      {
        title: '右脇が開いています(フライングエルボー)',
        advice: 'テークバックからトップにかけて、右肘が体から離れすぎないよう意識しましょう。',
        searchQuery: 'ゴルフ 右脇 締める フライングエルボー 直し方',
      },
    )
  }

  // ---- II. トップ・切り返し ----

  // #8 X-factor: shoulder rotation vs hip rotation differential at the top
  {
    const shoulderRotAtTop = top.shoulderWidth && address.shoulderWidth ? 1 - top.shoulderWidth / address.shoulderWidth : 0
    const hipRotAtTop = top.hipWidth && address.hipWidth ? 1 - top.hipWidth / address.hipWidth : 0
    const xFactor = shoulderRotAtTop - hipRotAtTop
    const score = clampScore(xFactor * profile.xFactorGain)
    addPrimary(
      'x_factor',
      '体の捻転差(Xファクター)',
      PHASE.top,
      score,
      `肩の回転に対して腰の回転を約${(xFactor * 100).toFixed(0)}ポイント抑えられていました(大きいほど捻転差があります)。`,
      55,
      {
        title: '肩の回転が浅く、手打ちになっている可能性があります',
        advice: '腰の回転を抑えつつ、肩をしっかり回して体の捻転差(Xファクター)を作りましょう。',
        searchQuery: 'ゴルフ 捻転差 Xファクター 作り方',
      },
    )
  }

  // #9 pause at the top: how much the hands decelerate right at the transition
  {
    const speeds: (number | undefined)[] = usable.map((_f, i) => {
      if (i === 0 || i === usable.length - 1) return undefined
      const a = usable[i - 1].wristMid
      const b = usable[i + 1].wristMid
      const dt = usable[i + 1].time - usable[i - 1].time
      if (!a || !b || dt <= 0) return undefined
      return Math.hypot(b.x - a.x, b.y - a.y) / dt
    })
    const validSpeeds = speeds.filter((s): s is number => s !== undefined)
    const avgSpeed = validSpeeds.reduce((a, b) => a + b, 0) / (validSpeeds.length || 1)
    const speedAtTop = speeds[topIdx]
    const pauseRatio = speedAtTop !== undefined && avgSpeed > 0 ? 1 - speedAtTop / avgSpeed : undefined
    const score = pauseRatio !== undefined ? clampScore(pauseRatio * profile.transitionPauseGain) : 50
    addPrimary(
      'transition_pause',
      '切り返しのタイミング(間)',
      PHASE.top,
      score,
      pauseRatio !== undefined
        ? `トップでの手元の減速は平均スピードの約${(pauseRatio * 100).toFixed(0)}%でした。`
        : 'トップ付近の速度を推定できませんでした。',
      55,
      {
        title: '切り返しに間(タメ)がなく急いでいる可能性があります',
        advice: 'トップで一瞬の間を作ってから切り返す意識を持ちましょう。',
        searchQuery: 'ゴルフ 切り返し 間 タメ 作り方',
      },
    )
  }

  // ---- III. ダウンスイング・インパクト ----

  // #13 early extension: torso "standing up" from address to impact
  {
    const addressSpan = address.hipMid && address.shoulderMid ? address.hipMid.y - address.shoulderMid.y : undefined
    const impactSpan = impact.hipMid && impact.shoulderMid ? impact.hipMid.y - impact.shoulderMid.y : undefined
    const extensionRatio = addressSpan !== undefined && impactSpan !== undefined ? (impactSpan - addressSpan) / avgShoulderWidth : undefined
    const score = extensionRatio !== undefined ? clampScore(100 - Math.max(0, extensionRatio) * profile.earlyExtensionPenalty) : 50
    addPrimary(
      'early_extension',
      '前傾角度の維持(アーリーエクステンション)',
      PHASE.impact,
      score,
      extensionRatio !== undefined
        ? `アドレスからインパクトにかけて上体の高さが約${(extensionRatio * 100).toFixed(0)}%変化しました(プラスが大きいほど起き上がりです)。`
        : '前傾角度の変化を推定できませんでした。',
      65,
      {
        title: '前傾角度が起き上がっています(アーリーエクステンション)',
        advice: 'インパクトまでアドレスの前傾角度をキープする練習をしましょう。',
        searchQuery: 'ゴルフ アーリーエクステンション 直し方',
      },
    )
  }

  // #14 head position: vertical head shift from address to impact
  {
    const headShiftRatio =
      address.head && impact.head ? (address.head.y - impact.head.y) / avgShoulderWidth : undefined
    const score = headShiftRatio !== undefined ? clampScore(100 - Math.abs(headShiftRatio) * profile.headImpactPenalty) : 50
    addPrimary(
      'head_impact',
      'インパクトでの頭の位置',
      PHASE.impact,
      score,
      headShiftRatio !== undefined
        ? `アドレスからインパクトにかけて頭の高さが肩幅の約${(Math.abs(headShiftRatio) * 100).toFixed(0)}%変化しました。`
        : '頭の位置を推定できませんでした。',
      65,
      {
        title: 'インパクトで頭が大きく動いています',
        advice: 'インパクトにかけて頭の高さをできるだけ変えないよう意識しましょう。',
        searchQuery: 'ゴルフ インパクト 頭 動く 直し方',
      },
    )
  }

  // #15 early opening: how much the shoulders have already turned back open by impact
  {
    const impactOpenRatio = impact.shoulderWidth && address.shoulderWidth ? 1 - impact.shoulderWidth / address.shoulderWidth : undefined
    const score = impactOpenRatio !== undefined ? clampScore(100 - Math.max(0, impactOpenRatio) * 240) : 50
    addPrimary(
      'early_opening',
      '体の開き制御(インパクト)',
      PHASE.impact,
      score,
      impactOpenRatio !== undefined
        ? `インパクト時点で肩がアドレス比で約${(Math.max(0, impactOpenRatio) * 100).toFixed(0)}%回転していました。`
        : '肩の向きを推定できませんでした。',
      65,
      {
        title: 'インパクトで体が早く開いています',
        advice: 'インパクトまで胸を開きすぎないよう、我慢して振り抜く練習をしましょう。',
        searchQuery: 'ゴルフ インパクト 体 開く 直し方',
      },
    )
  }

  // ---- IV. フォロースルー・フィニッシュ ----

  // #18 heel lift: right ankle rising too early right after impact
  {
    const followIdx = Math.min(impactIdx + 2, usable.length - 1)
    const follow = usable[followIdx]
    const riseRatio =
      address.rightAnkle && follow.rightAnkle ? (address.rightAnkle.y - follow.rightAnkle.y) / avgShoulderWidth : undefined
    const score = riseRatio !== undefined ? clampScore(100 - Math.max(0, riseRatio) * 260) : 50
    addPrimary(
      'heel_lift',
      '足元の粘り(右かかと)',
      PHASE.finish,
      score,
      riseRatio !== undefined
        ? `インパクト直後の右かかとの浮き上がりは肩幅の約${(Math.max(0, riseRatio) * 100).toFixed(0)}%でした。`
        : '右足の位置を検出できませんでした。',
      65,
      {
        title: '右かかとが早く浮いています',
        advice: 'インパクト直後まで右足をベタ足でキープする意識を持ちましょう。',
        searchQuery: 'ゴルフ 右かかと ベタ足 練習',
      },
    )
  }

  // #19 chicken wing: left elbow bend through the follow-through
  {
    let minAngle: number | undefined
    for (let i = impactIdx; i < usable.length; i++) {
      const f = usable[i]
      const angle = angleAtVertex(f.leftShoulder, f.leftElbow, f.leftWrist)
      if (angle !== undefined) minAngle = minAngle === undefined ? angle : Math.min(minAngle, angle)
    }
    const score = minAngle !== undefined ? clampScore((minAngle - 90) * (100 / 70)) : 50
    addPrimary(
      'chicken_wing',
      'アームローテーション(チキンウィング)',
      PHASE.finish,
      score,
      minAngle !== undefined
        ? `フォロースルー中の左肘の曲がり(最小角度)は約${minAngle.toFixed(0)}度でした。`
        : '左肘を検出できませんでした。',
      65,
      {
        title: 'フォローで左肘が引けています(チキンウィング)',
        advice: 'インパクト後も左腕を伸ばし切る意識で振り抜きましょう。',
        searchQuery: 'ゴルフ チキンウィング 直し方',
      },
    )
  }

  // #20 finish balance: weight settled over the left leg at the finish
  {
    const riseRatio =
      address.rightAnkle && finish.rightAnkle ? (address.rightAnkle.y - finish.rightAnkle.y) / avgShoulderWidth : undefined
    const riseScore = riseRatio !== undefined ? clampScore(riseRatio * 200) : undefined
    const hipOffset =
      finish.hipMid && finish.leftAnkle ? Math.abs(finish.hipMid.x - finish.leftAnkle.x) / avgShoulderWidth : undefined
    const centeredScore = hipOffset !== undefined ? clampScore(100 - hipOffset * 150) : undefined
    const parts = [riseScore, centeredScore].filter((s): s is number => s !== undefined)
    const score = parts.length ? clampScore(parts.reduce((a, b) => a + b, 0) / parts.length) : 50
    addPrimary(
      'finish_balance',
      'フィニッシュのバランス',
      PHASE.finish,
      score,
      '右足の浮き上がり方と体の重心位置から、フィニッシュの安定度を推定しました。',
      65,
      {
        title: 'フィニッシュのバランスが崩れやすい傾向があります',
        advice: '左足一本で3秒静止できるバランスを目標に、フィニッシュを最後まで作りましょう。',
        searchQuery: 'ゴルフ フィニッシュ バランス 練習',
      },
    )
  }

  // ---- 参考値(正面映像では精度が低め) ----

  // #3 swing plane: angle from vertical of the hands' path up to the top
  {
    const dx = top.wristMid && address.wristMid ? top.wristMid.x - address.wristMid.x : undefined
    const dy = top.wristMid && address.wristMid ? address.wristMid.y - top.wristMid.y : undefined
    const planeAngle = dx !== undefined && dy !== undefined ? Math.abs((Math.atan2(dx, dy) * 180) / Math.PI) : undefined
    const score = planeAngle !== undefined ? clampScore(100 - Math.max(0, Math.abs(planeAngle - 57) - 15) * 4) : 50
    addReference(
      'swing_plane',
      'スイングプレーン',
      score,
      planeAngle !== undefined
        ? `手元が上がる角度は垂直から約${planeAngle.toFixed(0)}度でした(正面映像のための参考値です)。`
        : 'プレーンを推定できませんでした。',
      55,
      {
        title: 'スイングプレーンがやや乱れている可能性があります(参考値)',
        advice: '正面映像のため参考値ですが、テークバックの最初の軌道を体の近くに保つ意識をしてみましょう。',
        searchQuery: 'ゴルフ スイングプレーン 安定 練習',
      },
    )
  }

  // #7 top elbow direction: right elbow-to-shoulder angle from straight down at the top
  {
    const dx = top.rightElbow && top.rightShoulder ? top.rightElbow.x - top.rightShoulder.x : undefined
    const dy = top.rightElbow && top.rightShoulder ? top.rightElbow.y - top.rightShoulder.y : undefined
    const angleFromDown = dx !== undefined && dy !== undefined ? Math.abs((Math.atan2(dx, dy) * 180) / Math.PI) : undefined
    const score = angleFromDown !== undefined ? clampScore(100 - angleFromDown * 1.5) : 50
    addReference(
      'top_elbow',
      'トップでの右肘の向き',
      score,
      angleFromDown !== undefined
        ? `トップでの右肘の向きは、真下から約${angleFromDown.toFixed(0)}度でした。`
        : '右肘の向きを推定できませんでした。',
      55,
      {
        title: 'トップで右肘が浮いている可能性があります(参考値)',
        advice: 'トップで右肘が下(お盆を持つような角度)を向くよう意識しましょう。',
        searchQuery: 'ゴルフ トップ 右肘 下向き コツ',
      },
    )
  }

  // #10 lower body lead: hips vs shoulders unwinding speed just after the top
  {
    const idx2 = Math.min(topIdx + 2, impactIdx)
    let score = 50
    let detail = '切り返し直後の体の動きを推定できませんでした。'
    if (idx2 > topIdx) {
      const hipChange = (usable[idx2].hipWidth ?? 0) - (top.hipWidth ?? 0)
      const shoulderChange = (usable[idx2].shoulderWidth ?? 0) - (top.shoulderWidth ?? 0)
      const leadRatio = (hipChange - shoulderChange) / avgShoulderWidth
      score = clampScore(50 + leadRatio * 300)
      detail = '切り返し直後の腰と肩の戻り方の差から、下半身リードの度合いを推定しました。'
    }
    addReference('lower_body_lead', '下半身リード', score, detail, 45, {
      title: '切り返しが上半身主導になっている可能性があります(参考値)',
      advice: '切り返しは腰(下半身)から先に動かす意識を持ちましょう。',
      searchQuery: 'ゴルフ 切り返し 下半身リード 練習',
    })
  }

  // #11 early release: how much of the arm's extension already happened by mid-downswing
  {
    let score = 50
    let detail = 'ダウンスイングの推定に十分なフレームがありませんでした。'
    if (impactIdx > topIdx + 1) {
      const wristShoulderDist = (f: DerivedFrame) => dist(f.wristMid, f.shoulderMid) ?? 0
      const midIdx = topIdx + Math.round((impactIdx - topIdx) / 2)
      const distAtTop = wristShoulderDist(top)
      const distAtMid = wristShoulderDist(usable[midIdx])
      const distAtImpact = wristShoulderDist(impact)
      const totalChange = distAtImpact - distAtTop
      const changeAtMid = distAtMid - distAtTop
      const releaseRatio = totalChange !== 0 ? changeAtMid / totalChange : 0
      score = clampScore(100 - Math.max(0, releaseRatio - 0.5) * 200)
      detail = `ダウンスイング前半で、腕の伸び(タメの解け具合)が全体の約${Math.round(releaseRatio * 100)}%進んでいました。`
    }
    addReference('early_release', 'アーリーリリース', score, detail, 55, {
      title: 'ダウンスイングでの早い解け(アーリーリリース)の可能性があります(参考値)',
      advice: 'ダウンスイング前半は手首の角度をキープし、インパクト直前まで我慢しましょう。',
      searchQuery: 'ゴルフ アーリーリリース タメ 練習',
    })
  }

  // #12 hand path: how much the hands bow off a straight line from top to impact
  {
    let score = 50
    let detail = '手元の軌道を推定できませんでした。'
    if (impactIdx > topIdx + 1 && top.wristMid && impact.wristMid) {
      let maxDev = 0
      for (let i = topIdx + 1; i < impactIdx; i++) {
        const p = usable[i].wristMid
        if (p) maxDev = Math.abs(perpDistance(p, top.wristMid, impact.wristMid)) > Math.abs(maxDev) ? perpDistance(p, top.wristMid, impact.wristMid) : maxDev
      }
      const devRatio = maxDev / avgShoulderWidth
      score = clampScore(100 - Math.abs(devRatio) * 200)
      detail = `切り返しからインパクトまでの手元の軌道は、直線に対して肩幅の約${(Math.abs(devRatio) * 100).toFixed(0)}%ズレていました(参考値)。`
    }
    addReference('hand_path', 'ハンドパス(手元の軌道)', score, detail, 55, {
      title: '手元の軌道がインサイド/アウトサイドに乱れている可能性があります(参考値)',
      advice: '切り返しからインパクトにかけて、手元がまっすぐ落ちてくる感覚を素振りで確認しましょう。',
      searchQuery: 'ゴルフ ダウンスイング 手元 軌道 練習',
    })
  }

  return { metrics, issues }
}

export function computeOverallScore(metrics: SwingMetric[]): number {
  const primary = metrics.filter((m) => m.tier === 'primary')
  if (!primary.length) return 0
  const total = primary.reduce((a, m) => a + m.score, 0)
  return clampScore(total / primary.length)
}
