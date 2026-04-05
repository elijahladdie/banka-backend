import { describe, expect, it } from "vitest";
import { generateTransactionReference } from "../../../src/utils/ref";

describe("ref util", () => {
  describe("generateTransactionReference", () => {
    it("should generate transaction reference with expected prefix", () => {
      expect(generateTransactionReference()).toMatch(/^TXN-\d{8}-[A-Z0-9]{6}$/);
    });

    it("should generate a fresh value on subsequent calls", () => {
      const first = generateTransactionReference();
      const second = generateTransactionReference();
      expect(first).not.toBe(second);
    });
  });
});
