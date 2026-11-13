import tailwindcss from "@tailwindcss/vite"
import type { UserConfig } from "vite"
import { defineConfig } from "vite"

const config: UserConfig = defineConfig({
	plugins: [tailwindcss()],
	// The smoke test asserts the emitted Brand Asset file, so the fixture keeps
	// every asset on disk instead of inlining it as a data URL.
	build: { assetsInlineLimit: 0 },
})

export default config
