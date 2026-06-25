"use client";

import { LogOut, Wifi } from "lucide-react";
import { MESSAGE_TTL_MINUTES } from "@/lib/message-ttl";
import { MessageInput } from "@/components/message-input";
import { MessageList } from "@/components/message-list";
import { SetupBanner } from "@/components/setup-banner";
import { useUser } from "@/contexts/user-context";
import { useChat } from "@/hooks/use-chat";

type LobbyViewProps = {
  variant?: "mobile" | "desktop";
};

export function LobbyView({ variant = "mobile" }: LobbyViewProps) {
  const { user, userId, logout } = useUser();
  const nickname = user?.nickname ?? null;
  const { messages, error, setError, sendMessage, messageActions, mode } = useChat(nickname, userId);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="border-b border-white/10 bg-panel px-4 py-3 lg:px-6 lg:py-4">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-lg lg:text-xl">🏴</span>
              <h1 className="truncate text-lg font-semibold lg:text-xl">Căn cứ bí mật</h1>
            </div>
            <p className="truncate text-xs text-muted lg:text-sm">
              Bạn: <span className="text-accent">{user?.nickname}</span>
              <span className="mx-1.5">·</span>
              Tin tự xóa sau {MESSAGE_TTL_MINUTES} phút
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden items-center gap-1 rounded-full bg-white/5 px-2 py-1 text-xs text-muted sm:inline-flex">
              <Wifi className="h-3.5 w-3.5 text-accent" />
              {mode === "supabase" ? "Live" : "Phòng chung"}
            </span>
            {variant === "mobile" ? (
              <button
                type="button"
                onClick={() => {
                  logout();
                  setError(null);
                }}
                className="rounded-lg p-2 text-muted transition hover:bg-white/5 hover:text-foreground"
                aria-label="Đổi tên"
              >
                <LogOut className="h-5 w-5" />
              </button>
            ) : null}
          </div>
        </div>
      </header>

      <SetupBanner />

      {error ? (
        <div className="bg-red-500/10 px-4 py-2 text-center text-sm text-red-300 lg:px-6">{error}</div>
      ) : null}

      <div className="mx-auto flex min-h-0 w-full max-w-4xl flex-1 flex-col lg:mx-0 lg:max-w-none">
        <MessageList messages={messages} clientId={userId} actions={messageActions} />
        <MessageInput onSend={sendMessage} />
      </div>
    </div>
  );
}
