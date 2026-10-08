"use client"

import { useMemo } from "react"
import { CheckIcon, ChevronDownIcon, CopyIcon } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { LivenessResult } from "@/lib/liveness/types"

function describeBlob(blob: Blob) {
  const kb = blob.size / 1024
  const size =
    kb > 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${kb.toFixed(1)} KB`
  return `${blob.type || "image"} · ${size}`
}

// Ảnh hiển thị dạng "type · size" thay vì base64 cho dễ đọc
function summarize(result: LivenessResult) {
  return {
    engine: result.engine,
    durationMs: result.durationMs,
    frontal: result.frontal.map((img) => describeBlob(img.blob)),
    gesture: result.gestures.map((g) => ({
      gesture: g.name,
      image: describeBlob(g.image.blob),
    })),
    ...(result.frames.length > 0 && {
      videos: { frames: result.frames.length, intervalMs: 180 },
    }),
  }
}

const TOKEN =
  /("(?:\\.|[^"\\])*")(\s*:)?|\b(true|false|null)\b|(-?\d+(?:\.\d+)?)/g

function highlight(json: string) {
  const parts: React.ReactNode[] = []
  let last = 0
  for (const m of json.matchAll(TOKEN)) {
    parts.push(json.slice(last, m.index))
    const [text, str, colon, literal, num] = m
    const className = str
      ? colon
        ? "text-sky-600 dark:text-sky-400"
        : "text-emerald-600 dark:text-emerald-400"
      : literal
        ? "text-violet-600 dark:text-violet-400"
        : num
          ? "text-amber-600 dark:text-amber-400"
          : undefined
    parts.push(
      <span key={m.index} className={className}>
        {str ?? text}
      </span>
    )
    if (colon) parts.push(colon)
    last = m.index + text.length
  }
  parts.push(json.slice(last))
  return parts
}

export function ResponsePreview({ result }: { result: LivenessResult }) {
  const json = useMemo(
    () => JSON.stringify(summarize(result), null, 2),
    [result]
  )

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(json)
      toast.success("Đã copy", { icon: <CheckIcon className="size-4" /> })
    } catch {
      toast.error("Không copy được")
    }
  }

  return (
    <details className="group w-full overflow-hidden rounded-2xl border text-left">
      <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-sm font-medium select-none [&::-webkit-details-marker]:hidden">
        Dữ liệu trả về
        <ChevronDownIcon className="size-4 text-muted-foreground transition-transform group-open:rotate-180" />
      </summary>
      <div className="relative border-t bg-muted/40">
        <Button
          size="icon-sm"
          variant="ghost"
          className="absolute top-2 right-2"
          aria-label="Copy"
          onClick={copy}
        >
          <CopyIcon />
        </Button>
        <pre className="max-h-72 overflow-auto p-4 font-mono text-xs leading-relaxed">
          {highlight(json)}
        </pre>
      </div>
    </details>
  )
}
