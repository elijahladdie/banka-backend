export type UserWithRoles = any;

export interface AuthRepository {
  findUserForLoginByEmail(email: string): Promise<UserWithRoles | null>;
  findUserByEmail(email: string): Promise<any>;
  findUserByIdWithRoles(id: string): Promise<UserWithRoles | null>;
  findClientRole(): Promise<any>;
  createClientRegistration(data: {
    firstName: string;
    lastName?: string;
    email: string;
    phoneNumber?: string;
    nationalId: string;
    password: string;
    age: number;
    profilePicture?: string;
    roleId: string;
  }): Promise<UserWithRoles>;
  createPasswordResetToken(data: {
    token: string;
    expiresAt: Date;
    userId: string;
    ipAddress?: string;
  }): Promise<any>;
  findResetToken(token: string): Promise<any>;
  updatePasswordAndConsumeResetToken(data: {
    userId: string;
    password: string;
    tokenId: string;
  }): Promise<void>;
  findExistingIdentity(data: { email: string; nationalId: string; phoneNumber?: string }): Promise<any>;
}
