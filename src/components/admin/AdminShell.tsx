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

export function AdminShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { user, loading, isAdmin, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      router.replace("/login");
    }
  }, [loading, user, isAdmin, router]);

  const handleSignOut = async () => {
    await signOut();
    router.replace("/login");
  };

  if (loading || !user || !isAdmin) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-secondary/40">
        <div
          aria-hidden="true"
          className="h-24 w-24 animate-pulse rounded-full bg-muted"
        />
      </div>
    );
  }

  return (
    <div className="flex min-h-svh bg-secondary/40">
      <aside className="sticky top-0 hidden h-svh w-64 shrink-0 border-r border-border bg-card md:block">
        <AdminNav onSignOut={handleSignOut} />
      </aside>

      <div className="flex flex-1 flex-col">
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

        <main className="flex-1 px-4 py-6 md:px-10 md:py-10">{children}</main>
      </div>
    </div>
  );
}
