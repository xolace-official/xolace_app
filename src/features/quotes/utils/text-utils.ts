export function removeEmDash(text: string): string {
  return text.replace(/—/g, "");
}

export function removeEmDashWithSpaces(text: string): string {
  return text.replace(/—/g, " ").replace(/\s{2,}/g, " ").trim();
}
