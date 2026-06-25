"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { registerUserApi } from "@/lib/api/client";
import { clearNickname, getClientId, getNickname, setNickname } from "@/lib/storage";
import type { User } from "@/types/social";

type UserContextValue = {
  user: User | null;
  userId: string;
  ready: boolean;
  join: (nickname: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
};

const UserContext = createContext<UserContextValue | null>(null);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const userId = useMemo(() => getClientId(), []);

  const refreshUser = useCallback(async () => {
    const res = await fetch("/api/users/me", {
      headers: { "x-user-id": userId },
      cache: "no-store",
    });
    if (!res.ok) {
      setUser(null);
      return;
    }
    const data = (await res.json()) as { user: User };
    setUser(data.user);
    setNickname(data.user.nickname);
  }, [userId]);

  useEffect(() => {
    const nickname = getNickname();
    if (!nickname) {
      setReady(true);
      return;
    }
    void (async () => {
      const res = await fetch("/api/users/me", {
        headers: { "x-user-id": userId },
        cache: "no-store",
      });
      if (res.ok) {
        const data = (await res.json()) as { user: User };
        setUser(data.user);
      } else {
        try {
          const { user: registered } = await registerUserApi(nickname, userId);
          setUser(registered);
        } catch {
          clearNickname();
        }
      }
      setReady(true);
    })();
  }, [userId]);

  const join = useCallback(
    async (nickname: string) => {
      const { user: registered } = await registerUserApi(nickname, userId);
      setUser(registered);
      setNickname(registered.nickname);
    },
    [userId],
  );

  const logout = useCallback(() => {
    clearNickname();
    setUser(null);
  }, []);

  return (
    <UserContext.Provider
      value={{ user, userId, ready, join, logout, refreshUser }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser must be used within UserProvider");
  return ctx;
}
