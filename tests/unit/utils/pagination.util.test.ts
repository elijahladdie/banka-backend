import { describe, expect, it } from "vitest";
import { paginationMeta, parsePagination } from "../../../src/utils/pagination";

describe("pagination util", () => {
  describe("parsePagination", () => {
    it("should parse valid pagination input", () => {
      expect(parsePagination({ page: "2", limit: "20" })).toEqual({ page: 2, limit: 20, skip: 20 });
    });

    it("should clamp invalid pagination input", () => {
      expect(parsePagination({ page: "0", limit: "500" })).toEqual({
        page: 1,
        limit: 100,
        skip: 0
      });
    });
  });

  describe("paginationMeta", () => {
    it("should compute pagination metadata", () => {
      expect(paginationMeta(2, 10, 15)).toEqual({
        page: 2,
        limit: 10,
        total: 15,
        totalPages: 2,
        hasNext: false,
        hasPrev: true
      });
    });
  });
});
