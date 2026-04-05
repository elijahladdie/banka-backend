import { beforeEach, describe, expect, it, vi } from "vitest";

const mocked = vi.hoisted(() => ({
  env: {
    cookieName: "token",
    cookieSecure: false,
    frontendUrl: "http://localhost:3000"
  },
  repo: {
    findExistingIdentity: vi.fn(),
    findClientRole: vi.fn(),
    createClientRegistration: vi.fn(),
    findUserForLoginByEmail: vi.fn(),
    findUserByEmail: vi.fn(),
    createPasswordResetToken: vi.fn(),
    findResetToken: vi.fn(),
    updatePasswordAndConsumeResetToken: vi.fn(),
    findUserById: vi.fn(),
    updateUserPassword: vi.fn()
  },
  bcrypt: {
    hash: vi.fn(),
    compare: vi.fn()
  },
  success: vi.fn(),
  error: vi.fn(),
  blacklistToken: vi.fn(),
  signAccessToken: vi.fn(),
  createPasswordResetToken: vi.fn(),
  hashPasswordResetToken: vi.fn(),
  sendMail: vi.fn(),
  notificationService: {
    welcome: vi.fn(),
    passwordChanged: vi.fn()
  }
}));

vi.mock("../../../src/config/env", () => ({ env: mocked.env }));
vi.mock("../../../src/repositories/implementations/prismaAuth.repository", () => ({
  authRepository: mocked.repo
}));
vi.mock("bcrypt", () => ({ default: mocked.bcrypt }));
vi.mock("../../../src/utils/response", () => ({ success: mocked.success, error: mocked.error }));
vi.mock("../../../src/config/redis", () => ({ blacklistToken: mocked.blacklistToken }));
vi.mock("../../../src/middleware/auth", () => ({ signAccessToken: mocked.signAccessToken }));
vi.mock("../../../src/utils/passwordReset", () => ({
  createPasswordResetToken: mocked.createPasswordResetToken,
  hashPasswordResetToken: mocked.hashPasswordResetToken
}));
vi.mock("../../../src/services/mailer", () => ({ sendMail: mocked.sendMail }));
vi.mock("../../../src/services/notification.service", () => ({
  notificationService: mocked.notificationService
}));

describe("auth service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("register", () => {
    it("should block registration when identity already exists", async () => {
      mocked.repo.findExistingIdentity.mockResolvedValue({ id: "u1" });
      const { authService } = await import("../../../src/services/auth.service");

      await authService.register({ body: { email: "a@b.com" } } as any, {} as any);
      expect(mocked.error).toHaveBeenCalledWith({}, 409, "Email or identity already exists");
    });
  });

  describe("login", () => {
    it("should log in active user and set cookie with token", async () => {
      const res = { cookie: vi.fn() } as any;
      mocked.repo.findUserForLoginByEmail.mockResolvedValue({
        id: "u1",
        password: "hash",
        status: "active",
        firstName: "A",
        lastName: "B",
        email: "a@b.com",
        userRoles: [{ role: { slug: "client" } }]
      });
      mocked.bcrypt.compare.mockResolvedValue(true);
      mocked.signAccessToken.mockReturnValue("jwt-token");

      const { authService } = await import("../../../src/services/auth.service");
      await authService.login({ body: { email: "a@b.com", password: "x" } } as any, res);

      expect(res.cookie).toHaveBeenCalled();
      expect(mocked.success).toHaveBeenCalled();
    });
  });

  describe("changePassword", () => {
    it("should reject when new password equals current password", async () => {
      mocked.repo.findUserById.mockResolvedValue({ id: "u1", password: "hash" });
      mocked.bcrypt.compare.mockResolvedValue(true);
      const { authService } = await import("../../../src/services/auth.service");

      await authService.changePassword(
        { user: { id: "u1" }, body: { currentPassword: "x", newPassword: "x" } } as any,
        {} as any
      );

      expect(mocked.error).toHaveBeenCalledWith(
        {},
        400,
        "New password must be different from current password"
      );
    });
  });
});
