import { describe, expect, it } from "vitest";
import {
  buildAccountsSearchCondition,
  buildEntitySearchCondition,
  buildSearchCondition,
  buildTransactionsSearchCondition,
  buildUsersSearchCondition
} from "../../../src/utils/search.helper";

describe("search.helper util", () => {
  describe("buildSearchCondition", () => {
    it("should build nested OR conditions", () => {
      expect(
        buildSearchCondition({ searchTerm: "john", fields: ["sourceAccount.accountNumber"] })
      ).toEqual({
        OR: [{ sourceAccount: { accountNumber: { contains: "john", mode: "insensitive" } } }]
      });
    });

    it("should return empty condition when search term is blank", () => {
      expect(buildSearchCondition({ searchTerm: " ", fields: ["email"] })).toEqual({});
    });
  });

  describe("entity builders", () => {
    it("should build entity-based search conditions", () => {
      expect(buildEntitySearchCondition("a", "users")).toHaveProperty("OR");
      expect(buildUsersSearchCondition("a")).toHaveProperty("OR");
      expect(buildAccountsSearchCondition("a")).toHaveProperty("OR");
      expect(buildTransactionsSearchCondition("a")).toHaveProperty("OR");
    });
  });
});
