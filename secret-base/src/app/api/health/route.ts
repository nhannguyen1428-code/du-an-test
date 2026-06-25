import { NextResponse } from "next/server";
import { getServerBackend } from "@/lib/chat/service";
import { isRedisConfigured } from "@/lib/chat/redis-store";
import { isSupabaseConfigured } from "@/lib/supabase/client";

export const dynamic = "force-dynamic";

export async function GET() {
  const backend = getServerBackend();
  const shared =
    isSupabaseConfigured() || isRedisConfigured() || backend === "redis";

  return NextResponse.json({
    backend,
    shared,
    supabase: isSupabaseConfigured(),
    redis: isRedisConfigured(),
    hint: shared
      ? null
      : "Thêm Upstash Redis hoặc Supabase env trên Vercel để chat chung hoạt động.",
  });
}
