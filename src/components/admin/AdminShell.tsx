"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { Menu } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Logo } from "@/components/shared/Logo";
import { AdminNav } from "@/components/admin/AdminNav";
import { useAuth } from "@/hooks/use-auth";

function LoadingScreen() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div
        aria-hidden="true"
        className="h-20 w-20 animate-pulse rounded-full bg-muted"
      />
    </div>
  );
}

export function AdminShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { user, loading, isAdmin, signOut } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!mounted || loading) return;
    if (!user || !isAdmin) {
      router.replace("/login");
    }
  }, [mounted, loading, user, isAdmin, router]);

  const authorized = mounted && !loading && user !== null && isAdmin;

  const handleSignOut = async () => {
    await signOut();
    router.replace("/login");
  };

  // Render nothing on the server. The admin tree is fully client-gated by
  // auth, and Next.js 16's segment rendering kept clashing with any DOM we
  // produced during SSR. After mount the client renders the real shell.
  if (!mounted) return null;

  return (
    <div className="flex min-h-svh bg-secondary/40">
      <aside className="sticky top-0 hidden h-svh w-64 shrink-0 border-r border-border bg-card md:block">
        {authorized && <AdminNav onSignOut={handleSignOut} />}
      </aside>

      <div className="flex flex-1 flex-col">
        {authorized && (
          <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-border bg-card/90 px-4 py-3 backdrop-blur md:hidden">
            <Logo size="sm" showTagline={false} />
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger
                aria-label="Abrir menú"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background text-brown-700 transition-colors hover:bg-muted"
              >
                <Menu className="h-4 w-4" />
              </SheetTrigger>
              <SheetContent
                side="left"
                className="w-72 border-r border-border bg-card p-0"
              >
                <SheetHeader className="sr-only">
                  <SheetTitle>Menú de administración</SheetTitle>
                </SheetHeader>
                <AdminNav
                  onSignOut={handleSignOut}
                  onNavigate={() => setMobileOpen(false)}
                />
              </SheetContent>
            </Sheet>
          </header>
        )}

        <main className="min-w-0 flex-1 overflow-x-hidden px-4 py-6 md:px-10 md:py-10">
          {authorized ? children : <LoadingScreen />}
        </main>
      </div>
    </div>
  );
}
