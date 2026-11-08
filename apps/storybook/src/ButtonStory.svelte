<script lang="ts" module>
	import type { ButtonVariant } from "@trajectonomics/design-system-svelte"

	export interface ButtonStoryProps {
		variant?: ButtonVariant
		label?: string
	}
</script>

<script lang="ts">
	import { Button } from "@trajectonomics/design-system-svelte"

	let { variant = "default", label = "Button" }: ButtonStoryProps = $props()
</script>

<Button {variant}>{label}</Button>
