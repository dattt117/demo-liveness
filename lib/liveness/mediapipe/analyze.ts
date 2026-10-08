import type { FaceLandmarkerResult } from "@mediapipe/tasks-vision"

import { FaceIssue } from "../messages"

export interface FaceBox {
  x: number
  y: number
  width: number
  height: number
}

export interface FaceMetrics {
  box: FaceBox
  // ~0.5 là nhìn thẳng; quay sang trái (của người dùng) thì yaw tăng
  yaw: number
  blink: number
  smile: number
}

export type FaceAnalysis =
  | { ok: true; metrics: FaceMetrics }
  | { ok: false; issue: FaceIssue; metrics?: FaceMetrics }

const NOSE_TIP = 1
const CHEEK_RIGHT_EDGE = 234 // phía trái ảnh
const CHEEK_LEFT_EDGE = 454 // phía phải ảnh

const MIN_FACE_WIDTH = 0.22
const MAX_FACE_WIDTH = 0.75
const MAX_CENTER_OFFSET_X = 0.18
const MAX_CENTER_OFFSET_Y = 0.22

function blendshape(result: FaceLandmarkerResult, name: string) {
  const categories = result.faceBlendshapes?.[0]?.categories ?? []
  return categories.find((c) => c.categoryName === name)?.score ?? 0
}

export function analyzeFace(
  result: FaceLandmarkerResult,
  { strictCenter }: { strictCenter: boolean }
): FaceAnalysis {
  const faces = result.faceLandmarks ?? []
  if (faces.length === 0) return { ok: false, issue: "no_face" }
  if (faces.length > 1) return { ok: false, issue: "multiple_faces" }

  const points = faces[0]
  let minX = 1
  let minY = 1
  let maxX = 0
  let maxY = 0
  for (const p of points) {
    minX = Math.min(minX, p.x)
    minY = Math.min(minY, p.y)
    maxX = Math.max(maxX, p.x)
    maxY = Math.max(maxY, p.y)
  }
  const box = { x: minX, y: minY, width: maxX - minX, height: maxY - minY }

  const left = points[CHEEK_RIGHT_EDGE].x
  const right = points[CHEEK_LEFT_EDGE].x
  const span = right - left
  const yaw = span > 0 ? (points[NOSE_TIP].x - left) / span : 0.5

  const metrics: FaceMetrics = {
    box,
    yaw,
    blink:
      (blendshape(result, "eyeBlinkLeft") +
        blendshape(result, "eyeBlinkRight")) /
      2,
    smile:
      (blendshape(result, "mouthSmileLeft") +
        blendshape(result, "mouthSmileRight")) /
      2,
  }

  if (box.width < MIN_FACE_WIDTH)
    return { ok: false, issue: "face_too_small", metrics }
  if (box.width > MAX_FACE_WIDTH)
    return { ok: false, issue: "face_too_large", metrics }

  const outOfFrame = minX < 0 || minY < 0 || maxX > 1 || maxY > 1
  const cx = box.x + box.width / 2
  const cy = box.y + box.height / 2
  const offCenter =
    Math.abs(cx - 0.5) > MAX_CENTER_OFFSET_X ||
    Math.abs(cy - 0.5) > MAX_CENTER_OFFSET_Y
  if (outOfFrame || (strictCenter && offCenter))
    return { ok: false, issue: "face_out_of_box", metrics }

  return { ok: true, metrics }
}
