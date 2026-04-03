import type { User, UserRole, Role } from "@prisma/client";

declare global {
  namespace Express {
    interface Request {
      requestId?: string;
      authToken?: string;
      user?: User & { userRoles: (UserRole & { role: Role })[] };
    }
  }
}

export {};
