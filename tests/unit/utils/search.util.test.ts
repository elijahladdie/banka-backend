import { describe, expect, it } from "vitest";
import { generateSearchConditions } from "../../../src/utils/search";

describe("search util", () => {
  describe("generateSearchConditions", () => {
    it("should create OR search conditions when query exists", () => {
      expect(generateSearchConditions({ query: "john", fields: ["firstName", "email"] })).toEqual({
        OR: [
          { firstName: { contains: "john", mode: "insensitive" } },
          { email: { contains: "john", mode: "insensitive" } }
        ]
      });
    });

    it("should return empty object when query is missing", () => {
      expect(generateSearchConditions({ query: undefined, fields: ["email"] })).toEqual({});
    });
  });
});
