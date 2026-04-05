import { beforeEach, describe, expect, it, vi } from "vitest";

const mocked = vi.hoisted(() => ({
  req: {} as any,
  res: {} as any,
  authService: {
    register: vi.fn(),
    login: vi.fn(),
    logout: vi.fn(),
    forgotPassword: vi.fn(),
    resetPassword: vi.fn(),
    changePassword: vi.fn(),
    me: vi.fn()
  }
}));

vi.mock("../../../src/services/auth.service", () => ({ authService: mocked.authService }));

describe("auth controller", () => {
  beforeEach(() => vi.clearAllMocks());

  describe("register", () => {
    it("should delegate to authService.register", async () => {
      const controller = await import("../../../src/controllers/auth.controller");
      await controller.register(mocked.req, mocked.res);
      expect(mocked.authService.register).toHaveBeenCalledWith(mocked.req, mocked.res);
    });

    it("should propagate service errors", async () => {
      mocked.authService.register.mockRejectedValueOnce(new Error("register failed"));
      const controller = await import("../../../src/controllers/auth.controller");
      await expect(controller.register(mocked.req, mocked.res)).rejects.toThrow("register failed");
    });
  });

  describe("login", () => {
    it("should delegate to authService.login", async () => {
      const controller = await import("../../../src/controllers/auth.controller");
      await controller.login(mocked.req, mocked.res);
      expect(mocked.authService.login).toHaveBeenCalledWith(mocked.req, mocked.res);
    });

    it("should propagate service errors", async () => {
      mocked.authService.login.mockRejectedValueOnce(new Error("login failed"));
      const controller = await import("../../../src/controllers/auth.controller");
      await expect(controller.login(mocked.req, mocked.res)).rejects.toThrow("login failed");
    });
  });

  describe("logout", () => {
    it("should delegate to authService.logout", async () => {
      const controller = await import("../../../src/controllers/auth.controller");
      await controller.logout(mocked.req, mocked.res);
      expect(mocked.authService.logout).toHaveBeenCalledWith(mocked.req, mocked.res);
    });
  });

  describe("forgotPassword", () => {
    it("should delegate to authService.forgotPassword", async () => {
      const controller = await import("../../../src/controllers/auth.controller");
      await controller.forgotPassword(mocked.req, mocked.res);
      expect(mocked.authService.forgotPassword).toHaveBeenCalledWith(mocked.req, mocked.res);
    });
  });

  describe("resetPassword", () => {
    it("should delegate to authService.resetPassword", async () => {
      const controller = await import("../../../src/controllers/auth.controller");
      await controller.resetPassword(mocked.req, mocked.res);
      expect(mocked.authService.resetPassword).toHaveBeenCalledWith(mocked.req, mocked.res);
    });
  });

  describe("changePassword", () => {
    it("should delegate to authService.changePassword", async () => {
      const controller = await import("../../../src/controllers/auth.controller");
      await controller.changePassword(mocked.req, mocked.res);
      expect(mocked.authService.changePassword).toHaveBeenCalledWith(mocked.req, mocked.res);
    });
  });

  describe("me", () => {
    it("should delegate to authService.me", async () => {
      const controller = await import("../../../src/controllers/auth.controller");
      await controller.me(mocked.req, mocked.res);
      expect(mocked.authService.me).toHaveBeenCalledWith(mocked.req, mocked.res);
    });
  });
});
