import { describe, expect, it } from "vitest";
import { getPrimaryUserRole, getUserRoles } from "../../../src/utils/roles";

describe("roles util", () => {
  describe("getUserRoles", () => {
    it("should extract role slugs from user-role objects", () => {
      const roles = [{ role: { slug: "manager" } }, { role: { slug: "client" } }] as any;
      expect(getUserRoles(roles)).toEqual(["manager", "client"]);
    });
  });

  describe("getPrimaryUserRole", () => {
    it("should fall back to client when user has no roles", () => {
      expect(getPrimaryUserRole([] as any)).toBe("client");
    });
  });
});
