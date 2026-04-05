import { afterEach, describe, expect, it, vi } from "vitest";
import { generateAccountNumber } from "../../../src/utils/generateAccountNumber";

describe("generateAccountNumber util", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe("generateAccountNumber", () => {
    it("should build predictable account number", () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2026-04-05T00:00:00Z"));
      vi.spyOn(Math, "random").mockReturnValue(0);

      expect(generateAccountNumber("123456789")).toBe("2026678910000000");
    });

    it("should pad short national id suffix", () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2026-04-05T00:00:00Z"));
      vi.spyOn(Math, "random").mockReturnValue(0);

      expect(generateAccountNumber("12")).toContain("0012");
    });
  });
});
