import { describe, expect, it } from "vitest";
import { generateReference } from "../../../src/utils/reference";

describe("reference util", () => {
  describe("generateReference", () => {
    it("should include deposit, withdrawal, and transfer markers", () => {
      expect(generateReference("D")).toContain("-DEP-");
      expect(generateReference("W")).toContain("-WDR-");
      expect(generateReference("T")).toContain("-TRF-");
    });

    it("should match expected structured format", () => {
      expect(generateReference("D")).toMatch(/^TXN-\d{8}-DEP-[A-Z0-9]{6}$/);
    });
  });
});
