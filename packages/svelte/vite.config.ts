import { svelte } from "@sveltejs/vite-plugin-svelte"
import { svelteTesting } from "@testing-library/svelte/vite"
import type { UserConfig } from "vite"
import { defineConfig } from "vitest/config"

const source = (path: string): string => new URL(path, import.meta.url).pathname

const config: UserConfig = defineConfig({
	plugins: [svelte(), svelteTesting()],
	resolve: {
		alias: [
			{ find: /^@trajectonomics\/design-system$/, replacement: source("../core/src/index.ts") },
			{
				find: /^@trajectonomics\/design-system-theme$/,
				replacement: source("../theme/src/index.ts"),
			},
		],
	},
	test: {
		environment: "jsdom",
		setupFiles: ["./vitest-setup.ts"],
		include: ["src/**/*.test.ts", "tests/**/*.test.ts"],
	},
})

export default config
