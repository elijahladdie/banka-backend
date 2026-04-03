import type { Role, UserRole } from "@prisma/client";

export function getUserRoles(userRoles: (UserRole & { role: Role })[]) {
  return userRoles.map((ur) => ur.role.slug);
}

export function getPrimaryUserRole(userRoles: (UserRole & { role: Role })[]) {
  return userRoles[0]?.role.slug ?? "client";
}
