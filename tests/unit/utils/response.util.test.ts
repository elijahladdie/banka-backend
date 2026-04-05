import { describe, expect, it, vi } from "vitest";
import { error, success } from "../../../src/utils/response";

describe("response util", () => {
  describe("success", () => {
    it("should write success payload", () => {
      const res = { status: vi.fn().mockReturnThis(), json: vi.fn() } as any;
      success(res, "ok", { a: 1 }, undefined, 201);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ success: true, message: "ok", data: { a: 1 } });
    });
  });

  describe("error", () => {
    it("should write error payload with validation details", () => {
      const res = { status: vi.fn().mockReturnThis(), json: vi.fn() } as any;
      error(res, 400, "bad", [{ field: "email", message: "required" }]);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "bad",
        errors: [{ field: "email", message: "required" }]
      });
    });
  });
});
