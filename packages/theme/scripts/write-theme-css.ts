import { mkdir } from "node:fs/promises"
import { join } from "node:path"
import { prebuiltThemeCss } from "./prebuilt-theme-css"

/** Writes the prebuilt Theme CSS files into `outputDirectory`, creating it when missing. */
export async function writePrebuiltThemeCss(outputDirectory: string): Promise<void> {
	await mkdir(outputDirectory, { recursive: true })
	for (const file of prebuiltThemeCss) {
		await Bun.write(join(outputDirectory, file.fileName), file.css)
	}
}
