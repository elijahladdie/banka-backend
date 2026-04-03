import type { NextFunction, Request, Response } from "express";
import jwt, { type SignOptions } from "jsonwebtoken";
import { env } from "../config/env";
import { prisma } from "../config/prisma";
import { isTokenBlacklisted } from "../config/redis";
import { error } from "../utils/response";

type TokenPayload = { sub: string; exp: number };

export function signAccessToken(userId: string) {
  const expiresIn = env.jwtExpiresIn as SignOptions["expiresIn"];
  return jwt.sign({ sub: userId }, env.jwtSecret, { expiresIn });
}

export async function authenticate(req: Request, res: Response, next: NextFunction) {
  const tokenFromCookie = req.cookies?.[env.cookieName] as string | undefined;
  const tokenFromHeader = req.headers.authorization?.startsWith("Bearer ")
    ? req.headers.authorization.slice(7)
    : undefined;
  const token = tokenFromCookie ?? tokenFromHeader;

  if (!token) {
    return error(res, 401, "Unauthorized");
  }

  const blacklisted = await isTokenBlacklisted(token);
  if (blacklisted) {
    return error(res, 401, "Token invalidated");
  }

  try {
    const payload = jwt.verify(token, env.jwtSecret) as TokenPayload;
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      include: { userRoles: { include: { role: true } } }
    });

    if (!user) {
      return error(res, 401, "Unauthorized");
    }

    req.authToken = token;
    req.user = user;
    next();
  } catch {
    return error(res, 401, "Invalid token");
  }
}

export function requireRole(...slugs: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return error(res, 401, "Unauthorized");
    }
    const userSlugs = req.user.userRoles.map((ur) => ur.role.slug);
    const hasRole = slugs.some((slug) => userSlugs.includes(slug));
    if (!hasRole) {
      return error(res, 403, "Forbidden");
    }
    next();
  };
}
