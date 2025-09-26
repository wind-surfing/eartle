import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";
import { SessionUser } from "@/types/User";
import {
  authenticateUser,
  createOrUpdateSocialUser,
} from "@/supabase/rpc/auth";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      id: "credentials",
      name: "credentials",
      credentials: {
        identifier: { label: "Email or Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials): Promise<SessionUser | null> {
        if (!credentials?.identifier || !credentials?.password) {
          return null;
        }

        try {
          const result = await authenticateUser({
            identifier: credentials.identifier,
            password: credentials.password,
          });

          if (result?.success && result.user) {
            return {
              id: result.user.id || "",
              email: result.user.email || "",
              username: result.user.username || "",
              displayName: result.user.displayName || result.user.username,
              avatar: result.user.avatar || null,
              emailVerified: Boolean(result.user.emailVerified),
              lastActiveAt: result.user.lastActiveAt || new Date(),
            };
          }
          return null;
        } catch (error) {
          console.error("Authentication error:", error);
          return null;
        }
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
    }),
  ].filter(Boolean),
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider !== "credentials") {
        try {
          console.log("Social sign-in attempt:", {
            provider: account?.provider,
            email: user.email,
            name: user.name,
            image: user.image,
          });

          const result = await createOrUpdateSocialUser({
            email: user.email!,
            name: user.name || (profile?.name as string) || user.email!,
            image: user.image || (profile?.image as string),
          });

          console.log("createOrUpdateSocialUser result:", result);

          if (result?.success && result.user) {
            user.id = result.user.id;
            user.email = result.user.email;
            user.name = result.user.displayName || result.user.username;
            user.image = result.user.avatar;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (user as any).username = result.user.username;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (user as any).displayName =
              result.user.displayName || result.user.username;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (user as any).avatar = result.user.avatar;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (user as any).emailVerified = Boolean(result.user.emailVerified);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (user as any).lastActiveAt = result.user.lastActiveAt || new Date();

            console.log("User object after social sign-in:", user);
            return true;
          } else {
            console.error("Failed to create/update social user:", result);
            return false;
          }
        } catch (error) {
          console.error("Social sign-in error:", error);
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id || "";
        token.email = user.email || "";
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        token.username = (user as any).username || "";
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        token.displayName = (user as any).displayName || user.name || "";
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        token.avatar = (user as any).avatar || user.image || null;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        token.emailVerified = Boolean((user as any).emailVerified) || false;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        token.lastActiveAt = (user as any).lastActiveAt || new Date();
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user = {
          id: token.id || "",
          email: token.email || "",
          username: token.username || "",
          displayName: token.displayName || token.username || "",
          avatar: token.avatar || null,
          emailVerified: Boolean(token.emailVerified) || false,
          lastActiveAt: token.lastActiveAt || new Date(),
        } as SessionUser;
      }
      return session;
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
    updateAge: 60 * 60,
  },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/authentication?mode=signin",
    error: "/api/auth/error",
  },
};
