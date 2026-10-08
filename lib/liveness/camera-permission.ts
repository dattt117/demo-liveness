// Popup bị đóng (state "prompt") thì xin lại được; đã chặn ("denied") thì
// chỉ có thể hướng dẫn mở trong cài đặt.

export type CameraPermissionState = "granted" | "prompt" | "denied" | "unknown"

export type CameraAccessReason =
  | "denied" // từ chối nhưng còn xin lại được
  | "blocked" // đã chặn, phải mở trong cài đặt trình duyệt
  | "not_found"
  | "in_use"
  | "not_supported"
  | "insecure"

export const CAMERA_ACCESS_MESSAGE: Record<CameraAccessReason, string> = {
  denied: "Cần camera để chụp ảnh khuôn mặt của bạn.",
  blocked: "Bật lại theo các bước sau:",
  not_found: "Không tìm thấy camera trên thiết bị.",
  in_use:
    "Camera đang bị ứng dụng khác sử dụng. Hãy tắt ứng dụng đó rồi thử lại.",
  not_supported:
    "Trình duyệt này không dùng được camera. Hãy mở bằng Chrome hoặc Safari.",
  insecure: "Trang cần mở bằng https:// để dùng camera.",
}

export class CameraAccessError extends Error {
  constructor(readonly reason: CameraAccessReason) {
    super(CAMERA_ACCESS_MESSAGE[reason])
    this.name = "CameraAccessError"
  }
}

// Bị từ chối ngay (không kịp hiện popup) = đã chặn sẵn, giống heuristic của TVWebSDK
const INSTANT_DENY_MS = 1600

export async function getCameraPermissionStatus(): Promise<PermissionStatus | null> {
  try {
    return await navigator.permissions.query({
      name: "camera" as PermissionName,
    })
  } catch {
    return null
  }
}

export async function getCameraPermissionState(): Promise<CameraPermissionState> {
  const status = await getCameraPermissionStatus()
  return (status?.state as CameraPermissionState) ?? "unknown"
}

async function resolveNotAllowed(elapsedMs?: number) {
  const state = await getCameraPermissionState()
  if (state === "denied") return "blocked"
  if (state === "prompt") return "denied"
  return elapsedMs !== undefined && elapsedMs < INSTANT_DENY_MS
    ? "blocked"
    : "denied"
}

export async function toCameraAccessError(
  e: unknown,
  elapsedMs?: number
): Promise<CameraAccessError | null> {
  if (e instanceof CameraAccessError) return e
  const err = e as { name?: string; code?: string } | undefined
  switch (err?.name ?? err?.code) {
    case "NotAllowedError":
    case "PermissionDeniedError":
    case "no_permission":
      return new CameraAccessError(await resolveNotAllowed(elapsedMs))
    case "SecurityError":
      return new CameraAccessError(
        window.isSecureContext ? "blocked" : "insecure"
      )
    case "NotFoundError":
    case "DevicesNotFoundError":
    case "OverconstrainedError":
      return new CameraAccessError("not_found")
    case "NotReadableError":
    case "TrackStartError":
    case "AbortError":
      return new CameraAccessError("in_use")
    case "not_supported":
      return new CameraAccessError("not_supported")
    default:
      return null
  }
}

export async function openFrontCamera(): Promise<MediaStream> {
  if (!window.isSecureContext) throw new CameraAccessError("insecure")
  if (!navigator.mediaDevices?.getUserMedia)
    throw new CameraAccessError("not_supported")

  const startedAt = performance.now()
  try {
    return await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: {
        facingMode: "user",
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
    })
  } catch (e) {
    throw (await toCameraAccessError(e, performance.now() - startedAt)) ?? e
  }
}

export async function requestCameraAccess(): Promise<void> {
  if ((await getCameraPermissionState()) === "granted") return
  const stream = await openFrontCamera()
  stream.getTracks().forEach((t) => t.stop())
}
