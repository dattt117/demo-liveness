import { GestureName } from "./types"

export type FaceIssue =
  | "no_face"
  | "multiple_faces"
  | "face_too_small"
  | "face_too_large"
  | "face_out_of_box"

export const FACE_ISSUE_MESSAGE: Record<FaceIssue, string> = {
  no_face: "Chưa thấy khuôn mặt",
  multiple_faces: "Chỉ để một người trong khung",
  face_too_small: "Đưa mặt lại gần hơn",
  face_too_large: "Lùi ra xa một chút",
  face_out_of_box: "Đưa mặt vào giữa khung",
}

export const GESTURE_INSTRUCTION: Record<GestureName, string> = {
  frontal: "Nhìn thẳng",
  blink: "Chớp mắt",
  turn_left: "Quay sang trái",
  turn_right: "Quay sang phải",
  smile: "Mỉm cười",
}

// Tên bước của TVWebSDK
const TV_STEP_LABEL: Record<string, string> = {
  frontal: "Nhìn thẳng",
  left: "Quay trái",
  right: "Quay phải",
  up: "Ngẩng lên",
  down: "Cúi xuống",
}

export function gestureLabel(name: string) {
  return GESTURE_INSTRUCTION[name as GestureName] ?? TV_STEP_LABEL[name] ?? name
}

export function toError(e: unknown): Error {
  return e instanceof Error && e.message
    ? e
    : new Error("Đã có lỗi, vui lòng thử lại.")
}
