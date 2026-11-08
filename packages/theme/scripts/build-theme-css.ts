import { fileURLToPath } from "node:url"
import { writePrebuiltThemeCss } from "./write-theme-css"

await writePrebuiltThemeCss(fileURLToPath(new URL("../dist/themes/", import.meta.url)))
