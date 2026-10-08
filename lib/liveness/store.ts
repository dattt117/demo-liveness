import { create } from "zustand"

import { CameraAccessError, CameraAccessReason } from "./camera-permission"
import { EngineId, LivenessResult, revokeResult } from "./types"

export type LivenessPhase =
  "guide" | "permission" | "running" | "result" | "error"

interface LivenessState {
  engine: EngineId
  phase: LivenessPhase
  result: LivenessResult | null
  error: string | null
  cameraIssue: CameraAccessReason | null
  setEngine: (engine: EngineId) => void
  start: () => void
  finish: (result: LivenessResult) => void
  fail: (error: Error) => void
  reset: () => void
}

export const useLivenessStore = create<LivenessState>((set, get) => ({
  engine: "mediapipe",
  phase: "guide",
  result: null,
  error: null,
  cameraIssue: null,
  setEngine: (engine) => {
    if (get().phase === "running") return
    revokeResult(get().result)
    set({
      engine,
      phase: "guide",
      result: null,
      error: null,
      cameraIssue: null,
    })
  },
  start: () => {
    revokeResult(get().result)
    set({ phase: "running", result: null, error: null, cameraIssue: null })
  },
  finish: (result) => set({ phase: "result", result }),
  fail: (error) =>
    error instanceof CameraAccessError
      ? set({ phase: "permission", cameraIssue: error.reason })
      : set({ phase: "error", error: error.message || "Có lỗi xảy ra" }),
  reset: () => {
    revokeResult(get().result)
    set({ phase: "guide", result: null, error: null, cameraIssue: null })
  },
}))
