<script lang="ts">
	import { Button, type ButtonVariant } from "@trajectonomics/design-system-svelte"

	const variants: readonly ButtonVariant[] = [
		"default",
		"secondary",
		"destructive",
		"outline",
		"ghost",
	]
</script>

<div class="flex flex-wrap items-center gap-3">
	{#each variants as variant}
		<Button {variant}>{variant}</Button>
	{/each}
</div>
