"use client"

import { useState } from "react"
import {
  ArrowDownIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  ArrowUpIcon,
  CircleCheckIcon,
  ClockIcon,
  DownloadIcon,
  EyeIcon,
  FilmIcon,
  ImagesIcon,
  RotateCcwIcon,
  ScanFaceIcon,
  SmileIcon,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { gestureLabel } from "@/lib/liveness/messages"
import { CapturedImage, LivenessResult, toPayload } from "@/lib/liveness/types"
import { cn } from "@/lib/utils"

import { FramePlayer } from "./frame-player"
import { ResponsePreview } from "./response-preview"
import { StatusScreen } from "./status-screen"

const GESTURE_ICON: Record<string, React.ElementType> = {
  frontal: ScanFaceIcon,
  blink: EyeIcon,
  smile: SmileIcon,
  turn_left: ArrowLeftIcon,
  left: ArrowLeftIcon,
  turn_right: ArrowRightIcon,
  right: ArrowRightIcon,
  up: ArrowUpIcon,
  down: ArrowDownIcon,
}

interface Shot {
  key: string
  name: string
  image: CapturedImage
}

function ShotTile({
  shot,
  mirrored,
  large,
  onOpen,
}: {
  shot: Shot
  mirrored: boolean
  large?: boolean
  onOpen: () => void
}) {
  const Icon = GESTURE_ICON[shot.name] ?? CircleCheckIcon
  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn(
        "group relative overflow-hidden rounded-2xl bg-muted outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
        large ? "aspect-4/3 w-full" : "aspect-square"
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={shot.image.url}
        alt={gestureLabel(shot.name)}
        className={cn(
          "size-full object-cover transition-transform duration-300 group-hover:scale-105",
          mirrored && "-scale-x-100 group-hover:-scale-x-105"
        )}
      />
      <span
        className={cn(
          "absolute flex items-center gap-1 rounded-full bg-black/60 font-medium text-white backdrop-blur",
          large
            ? "bottom-3 left-3 px-3 py-1.5 text-sm"
            : "bottom-1.5 left-1.5 px-2 py-1 text-[11px]"
        )}
      >
        <Icon className={large ? "size-4" : "size-3"} />
        {gestureLabel(shot.name)}
      </span>
    </button>
  )
}

function Stat({
  icon: Icon,
  children,
}: {
  icon: React.ElementType
  children: React.ReactNode
}) {
  return (
    <span className="flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
      <Icon className="size-3.5" />
      {children}
    </span>
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
  const [opened, setOpened] = useState<Shot | null>(null)
  // Ảnh MediaPipe chụp từ frame gốc, lật lại cho giống lúc soi camera
  const mirrored = result.engine === "mediapipe"

  const shots: Shot[] = [
    ...result.frontal.map((image) => ({
      key: image.url,
      name: "frontal",
      image,
    })),
    ...result.gestures.map((g) => ({
      key: g.image.url,
      name: g.name,
      image: g.image,
    })),
  ]
  const [hero, ...rest] = shots

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
      <div className="-mt-2 flex flex-wrap justify-center gap-2">
        <Stat icon={ClockIcon}>
          {(result.durationMs / 1000).toFixed(1)} giây
        </Stat>
        <Stat icon={ImagesIcon}>{shots.length} ảnh</Stat>
        {result.frames.length > 0 && (
          <Stat icon={FilmIcon}>{result.frames.length} frame</Stat>
        )}
      </div>

      {hero && (
        <div className="flex w-full flex-col gap-2">
          <ShotTile
            shot={hero}
            mirrored={mirrored}
            large
            onOpen={() => setOpened(hero)}
          />
          {rest.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {rest.map((shot) => (
                <ShotTile
                  key={shot.key}
                  shot={shot}
                  mirrored={mirrored}
                  onOpen={() => setOpened(shot)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {result.frames.length > 0 && (
        <div className="flex w-full flex-col gap-2 text-left">
          <h3 className="text-sm font-medium">Video ghi lại</h3>
          <FramePlayer frames={result.frames} />
        </div>
      )}

      <ResponsePreview result={result} />

      <Dialog open={!!opened} onOpenChange={(open) => !open && setOpened(null)}>
        <DialogContent className="max-w-lg overflow-hidden p-0">
          <DialogTitle className="px-5 pt-5">
            {opened && gestureLabel(opened.name)}
          </DialogTitle>
          {opened && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={opened.image.url}
              alt={gestureLabel(opened.name)}
              className={cn(
                "max-h-[75vh] w-full bg-black object-contain",
                mirrored && "-scale-x-100"
              )}
            />
          )}
        </DialogContent>
      </Dialog>
    </StatusScreen>
  )
}
