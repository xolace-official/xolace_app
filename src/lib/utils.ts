import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merges Tailwind class names with conflict resolution. Use this for conditional className composition. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}