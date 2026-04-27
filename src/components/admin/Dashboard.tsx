"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  CircleDollarSign,
  Clock,
  Receipt,
  Wallet,
} from "lucide-react";
import { ServiceToggle } from "@/components/admin/ServiceToggle";
import { subscribeOrders } from "@/lib/firebase/orders";
import type { Order, OrderStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const priceFormatter = new Intl.NumberFormat("es-AR");
const formatPrice = (v: number) => `$${priceFormatter.format(v)}`;

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Pendiente",
  confirmed: "Confirmado",
  in_preparation: "En preparación",
  ready: "Listo",
  delivered: "Entregado",
  cancelled: "Cancelado",
};

const STATUS_COLORS: Record<OrderStatus, string> = {
  pending: "bg-warning/20 text-warning",
  confirmed: "bg-gold/25 text-brown-700",
  in_preparation: "bg-gold/25 text-brown-700",
  ready: "bg-success/20 text-success",
  delivered: "bg-muted text-brown-700",
  cancelled: "bg-destructive/15 text-destructive",
};

function startOfToday(): Date {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return now;
}

function startOfMonth(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

function toDate(ts: Order["createdAt"]): Date | null {
  if (!ts) return null;
  if (typeof (ts as { toDate?: () => Date }).toDate === "function") {
    return (ts as { toDate: () => Date }).toDate();
  }
  return null;
}

function KpiCard({
  label,
  value,
  icon: Icon,
  hint,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  hint?: string;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-brown-500">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <div className="font-display text-3xl text-brown-900">{value}</div>
      {hint && <div className="text-xs text-brown-500">{hint}</div>}
    </div>
  );
}

export function Dashboard() {
  const [orders, setOrders] = useState<Order[] | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeOrders({}, (all) => setOrders(all));
    return () => unsubscribe();
  }, []);

  if (orders === null) {
    return (
      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            aria-hidden="true"
            className="h-32 animate-pulse rounded-2xl bg-card/70"
          />
        ))}
      </div>
    );
  }

  const todayStart = startOfToday();
  const monthStart = startOfMonth();

  const pendingToday = orders.filter((o) => {
    if (o.status !== "pending") return false;
    const d = toDate(o.createdAt);
    return d ? d >= todayStart : false;
  }).length;

  const paidMonth = orders.filter((o) => {
    if (!o.paid || o.status === "cancelled") return false;
    const d = toDate(o.createdAt);
    return d ? d >= monthStart : false;
  });

  const billedMonth = paidMonth.reduce((sum, o) => sum + o.total, 0);
  const profitMonth = paidMonth.reduce(
    (sum, o) => sum + (o.profit ?? o.total - (o.totalCost ?? 0)),
    0,
  );

  const unpaidOpen = orders
    .filter((o) => !o.paid && o.status !== "cancelled")
    .reduce((sum, o) => sum + o.total, 0);

  const recent = orders.slice(0, 5);

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-1">
        <h1 className="font-display text-3xl text-brown-900 md:text-4xl">
          ¡Hola, Anna!
        </h1>
        <p className="text-sm text-brown-500">
          Resumen rápido del horno.
        </p>
      </header>

      <ServiceToggle />

      <div className="grid gap-4 md:grid-cols-4">
        <KpiCard
          label="Pendientes hoy"
          value={pendingToday.toString()}
          icon={Clock}
          hint={pendingToday === 1 ? "pedido esperando" : "pedidos esperando"}
        />
        <KpiCard
          label="Facturado del mes"
          value={formatPrice(billedMonth)}
          icon={Receipt}
          hint="cobrado · excluye cancelados"
        />
        <KpiCard
          label="Ganancia del mes"
          value={formatPrice(profitMonth)}
          icon={Wallet}
          hint="facturado − costo de insumos"
        />
        <KpiCard
          label="Pendiente de cobro"
          value={formatPrice(unpaidOpen)}
          icon={CircleDollarSign}
          hint="pedidos no cobrados"
        />
      </div>

      <section className="flex flex-col gap-4 rounded-3xl border border-border bg-card p-5 md:p-6">
        <header className="flex items-center justify-between">
          <h2 className="font-display text-xl text-brown-900">
            Últimos pedidos
          </h2>
          <Link
            href="/admin/pedidos"
            className="inline-flex items-center gap-1 text-sm font-medium text-brown-700 hover:text-brown-900"
          >
            Ver todos
            <ArrowRight className="h-4 w-4" />
          </Link>
        </header>

        {recent.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border bg-background/60 py-10 text-center text-sm text-brown-500">
            Todavía no entraron pedidos. ¡Buen momento para un mate! ☕
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {recent.map((order) => {
              const date = toDate(order.createdAt);
              return (
                <li
                  key={order.id}
                  className="flex items-center gap-3 rounded-2xl border border-border bg-background/60 px-4 py-3"
                >
                  <div className="flex flex-1 flex-col gap-0.5 min-w-0">
                    <span className="truncate text-sm font-medium text-brown-900">
                      {order.customerName}
                    </span>
                    <span className="text-xs text-brown-500">
                      {date
                        ? date.toLocaleString("es-AR", {
                            day: "2-digit",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "—"}
                    </span>
                  </div>
                  <span
                    className={cn(
                      "rounded-full px-3 py-1 text-xs font-medium",
                      STATUS_COLORS[order.status],
                    )}
                  >
                    {STATUS_LABELS[order.status]}
                  </span>
                  <span className="min-w-[80px] text-right font-display text-base text-brown-900">
                    {formatPrice(order.total)}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
