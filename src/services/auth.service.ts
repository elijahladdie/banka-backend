import bcrypt from "bcrypt";
import type { Request, Response } from "express";
import { env } from "../config/env";
import { success, error } from "../utils/response";
import { blacklistToken } from "../config/redis";
import { signAccessToken } from "../middleware/auth";
import { authRepository } from "../repositories/implementations/prismaAuth.repository";
import { createPasswordResetToken, hashPasswordResetToken } from "../utils/passwordReset";
import { sendMail } from "./mailer";
import { notificationService } from "./notification.service";
import { t } from "../i18n";

const setAuthCookie = (res: Response, token: string): void => {
  res.cookie(env.cookieName, token, {
    httpOnly: true,
    secure: env.cookieSecure,
    sameSite: "lax",
    maxAge: 24 * 60 * 60 * 1000
  });
};

const register = async (req: Request, res: Response): Promise<void> => {
  const payload = req.body;

  const existing = await authRepository.findExistingIdentity(payload);
  if (existing) {
    error(res, 409, t(req, "auth.emailOrIdentityExists"));
    return;
  }

  const clientRole = await authRepository.findClientRole();
  if (!clientRole) {
    error(res, 500, t(req, "auth.clientRoleNotSeeded"));
    return;
  }

  const hashedPassword = await bcrypt.hash(payload.password, 10);
  const user = await authRepository.createClientRegistration({
    ...payload,
    password: hashedPassword,
    roleId: clientRole.id
  });

  void notificationService.welcome({ receiverId: user.id });

  success(res, t(req, "auth.registrationPendingApproval"), {
    id: user.id,
    email: user.email,
    status: user.status
  });
};

const login = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  const user = await authRepository.findUserForLoginByEmail(email);
  if (!user) {
    error(res, 401, t(req, "auth.invalidCredentials"));
    return;
  }

  const validPassword = await bcrypt.compare(password, user.password);
  if (!validPassword) {
    error(res, 401, t(req, "auth.invalidCredentials"));
    return;
  }

  if (user.status !== "active") {
    error(res, 403, t(req, "auth.userStatusContactManager", { status: user.status }));
    return;
  }

  const token = signAccessToken(user.id);
  setAuthCookie(res, token);

  success(res, t(req, "auth.loginSuccessful"), {
    token,
    user: {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      preferredLanguage: user.preferredLanguage,
      status: user.status,
      roles: user.userRoles.map((item: { role: { slug: string } }) => item.role.slug)
    }
  });
};

const logout = async (req: Request, res: Response): Promise<void> => {
  const token = req.authToken;
  if (token) {
    await blacklistToken(token, 24 * 60 * 60);
  }
  res.clearCookie(env.cookieName);
  success(res, t(req, "auth.logoutSuccessful"), {});
};

const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  const { email } = req.body;

  const user = await authRepository.findUserByEmail(email);
  if (!user) {
    return success(res, t(req, "auth.resetLinkIfEmailExists"), {});
  }

  const { raw, hashed } = createPasswordResetToken();
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

  await authRepository.createPasswordResetToken({
    token: hashed,
    expiresAt,
    userId: user.id,
    ipAddress: req.ip
  });

  const resetUrl = `${env.frontendUrl}/reset-password?token=${raw}`;
  await sendMail(
    user.email,
    t(req, "auth.resetEmailSubject"),
    t(req, "auth.resetEmailBody", { resetUrl })
  );

  return success(res, t(req, "auth.resetLinkIfEmailExists"), {});
};

const resetPassword = async (req: Request, res: Response): Promise<void> => {
  const { token, newPassword } = req.body;
  const hashedToken = hashPasswordResetToken(token);

  const record = await authRepository.findResetToken(hashedToken);
  if (!record || record.isUsed || record.expiresAt < new Date()) {
    error(res, 400, t(req, "auth.invalidOrExpiredToken"));
    return;
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await authRepository.updatePasswordAndConsumeResetToken({
    userId: record.userId,
    password: hashedPassword,
    tokenId: record.id
  });

  await notificationService.passwordChanged({ receiverId: record.userId });

  return success(res, t(req, "auth.passwordResetSuccessful"), {});
};

const changePassword = async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    error(res, 401, t(req, "common.unauthorized"));
    return;
  }

  const { currentPassword, newPassword } = req.body;

  const user = await authRepository.findUserById(req.user.id);
  if (!user) {
    error(res, 404, t(req, "auth.userNotFound"));
    return;
  }

  const validPassword = await bcrypt.compare(currentPassword, user.password);
  if (!validPassword) {
    error(res, 400, t(req, "auth.currentPasswordIncorrect"));
    return;
  }

  const isSamePassword = await bcrypt.compare(newPassword, user.password);
  if (isSamePassword) {
    error(res, 400, t(req, "auth.newPasswordMustDiffer"));
    return;
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await authRepository.updateUserPassword({ userId: req.user.id, password: hashedPassword });

  await notificationService.passwordChanged({ receiverId: req.user.id });

  return success(res, t(req, "auth.passwordChangedSuccessfully"), {});
};

const me = async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    error(res, 401, t(req, "common.unauthorized"));
    return;
  }

  return success(res, t(req, "auth.currentUserFetched"), {
    id: req.user.id,
    createdAt: req.user.createdAt,
    firstName: req.user.firstName,
    lastName: req.user.lastName,
    email: req.user.email,
    preferredLanguage: req.user.preferredLanguage,
    profilePicture: req.user.profilePicture,
    phoneNumber: req.user.phoneNumber,
    nationalId: req.user.nationalId,
    status: req.user.status,
    roles: req.user.userRoles.map((item: { role: { slug: string } }) => item.role.slug)
  });
};

export const authService = { register, login, logout, forgotPassword, resetPassword, changePassword, me };
