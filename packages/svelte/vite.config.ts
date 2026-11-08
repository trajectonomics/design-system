import { svelte } from "@sveltejs/vite-plugin-svelte"
import { svelteTesting } from "@testing-library/svelte/vite"
import type { UserConfig } from "vite"
import { defineConfig } from "vitest/config"

const config: UserConfig = defineConfig({
	plugins: [svelte(), svelteTesting()],
	test: {
		environment: "jsdom",
		setupFiles: ["./vitest-setup.ts"],
		include: ["src/**/*.test.ts", "tests/**/*.test.ts"],
	},
})

export default config
