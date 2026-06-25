"use client";

import { LogOut, Wifi } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { MessageInput } from "@/components/message-input";
import { MessageList } from "@/components/message-list";
import { NicknameGate } from "@/components/nickname-gate";
import { SetupBanner } from "@/components/setup-banner";
import { useChat } from "@/hooks/use-chat";
import { clearNickname, getClientId, getNickname } from "@/lib/storage";

export function ChatRoom() {
  const [nickname, setNicknameState] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const clientId = useMemo(() => getClientId(), []);

  const { messages, error, setError, sendMessage, mode } = useChat(
    nickname,
    clientId,
  );

  useEffect(() => {
    setNicknameState(getNickname());
    setReady(true);
  }, []);

  function handleLeave() {
    clearNickname();
    setNicknameState(null);
    setError(null);
  }

  if (!ready) {
    return (
      <div className="flex min-h-dvh items-center justify-center text-sm text-muted">
        Đang tải...
      </div>
    );
  }

  if (!nickname) {
    return <NicknameGate onJoin={setNicknameState} />;
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col bg-background">
      <header className="sticky top-0 z-10 border-b border-white/10 bg-panel px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-lg">🏴</span>
              <h1 className="truncate text-lg font-semibold">Căn cứ bí mật</h1>
            </div>
            <p className="truncate text-xs text-muted">
              Bạn: <span className="text-accent">{nickname}</span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden items-center gap-1 rounded-full bg-white/5 px-2 py-1 text-xs text-muted sm:inline-flex">
              <Wifi className="h-3.5 w-3.5 text-accent" />
              {mode === "supabase" ? "Live" : "Phòng chung"}
            </span>
            <button
              type="button"
              onClick={handleLeave}
              className="rounded-lg p-2 text-muted transition hover:bg-white/5 hover:text-foreground"
              aria-label="Đổi tên"
              title="Đổi tên"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
        {mode === "shared" ? (
          <p className="mt-2 text-xs text-muted">
            Phòng chat chung — tin nhắn đồng bộ mỗi ~2 giây.
          </p>
        ) : null}
      </header>

      <SetupBanner />

      {error ? (
        <div className="bg-red-500/10 px-4 py-2 text-center text-sm text-red-300">
          {error}
        </div>
      ) : null}

      <MessageList messages={messages} clientId={clientId} />
      <MessageInput onSend={sendMessage} />
    </div>
  );
}
