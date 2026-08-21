/**
 * Map a parsed API error's field errors onto a React Hook Form `setError`.
 *
 * Backend validation errors arrive as `{ fieldErrors: { name: "msg", ... } }`
 * via `parseApiError`. This applies each one to its matching form field so the
 * message renders inline under the input.
 *
 * @returns {boolean} true if at least one field-level error was applied, letting
 *   the caller decide whether to also surface the general message as a toast.
 */
export function applyFieldErrors(parsed, setError) {
  const fieldErrors = parsed?.fieldErrors ?? {};
  const entries = Object.entries(fieldErrors);
  entries.forEach(([field, message]) => {
    setError(field, { type: "server", message });
  });
  return entries.length > 0;
}
