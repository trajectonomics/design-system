import { semanticTokenContract } from "@trajectonomics/design-system"

/** One Tailwind v4 theme namespace that a Contract role prefix maps onto. */
interface TailwindNamespace {
	readonly rolePrefix: string
	readonly variablePrefix: string
}

/** Longest role prefix first, so the more specific namespace always wins the match. */
const TAILWIND_NAMESPACES: readonly TailwindNamespace[] = Object.freeze(
	[
		{ rolePrefix: "color.", variablePrefix: "--color-" },
		{ rolePrefix: "radius.", variablePrefix: "--radius-" },
		{ rolePrefix: "space.", variablePrefix: "--spacing-" },
		{ rolePrefix: "font.family.", variablePrefix: "--font-" },
		{ rolePrefix: "font.size.", variablePrefix: "--text-" },
	].sort((left, right) => right.rolePrefix.length - left.rolePrefix.length),
)

/** The Tailwind v4 theme variable a Contract role maps onto, such as `--radius-xl`. */
export function tailwindThemeVariable(roleName: string): string {
	const namespace = TAILWIND_NAMESPACES.find(({ rolePrefix }) => roleName.startsWith(rolePrefix))
	if (namespace === undefined) {
		throw new Error(`No Tailwind theme namespace maps the Contract role "${roleName}".`)
	}
	const name = roleName.slice(namespace.rolePrefix.length).replaceAll(".", "-")
	return `${namespace.variablePrefix}${name}`
}

/** Builds the Tailwind v4 theme stylesheet that maps theme variables onto the `--ds-` variables. */
export function buildTailwindThemeCss(): string {
	const mappings = semanticTokenContract.roles.map((role) => {
		const variable = `--ds-${role.name.replaceAll(".", "-")}`
		return `\t${tailwindThemeVariable(role.name)}: var(${variable});`
	})
	return `@theme inline {\n${mappings.join("\n")}\n}\n`
}
