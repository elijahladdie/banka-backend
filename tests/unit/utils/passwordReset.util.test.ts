import { describe, expect, it } from "vitest";
import { createPasswordResetToken, hashPasswordResetToken } from "../../../src/utils/passwordReset";

describe("password reset util", () => {
  describe("createPasswordResetToken", () => {
    it("should create raw and hashed token pair", () => {
      const { raw, hashed } = createPasswordResetToken();
      expect(raw).toHaveLength(64);
      expect(hashPasswordResetToken(raw)).toBe(hashed);
    });
  });

  describe("hashPasswordResetToken", () => {
    it("should hash empty input deterministically", () => {
      expect(hashPasswordResetToken("")).toBe(
        "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
      );
    });
  });
});
