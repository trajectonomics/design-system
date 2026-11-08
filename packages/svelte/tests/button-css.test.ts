import { spawn } from "node:child_process"
import { mkdtemp, readFile, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { describe, expect, it } from "vitest"

const PACKAGE_ROOT = process.cwd()
const TAILWIND_BIN = join(PACKAGE_ROOT, "node_modules/.bin/tailwindcss")

function run(
	command: string,
	args: readonly string[],
): Promise<{ exitCode: number; stderr: string }> {
	return new Promise((resolve, reject) => {
		const child = spawn(command, args, { cwd: PACKAGE_ROOT })
		let stderr = ""
		child.stderr.on("data", (chunk: Buffer) => {
			stderr += chunk.toString()
		})
		child.on("error", reject)
		child.on("close", (exitCode) => {
			resolve({ exitCode: exitCode ?? 1, stderr })
		})
	})
}

async function compileStylesheet(): Promise<string> {
	const directory = await mkdtemp(join(tmpdir(), "ds-svelte-css-"))
	try {
		const output = join(directory, "style.css")
		const { exitCode, stderr } = await run(TAILWIND_BIN, ["-i", "app.css", "-o", output])
		if (exitCode !== 0) throw new Error(`Tailwind failed: ${stderr}`)
		for (let attempt = 0; attempt < 20; attempt += 1) {
			try {
				return await readFile(output, "utf8")
			} catch {
				await new Promise((resolve) => setTimeout(resolve, 10))
			}
		}
		throw new Error(`Tailwind produced no output: ${output}`)
	} finally {
		await rm(directory, { recursive: true, force: true })
	}
}

describe("Button stylesheet", () => {
	it("compiles every variant to the --ds- Theme variables", async () => {
		const css = await compileStylesheet()
		expect(css).toContain(".bg-primary {")
		expect(css).toContain("background-color: var(--ds-color-primary);")
		expect(css).toContain(".text-primary-foreground {")
		expect(css).toContain("color: var(--ds-color-primary-foreground);")
		expect(css).toContain(".bg-secondary {")
		expect(css).toContain("background-color: var(--ds-color-secondary);")
		expect(css).toContain(".bg-destructive {")
		expect(css).toContain("background-color: var(--ds-color-destructive);")
		expect(css).toContain(".border-input {")
		expect(css).toContain("border-color: var(--ds-color-input);")
		expect(css).toContain(".bg-background {")
		expect(css).toContain("background-color: var(--ds-color-background);")
		expect(css).toContain(".hover\\:bg-accent:hover {")
		expect(css).toContain("background-color: var(--ds-color-accent);")
	})

	it("compiles the focus ring from the ring role", async () => {
		const css = await compileStylesheet()
		expect(css).toContain(".focus-visible\\:ring-ring:focus-visible {")
		expect(css).toContain("--tw-ring-color: var(--ds-color-ring);")
	})

	it("compiles a standalone stylesheet with no Tailwind directives", async () => {
		const css = await compileStylesheet()
		expect(css).not.toContain('@import "tailwindcss"')
		expect(css).not.toContain("@theme")
		expect(css).toContain(".bg-primary")
		expect(css).toContain("var(--ds-color-primary)")
	})

	it("ships no hardcoded colours in the Button utility rules", async () => {
		const css = await compileStylesheet()
		const buttonRules = [
			...css.matchAll(/\.(?:bg|text|border|hover|focus-visible)[^{]*\{([^}]*)\}/g),
		].map((match) => match[1] ?? "")
		expect(buttonRules.some((rule) => rule.includes("var(--ds-"))).toBe(true)
		for (const rule of buttonRules) expect(rule).not.toMatch(/#[0-9a-f]{3,8}/i)
	})
})
