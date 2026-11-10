import { describe, expect, it } from "bun:test"
import { readFile } from "node:fs/promises"
import { join } from "node:path"

const ROOT = join(import.meta.dir, "..")
const README_PATH = join(ROOT, "README.md")
const FIXTURE_CSS_PATH = join(ROOT, "fixtures", "web", "src", "app.css")

/** The `@import` lines of a CSS document, trimmed, in source order. */
function cssImports(css: string): readonly string[] {
	return css
		.split("\n")
		.map((line) => line.trim())
		.filter((line) => line.startsWith("@import"))
}

/** The fenced CSS blocks of a Markdown document, in source order. */
function cssBlocks(markdown: string): readonly string[] {
	return [...markdown.matchAll(/```css\n([\s\S]*?)```/g)].map((match) => match[1] ?? "")
}

describe("web fixture documentation", () => {
	it("imports the same stylesheets the README documents", async () => {
		const markdown = await readFile(README_PATH, "utf8")
		const documented = cssBlocks(markdown).filter((block) =>
			cssImports(block).some((line) => line.includes("design-system-theme/tailwind.css")),
		)
		expect(documented).toHaveLength(1)

		const fixture = await readFile(FIXTURE_CSS_PATH, "utf8")
		expect(cssImports(fixture)).toEqual(cssImports(documented[0] ?? ""))
	})
})
