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
    error(res, 409, "Email or identity already exists");
    return;
  }

  const clientRole = await authRepository.findClientRole();
  if (!clientRole) {
    error(res, 500, "Client role not seeded");
    return;
  }

  const hashedPassword = await bcrypt.hash(payload.password, 10);
  const user = await authRepository.createClientRegistration({
    ...payload,
    password: hashedPassword,
    roleId: clientRole.id
  });

  void notificationService.welcome({ receiverId: user.id });

  success(res, "Registration successful. Account pending approval", {
    id: user.id,
    email: user.email,
    status: user.status
  });
};

const login = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  const user = await authRepository.findUserForLoginByEmail(email);
  if (!user) {
    error(res, 401, "Invalid credentials");
    return;
  }

  const validPassword = await bcrypt.compare(password, user.password);
  if (!validPassword) {
    error(res, 401, "Invalid credentials");
    return;
  }

  if (user.status !== "active") {
    error(res, 403, `User status is ${user.status}, Contact Manager`);
    return;
  }

  const token = signAccessToken(user.id);
  setAuthCookie(res, token);

  success(res, "Login successful", {
    token,
    user: {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
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
  success(res, "Logout successful", {});
};

const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  const { email } = req.body;

  const user = await authRepository.findUserByEmail(email);
  if (!user) {
   return success(res, "If the email exists, a reset link has been sent", {});
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
  await sendMail(user.email, "Password reset", `Reset your password: ${resetUrl}`);

  return success(res, "If the email exists, a reset link has been sent", {});
};

const resetPassword = async (req: Request, res: Response): Promise<void> => {
  const { token, newPassword } = req.body;
  const hashedToken = hashPasswordResetToken(token);

  const record = await authRepository.findResetToken(hashedToken);
  if (!record || record.isUsed || record.expiresAt < new Date()) {
    error(res, 400, "Invalid or expired token");
    return;
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await authRepository.updatePasswordAndConsumeResetToken({
    userId: record.userId,
    password: hashedPassword,
    tokenId: record.id
  });

  await notificationService.passwordChanged({ receiverId: record.userId });

  return success(res, "Password reset successful", {});
};

const changePassword = async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    error(res, 401, "Unauthorized");
    return;
  }

  const { currentPassword, newPassword } = req.body;

  const user = await authRepository.findUserById(req.user.id);
  if (!user) {
    error(res, 404, "User not found");
    return;
  }

  const validPassword = await bcrypt.compare(currentPassword, user.password);
  if (!validPassword) {
    error(res, 400, "Current password is incorrect");
    return;
  }

  const isSamePassword = await bcrypt.compare(newPassword, user.password);
  if (isSamePassword) {
    error(res, 400, "New password must be different from current password");
    return;
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await authRepository.updateUserPassword({ userId: req.user.id, password: hashedPassword });

  await notificationService.passwordChanged({ receiverId: req.user.id });

  return success(res, "Password changed successfully", {});
};

const me = async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    error(res, 401, "Unauthorized");
    return;
  }

  return success(res, "Current user fetched", {
    id: req.user.id,
    createdAt: req.user.createdAt,
    firstName: req.user.firstName,
    lastName: req.user.lastName,
    email: req.user.email,
    profilePicture: req.user.profilePicture,
    phoneNumber: req.user.phoneNumber,
    nationalId: req.user.nationalId,
    status: req.user.status,
    roles: req.user.userRoles.map((item: { role: { slug: string } }) => item.role.slug)
  });
};

export const authService = { register, login, logout, forgotPassword, resetPassword, changePassword, me };
