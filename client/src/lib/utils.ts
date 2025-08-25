import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
function genId() {
  return Math.random().toString(36).substr(2, 6).toUpperCase(); // Example: "ABC123"
}
