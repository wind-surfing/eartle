export type DatabaseUser = {
  id: string;
  email: string;
  username: string;
  displayName: string;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  avatar: string | null;
  lastActiveAt: Date;
  password_hash: string;
  emailVerificationToken: string | null;
  passwordResetToken: string | null;
  passwordResetExpires: Date | null;
};

export interface User {
  id: string;
  email: string;
  username: string;
  displayName: string;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  avatar: string | null;
  lastActiveAt: Date;
}

export type SessionUser = {
  id: string;
  email: string;
  username: string;
  displayName: string;
  avatar: string | null;
  emailVerified: boolean;
  lastActiveAt: Date;
};

export const USER_FIELD_MAPPING = {
  id: "id",
  email: "email",
  username: "username",
  displayName: "displayName",
  emailVerified: "emailVerified",
  createdAt: "createdAt",
  updatedAt: "updatedAt",
  avatar: "avatar",
  lastActiveAt: "lastActiveAt",
} as const;

export type UserProfileUpdateFields = {
  username: string;
  displayName: string;
  avatar: string | null;
};

export type UserProfileUpdate = {
  username: string;
  displayName: string;
  avatar: string | null;
};

export type DefaultUserData = User;
