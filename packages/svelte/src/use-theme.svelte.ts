import type { Theme } from "@trajectonomics/design-system"
import { themeToCss } from "@trajectonomics/design-system-theme"

const THEME_STYLE_ATTRIBUTE = "data-ds-theme"

/** Options for `useTheme`. */
export interface UseThemeOptions {
	/** Returns the element that receives the Theme; defaults to `document.documentElement`. */
	readonly element?: () => Element | null | undefined
	/** The Theme to apply when the Hook is created. */
	readonly theme?: Theme
}

/** Reads and changes the active Theme by applying it to an element. */
export interface ThemeHook {
	/** The Theme applied by the most recent `setTheme` call. */
	readonly current: Theme | undefined
	/** Applies a valid Theme to the chosen element and injects its CSS. */
	setTheme(theme: Theme, element?: Element | null): void
}

function defaultElement(): Element | null {
	return typeof document === "undefined" ? null : document.documentElement
}

function createStyleInjector(): (css: string) => void {
	let styleElement: HTMLStyleElement | undefined
	return (css: string): void => {
		if (typeof document === "undefined") return
		if (styleElement === undefined) {
			styleElement = document.createElement("style")
			styleElement.setAttribute(THEME_STYLE_ATTRIBUTE, "")
			document.head.append(styleElement)
		}
		styleElement.textContent = css
	}
}

/** Applies any valid Theme to an element through its `data-theme` attribute and Theme CSS. */
export function useTheme(options: UseThemeOptions = {}): ThemeHook {
	let current = $state.raw<Theme | undefined>(undefined)
	let activeElement: Element | undefined
	const injectCss = createStyleInjector()

	function setTheme(theme: Theme, element?: Element | null): void {
		const css = themeToCss(theme)
		const target = element === undefined ? (options.element?.() ?? defaultElement()) : element
		if (activeElement !== undefined && activeElement !== target) {
			activeElement.removeAttribute("data-theme")
		}
		if (target !== null) target.setAttribute("data-theme", theme.name)
		injectCss(css)
		activeElement = target ?? undefined
		current = theme
	}

	if (options.theme !== undefined) setTheme(options.theme)

	return {
		get current() {
			return current
		},
		setTheme,
	}
}
