import { JWT as DefaultJWT } from "next-auth/jwt";
import { SessionUser } from "@/types/User";

declare module "next-auth" {
  interface Session {
    user: SessionUser;
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface User extends SessionUser {}
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id?: string;
    email?: string;
    username?: string;
    displayName?: string;
    role?: string;
    theme?: string;
    avatar?: string | null;
    emailVerified?: boolean;
    lastActiveAt?: Date;
  }
}
