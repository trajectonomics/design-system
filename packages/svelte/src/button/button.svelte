<script lang="ts" module>
	import type { ButtonProps as BaseButtonProps } from "./button.svelte.js"

	// svelte2tsx drops imported types used only by $props(), so the public props
	// type is re-declared here to keep the generated .d.ts valid for consumers.
	/** Props for `Button`, covering both the button and anchor forms. */
	export interface ButtonProps extends BaseButtonProps {}
</script>

<script lang="ts">
	import { cn } from "../utils.js"
	import { buttonVariants } from "./button.svelte.js"

	let {
		class: className,
		variant = "default",
		size = "default",
		ref = $bindable(null),
		href = undefined,
		type = "button",
		disabled,
		children,
		...restProps
	}: ButtonProps = $props()
</script>

{#if href}
	<a
		bind:this={ref}
		data-slot="button"
		class={cn(buttonVariants({ variant, size }), className)}
		href={disabled ? undefined : href}
		aria-disabled={disabled}
		role={disabled ? "link" : undefined}
		tabindex={disabled ? -1 : undefined}
		{...restProps}
	>
		{@render children?.()}
	</a>
{:else}
	<button
		bind:this={ref}
		data-slot="button"
		class={cn(buttonVariants({ variant, size }), className)}
		{type}
		{disabled}
		{...restProps}
	>
		{@render children?.()}
	</button>
{/if}
