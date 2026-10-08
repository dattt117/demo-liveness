import { ImageResponse } from "next/og"

import { BrandMark } from "@/components/brand-mark"
import SITE from "@/configs/site"

export const alt = `${SITE.title} | ${SITE.name}`
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

const STEPS = ["Nhìn thẳng", "Chớp mắt", "Quay đầu", "Mỉm cười"]

export default function OpengraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: 80,
        gap: 36,
        color: "#fafafa",
        background:
          "radial-gradient(circle at 85% 20%, #2a2a2a 0%, #0a0a0a 60%)",
      }}
    >
      <div
        style={{
          width: 112,
          height: 112,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 28,
          background: "#fafafa",
        }}
      >
        <BrandMark size={68} color="#0a0a0a" />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ fontSize: 76, fontWeight: 700, letterSpacing: -2 }}>
          {SITE.title}
        </div>
        <div style={{ fontSize: 32, color: "#a3a3a3" }}>{SITE.name}</div>
      </div>
      <div style={{ display: "flex", gap: 16 }}>
        {STEPS.map((step) => (
          <div
            key={step}
            style={{
              display: "flex",
              padding: "12px 24px",
              borderRadius: 999,
              fontSize: 26,
              background: "#262626",
              color: "#e5e5e5",
            }}
          >
            {step}
          </div>
        ))}
      </div>
    </div>,
    size
  )
}
