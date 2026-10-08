"use client"

import {
  CameraIcon,
  CircleCheckIcon,
  GlassesIcon,
  ScanFaceIcon,
  ShieldAlertIcon,
  SunIcon,
  VenetianMaskIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { useCameraPermission } from "@/hooks/use-camera-permission"

import { StatusScreen } from "./status-screen"

const TIPS = [
  { icon: SunIcon, text: "Đủ ánh sáng" },
  { icon: GlassesIcon, text: "Bỏ kính, mũ" },
  { icon: VenetianMaskIcon, text: "Không che mặt" },
]

export function LivenessGuide({
  starting,
  onStart,
}: {
  starting: boolean
  onStart: () => void
}) {
  const permission = useCameraPermission()

  return (
    <StatusScreen
      icon={ScanFaceIcon}
      title="Xác thực khuôn mặt"
      description="Làm theo hướng dẫn trên màn hình, chỉ mất vài giây."
      actions={
        <Button
          size="lg"
          className="w-full"
          onClick={onStart}
          disabled={starting}
        >
          {starting ? <Spinner /> : <CameraIcon />}
          Bắt đầu
        </Button>
      }
    >
      <ul className="grid w-full grid-cols-3 gap-2">
        {TIPS.map(({ icon: Icon, text }) => (
          <li
            key={text}
            className="flex flex-col items-center gap-2 rounded-xl bg-muted/60 px-2 py-4 text-xs font-medium"
          >
            <Icon className="size-5 text-muted-foreground" />
            {text}
          </li>
        ))}
      </ul>

      {permission === "granted" && (
        <p className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
          <CircleCheckIcon className="size-3.5" /> Camera đã sẵn sàng
        </p>
      )}
      {permission === "denied" && (
        <p className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400">
          <ShieldAlertIcon className="size-3.5" /> Camera đang bị chặn
        </p>
      )}
    </StatusScreen>
  )
}
