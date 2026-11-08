import type { Meta, StoryObj } from "@storybook/svelte-vite"
import ButtonStory from "./ButtonStory.svelte"

const meta: Meta<typeof ButtonStory> = {
	title: "Components/Button",
	component: ButtonStory,
	parameters: {
		layout: "centered",
	},
	argTypes: {
		variant: {
			control: "select",
			options: ["default", "secondary", "destructive", "outline", "ghost"],
		},
		label: {
			control: "text",
		},
	},
}

export default meta

type Story = StoryObj<typeof ButtonStory>

export const Default: Story = {
	args: { variant: "default", label: "Default" },
}

export const Secondary: Story = {
	args: { variant: "secondary", label: "Secondary" },
}

export const Destructive: Story = {
	args: { variant: "destructive", label: "Destructive" },
}

export const Outline: Story = {
	args: { variant: "outline", label: "Outline" },
}

export const Ghost: Story = {
	args: { variant: "ghost", label: "Ghost" },
}
