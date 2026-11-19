// The checks the login and register forms do in the browser, before anything is sent
// (decisions A26). The server checks the same rules again: these are only here so the person
// hears about a mistake at once, next to the field, in plain words.
//
// Each function returns a message when something is wrong, or undefined when the value is fine.

export const MIN_PASSWORD_LENGTH = 8; // the backend enforces the same rule (SRS BR-10)

export function checkName(value: string): string | undefined {
  return value.trim() ? undefined : "Enter your name.";
}

export function checkEmail(value: string): string | undefined {
  const email = value.trim();
  if (!email) return "Enter your email address.";
  if (!/^\S+@\S+\.\S+$/.test(email)) return "Enter a valid email address, like name@example.com.";
  return undefined;
}

// On the login page the only thing to check is that something was typed: the server decides
// if it is right (and never says which half was wrong).
export function checkPasswordPresent(value: string): string | undefined {
  return value ? undefined : "Enter your password.";
}

export function checkNewPassword(value: string): string | undefined {
  return value.length >= MIN_PASSWORD_LENGTH ? undefined : `Use at least ${MIN_PASSWORD_LENGTH} characters.`;
}

// Moves the cursor to the first field that has a mistake (so the person never has to hunt for it).
export function focusFirstInvalid(ids: string[], errors: Record<string, string | undefined>): void {
  const first = ids.find((id) => errors[id]);
  if (first) document.getElementById(first)?.focus();
}

// On a computer the cursor starts in the first field. On a phone it does not: the keyboard
// would cover half of the page before the person has seen it.
export function focusOnComputers(id: string): void {
  if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
    document.getElementById(id)?.focus();
  }
}
