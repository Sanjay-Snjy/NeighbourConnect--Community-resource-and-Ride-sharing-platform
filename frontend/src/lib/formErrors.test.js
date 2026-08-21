import { describe, it, expect, vi } from "vitest";
import { applyFieldErrors } from "@/lib/formErrors";

describe("applyFieldErrors", () => {
  it("maps each field error onto setError and reports true", () => {
    const setError = vi.fn();
    const applied = applyFieldErrors(
      { fieldErrors: { title: "Required", body: "Too short" } },
      setError,
    );

    expect(applied).toBe(true);
    expect(setError).toHaveBeenCalledTimes(2);
    expect(setError).toHaveBeenCalledWith("title", {
      type: "server",
      message: "Required",
    });
    expect(setError).toHaveBeenCalledWith("body", {
      type: "server",
      message: "Too short",
    });
  });

  it("reports false and never calls setError when there are no field errors", () => {
    const setError = vi.fn();
    expect(applyFieldErrors({ fieldErrors: {} }, setError)).toBe(false);
    expect(setError).not.toHaveBeenCalled();
  });

  it("tolerates a null/undefined parsed error", () => {
    const setError = vi.fn();
    expect(applyFieldErrors(null, setError)).toBe(false);
    expect(applyFieldErrors(undefined, setError)).toBe(false);
    expect(setError).not.toHaveBeenCalled();
  });
});
