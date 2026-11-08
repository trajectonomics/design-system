import { semanticTokenContract, type Theme } from "@trajectonomics/design-system"
import { validateTheme } from "./validation"

function escapeCssString(value: string): string {
	let escaped = ""
	for (const character of value) {
		const codePoint = character.codePointAt(0) ?? 0
		if (character === "\\") escaped += "\\\\"
		else if (character === '"') escaped += '\\"'
		else if (codePoint < 0x20 || codePoint === 0x7f) {
			escaped += `\\${codePoint.toString(16)} `
		} else escaped += character
	}
	return escaped
}

function cssVariableName(roleName: string): string {
	return `--ds-${roleName.replaceAll(".", "-")}`
}

/** The Theme-to-CSS emitter: data-theme-scoped CSS custom properties for a valid Theme. */
export function themeToCss(theme: Theme): string {
	const validated = validateTheme(theme)
	const declarations = semanticTokenContract.roles.map((role) => {
		const value = validated.tokens[role.name]!
		return `  ${cssVariableName(role.name)}: ${value};`
	})
	const selector = `[data-theme="${escapeCssString(validated.name)}"]`
	return `${selector} {\n${declarations.join("\n")}\n}\n`
}
