import LIVENESS_CONFIG from "@/configs/liveness"

import { toCameraAccessError } from "../camera-permission"
import { FACE_ISSUE_MESSAGE, toError } from "../messages"
import { CapturedGesture, LivenessResult, toCapturedImage } from "../types"

interface TVLivenessStep {
  name: string
  image: { blob: Blob }
}

interface TVLivenessDoneResult {
  frontalFaces: Blob[]
  steps: TVLivenessStep[]
  capturedFrames?: unknown[]
  apiCheckPassed?: boolean
}

interface TVWebSDKInstance {
  livenessDetection(config: Record<string, unknown>): void
  initNativeCamera(): void
  destroyView(): void
}

declare global {
  interface Window {
    TVWebSDK?: {
      SDK: new (options: Record<string, unknown>) => TVWebSDKInstance
    }
  }
}

const config = LIVENESS_CONFIG.tvweb

const CUSTOM_ERRORS = Object.fromEntries(
  Object.entries(FACE_ISSUE_MESSAGE).map(([code, vi]) => [
    code,
    { code, msg: { vi, en: vi } },
  ])
)

let scriptPromise: Promise<void> | null = null

function loadSdkScript() {
  if (window.TVWebSDK) return Promise.resolve()
  scriptPromise ??= new Promise<void>((resolve, reject) => {
    const script = document.createElement("script")
    script.src = config.sdkUrl
    script.async = true
    script.onload = () =>
      window.TVWebSDK ? resolve() : reject(new Error("SDK not found"))
    script.onerror = () => reject(new Error("SDK load failed"))
    document.body.appendChild(script)
  }).catch(() => {
    scriptPromise = null
    throw new Error("Không tải được, kiểm tra mạng rồi thử lại.")
  })
  return scriptPromise
}

export interface TVLivenessHandle {
  promise: Promise<LivenessResult>
  cancel: () => void
}

export function runTVLiveness(container: HTMLElement): TVLivenessHandle {
  let sdk: TVWebSDKInstance | null = null
  let cancelled = false
  let timer: ReturnType<typeof setTimeout> | undefined

  const destroy = () => {
    clearTimeout(timer)
    try {
      sdk?.destroyView()
    } catch {
      // view đã bị SDK tự hủy
    }
    sdk = null
  }

  const promise = (async () => {
    await loadSdkScript()
    if (cancelled) throw new Error("cancelled")
    const startedAt = performance.now()

    return new Promise<LivenessResult>((resolve, reject) => {
      sdk = new window.TVWebSDK!.SDK({
        container,
        lang: "vi",
        enableAntiDebug: false,
        assetRoot: config.assetRoot,
        ...(config.resourceRoot
          ? { resourceRoot: config.resourceRoot }
          : {
              customUrls: {
                blazefaceModelUrl: `${window.location.origin}${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}${config.blazefaceModelPath}`,
              },
            }),
      })
      sdk.initNativeCamera()

      timer = setTimeout(() => {
        destroy()
        reject(new Error("Hết thời gian, vui lòng thử lại."))
      }, config.timeoutMs)

      sdk.livenessDetection({
        mode: "active",
        // apiCheck=false: chỉ thu ảnh, việc chấm thật/giả để backend làm
        apiCheck: false,
        // Mặc định bật tracking nhưng không có key → console.error liên tục
        logCredentials: { enable: false },
        frontCamera: true,
        captureFrameSettings: {
          enable: true,
          framesIntervalTime: 180,
          framesBatchLength: 15,
        },
        customErrors: CUSTOM_ERRORS,
        onLivenessDetectionDone: (result: TVLivenessDoneResult) => {
          destroy()
          const gestures: CapturedGesture[] = (result.steps ?? []).map((s) => ({
            name: s.name,
            image: toCapturedImage(s.image.blob),
          }))
          resolve({
            engine: "tvweb",
            frontal: (result.frontalFaces ?? []).map(toCapturedImage),
            gestures,
            frameCount: result.capturedFrames?.length ?? 0,
            durationMs: Math.round(performance.now() - startedAt),
          })
        },
        onError: (e: unknown) => {
          destroy()
          toCameraAccessError(e).then((err) => reject(err ?? toError(e)))
        },
      })
    })
  })()

  return {
    promise,
    cancel: () => {
      cancelled = true
      destroy()
    },
  }
}
