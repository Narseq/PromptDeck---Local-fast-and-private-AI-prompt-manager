const VARIABLE_PATTERN = /\{\{\s*([\p{L}\p{N}_-]+)\s*\}\}/gu;

/** Returns unique variable names in order of first appearance, e.g. `{{topic}}` -> `topic`. */
export function extractVariables(content: string): string[] {
  const names = new Set<string>();
  for (const match of content.matchAll(VARIABLE_PATTERN)) {
    if (match[1]) names.add(match[1]);
  }
  return [...names];
}

/** Replaces `{{name}}` placeholders. Variables without a non-empty value are left untouched. */
export function fillVariables(content: string, values: Record<string, string>): string {
  return content.replace(VARIABLE_PATTERN, (placeholder, name: string) => {
    const value = values[name];
    return value !== undefined && value !== "" ? value : placeholder;
  });
}
