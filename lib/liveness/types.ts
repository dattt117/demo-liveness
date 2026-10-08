export type EngineId = "mediapipe" | "tvweb"

export type GestureName =
  "frontal" | "blink" | "turn_left" | "turn_right" | "smile"

export interface CapturedImage {
  blob: Blob
  url: string
}

export interface CapturedGesture {
  name: GestureName | string
  image: CapturedImage
}

export interface LivenessResult {
  engine: EngineId
  frontal: CapturedImage[]
  gestures: CapturedGesture[]
  frameCount: number
  durationMs: number
}

// Cùng format với useCamera bên onboarding PVCB
export interface LivenessPayload {
  frontal: string[]
  gesture: { base64: string; gesture: string }[]
}

export interface RunnerProps {
  onDone: (result: LivenessResult) => void
  onError: (error: Error) => void
  onCancel: () => void
}

export function toCapturedImage(blob: Blob): CapturedImage {
  return { blob, url: URL.createObjectURL(blob) }
}

export function revokeResult(result: LivenessResult | null) {
  if (!result) return
  result.frontal.forEach((img) => URL.revokeObjectURL(img.url))
  result.gestures.forEach((g) => URL.revokeObjectURL(g.image.url))
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result).split(",")[1] ?? "")
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(blob)
  })
}

export async function toPayload(
  result: LivenessResult
): Promise<LivenessPayload> {
  const [frontal, gesture] = await Promise.all([
    Promise.all(result.frontal.map((img) => blobToBase64(img.blob))),
    Promise.all(
      result.gestures.map(async (g) => ({
        base64: await blobToBase64(g.image.blob),
        gesture: g.name,
      }))
    ),
  ])
  return { frontal, gesture }
}
