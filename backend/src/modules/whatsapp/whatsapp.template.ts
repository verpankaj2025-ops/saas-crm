// ── Template rendering helpers (pure — unit tested) ───────────
// A template stores an ordered `variables` list (the {{name}} placeholders)
// and a `body`. The caller supplies values keyed by variable name; we turn
// those into the ordered parameter array WhatsApp expects and a rendered
// body string for display in the conversation thread.

/** Ordered body parameters in the template's declared variable order. */
export function orderedTemplateParams(
  variables: string[],
  values: Record<string, string> = {},
): string[] {
  return variables.map((name) => values[name] ?? "");
}

/** Substitute {{name}} placeholders in the body with supplied values. */
export function renderTemplateBody(
  body: string,
  values: Record<string, string> = {},
): string {
  return body.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_m, name: string) =>
    Object.prototype.hasOwnProperty.call(values, name) ? values[name] : `{{${name}}}`,
  );
}
