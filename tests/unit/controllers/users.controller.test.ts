import { beforeEach, describe, expect, it, vi } from "vitest";

const mocked = vi.hoisted(() => ({
  req: {} as any,
  res: {} as any,
  usersService: {
    listUsers: vi.fn(),
    createUser: vi.fn(),
    getUserById: vi.fn(),
    updateUser: vi.fn(),
    updateUserStatus: vi.fn(),
    changeUserPassword: vi.fn(),
    softDeleteUser: vi.fn()
  }
}));

vi.mock("../../../src/services/users.service", () => ({ usersService: mocked.usersService }));

describe("users controller", () => {
  beforeEach(() => vi.clearAllMocks());

  describe("listUsers", () => {
    it("should delegate to usersService.listUsers", async () => {
      const controller = await import("../../../src/controllers/users.controller");
      await controller.listUsers(mocked.req, mocked.res);
      expect(mocked.usersService.listUsers).toHaveBeenCalledWith(mocked.req, mocked.res);
    });

    it("should propagate service errors", async () => {
      mocked.usersService.listUsers.mockRejectedValueOnce(new Error("list failed"));
      const controller = await import("../../../src/controllers/users.controller");
      await expect(controller.listUsers(mocked.req, mocked.res)).rejects.toThrow("list failed");
    });
  });

  describe("createUser", () => {
    it("should delegate to usersService.createUser", async () => {
      const controller = await import("../../../src/controllers/users.controller");
      await controller.createUser(mocked.req, mocked.res);
      expect(mocked.usersService.createUser).toHaveBeenCalledWith(mocked.req, mocked.res);
    });
  });

  describe("getUserById", () => {
    it("should delegate to usersService.getUserById", async () => {
      const controller = await import("../../../src/controllers/users.controller");
      await controller.getUserById(mocked.req, mocked.res);
      expect(mocked.usersService.getUserById).toHaveBeenCalledWith(mocked.req, mocked.res);
    });
  });

  describe("updateUser", () => {
    it("should delegate to usersService.updateUser", async () => {
      const controller = await import("../../../src/controllers/users.controller");
      await controller.updateUser(mocked.req, mocked.res);
      expect(mocked.usersService.updateUser).toHaveBeenCalledWith(mocked.req, mocked.res);
    });
  });

  describe("updateUserStatus", () => {
    it("should delegate to usersService.updateUserStatus", async () => {
      const controller = await import("../../../src/controllers/users.controller");
      await controller.updateUserStatus(mocked.req, mocked.res);
      expect(mocked.usersService.updateUserStatus).toHaveBeenCalledWith(mocked.req, mocked.res);
    });
  });

  describe("changeUserPassword", () => {
    it("should delegate to usersService.changeUserPassword", async () => {
      const controller = await import("../../../src/controllers/users.controller");
      await controller.changeUserPassword(mocked.req, mocked.res);
      expect(mocked.usersService.changeUserPassword).toHaveBeenCalledWith(mocked.req, mocked.res);
    });
  });

  describe("softDeleteUser", () => {
    it("should delegate to usersService.softDeleteUser", async () => {
      const controller = await import("../../../src/controllers/users.controller");
      await controller.softDeleteUser(mocked.req, mocked.res);
      expect(mocked.usersService.softDeleteUser).toHaveBeenCalledWith(mocked.req, mocked.res);
    });
  });
});
