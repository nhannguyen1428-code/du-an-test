"use client";

import { useState } from "react";
import { BottomNav, type AppTab } from "@/components/bottom-nav";
import { DesktopDmPlaceholder } from "@/components/desktop-dm-placeholder";
import { DmChatView, DmListView } from "@/components/dm/dm-views";
import { FriendsView } from "@/components/friends/friends-view";
import { LobbyView } from "@/components/lobby-view";
import { NicknameGate } from "@/components/nickname-gate";
import { SideNav } from "@/components/side-nav";
import { useUser } from "@/contexts/user-context";
import { useFriends } from "@/hooks/use-friends";
import { useDmConversations } from "@/hooks/use-dm";

export function AppShell() {
  const { user, ready, join } = useUser();
  const [tab, setTab] = useState<AppTab>("lobby");
  const [dmChat, setDmChat] = useState<{ id: string; name: string } | null>(null);
  const { incoming } = useFriends(Boolean(user));
  const { conversations, totalUnread } = useDmConversations(Boolean(user));

  function openDm(id: string, name: string) {
    setDmChat({ id, name });
    setTab("dm");
  }

  function handleTabChange(next: AppTab) {
    setTab(next);
    if (next !== "dm") setDmChat(null);
  }

  if (!ready) {
    return (
      <div className="flex min-h-dvh items-center justify-center text-sm text-muted">
        Đang tải...
      </div>
    );
  }

  if (!user) {
    return <NicknameGate onJoin={join} />;
  }

  const navProps = {
    tab,
    onChange: handleTabChange,
    friendBadge: incoming.length,
    dmBadge: totalUnread,
  };

  return (
    <>
      {/* Desktop: full viewport — sidebar + optional DM list + main */}
      <div className="hidden h-dvh w-full flex-col bg-background lg:flex">
        <div className="flex h-full w-full overflow-hidden">
          <SideNav {...navProps} />

          {tab === "dm" ? (
            <div className="flex w-80 shrink-0 flex-col border-r border-white/10 bg-panel">
              <DmListView
                conversations={conversations}
                selectedId={dmChat?.id}
                onOpenChat={openDm}
                variant="desktop"
              />
            </div>
          ) : null}

          <main className="flex min-w-0 flex-1 flex-col bg-background">
            {tab === "lobby" ? <LobbyView variant="desktop" /> : null}
            {tab === "friends" ? <FriendsView onOpenDm={openDm} variant="desktop" /> : null}
            {tab === "dm" ? (
              dmChat ? (
                <DmChatView
                  conversationId={dmChat.id}
                  friendName={dmChat.name}
                  onBack={() => setDmChat(null)}
                  variant="desktop"
                />
              ) : (
                <DesktopDmPlaceholder hasConversations={conversations.length > 0} />
              )
            ) : null}
          </main>
        </div>
      </div>

      {/* Mobile: single column + bottom nav */}
      <div className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col bg-background lg:hidden">
        <div className="flex min-h-0 flex-1 flex-col">
          {tab === "lobby" ? <LobbyView variant="mobile" /> : null}
          {tab === "friends" ? <FriendsView onOpenDm={openDm} variant="mobile" /> : null}
          {tab === "dm" ? (
            dmChat ? (
              <DmChatView
                conversationId={dmChat.id}
                friendName={dmChat.name}
                onBack={() => setDmChat(null)}
                variant="mobile"
              />
            ) : (
              <DmListView
                conversations={conversations}
                onOpenChat={openDm}
                variant="mobile"
              />
            )
          ) : null}
        </div>
        {!dmChat ? <BottomNav {...navProps} /> : null}
      </div>
    </>
  );
}
