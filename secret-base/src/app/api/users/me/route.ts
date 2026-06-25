import { NextResponse } from "next/server";
import { getUserIdFromRequest, unauthorized } from "@/lib/api/request";
import { getUser } from "@/lib/social/service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const userId = getUserIdFromRequest(request);
  if (!userId) return unauthorized();

  const user = await getUser(userId);
  if (!user) return unauthorized();

  return NextResponse.json({ user });
}
