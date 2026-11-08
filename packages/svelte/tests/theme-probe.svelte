<script lang="ts">
	import type { Theme } from "@trajectonomics/design-system"
	import { useThemeProbe } from "./use-theme-probe.svelte.js"

	let { theme }: { theme: Theme } = $props()
	const hook = useThemeProbe(() => theme)
</script>

<p data-testid="active-theme">{hook.current?.name ?? "none"}</p>
