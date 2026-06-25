"use client";

import { Check, Copy, UserPlus, X } from "lucide-react";
import { useState } from "react";
import { useUser } from "@/contexts/user-context";
import { useFriends } from "@/hooks/use-friends";
import { conversationId } from "@/types/social";
import { cn } from "@/lib/utils";

type FriendsViewProps = {
  onOpenDm: (conversationId: string, friendName: string) => void;
  variant?: "mobile" | "desktop";
};

export function FriendsView({ onOpenDm, variant = "mobile" }: FriendsViewProps) {
  const { user } = useUser();
  const { friends, incoming, outgoing, error, sendRequest, respond } = useFriends(true);
  const [code, setCode] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleAddFriend() {
    setLocalError(null);
    try {
      await sendRequest(code);
      setCode("");
    } catch (e) {
      setLocalError(e instanceof Error ? e.message : "Lỗi.");
    }
  }

  async function copyCode() {
    if (!user?.friend_code) return;
    await navigator.clipboard.writeText(user.friend_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      <header className="border-b border-white/10 bg-panel px-4 py-3 lg:px-6 lg:py-4">
        <h1 className="text-lg font-semibold lg:text-xl">Bạn bè</h1>
        {user ? (
          <div className="mt-2 flex items-center justify-between rounded-xl bg-white/5 px-3 py-2">
            <div>
              <p className="text-xs text-muted">Mã của bạn</p>
              <p className="font-mono text-lg font-bold tracking-widest text-accent">
                {user.friend_code}
              </p>
            </div>
            <button
              type="button"
              onClick={() => void copyCode()}
              className="rounded-lg p-2 text-muted hover:bg-white/10 hover:text-foreground"
            >
              {copied ? <Check className="h-5 w-5 text-accent" /> : <Copy className="h-5 w-5" />}
            </button>
          </div>
        ) : null}
      </header>

      <div className={cn("space-y-4 p-4", variant === "desktop" && "lg:p-6")}>
        <div>
          <label className="mb-2 block text-sm text-muted">Thêm bạn bằng mã</label>
          <div className="flex gap-2">
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="VD: K7X2M9"
              maxLength={6}
              className="flex-1 rounded-xl border border-white/10 bg-background px-3 py-2.5 font-mono uppercase outline-none focus:border-accent"
            />
            <button
              type="button"
              onClick={() => void handleAddFriend()}
              disabled={code.length < 6}
              className="flex items-center gap-1 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
            >
              <UserPlus className="h-4 w-4" />
              Thêm
            </button>
          </div>
        </div>

        {(localError || error) && (
          <p className="text-sm text-red-400">{localError ?? error}</p>
        )}

        {incoming.length > 0 ? (
          <section>
            <h2 className="mb-2 text-sm font-medium text-muted">Lời mời đến</h2>
            <ul className="space-y-2">
              {incoming.map((req) => (
                <li
                  key={req.id}
                  className="flex items-center justify-between rounded-xl border border-white/10 bg-panel px-3 py-2"
                >
                  <span className="text-sm">{req.requester?.nickname ?? "Ẩn danh"}</span>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => void respond(req.requester_id, "accept")}
                      className="rounded-lg bg-accent/20 p-2 text-accent"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => void respond(req.requester_id, "reject")}
                      className="rounded-lg bg-red-500/20 p-2 text-red-300"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {outgoing.length > 0 ? (
          <section>
            <h2 className="mb-2 text-sm font-medium text-muted">Đã gửi lời mời</h2>
            <ul className="space-y-2">
              {outgoing.map((req) => (
                <li
                  key={req.id}
                  className="rounded-xl border border-white/10 bg-panel px-3 py-2 text-sm text-muted"
                >
                  {req.addressee?.nickname ?? "..."} — chờ chấp nhận
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <section>
          <h2 className="mb-2 text-sm font-medium text-muted">
            Bạn bè ({friends.length})
          </h2>
          {friends.length === 0 ? (
            <p className="text-center text-sm text-muted py-8">
              Chưa có bạn. Chia sẻ mã của bạn để kết bạn!
            </p>
          ) : (
            <ul className="space-y-2">
              {friends.map((friend) => (
                <li key={friend.id}>
                  <button
                    type="button"
                    onClick={() => {
                      if (!user) return;
                      onOpenDm(conversationId(user.id, friend.id), friend.nickname);
                    }}
                    className={cn(
                      "flex w-full items-center justify-between rounded-xl border border-white/10 bg-panel px-4 py-3 text-left transition hover:border-accent/40",
                    )}
                  >
                    <span className="font-medium">{friend.nickname}</span>
                    <span className="text-xs text-accent">Nhắn tin →</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
