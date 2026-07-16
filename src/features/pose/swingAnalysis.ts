import { detectFrame } from './poseDetector'
import { computeMetrics, computeOverallScore, type FrameSample } from './scoring'
import { buildFocusIssues } from './focusNotes'
import { buildSelfCheckIssues } from './selfChecks'
import { getClubType } from '../clubs/clubs'
import type { SwingSession } from '../../types'

// Higher than a plain "sample the swing" count would need, because a few metrics
// (transition pause, release timing) depend on catching the top-of-backswing and
// downswing with enough temporal resolution to see a real speed change.
const SAMPLE_COUNT = 60

function seekTo(video: HTMLVideoElement, time: number): Promise<void> {
  return new Promise((resolve) => {
    const onSeeked = () => {
      video.removeEventListener('seeked', onSeeked)
      resolve()
    }
    video.addEventListener('seeked', onSeeked)
    video.currentTime = time
  })
}

export async function analyzeSwingVideo(
  file: File,
  club: string,
  focusNote: string,
  selfChecks: string[],
  onProgress?: (pct: number) => void,
): Promise<Omit<SwingSession, 'id'>> {
  const url = URL.createObjectURL(file)
  const video = document.createElement('video')
  video.src = url
  video.muted = true
  video.playsInline = true

  await new Promise<void>((resolve, reject) => {
    video.addEventListener('loadedmetadata', () => resolve(), { once: true })
    video.addEventListener('error', () => reject(new Error('動画を読み込めませんでした')), { once: true })
  })

  const duration = video.duration
  const canvas = document.createElement('canvas')
  canvas.width = video.videoWidth
  canvas.height = video.videoHeight
  const ctx = canvas.getContext('2d')!

  const frames: FrameSample[] = []
  let thumbnail: string | undefined

  for (let i = 0; i < SAMPLE_COUNT; i++) {
    const t = (duration * i) / (SAMPLE_COUNT - 1)
    await seekTo(video, Math.min(t, Math.max(duration - 0.01, 0)))
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    const keypoints = await detectFrame(canvas)
    if (keypoints) {
      frames.push({ time: t, keypoints })
      if (!thumbnail && i < SAMPLE_COUNT * 0.3) {
        thumbnail = canvas.toDataURL('image/jpeg', 0.6)
      }
    }
    onProgress?.(Math.round(((i + 1) / SAMPLE_COUNT) * 100))
  }

  if (!thumbnail && frames.length) {
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    thumbnail = canvas.toDataURL('image/jpeg', 0.6)
  }

  URL.revokeObjectURL(url)

  const { metrics, issues } = computeMetrics(frames, getClubType(club))
  const overallScore = computeOverallScore(metrics)
  const focusIssues = buildFocusIssues(focusNote, issues)
  const selfCheckIssues = buildSelfCheckIssues(selfChecks)

  return {
    date: new Date().toISOString(),
    club,
    overallScore,
    metrics,
    issues: [...issues, ...focusIssues, ...selfCheckIssues],
    thumbnail,
    focusNote: focusNote.trim() || undefined,
    selfChecks: selfChecks.length ? selfChecks : undefined,
  }
}
