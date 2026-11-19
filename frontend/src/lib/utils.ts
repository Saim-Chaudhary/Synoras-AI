import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// Joins class names and lets a later Tailwind class win over an earlier one that sets the same
// thing (for example "p-2" then "p-4" gives "p-4"). The two copied library components
// (Aceternity and Motion Primitives, decisions A29) call it; our own code does not need it.
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
