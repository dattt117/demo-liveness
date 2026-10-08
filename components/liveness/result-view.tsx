"use client"

import { useState } from "react"
import { CircleCheckIcon, DownloadIcon, RotateCcwIcon } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { gestureLabel } from "@/lib/liveness/messages"
import { CapturedImage, LivenessResult, toPayload } from "@/lib/liveness/types"
import { cn } from "@/lib/utils"

import { StatusScreen } from "./status-screen"

function Shot({
  image,
  label,
  mirrored,
}: {
  image: CapturedImage
  label: string
  mirrored: boolean
}) {
  return (
    <figure className="space-y-1.5">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={image.url}
        alt={label}
        className={cn(
          "aspect-3/4 w-full rounded-xl bg-muted object-cover",
          mirrored && "-scale-x-100"
        )}
      />
      <figcaption className="text-xs text-muted-foreground">{label}</figcaption>
    </figure>
  )
}

export function ResultView({
  result,
  onRetry,
}: {
  result: LivenessResult
  onRetry: () => void
}) {
  const [exporting, setExporting] = useState(false)
  const mirrored = result.engine === "mediapipe"

  const download = async () => {
    setExporting(true)
    try {
      const payload = await toPayload(result)
      const url = URL.createObjectURL(
        new Blob([JSON.stringify(payload, null, 2)], {
          type: "application/json",
        })
      )
      const a = document.createElement("a")
      a.href = url
      a.download = `liveness-${result.engine}-${Date.now()}.json`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      toast.error("Không tải được dữ liệu")
    } finally {
      setExporting(false)
    }
  }

  return (
    <StatusScreen
      icon={CircleCheckIcon}
      tone="success"
      title="Xác thực thành công"
      description={`Hoàn tất trong ${(result.durationMs / 1000).toFixed(1)} giây`}
      actions={
        <>
          <Button variant="outline" onClick={download} disabled={exporting}>
            <DownloadIcon /> Tải dữ liệu
          </Button>
          <Button onClick={onRetry}>
            <RotateCcwIcon /> Làm lại
          </Button>
        </>
      }
    >
      <div className="grid w-full grid-cols-3 gap-2">
        {result.frontal.map((img) => (
          <Shot
            key={img.url}
            image={img}
            label="Nhìn thẳng"
            mirrored={mirrored}
          />
        ))}
        {result.gestures.map((g) => (
          <Shot
            key={g.image.url}
            image={g.image}
            label={gestureLabel(g.name)}
            mirrored={mirrored}
          />
        ))}
      </div>
    </StatusScreen>
  )
}
