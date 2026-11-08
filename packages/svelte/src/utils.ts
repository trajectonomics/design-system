import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/** Merges Tailwind class names so later utilities override earlier ones. */
export function cn(...inputs: ClassValue[]): string {
	return twMerge(clsx(inputs))
}
