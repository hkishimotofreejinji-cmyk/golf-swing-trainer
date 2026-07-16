import '@tensorflow/tfjs-backend-webgl'
import * as tf from '@tensorflow/tfjs-core'
import * as poseDetection from '@tensorflow-models/pose-detection'

let detectorPromise: Promise<poseDetection.PoseDetector> | null = null

export function getDetector() {
  if (!detectorPromise) {
    detectorPromise = (async () => {
      await tf.setBackend('webgl')
      await tf.ready()
      return poseDetection.createDetector(poseDetection.SupportedModels.MoveNet, {
        modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
      })
    })()
  }
  return detectorPromise
}

export type Keypoints = Record<string, { x: number; y: number; score: number }>

export async function detectFrame(
  source: HTMLVideoElement | HTMLCanvasElement,
): Promise<Keypoints | null> {
  const detector = await getDetector()
  const poses = await detector.estimatePoses(source, { flipHorizontal: false })
  if (!poses.length) return null
  const kp: Keypoints = {}
  for (const p of poses[0].keypoints) {
    if (p.name) kp[p.name] = { x: p.x, y: p.y, score: p.score ?? 0 }
  }
  return kp
}
