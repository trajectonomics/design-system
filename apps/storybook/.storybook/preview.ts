import type { Preview } from "@storybook/svelte-vite"
import { darkTheme, lightTheme } from "@trajectonomics/design-system"
import { useTheme } from "@trajectonomics/design-system-svelte"
import "./preview.css"

const theme = useTheme({ element: () => document.documentElement })

const preview: Preview = {
	parameters: {
		controls: {
			matchers: {
				color: /(background|color)$/i,
				date: /Date$/i,
			},
		},
		a11y: {
			test: "error",
		},
	},
	globalTypes: {
		theme: {
			description: "Active Theme",
			toolbar: {
				title: "Theme",
				icon: "paintbrush",
				items: [
					{ value: "light", title: "Light" },
					{ value: "dark", title: "Dark" },
				],
				dynamicTitle: true,
			},
		},
	},
	initialGlobals: {
		theme: "light",
	},
	decorators: [
		(story, context) => {
			theme.setTheme(context.globals["theme"] === "dark" ? darkTheme : lightTheme)
			return story()
		},
	],
}

export default preview
