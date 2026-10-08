"use client"

import { useEffect, useEffectEvent, useRef, useState } from "react"
import { CheckIcon, XIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Spinner } from "@/components/ui/spinner"
import LIVENESS_CONFIG from "@/configs/liveness"
import {
  LivenessSession,
  SessionSnapshot,
} from "@/lib/liveness/mediapipe/session"
import { openFrontCamera } from "@/lib/liveness/camera-permission"
import {
  FACE_ISSUE_MESSAGE,
  GESTURE_INSTRUCTION,
  toError,
} from "@/lib/liveness/messages"
import { RunnerProps } from "@/lib/liveness/types"
import { cn } from "@/lib/utils"

export function MediapipeRunner({ onDone, onError, onCancel }: RunnerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [snapshot, setSnapshot] = useState<SessionSnapshot | null>(null)

  const handleDone = useEffectEvent(onDone)
  const handleError = useEffectEvent((e: unknown) => onError(toError(e)))

  useEffect(() => {
    let cancelled = false
    let stream: MediaStream | null = null
    let session: LivenessSession | null = null

    ;(async () => {
      try {
        stream = await openFrontCamera()
        const video = videoRef.current
        if (cancelled || !video) return
        video.srcObject = stream
        await video.play()
        if (cancelled) return

        session = new LivenessSession(video, setSnapshot)
        const result = await session.run()
        if (!cancelled) handleDone(result)
      } catch (e) {
        if (!cancelled) handleError(e)
      }
    })()

    return () => {
      cancelled = true
      session?.dispose()
      stream?.getTracks().forEach((t) => t.stop())
    }
  }, [])

  const loading = !snapshot || snapshot.status === "loading"
  const step = snapshot?.steps[snapshot.stepIndex]
  const passed = snapshot?.status === "step-passed"
  const issue = snapshot?.issue
  const ovalTone = passed
    ? "stroke-emerald-500"
    : issue
      ? "stroke-amber-400"
      : "stroke-white"

  return (
    <div className="flex flex-col gap-4">
      <div className="relative mx-auto aspect-3/4 w-full max-w-md overflow-hidden rounded-2xl bg-black sm:aspect-4/3 sm:max-w-2xl">
        <video
          ref={videoRef}
          className="size-full -scale-x-100 object-cover"
          playsInline
          muted
        />

        <svg
          className="pointer-events-none absolute inset-0 size-full"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          <defs>
            <mask id="oval-mask">
              <rect width="100" height="100" fill="white" />
              <ellipse cx="50" cy="47" rx="27" ry="36" fill="black" />
            </mask>
          </defs>
          <rect
            width="100"
            height="100"
            className="fill-black/55"
            mask="url(#oval-mask)"
          />
          <ellipse
            cx="50"
            cy="47"
            rx="27"
            ry="36"
            fill="none"
            vectorEffect="non-scaling-stroke"
            className={cn("[stroke-width:3px] transition-colors", ovalTone)}
          />
        </svg>

        {snapshot && (
          <div className="absolute inset-x-0 top-0 flex justify-center gap-1.5 p-3">
            {snapshot.steps.map((s, i) => (
              <span
                key={s}
                className={cn(
                  "flex h-7 items-center gap-1 rounded-full px-2.5 text-xs font-medium backdrop-blur",
                  i < snapshot.stepIndex || (i === snapshot.stepIndex && passed)
                    ? "bg-emerald-500/90 text-white"
                    : i === snapshot.stepIndex
                      ? "bg-white text-black"
                      : "bg-white/20 text-white"
                )}
              >
                {(i < snapshot.stepIndex ||
                  (i === snapshot.stepIndex && passed)) && (
                  <CheckIcon className="size-3.5" />
                )}
                {i + 1}
              </span>
            ))}
          </div>
        )}

        <div className="absolute inset-x-0 bottom-0 flex flex-col items-center gap-2 bg-linear-to-t from-black/80 to-transparent p-4 pt-10 text-center text-white">
          {loading ? (
            <p className="flex items-center gap-2 text-sm">
              <Spinner /> Đang mở camera…
            </p>
          ) : (
            <>
              <p className="text-xl font-semibold">
                {passed ? "Tốt lắm" : step && GESTURE_INSTRUCTION[step]}
              </p>
              <p
                className={cn(
                  "min-h-5 text-sm",
                  issue ? "text-amber-300" : "text-white/70"
                )}
              >
                {issue ? FACE_ISSUE_MESSAGE[issue] : "Giữ mặt trong khung"}
              </p>
              <Progress
                className="h-1 w-40 bg-white/20"
                value={
                  ((snapshot?.stepRemainingMs ?? 0) /
                    LIVENESS_CONFIG.mediapipe.stepTimeoutMs) *
                  100
                }
              />
            </>
          )}
        </div>
      </div>

      <Button variant="outline" className="mx-auto" onClick={onCancel}>
        <XIcon /> Hủy
      </Button>
    </div>
  )
}
