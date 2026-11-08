import { writeFile } from "node:fs/promises"
import { fileURLToPath } from "node:url"
import { buildTailwindThemeCss } from "./tailwind-theme-css"

await writeFile(fileURLToPath(new URL("../tailwind.css", import.meta.url)), buildTailwindThemeCss())
