import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision"

import LIVENESS_CONFIG from "@/configs/liveness"

import { FaceIssue } from "../messages"
import {
  CapturedGesture,
  CapturedImage,
  GestureName,
  LivenessResult,
  toCapturedImage,
} from "../types"
import { analyzeFace, FaceBox } from "./analyze"
import { buildChallengeSequence, CHALLENGE_RULES } from "./challenges"

export interface SessionSnapshot {
  status: "loading" | "running" | "step-passed"
  steps: GestureName[]
  stepIndex: number
  issue: FaceIssue | null
  box: FaceBox | null
  stepRemainingMs: number
}

const config = LIVENESS_CONFIG.mediapipe

let landmarkerPromise: Promise<FaceLandmarker> | null = null

export function loadFaceLandmarker() {
  landmarkerPromise ??= (async () => {
    const fileset = await FilesetResolver.forVisionTasks(config.wasmRoot)
    const create = (delegate: "GPU" | "CPU") =>
      FaceLandmarker.createFromOptions(fileset, {
        baseOptions: { modelAssetPath: config.modelUrl, delegate },
        runningMode: "VIDEO",
        numFaces: 2,
        outputFaceBlendshapes: true,
      })
    try {
      return await create("GPU")
    } catch {
      return await create("CPU")
    }
  })().catch((e) => {
    landmarkerPromise = null
    throw e
  })
  return landmarkerPromise
}

function captureFrame(video: HTMLVideoElement): Promise<CapturedImage> {
  const canvas = document.createElement("canvas")
  canvas.width = video.videoWidth
  canvas.height = video.videoHeight
  canvas.getContext("2d")!.drawImage(video, 0, 0)
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) =>
        blob
          ? resolve(toCapturedImage(blob))
          : reject(new Error("Không chụp được ảnh từ camera")),
      "image/jpeg",
      0.9
    )
  )
}

export class LivenessSession {
  private rafId = 0
  private stopped = false
  private finished = false
  private lastVideoTime = -1
  private holdCount = 0
  private stepStartedAt = 0
  private startedAt = 0
  private frameCount = 0
  private frontal: CapturedImage[] = []
  private gestures: CapturedGesture[] = []
  private snapshot: SessionSnapshot

  constructor(
    private readonly video: HTMLVideoElement,
    private readonly onUpdate: (s: SessionSnapshot) => void
  ) {
    this.snapshot = {
      status: "loading",
      steps: buildChallengeSequence(config.challengeCount),
      stepIndex: 0,
      issue: null,
      box: null,
      stepRemainingMs: config.stepTimeoutMs,
    }
  }

  run(): Promise<LivenessResult> {
    return new Promise((resolve, reject) => {
      loadFaceLandmarker()
        .then((landmarker) => {
          if (this.stopped) return
          this.startedAt = performance.now()
          this.stepStartedAt = this.startedAt
          this.emit({ status: "running" })
          this.loop(landmarker, resolve, reject)
        })
        .catch(() =>
          reject(new Error("Không tải được, kiểm tra mạng rồi thử lại."))
        )
    })
  }

  stop() {
    this.stopped = true
    cancelAnimationFrame(this.rafId)
  }

  private emit(patch: Partial<SessionSnapshot>) {
    this.snapshot = { ...this.snapshot, ...patch }
    this.onUpdate(this.snapshot)
  }

  private loop(
    landmarker: FaceLandmarker,
    resolve: (r: LivenessResult) => void,
    reject: (e: Error) => void
  ) {
    const tick = async () => {
      if (this.stopped) return
      const now = performance.now()

      if (now - this.startedAt > config.totalTimeoutMs) {
        this.stop()
        return reject(new Error("Hết thời gian, vui lòng thử lại."))
      }
      const stepElapsed = now - this.stepStartedAt
      if (stepElapsed > config.stepTimeoutMs) {
        this.stop()
        return reject(new Error("Chưa nhận được thao tác, vui lòng thử lại."))
      }

      const video = this.video
      if (
        this.snapshot.status === "running" &&
        video.readyState >= 2 &&
        video.currentTime !== this.lastVideoTime
      ) {
        this.lastVideoTime = video.currentTime
        this.frameCount++
        const step = this.snapshot.steps[this.snapshot.stepIndex]
        const rule = CHALLENGE_RULES[step]
        const analysis = analyzeFace(landmarker.detectForVideo(video, now), {
          strictCenter: rule.strictCenter,
        })

        this.holdCount =
          analysis.ok && rule.passed(analysis.metrics) ? this.holdCount + 1 : 0

        this.emit({
          issue: analysis.ok ? null : analysis.issue,
          box: analysis.metrics?.box ?? null,
          stepRemainingMs: Math.max(0, config.stepTimeoutMs - stepElapsed),
        })

        if (this.holdCount >= rule.holdFrames) {
          this.holdCount = 0
          const image = await captureFrame(video)
          if (this.stopped) return URL.revokeObjectURL(image.url)
          if (step === "frontal") this.frontal.push(image)
          else this.gestures.push({ name: step, image })

          const isLast =
            this.snapshot.stepIndex === this.snapshot.steps.length - 1
          if (isLast) {
            this.stop()
            this.finished = true
            return resolve({
              engine: "mediapipe",
              frontal: this.frontal,
              gestures: this.gestures,
              frameCount: this.frameCount,
              durationMs: Math.round(performance.now() - this.startedAt),
            })
          }

          this.emit({ status: "step-passed" })
          setTimeout(() => {
            if (this.stopped) return
            this.stepStartedAt = performance.now()
            this.emit({
              status: "running",
              stepIndex: this.snapshot.stepIndex + 1,
            })
          }, 700)
        }
      }

      this.rafId = requestAnimationFrame(tick)
    }
    this.rafId = requestAnimationFrame(tick)
  }

  // Đã resolve thì ảnh thuộc về result, không thu hồi
  dispose() {
    this.stop()
    if (this.finished) return
    this.frontal.forEach((i) => URL.revokeObjectURL(i.url))
    this.gestures.forEach((g) => URL.revokeObjectURL(g.image.url))
  }
}
