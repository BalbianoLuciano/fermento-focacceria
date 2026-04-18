"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  BarChart3,
  Image as ImageIcon,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Package,
  Settings,
  Star,
} from "lucide-react";
import { Logo } from "@/components/shared/Logo";
import { subscribeOrders } from "@/lib/firebase/orders";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Pedidos", href: "/admin/pedidos", icon: MessageSquare },
  { label: "Productos", href: "/admin/productos", icon: Package },
  { label: "Galería", href: "/admin/galeria", icon: ImageIcon },
  { label: "Reseñas", href: "/admin/resenas", icon: Star },
  { label: "Analíticas", href: "/admin/analiticas", icon: BarChart3 },
  { label: "Ajustes", href: "/admin/ajustes", icon: Settings },
];

export function AdminNav({
  onSignOut,
  onNavigate,
}: {
  onSignOut: () => void;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const unsubscribe = subscribeOrders({ status: "pending" }, (orders) =>
      setPendingCount(orders.length),
    );
    return () => unsubscribe();
  }, []);

  return (
    <nav className="flex h-full flex-col gap-2 px-4 py-6">
      <div className="px-2 pb-4">
        <Logo size="sm" />
      </div>

      <ul className="flex flex-col gap-1">
        {ITEMS.map(({ label, href, icon: Icon }) => {
          const active = pathname === href || pathname?.startsWith(`${href}/`);
          const badge =
            href === "/admin/pedidos" && pendingCount > 0 ? pendingCount : null;
          return (
            <li key={href}>
              <Link
                href={href}
                onClick={onNavigate}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-brown-900 text-background"
                    : "text-brown-700 hover:bg-muted",
                )}
              >
                <Icon className="h-4 w-4" />
                <span className="flex-1">{label}</span>
                {badge !== null && (
                  <span
                    className={cn(
                      "inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-medium",
                      active
                        ? "bg-background text-brown-900"
                        : "bg-gold text-brown-900",
                    )}
                    aria-label={`${badge} pedidos pendientes`}
                  >
                    {badge}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>

      <button
        type="button"
        onClick={onSignOut}
        className="mt-auto flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-brown-500 transition-colors hover:bg-muted hover:text-brown-700"
      >
        <LogOut className="h-4 w-4" />
        Cerrar sesión
      </button>
    </nav>
  );
}
