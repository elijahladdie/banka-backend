/**
 * Search helper utility for building Prisma search conditions
 */

export interface SearchCondition {
  contains: string;
  mode: "insensitive" | "default";
}

export interface SearchOptions {
  searchTerm: string;
  fields: readonly string[];
  mode?: "insensitive" | "default";
}

type SearchMode = "insensitive" | "default";

const buildNestedSearchCondition = (field: string, searchTerm: string, mode: SearchMode): Record<string, unknown> => {
  const path = field.split(".").filter(Boolean);
  if (path.length === 0) {
    return {};
  }

  const leaf: SearchCondition = {
    contains: searchTerm,
    mode,
  };

  return path
    .slice()
    .reverse()
    .reduce<Record<string, unknown>>((acc, segment) => ({ [segment]: acc }), leaf as unknown as Record<string, unknown>);
};

/**
 * Builds a Prisma OR condition for searching across multiple fields
 * @param options - Search configuration options
 * @returns Prisma OR condition object
 */
export function buildSearchCondition(
  options: SearchOptions,
): { OR: Record<string, unknown>[] } | Record<string, unknown> {
  const { searchTerm, fields, mode = "insensitive" } = options;

  if (!searchTerm?.trim() || !fields?.length) {
    return {};
  }

  const trimmedSearchTerm = searchTerm.trim();
  const orConditions = fields.map((field) => buildNestedSearchCondition(field, trimmedSearchTerm, mode));

  return { OR: orConditions };
}

/**
 * Predefined searchable fields for entities in prisma schema.
 * Only string-like fields are included.
 */
const USERS_SEARCHABLE_FIELDS = ["firstName", "lastName", "email", "phoneNumber", "nationalId"] as const;
const ACCOUNTS_SEARCHABLE_FIELDS = ["accountNumber"] as const;
const TRANSACTIONS_SEARCHABLE_FIELDS = [
  "reference",
  "description",
  "currency",
  "failureReason",
  "reversalReason",
  "sourceAccount.accountNumber",
  "destinationAccount.accountNumber",
] as const;
const NOTIFICATIONS_SEARCHABLE_FIELDS = ["title", "message"] as const;
const ROLES_SEARCHABLE_FIELDS = ["name", "slug", "description"] as const;
const AUDIT_LOGS_SEARCHABLE_FIELDS = ["entity", "entityId", "ipAddress", "userAgent", "notes"] as const;

export const SEARCHABLE_FIELDS = {
  users: USERS_SEARCHABLE_FIELDS,
  accounts: ACCOUNTS_SEARCHABLE_FIELDS,
  transactions: TRANSACTIONS_SEARCHABLE_FIELDS,
  notifications: NOTIFICATIONS_SEARCHABLE_FIELDS,
  roles: ROLES_SEARCHABLE_FIELDS,
  auditLogs: AUDIT_LOGS_SEARCHABLE_FIELDS,
} as const;

export type SearchableEntity = keyof typeof SEARCHABLE_FIELDS;

/**
 * Generic entity search helper for any key in SEARCHABLE_FIELDS
 */
export function buildEntitySearchCondition(
  searchTerm: string,
  entity: SearchableEntity,
  mode: SearchMode = "insensitive",
) {
  return buildSearchCondition({
    searchTerm,
    fields: SEARCHABLE_FIELDS[entity],
    mode,
  });
}

export function buildUsersSearchCondition(searchTerm: string) {
  return buildEntitySearchCondition(searchTerm, "users", "insensitive");
}

export function buildAccountsSearchCondition(searchTerm: string) {
  return buildEntitySearchCondition(searchTerm, "accounts", "insensitive");
}

export function buildTransactionsSearchCondition(searchTerm: string) {
  return buildEntitySearchCondition(searchTerm, "transactions", "insensitive");
}
