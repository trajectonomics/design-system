import type { Theme } from "@trajectonomics/design-system"
import { type ThemeHook, useTheme } from "../src/index.js"

/** Test-only Hook wrapper: applies the Theme from a getter and exposes the reactive Hook state. */
export function useThemeProbe(getTheme: () => Theme): ThemeHook {
	const hook = useTheme()
	$effect(() => {
		hook.setTheme(getTheme())
	})
	return hook
}
