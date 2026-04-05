import { describe, expect, it, vi } from "vitest";
import { asyncWrapper } from "../../../src/utils/asyncWrapper";

describe("asyncWrapper util", () => {
  describe("asyncWrapper", () => {
    it("should run handler successfully", async () => {
      const next = vi.fn();
      const handler = vi.fn().mockResolvedValue(undefined);
      const wrapped = asyncWrapper(handler as any);

      await wrapped({} as any, {} as any, next);
      expect(handler).toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it("should forward thrown errors to next", async () => {
      const next = vi.fn();
      const wrapped = asyncWrapper(async () => {
        throw new Error("boom");
      });

      await wrapped({} as any, {} as any, next);
      expect(next).toHaveBeenCalled();
    });
  });
});
