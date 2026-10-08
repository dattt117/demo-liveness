"use client"

import { useEffect, useEffectEvent, useState } from "react"
import { CameraIcon, CameraOffIcon, RefreshCwIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { useCameraPermission } from "@/hooks/use-camera-permission"
import {
  CAMERA_ACCESS_MESSAGE,
  CameraAccessError,
  CameraAccessReason,
  requestCameraAccess,
} from "@/lib/liveness/camera-permission"

import { StatusScreen } from "./status-screen"

function unblockSteps(): string[] {
  const ua = navigator.userAgent
  const isIOS =
    /iPad|iPhone|iPod/.test(ua) ||
    (ua.includes("Macintosh") && navigator.maxTouchPoints > 1)

  if (isIOS && /CriOS/.test(ua))
    return ["Mở Cài đặt → Chrome", "Bật Camera rồi quay lại đây"]
  if (isIOS)
    return [
      "Chạm “aA” trên thanh địa chỉ",
      "Cài đặt trang web → Camera → Cho phép",
    ]
  if (/Android/.test(ua))
    return ["Chạm biểu tượng cạnh thanh địa chỉ", "Quyền → Camera → Cho phép"]
  if (/Safari/.test(ua) && !/Chrome|Chromium|Edg|Firefox/.test(ua))
    return ["Safari → Cài đặt cho trang web này", "Camera → Cho phép"]
  return ["Bấm biểu tượng 🔒 cạnh thanh địa chỉ", "Bật Camera → Cho phép"]
}

const RETRYABLE: CameraAccessReason[] = [
  "denied",
  "blocked",
  "not_found",
  "in_use",
]

export function CameraPermissionPanel({
  reason: initialReason,
  onGranted,
  onBack,
}: {
  reason: CameraAccessReason
  onGranted: () => void
  onBack: () => void
}) {
  const [lastReason, setReason] = useState(initialReason)
  const [requesting, setRequesting] = useState(false)
  const permission = useCameraPermission()
  const reason =
    lastReason === "denied" && permission === "denied" ? "blocked" : lastReason
  const isPermission = reason === "denied" || reason === "blocked"

  const retry = async () => {
    setRequesting(true)
    try {
      await requestCameraAccess()
      onGranted()
    } catch (e) {
      setReason(e instanceof CameraAccessError ? e.reason : "in_use")
    } finally {
      setRequesting(false)
    }
  }

  const handleGranted = useEffectEvent(() => isPermission && onGranted())
  useEffect(() => {
    if (permission === "granted") handleGranted()
  }, [permission])

  return (
    <StatusScreen
      icon={CameraOffIcon}
      tone="warning"
      title={
        reason === "blocked"
          ? "Camera đang bị chặn"
          : reason === "denied"
            ? "Cho phép dùng camera"
            : "Không mở được camera"
      }
      description={CAMERA_ACCESS_MESSAGE[reason]}
      actions={
        <>
          <Button variant="ghost" onClick={onBack}>
            Để sau
          </Button>
          {reason === "blocked" && (
            <Button variant="outline" onClick={() => window.location.reload()}>
              <RefreshCwIcon /> Tải lại trang
            </Button>
          )}
          {RETRYABLE.includes(reason) && (
            <Button onClick={retry} disabled={requesting}>
              {requesting ? <Spinner /> : <CameraIcon />}
              {reason === "denied" ? "Cho phép camera" : "Thử lại"}
            </Button>
          )}
        </>
      }
    >
      {reason === "blocked" && (
        <ol className="w-full space-y-2 text-left text-sm">
          {unblockSteps().map((step, i) => (
            <li
              key={step}
              className="flex items-center gap-3 rounded-xl bg-muted/60 px-3 py-2.5"
            >
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-background text-xs font-semibold">
                {i + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>
      )}
    </StatusScreen>
  )
}
