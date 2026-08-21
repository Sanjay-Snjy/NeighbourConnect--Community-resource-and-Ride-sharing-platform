import { describe, it, expect } from "vitest";
import { initials, pluralize, truncate, formatTime } from "@/utils/format";

describe("initials", () => {
  it("takes first + last initial from a full name", () => {
    expect(initials("Priya Nair")).toBe("PN");
  });

  it("uses the first two letters for a single name", () => {
    expect(initials("Sanjay")).toBe("SA");
  });

  it("falls back to a placeholder for empty input", () => {
    expect(initials("")).toBe("?");
  });
});

describe("pluralize", () => {
  it("keeps the singular for a count of one", () => {
    expect(pluralize(1, "seat")).toBe("1 seat");
  });

  it("appends 's' for other counts", () => {
    expect(pluralize(3, "seat")).toBe("3 seats");
  });

  it("uses an explicit plural when given", () => {
    expect(pluralize(2, "child", "children")).toBe("2 children");
  });
});

describe("truncate", () => {
  it("leaves short text untouched", () => {
    expect(truncate("hello", 120)).toBe("hello");
  });

  it("adds an ellipsis when over the limit", () => {
    const out = truncate("a".repeat(200), 20);
    expect(out.endsWith("…")).toBe(true);
    expect(out.length).toBeLessThanOrEqual(21);
  });
});

describe("formatTime", () => {
  it("formats 24h times as 12h with meridiem", () => {
    expect(formatTime("09:00")).toBe("9:00 AM");
    expect(formatTime("13:30")).toBe("1:30 PM");
  });

  it("returns an empty string for empty input", () => {
    expect(formatTime("")).toBe("");
  });
});
