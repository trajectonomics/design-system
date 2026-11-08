import type { Theme } from "./theme"
import { darkTheme } from "./themes/dark"
import { lightTheme } from "./themes/light"

/** Every built-in Theme, in one flat list. */
export const themes: readonly Theme[] = Object.freeze([lightTheme, darkTheme])
