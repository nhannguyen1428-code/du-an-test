"use client";

import { useEffect } from "react";
import type { Dispatch, SetStateAction } from "react";
import { filterActiveMessages } from "@/lib/message-ttl";

const PRUNE_INTERVAL_MS = 30_000;

export function useMessageExpiry<T extends { created_at: string }>(
  setMessages: Dispatch<SetStateAction<T[]>>,
) {
  useEffect(() => {
    const prune = () => {
      setMessages((prev) => {
        const active = filterActiveMessages(prev);
        return active.length === prev.length ? prev : active;
      });
    };

    const interval = setInterval(prune, PRUNE_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [setMessages]);
}
