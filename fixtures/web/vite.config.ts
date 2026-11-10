import tailwindcss from "@tailwindcss/vite"
import type { UserConfig } from "vite"
import { defineConfig } from "vite"

const config: UserConfig = defineConfig({
	plugins: [tailwindcss()],
})

export default config
