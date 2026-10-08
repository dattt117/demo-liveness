const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ""

const SITE = {
  name: "Liveness Demo",
  shortName: "Liveness",
  title: "Xác thực khuôn mặt",
  description:
    "Xác thực khuôn mặt người thật ngay trên trình duyệt: nhìn thẳng, chớp mắt, quay đầu, mỉm cười.",
  // URL gốc khi deploy (kèm basePath) — cần cho og:image dạng tuyệt đối
  url: process.env.NEXT_PUBLIC_SITE_URL || `http://localhost:3000${basePath}`,
  basePath,
  locale: "vi_VN",
  themeColor: { light: "#ffffff", dark: "#0a0a0a" },
} as const

export default SITE
