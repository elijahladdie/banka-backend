export type UserStatus = "active" | "inactive" | "suspended" | "pending_approval";
export type AccountStatus = "Active" | "Inactive" | "Dormant";
export type AccountType = "saving" | "fixed";
export type TransactionType = "deposit" | "withdraw" | "transfer";
export type TransactionStatus = "completed" | "failed" | "pending" | "reversed";

export type RoleRecord = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
};

export type UserRoleRecord = {
  role: {
    slug: string;
  };
};

export type UserRecord = {
  id: string;
  firstName: string;
  lastName?: string | null;
  email: string;
  phoneNumber?: string | null;
  nationalId: string;
  preferredLanguage?: string;
  status: UserStatus;
  age: number;
  profilePicture?: string | null;
  password: string;
  createdAt: Date;
  userRoles?: UserRoleRecord[];
};

export type AccountRecord = {
  id: string;
  ownerId: string;
  accountNumber: string;
  status: AccountStatus;
  type: AccountType;
  createdBy: string;
  createdAt: Date;
};

export type PasswordResetTokenRecord = {
  id: string;
  token: string;
  expiresAt: Date;
  isUsed: boolean;
  userId: string;
};
