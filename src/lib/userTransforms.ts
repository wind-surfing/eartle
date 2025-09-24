import {
  DatabaseUser,
  User,
  SessionUser,
  USER_FIELD_MAPPING,
} from "@/types/User";

export function transformDatabaseUserToUser(dbUser: DatabaseUser): User {
  return {
    id: dbUser.id,
    email: dbUser.email,
    username: dbUser.username,
    displayName: dbUser.displayName,
    emailVerified: dbUser.emailVerified,
    createdAt: dbUser.createdAt,
    updatedAt: dbUser.updatedAt,
    avatar: dbUser.avatar,
    lastActiveAt: dbUser.lastActiveAt,
    bio: dbUser.bio,
  };
}

export function transformDatabaseUserToSessionUser(dbUser: DatabaseUser): SessionUser {
  return {
    id: dbUser.id,
    email: dbUser.email,
    username: dbUser.username,
    displayName: dbUser.displayName,
    avatar: dbUser.avatar,
    emailVerified: dbUser.emailVerified,
    lastActiveAt: dbUser.lastActiveAt,
  };
}

export function parseUserFromDatabase(rawData: Record<string, unknown>): User {
  if (!rawData || typeof rawData !== 'object') {
    throw new Error('Invalid user data from database');
  }

  try {
    return {
    id: String(rawData.id || ""),
    email: String(rawData.email || ""),
    username: String(rawData.username || ""),
    displayName: String(rawData.displayName || ""),
    emailVerified: Boolean(rawData.emailVerified),
    createdAt: rawData.createdAt
      ? new Date(String(rawData.createdAt))
      : new Date(),
    updatedAt: rawData.updatedAt
      ? new Date(String(rawData.updatedAt))
      : new Date(),
    role: String(rawData.role || ""),
    theme: String(rawData.theme || ""),
    avatar: String(rawData.avatar || ""),
    lastActiveAt: rawData.lastActiveAt
      ? new Date(String(rawData.lastActiveAt))
      : new Date(),
    bio: String(rawData.bio || ""),
    skills: Array.isArray(rawData.skills) ? rawData.skills : [],
    preferences: Array.isArray(rawData.preferences) ? rawData.preferences : [],
    };
  } catch (error) {
    console.error('Failed to parse user data:', error);
    throw new Error('Failed to parse user data from database');
  }
}

export const getUserFieldMapping = () => USER_FIELD_MAPPING;
