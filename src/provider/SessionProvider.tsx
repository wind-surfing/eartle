"use client";

import { UserProvider } from "@/context/UserContext";
import { SessionProvider as _SessionProvider } from "next-auth/react";

export default function SessionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <_SessionProvider>
      <UserProvider>{children}</UserProvider>
    </_SessionProvider>
  );
}
