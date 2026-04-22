export const SPACE_NAME_MAX_LENGTH = 20;
export const SPACE_NAME_VALID_RE = /^[A-Za-z0-9-]+$/;

export const SPACE_NAME_CRISIS_BLOCKLIST = [
  "kill", "die", "suicide", "suicid", "hurt", "dead", "death",
  "harm", "selfharm", "self-harm", "cut", "bleed",
] as const;

export type SpaceNameValidation =
  | { ok: true; trimmed: string }
  | { ok: false; message: string };

export function validateSpaceName(name: string): SpaceNameValidation {
  const trimmed = name.trim();
  if (!trimmed) return { ok: false, message: "Name cannot be empty" };
  if (trimmed.length > SPACE_NAME_MAX_LENGTH) {
    return { ok: false, message: `${SPACE_NAME_MAX_LENGTH} characters max` };
  }
  if (/\s/.test(trimmed)) return { ok: false, message: "No spaces allowed" };
  if (!SPACE_NAME_VALID_RE.test(trimmed)) {
    return { ok: false, message: "Letters, numbers, and hyphens only" };
  }
  const lower = trimmed.toLowerCase();
  for (const term of SPACE_NAME_CRISIS_BLOCKLIST) {
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    if (new RegExp(`\\b${escaped}\\b`).test(lower)) {
      return { ok: false, message: "That's not a name we can use here" };
    }
  }
  return { ok: true, trimmed };
}
