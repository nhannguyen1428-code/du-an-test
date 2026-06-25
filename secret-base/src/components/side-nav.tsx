"use client";

import { LogOut, MessageSquare, Radio, Users } from "lucide-react";
import { useUser } from "@/contexts/user-context";
import { cn } from "@/lib/utils";
import type { AppTab } from "@/components/bottom-nav";

type SideNavProps = {
  tab: AppTab;
  onChange: (tab: AppTab) => void;
  dmBadge?: number;
  friendBadge?: number;
};

const items: { id: AppTab; label: string; icon: typeof Radio }[] = [
  { id: "lobby", label: "Phòng chung", icon: Radio },
  { id: "dm", label: "Tin riêng", icon: MessageSquare },
  { id: "friends", label: "Bạn bè", icon: Users },
];

export function SideNav({ tab, onChange, dmBadge = 0, friendBadge = 0 }: SideNavProps) {
  const { user, logout } = useUser();

  return (
    <aside className="flex w-56 shrink-0 flex-col border-r border-white/10 bg-panel">
      <div className="border-b border-white/10 px-4 py-4">
        <div className="flex items-center gap-2">
          <span className="text-xl">🏴</span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">Căn cứ bí mật</p>
            <p className="truncate text-xs text-muted">{user?.nickname}</p>
          </div>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1 p-3">
        {items.map(({ id, label, icon: Icon }) => {
          const badge = id === "friends" ? friendBadge : id === "dm" ? dmBadge : 0;
          const active = tab === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onChange(id)}
              className={cn(
                "relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition",
                active
                  ? "bg-accent/15 text-accent"
                  : "text-muted hover:bg-white/5 hover:text-foreground",
              )}
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span className="font-medium">{label}</span>
              {badge > 0 ? (
                <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">
                  {badge > 9 ? "9+" : badge}
                </span>
              ) : null}
            </button>
          );
        })}
      </nav>

      <div className="border-t border-white/10 p-3">
        <button
          type="button"
          onClick={() => logout()}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted transition hover:bg-white/5 hover:text-foreground"
        >
          <LogOut className="h-5 w-5" />
          Đổi tên / thoát
        </button>
      </div>
    </aside>
  );
}
