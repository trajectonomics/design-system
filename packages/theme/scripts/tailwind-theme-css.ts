import { semanticTokenContract } from "@trajectonomics/design-system"

/** The Tailwind colour name for a Contract role: no `color.` prefix, dots replaced by dashes. */
export function tailwindColorName(roleName: string): string {
	return roleName.replace(/^color\./, "").replaceAll(".", "-")
}

/** Builds the Tailwind v4 theme stylesheet that maps utility colours onto the `--ds-` variables. */
export function buildTailwindThemeCss(): string {
	const mappings = semanticTokenContract.roles.map((role) => {
		const variable = `--ds-${role.name.replaceAll(".", "-")}`
		return `	--color-${tailwindColorName(role.name)}: var(${variable});`
	})
	return `@theme inline {\n${mappings.join("\n")}\n}\n`
}
