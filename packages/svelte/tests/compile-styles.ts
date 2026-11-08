import { spawn } from "node:child_process"
import { mkdtemp, readFile, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"

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

/** Compiles the package's Tailwind entrypoint to the stylesheet a consumer receives. */
export async function compileButtonStyles(): Promise<string> {
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
