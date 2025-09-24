"use client";
import React, { createContext, useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { SessionUser } from "@/types/User";
import { UserContextType, UserProviderProps } from "@/types/UserContext";
import { getUserByUsername } from "@/supabase/rpc/auth";

const UserContext = createContext<UserContextType | undefined>(undefined);

const UserProvider = ({ children }: UserProviderProps) => {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);
  const { data: session, status } = useSession();

  useEffect(() => {
    const loadUserFromStorage = () => {
      try {
        const savedUser = localStorage.getItem("user");
        if (savedUser) {
          const parsedUser = JSON.parse(savedUser) as SessionUser;
          console.log("Loaded user from localStorage:", parsedUser);
          setUser(parsedUser);
        }
      } catch (error) {
        console.warn("Failed to load user from localStorage:", error);
        localStorage.removeItem("user");
      }
    };

    if (status === "loading") {
      loadUserFromStorage();
    }
  }, [status]);

  const fetchUserData = async (username: string) => {
    if (!username) return;
    setLoading(true);
    try {
      const user = await getUserByUsername(username);
      if (user) {
        setUser(user);
        try {
          localStorage.setItem("user", JSON.stringify(user));
        } catch {}
      }
    } catch (error) {
      console.error("Failed to fetch user data:", error);
    } finally {
      setLoading(false);
    }
  };

  const logoutUser = async () => {
    setLoading(true);
    try {
      setUser(null);
      localStorage.removeItem("user");
    } catch (error) {
      console.log("Failed to remove user", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);

    if (status === "loading") {
      setLoading(true);
      return;
    }

    if (status === "authenticated" && session?.user) {
      const sUser = session.user;
      const mapped: SessionUser = {
        id: sUser.id ?? "",
        email: sUser.email ?? "",
        username: sUser.username || "",
        displayName: sUser.displayName ?? "",
        avatar: sUser.avatar ?? null,
        emailVerified: sUser.emailVerified ?? false,
        lastActiveAt: sUser.lastActiveAt ?? new Date(),
      };

      console.log("Saving user to localStorage:", mapped);
      setUser(mapped);

      try {
        localStorage.setItem("user", JSON.stringify(mapped));
        console.log("Successfully saved user to localStorage");
      } catch (error) {
        console.warn("Failed to save user to localStorage:", error);
      }

      if (mapped.username) {
        fetchUserData(mapped.username);
      } else {
        setLoading(false);
      }
    } else if (status === "unauthenticated") {
      console.log("User unauthenticated, clearing localStorage");
      setUser(null);
      try {
        localStorage.removeItem("user");
        console.log("Successfully removed user from localStorage");
      } catch (error) {
        console.warn("Failed to remove user from localStorage:", error);
      }
      setLoading(false);
    }
  }, [session, status]);

  return (
    <UserContext.Provider
      value={{ user, setUser, fetchUserData, logoutUser, loading }}
    >
      {children}
    </UserContext.Provider>
  );
};

export { UserContext, UserProvider };
