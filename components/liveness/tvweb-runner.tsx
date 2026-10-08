"use client"

import { useEffect, useEffectEvent, useRef, useState } from "react"
import { XIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { runTVLiveness } from "@/lib/liveness/tvweb/sdk"
import { RunnerProps } from "@/lib/liveness/types"

export function TVWebRunner({ onDone, onError, onCancel }: RunnerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [loading, setLoading] = useState(true)

  const handleDone = useEffectEvent(onDone)
  const handleError = useEffectEvent(onError)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    let cancelled = false

    const observer = new MutationObserver(() => {
      if (container.childElementCount > 0) setLoading(false)
    })
    observer.observe(container, { childList: true })

    const handle = runTVLiveness(container)
    handle.promise
      .then((result) => !cancelled && handleDone(result))
      .catch((e: Error) => !cancelled && handleError(e))

    return () => {
      cancelled = true
      observer.disconnect()
      handle.cancel()
    }
  }, [])

  return (
    <div className="flex flex-col gap-4">
      <div className="relative mx-auto min-h-[480px] w-full max-w-2xl overflow-hidden rounded-2xl border bg-black">
        <div ref={containerRef} className="size-full" />
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center gap-2 text-sm text-white">
            <Spinner /> Đang mở camera…
          </div>
        )}
      </div>
      <Button variant="outline" className="mx-auto" onClick={onCancel}>
        <XIcon /> Hủy
      </Button>
    </div>
  )
}
