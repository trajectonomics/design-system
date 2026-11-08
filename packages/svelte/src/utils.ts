import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/** A Tailwind class-name merger that lets later utilities win. */
export function cn(...inputs: ClassValue[]): string {
	return twMerge(clsx(inputs))
}
