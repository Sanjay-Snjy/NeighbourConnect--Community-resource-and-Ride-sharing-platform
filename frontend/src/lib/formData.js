/**
 * Build a FormData body from a plain object, used for endpoints that accept an
 * image upload alongside text fields (posts, resources, events, profile).
 * - `null`/`undefined` values are skipped.
 * - `File` values are appended as-is; everything else is stringified.
 * - Nested plain objects/arrays are JSON-encoded (used for the post `poll`).
 */
export function toFormData(values) {
  const form = new FormData();
  for (const [key, value] of Object.entries(values)) {
    if (value === null || value === undefined) continue;
    if (value instanceof File || value instanceof Blob) {
      form.append(key, value);
    } else if (typeof value === "boolean") {
      form.append(key, value ? "true" : "false");
    } else if (typeof value === "object") {
      form.append(key, JSON.stringify(value));
    } else {
      form.append(key, value);
    }
  }
  return form;
}

/** True when the payload carries a File and must be sent as multipart. */
export function hasFile(values) {
  return Object.values(values).some(
    (v) => v instanceof File || v instanceof Blob,
  );
}
