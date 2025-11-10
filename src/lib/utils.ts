import { clsx, type ClassValue } from "clsx";
// This is a code
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
