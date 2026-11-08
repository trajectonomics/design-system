import { darkTheme, lightTheme } from "@trajectonomics/design-system"
import { themeToCss } from "../src/index"

/** One prebuilt Theme CSS file shipped by the package. */
export interface PrebuiltThemeCss {
	readonly fileName: string
	readonly css: string
}

/** The prebuilt CSS files for the built-in Themes, emitted by the public Theme-to-CSS function. */
export const prebuiltThemeCss: readonly PrebuiltThemeCss[] = Object.freeze([
	Object.freeze({ fileName: "light.css", css: themeToCss(lightTheme) }),
	Object.freeze({ fileName: "dark.css", css: themeToCss(darkTheme) }),
])
