import { GestureName } from "../types"
import { FaceMetrics } from "./analyze"

interface ChallengeRule {
  holdFrames: number
  strictCenter: boolean
  passed: (m: FaceMetrics) => boolean
}

export const CHALLENGE_RULES: Record<GestureName, ChallengeRule> = {
  frontal: {
    holdFrames: 12,
    strictCenter: true,
    passed: (m) => Math.abs(m.yaw - 0.5) < 0.08 && m.blink < 0.35,
  },
  blink: {
    holdFrames: 2,
    strictCenter: false,
    passed: (m) => m.blink > 0.5,
  },
  turn_left: {
    holdFrames: 4,
    strictCenter: false,
    passed: (m) => m.yaw > 0.7,
  },
  turn_right: {
    holdFrames: 4,
    strictCenter: false,
    passed: (m) => m.yaw < 0.3,
  },
  smile: {
    holdFrames: 4,
    strictCenter: false,
    passed: (m) => m.smile > 0.6,
  },
}

const RANDOM_POOL: GestureName[] = ["blink", "turn_left", "turn_right", "smile"]

export function buildChallengeSequence(count: number): GestureName[] {
  const pool = [...RANDOM_POOL]
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[pool[i], pool[j]] = [pool[j], pool[i]]
  }
  return ["frontal", ...pool.slice(0, Math.min(count, pool.length))]
}
