"use client";

import { useCallback, useEffect, useState } from "react";
import { apiHeaders } from "@/lib/api/client";
import type { FriendRequest, User } from "@/types/social";

export function useFriends(enabled: boolean) {
  const [friends, setFriends] = useState<User[]>([]);
  const [incoming, setIncoming] = useState<FriendRequest[]>([]);
  const [outgoing, setOutgoing] = useState<FriendRequest[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    try {
      const res = await fetch("/api/friends", { headers: apiHeaders(), cache: "no-store" });
      if (!res.ok) throw new Error("Không tải được danh sách bạn.");
      const data = (await res.json()) as {
        friends: User[];
        incoming: FriendRequest[];
        outgoing: FriendRequest[];
      };
      setFriends(data.friends);
      setIncoming(data.incoming);
      setOutgoing(data.outgoing);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lỗi mạng.");
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    void load();
    if (!enabled) return;
    const t = setInterval(() => void load(), 3000);
    return () => clearInterval(t);
  }, [load, enabled]);

  const sendRequest = useCallback(
    async (friendCode: string) => {
      const res = await fetch("/api/friends", {
        method: "POST",
        headers: apiHeaders(),
        body: JSON.stringify({ friend_code: friendCode }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Gửi lời mời thất bại.");
      await load();
    },
    [load],
  );

  const respond = useCallback(
    async (requesterId: string, action: "accept" | "reject") => {
      const res = await fetch("/api/friends/respond", {
        method: "POST",
        headers: apiHeaders(),
        body: JSON.stringify({ requester_id: requesterId, action }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Xử lý thất bại.");
      await load();
    },
    [load],
  );

  return {
    friends,
    incoming,
    outgoing,
    error,
    loading,
    sendRequest,
    respond,
    reload: load,
  };
}
