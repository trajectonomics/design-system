import type { Meta, StoryObj } from "@storybook/svelte-vite"
import ButtonGallery from "./ButtonGallery.svelte"

const meta: Meta<typeof ButtonGallery> = {
	title: "Components/Button/All variants",
	component: ButtonGallery,
	parameters: {
		layout: "centered",
	},
}

export default meta

type Story = StoryObj<typeof ButtonGallery>

export const AllVariants: Story = {}
