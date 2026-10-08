"use client"

import { useEffect, useMemo, useState } from "react"
import { PauseIcon, PlayIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { CapturedFrame } from "@/lib/liveness/types"

const FRAME_MS = 180

export function FramePlayer({ frames }: { frames: CapturedFrame[] }) {
  const sources = useMemo(
    () => frames.map((f) => `data:image/jpeg;base64,${f.base64}`),
    [frames]
  )
  const [index, setIndex] = useState(0)
  const [playing, setPlaying] = useState(true)

  useEffect(() => {
    if (!playing) return
    const id = setInterval(
      () => setIndex((i) => (i + 1) % sources.length),
      FRAME_MS
    )
    return () => clearInterval(id)
  }, [playing, sources.length])

  return (
    <div className="overflow-hidden rounded-2xl border bg-black">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={sources[index]}
        alt={`Frame ${index + 1}`}
        className="aspect-4/3 w-full object-contain"
      />
      <div className="flex items-center gap-3 bg-card px-3 py-2">
        <Button
          size="icon-sm"
          variant="ghost"
          aria-label={playing ? "Tạm dừng" : "Phát"}
          onClick={() => setPlaying((p) => !p)}
        >
          {playing ? <PauseIcon /> : <PlayIcon />}
        </Button>
        <Slider
          value={[index]}
          max={sources.length - 1}
          step={1}
          onValueChange={([v]) => {
            setPlaying(false)
            setIndex(v)
          }}
          className="flex-1"
        />
        <span className="w-14 text-right font-mono text-xs text-muted-foreground tabular-nums">
          {index + 1}/{sources.length}
        </span>
      </div>
    </div>
  )
}
