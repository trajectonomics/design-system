<script lang="ts">
	import { darkTheme, lightTheme } from "@trajectonomics/design-system"
	import { Button, useTheme } from "@trajectonomics/design-system-svelte"

	const theme = useTheme({ element: () => document.documentElement, theme: lightTheme })

	function toggleTheme(): void {
		theme.setTheme(theme.current?.name === "dark" ? lightTheme : darkTheme)
	}
</script>

<main>
	<Button onclick={toggleTheme}>Toggle Theme</Button>
</main>
