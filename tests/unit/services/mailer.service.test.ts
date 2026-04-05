import { beforeEach, describe, expect, it, vi } from "vitest";

const mocked = vi.hoisted(() => ({
  env: {
    smtpHost: "smtp.test",
    smtpPort: 587,
    smtpUser: "user",
    smtpPass: "pass",
    smtpFrom: "noreply@test.com"
  },
  transporter: {
    sendMail: vi.fn()
  },
  createTransport: vi.fn()
}));

vi.mock("../../../src/config/env", () => ({ env: mocked.env }));
vi.mock("nodemailer", () => ({
  default: {
    createTransport: mocked.createTransport
  }
}));

describe("mailer service", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    mocked.createTransport.mockReturnValue(mocked.transporter);
    mocked.env.smtpHost = "smtp.test";
    mocked.env.smtpFrom = "noreply@test.com";
  });

  describe("sendMail", () => {
    it("should send mail when smtp configuration is available", async () => {
      const { sendMail } = await import("../../../src/services/mailer");
      await sendMail("user@test.com", "Hello", "Body");

      expect(mocked.createTransport).toHaveBeenCalled();
      expect(mocked.transporter.sendMail).toHaveBeenCalledWith({
        from: "noreply@test.com",
        to: "user@test.com",
        subject: "Hello",
        text: "Body"
      });
    });

    it("should skip sending when smtp host is missing", async () => {
      mocked.env.smtpHost = undefined as unknown as string;
      const { sendMail } = await import("../../../src/services/mailer");
      await sendMail("user@test.com", "Hello", "Body");
      expect(mocked.transporter.sendMail).not.toHaveBeenCalled();
    });
  });
});
