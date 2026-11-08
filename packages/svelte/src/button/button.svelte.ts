import type { HTMLAnchorAttributes, HTMLButtonAttributes } from "svelte/elements"

const BASE =
	"inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all outline-none select-none disabled:pointer-events-none disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background [&_svg]:pointer-events-none [&_svg]:shrink-0"

const VARIANTS = {
	default: "bg-primary text-primary-foreground hover:opacity-90",
	secondary: "bg-secondary text-secondary-foreground hover:opacity-90",
	destructive: "bg-destructive text-destructive-foreground hover:opacity-90",
	outline:
		"border border-input bg-background text-foreground hover:bg-accent hover:text-accent-foreground",
	ghost: "text-foreground hover:bg-accent hover:text-accent-foreground",
} as const

const SIZES = {
	default: "h-9 px-4 py-2",
	sm: "h-8 px-3 text-xs",
	lg: "h-10 px-6",
	icon: "size-9",
} as const

/** The visual variants of `Button`, adapted from shadcn-svelte. */
export type ButtonVariant = keyof typeof VARIANTS

/** The sizes of `Button`, adapted from shadcn-svelte. */
export type ButtonSize = keyof typeof SIZES

/** Options for the `Button` class builder. */
export interface ButtonVariantOptions {
	readonly variant?: ButtonVariant
	readonly size?: ButtonSize
}

/** Adds an element ref binding to an HTML attribute type. */
export type WithElementRef<T, U extends HTMLElement = HTMLElement> = T & { ref?: U | null }

/** Props for `Button`, covering both the button and anchor forms. */
export type ButtonProps = WithElementRef<HTMLButtonAttributes> &
	WithElementRef<HTMLAnchorAttributes> & {
		variant?: ButtonVariant
		size?: ButtonSize
	}

/** Builds the Tailwind classes for a `Button` variant and size. */
export function buttonVariants(options: ButtonVariantOptions = {}): string {
	const { variant = "default", size = "default" } = options
	return [BASE, VARIANTS[variant], SIZES[size]].join(" ")
}
