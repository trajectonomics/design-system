import type { StorybookConfig } from "@storybook/svelte-vite"
import { svelte } from "@sveltejs/vite-plugin-svelte"
import tailwindcss from "@tailwindcss/vite"

const config: StorybookConfig = {
	stories: ["../src/**/*.stories.ts"],
	addons: ["@storybook/addon-a11y"],
	framework: {
		name: "@storybook/svelte-vite",
		options: {},
	},
	viteFinal: async (viteConfig) => {
		viteConfig.plugins = [svelte(), ...(viteConfig.plugins ?? []), tailwindcss()]
		return viteConfig
	},
}

export default config
