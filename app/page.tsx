import { Metadata } from "next"

import SITE from "@/configs/site"

export { default } from "./main"

export const metadata: Metadata = {
  title: { absolute: `${SITE.title} | ${SITE.name}` },
}
