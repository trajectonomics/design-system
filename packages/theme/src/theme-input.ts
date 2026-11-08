/** Input for defining a Theme: a name and tokens; a full Theme also fits, but its version is ignored. */
export interface ThemeInput {
	readonly name: string
	readonly tokens: Readonly<Record<string, string>>
}
