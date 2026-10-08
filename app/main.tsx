"use client"

import { useState } from "react"
import { CircleXIcon, RotateCcwIcon, ScanFaceIcon } from "lucide-react"
import { match } from "ts-pattern"

import { CameraPermissionPanel } from "@/components/liveness/camera-permission-panel"
import { LivenessGuide } from "@/components/liveness/guide"
import { MediapipeRunner } from "@/components/liveness/mediapipe-runner"
import { ResultView } from "@/components/liveness/result-view"
import { StatusScreen } from "@/components/liveness/status-screen"
import { TVWebRunner } from "@/components/liveness/tvweb-runner"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { requestCameraAccess } from "@/lib/liveness/camera-permission"
import { toError } from "@/lib/liveness/messages"
import { useLivenessStore } from "@/lib/liveness/store"
import { EngineId, RunnerProps } from "@/lib/liveness/types"

const ENGINES: Record<
  EngineId,
  { label: string; Runner: React.FC<RunnerProps> }
> = {
  mediapipe: { label: "MediaPipe", Runner: MediapipeRunner },
  tvweb: { label: "TVWebSDK", Runner: TVWebRunner },
}

export default function LivenessMain() {
  const {
    engine,
    phase,
    result,
    error,
    cameraIssue,
    setEngine,
    start,
    finish,
    fail,
    reset,
  } = useLivenessStore()
  const [starting, setStarting] = useState(false)
  const { Runner } = ENGINES[engine]

  const begin = async () => {
    setStarting(true)
    try {
      await requestCameraAccess()
      start()
    } catch (e) {
      fail(toError(e))
    } finally {
      setStarting(false)
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-5 px-4 py-5 sm:py-10">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <ScanFaceIcon className="size-5" />
          </div>
          <span className="font-semibold">Liveness Demo</span>
        </div>
        <ThemeToggle />
      </header>

      <Tabs value={engine} onValueChange={(v) => setEngine(v as EngineId)}>
        <TabsList className="w-full">
          {(Object.keys(ENGINES) as EngineId[]).map((id) => (
            <TabsTrigger key={id} value={id} disabled={phase === "running"}>
              {ENGINES[id].label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <section className="rounded-3xl border bg-card p-5 shadow-sm sm:p-8">
        {match(phase)
          .with("guide", () => (
            <LivenessGuide starting={starting} onStart={begin} />
          ))
          .with("permission", () => (
            <CameraPermissionPanel
              reason={cameraIssue ?? "denied"}
              onGranted={start}
              onBack={reset}
            />
          ))
          .with("running", () => (
            <Runner
              key={engine}
              onDone={finish}
              onError={fail}
              onCancel={reset}
            />
          ))
          .with("result", () =>
            result ? <ResultView result={result} onRetry={begin} /> : null
          )
          .with("error", () => (
            <StatusScreen
              icon={CircleXIcon}
              tone="danger"
              title="Chưa xác thực được"
              description={error}
              actions={
                <>
                  <Button variant="ghost" onClick={reset}>
                    Quay lại
                  </Button>
                  <Button onClick={begin} disabled={starting}>
                    <RotateCcwIcon /> Thử lại
                  </Button>
                </>
              }
            />
          ))
          .exhaustive()}
      </section>
    </main>
  )
}
