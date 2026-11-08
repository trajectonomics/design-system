import "@testing-library/jest-dom/vitest"
import { cleanup } from "@testing-library/svelte"
import { afterEach } from "vitest"

afterEach(() => {
	cleanup()
	for (const style of document.head.querySelectorAll("style[data-ds-theme]")) style.remove()
	document.documentElement.removeAttribute("data-theme")
})
