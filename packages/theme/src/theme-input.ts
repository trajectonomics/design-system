/** Input for defining a Theme: its plain string name and a literal value for every Contract role. */
export interface ThemeInput {
	readonly name: string
	readonly tokens: Readonly<Record<string, string>>
}
