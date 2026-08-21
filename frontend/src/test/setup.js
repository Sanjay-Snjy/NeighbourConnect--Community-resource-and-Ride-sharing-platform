// Vitest global setup — runs before every test file.
// Adds jest-dom matchers (toBeInTheDocument, toHaveClass, …) and ensures the
// DOM is reset between tests.
import "@testing-library/jest-dom";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

afterEach(() => {
  cleanup();
});
