"use client";

import { MessageSquare } from "lucide-react";

type DesktopDmPlaceholderProps = {
  hasConversations: boolean;
};

export function DesktopDmPlaceholder({ hasConversations }: DesktopDmPlaceholderProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-background px-8 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/5">
        <MessageSquare className="h-8 w-8 text-muted" />
      </div>
      <h2 className="text-lg font-semibold">Tin riêng</h2>
      <p className="mt-2 max-w-sm text-sm text-muted">
        {hasConversations
          ? "Chọn một cuộc trò chuyện ở cột bên cạnh để bắt đầu nhắn tin."
          : "Kết bạn trước, sau đó mở tab Bạn bè để nhắn tin riêng."}
      </p>
    </div>
  );
}
