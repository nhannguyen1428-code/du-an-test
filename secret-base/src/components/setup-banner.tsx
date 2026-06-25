"use client";

import { AlertTriangle, ExternalLink } from "lucide-react";
import { useEffect, useState } from "react";

type Health = {
  backend: string;
  shared: boolean;
  hint: string | null;
};

export function SetupBanner() {
  const [health, setHealth] = useState<Health | null>(null);
  const onVercel =
    typeof window !== "undefined" &&
    window.location.hostname.includes("vercel.app");

  useEffect(() => {
    void fetch("/api/health", { cache: "no-store" })
      .then((r) => r.json())
      .then((data: Health) => setHealth(data))
      .catch(() => null);
  }, []);

  if (!onVercel || !health || health.shared) return null;

  return (
    <div className="border-b border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
      <div className="mx-auto flex max-w-3xl items-start gap-2">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
        <div>
          <p className="font-medium">Chat chung chưa kết nối database</p>
          <p className="mt-1 text-xs leading-5 text-amber-100/90">
            {health.hint} Bấm link bên dưới → cài <strong>Upstash for Redis</strong>{" "}
            (free) → Redeploy.
          </p>
          <a
            href="https://vercel.com/hihihah012/secret-base/integrations/upstash"
            target="_blank"
            rel="noreferrer"
            className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-accent underline"
          >
            Cài Upstash Redis trên Vercel
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>
    </div>
  );
}
