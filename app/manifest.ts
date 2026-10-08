import type { MetadataRoute } from "next"

import SITE from "@/configs/site"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${SITE.title} | ${SITE.name}`,
    short_name: SITE.shortName,
    description: SITE.description,
    lang: "vi",
    start_url: `${SITE.basePath}/`,
    scope: `${SITE.basePath}/`,
    display: "standalone",
    orientation: "portrait",
    background_color: SITE.themeColor.dark,
    theme_color: SITE.themeColor.dark,
    icons: [
      {
        src: `${SITE.basePath}/icon.svg`,
        sizes: "any",
        type: "image/svg+xml",
      },
      {
        src: `${SITE.basePath}/apple-icon`,
        sizes: "180x180",
        type: "image/png",
      },
    ],
  }
}
