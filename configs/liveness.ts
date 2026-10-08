const MEDIAPIPE_VERSION = "1.1.0"
const TVWEB_SDK_VERSION = "5.13.6"

const LIVENESS_CONFIG = {
  mediapipe: {
    wasmRoot:
      process.env.NEXT_PUBLIC_MEDIAPIPE_WASM_ROOT ||
      `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${MEDIAPIPE_VERSION}/wasm`,
    modelUrl:
      process.env.NEXT_PUBLIC_MEDIAPIPE_FACE_MODEL_URL ||
      "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
    challengeCount: 3,
    stepTimeoutMs: 10_000,
    totalTimeoutMs: 45_000,
  },
  tvweb: {
    sdkUrl:
      process.env.NEXT_PUBLIC_TVWEB_SDK_URL ||
      `https://unpkg.com/@tsocial/tvweb-sdk@${TVWEB_SDK_VERSION}/build/tvweb-sdk.standalone.min.js`,
    // SDK mặc định dùng assets @latest, lệch version
    assetRoot:
      process.env.NEXT_PUBLIC_TVWEB_ASSET_ROOT ||
      `https://unpkg.com/@tsocial/tvweb-sdk@${TVWEB_SDK_VERSION}/assets`,
    resourceRoot: process.env.NEXT_PUBLIC_TVWEB_RESOURCE_ROOT || undefined,
    // URL blazeface mặc định của SDK đã trả 403, tự host trong public/
    blazefaceModelPath: "/models/blazeface/model.json",
    timeoutMs: 60_000,
  },
} as const

export default LIVENESS_CONFIG
