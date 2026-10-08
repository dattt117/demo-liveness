"use client"

import { useEffect, useState } from "react"

import {
  CameraPermissionState,
  getCameraPermissionStatus,
} from "@/lib/liveness/camera-permission"

export function useCameraPermission(): CameraPermissionState {
  const [state, setState] = useState<CameraPermissionState>("unknown")

  useEffect(() => {
    let status: PermissionStatus | null = null
    let cancelled = false
    const sync = () => status && setState(status.state as CameraPermissionState)

    getCameraPermissionStatus().then((s) => {
      if (cancelled || !s) return
      status = s
      sync()
      status.addEventListener("change", sync)
    })

    return () => {
      cancelled = true
      status?.removeEventListener("change", sync)
    }
  }, [])

  return state
}
