"use client";

import { Shuffle, UserRound } from "lucide-react";
import { useState } from "react";
import { generateNickname } from "@/lib/nickname";
import { setNickname } from "@/lib/storage";
import { cn } from "@/lib/utils";

type NicknameGateProps = {
  onJoin: (nickname: string) => void;
};

export function NicknameGate({ onJoin }: NicknameGateProps) {
  const [nickname, setNicknameInput] = useState("");
  const [error, setError] = useState("");

  function handleJoin(value: string) {
    const trimmed = value.trim();
    if (trimmed.length < 2) {
      setError("Tên phải có ít nhất 2 ký tự.");
      return;
    }
    if (trimmed.length > 24) {
      setError("Tên tối đa 24 ký tự.");
      return;
    }
    setNickname(trimmed);
    onJoin(trimmed);
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-panel p-6 shadow-xl">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-accent/20 text-2xl">
            🏴
          </div>
          <h1 className="text-2xl font-bold">Căn cứ bí mật</h1>
          <p className="mt-2 text-sm text-muted">
            Chọn tên ẩn danh để vào phòng chém gió. Không cần đăng ký.
          </p>
        </div>

        <label className="mb-2 block text-sm font-medium text-muted">
          Tên ẩn danh
        </label>
        <div className="relative">
          <UserRound className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            type="text"
            value={nickname}
            onChange={(e) => {
              setNicknameInput(e.target.value);
              setError("");
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleJoin(nickname);
            }}
            placeholder="VD: Ninja Rùa #482"
            className="w-full rounded-xl border border-white/10 bg-background py-3 pr-4 pl-10 text-foreground outline-none focus:border-accent"
            maxLength={24}
            autoFocus
          />
        </div>

        {error ? <p className="mt-2 text-sm text-red-400">{error}</p> : null}

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={() => {
              const random = generateNickname();
              setNicknameInput(random);
              setError("");
            }}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-3 text-sm font-medium transition hover:bg-white/5"
          >
            <Shuffle className="h-4 w-4" />
            Random tên
          </button>
          <button
            type="button"
            onClick={() => handleJoin(nickname)}
            className={cn(
              "flex-1 rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-white transition hover:bg-accent-hover",
            )}
          >
            Vào phòng
          </button>
        </div>

        <p className="mt-5 text-center text-xs leading-5 text-muted">
          Chỉ ẩn danh trên giao diện. Đừng gửi thông tin cá nhân nhạy cảm.
        </p>
      </div>
    </div>
  );
}
