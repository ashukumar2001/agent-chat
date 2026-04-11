import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function isValidURL(str: string = "") {
  try {
    new URL(str);
    return true;
  } catch (_) {
    return false;
  }
}
