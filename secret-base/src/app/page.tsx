import { AppShell } from "@/components/app-shell";
import { UserProvider } from "@/contexts/user-context";

export default function HomePage() {
  return (
    <UserProvider>
      <AppShell />
    </UserProvider>
  );
}
