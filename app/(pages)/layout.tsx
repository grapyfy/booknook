import { AppShell } from "@/components/AppShell";

export default function PagesLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
