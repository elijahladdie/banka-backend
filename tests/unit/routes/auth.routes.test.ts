import { describe, expect, it, vi } from "vitest";

const mocked = vi.hoisted(() => ({
  router: {
    use: vi.fn(),
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn()
  },
  authenticate: { name: "authenticate" },
  register: { name: "register" },
  login: { name: "login" },
  logout: { name: "logout" },
  forgotPassword: { name: "forgotPassword" },
  resetPassword: { name: "resetPassword" },
  changePassword: { name: "changePassword" },
  me: { name: "me" },
  registerSchema: { name: "registerSchema" },
  loginSchema: { name: "loginSchema" },
  forgotPasswordSchema: { name: "forgotPasswordSchema" },
  resetPasswordSchema: { name: "resetPasswordSchema" },
  changePasswordSchema: { name: "changePasswordSchema" },
  validate: vi.fn((schema: unknown) => ({ type: "validate", schema })),
  asyncWrapper: vi.fn((handler: unknown) => ({ type: "wrapped", handler }))
}));

vi.mock("express", () => ({
  Router: vi.fn(() => mocked.router)
}));

vi.mock("../../../src/controllers/auth.controller", () => ({
  register: mocked.register,
  login: mocked.login,
  logout: mocked.logout,
  forgotPassword: mocked.forgotPassword,
  resetPassword: mocked.resetPassword,
  changePassword: mocked.changePassword,
  me: mocked.me
}));

vi.mock("../../../src/middleware/auth", () => ({
  authenticate: mocked.authenticate
}));

vi.mock("../../../src/middleware/validate", () => ({
  validate: mocked.validate
}));

vi.mock("../../../src/utils/asyncWrapper", () => ({
  asyncWrapper: mocked.asyncWrapper
}));

vi.mock("../../../src/validators/auth.validator", () => ({
  registerSchema: mocked.registerSchema,
  loginSchema: mocked.loginSchema,
  forgotPasswordSchema: mocked.forgotPasswordSchema,
  resetPasswordSchema: mocked.resetPasswordSchema,
  changePasswordSchema: mocked.changePasswordSchema
}));

describe("routes/auth", () => {
  it("registers auth routes with required validation/auth middlewares and wrapped controllers", async () => {
    const { default: router } = await import("../../../src/routes/auth.routes");

    expect(router).toBe(mocked.router);

    expect(mocked.router.post).toHaveBeenCalledTimes(6);
    expect(mocked.router.get).toHaveBeenCalledTimes(1);
    expect(mocked.router.use).not.toHaveBeenCalled();

    expect(mocked.validate).toHaveBeenCalledTimes(5);
    expect(mocked.validate).toHaveBeenNthCalledWith(1, mocked.registerSchema);
    expect(mocked.validate).toHaveBeenNthCalledWith(2, mocked.loginSchema);
    expect(mocked.validate).toHaveBeenNthCalledWith(3, mocked.forgotPasswordSchema);
    expect(mocked.validate).toHaveBeenNthCalledWith(4, mocked.resetPasswordSchema);
    expect(mocked.validate).toHaveBeenNthCalledWith(5, mocked.changePasswordSchema);

    expect(mocked.asyncWrapper).toHaveBeenCalledTimes(7);
    expect(mocked.asyncWrapper).toHaveBeenNthCalledWith(1, mocked.register);
    expect(mocked.asyncWrapper).toHaveBeenNthCalledWith(2, mocked.login);
    expect(mocked.asyncWrapper).toHaveBeenNthCalledWith(3, mocked.logout);
    expect(mocked.asyncWrapper).toHaveBeenNthCalledWith(4, mocked.forgotPassword);
    expect(mocked.asyncWrapper).toHaveBeenNthCalledWith(5, mocked.resetPassword);
    expect(mocked.asyncWrapper).toHaveBeenNthCalledWith(6, mocked.changePassword);
    expect(mocked.asyncWrapper).toHaveBeenNthCalledWith(7, mocked.me);

    expect(mocked.router.post).toHaveBeenNthCalledWith(
      1,
      "/register",
      { type: "validate", schema: mocked.registerSchema },
      { type: "wrapped", handler: mocked.register }
    );
    expect(mocked.router.post).toHaveBeenNthCalledWith(
      2,
      "/login",
      { type: "validate", schema: mocked.loginSchema },
      { type: "wrapped", handler: mocked.login }
    );
    expect(mocked.router.post).toHaveBeenNthCalledWith(3, "/logout", mocked.authenticate, {
      type: "wrapped",
      handler: mocked.logout
    });
    expect(mocked.router.post).toHaveBeenNthCalledWith(
      4,
      "/forgot-password",
      { type: "validate", schema: mocked.forgotPasswordSchema },
      { type: "wrapped", handler: mocked.forgotPassword }
    );
    expect(mocked.router.post).toHaveBeenNthCalledWith(
      5,
      "/reset-password",
      { type: "validate", schema: mocked.resetPasswordSchema },
      { type: "wrapped", handler: mocked.resetPassword }
    );
    expect(mocked.router.post).toHaveBeenNthCalledWith(
      6,
      "/change-password",
      mocked.authenticate,
      { type: "validate", schema: mocked.changePasswordSchema },
      { type: "wrapped", handler: mocked.changePassword }
    );
    expect(mocked.router.get).toHaveBeenNthCalledWith(1, "/me", mocked.authenticate, {
      type: "wrapped",
      handler: mocked.me
    });
  });
});
