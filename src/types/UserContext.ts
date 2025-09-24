import { ReactNode } from "react";
import { SessionUser } from "./User";

export interface UserContextType {
  user: SessionUser | null;
  loading: boolean;
  setUser: React.Dispatch<React.SetStateAction<SessionUser | null>>;
  fetchUserData: (username: string) => Promise<void>;
  logoutUser: () => void;
}

export interface UserProviderProps {
  children: ReactNode;
}
