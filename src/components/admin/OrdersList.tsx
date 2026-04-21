"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ManualOrderDialog } from "@/components/admin/ManualOrderDialog";
import { OrderDetailDialog } from "@/components/admin/OrderDetailDialog";

import { subscribeOrders } from "@/lib/firebase/orders";
import type { Order, OrderStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const priceFormatter = new Intl.NumberFormat("es-AR");
const formatPrice = (v: number) => `$${priceFormatter.format(v)}`;

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Pendientes",
  confirmed: "Confirmados",
  in_preparation: "En preparación",
  ready: "Listos",
  delivered: "Entregados",
  cancelled: "Cancelados",
};

const STATUS_COLORS: Record<OrderStatus, string> = {
  pending: "bg-warning/20 text-warning",
  confirmed: "bg-gold/25 text-brown-700",
  in_preparation: "bg-gold/25 text-brown-700",
  ready: "bg-success/20 text-success",
  delivered: "bg-muted text-brown-700",
  cancelled: "bg-destructive/15 text-destructive",
};

type TabKey = OrderStatus | "all";

const TAB_ORDER: TabKey[] = [
  "pending",
  "confirmed",
  "in_preparation",
  "ready",
  "delivered",
  "cancelled",
  "all",
];

const TAB_LABEL: Record<TabKey, string> = {
  pending: "Pendientes",
  confirmed: "Confirmados",
  in_preparation: "En preparación",
  ready: "Listos",
  delivered: "Entregados",
  cancelled: "Cancelados",
  all: "Todos",
};

function toDate(ts: Order["createdAt"]): Date | null {
  if (!ts) return null;
  const maybe = ts as { toDate?: () => Date };
  if (typeof maybe.toDate === "function") return maybe.toDate();
  return null;
}

function formatDateShort(date: Date): string {
  return date.toLocaleString("es-AR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function OrdersList() {
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [tab, setTab] = useState<TabKey>("pending");
  const [search, setSearch] = useState("");
  const [detailOrder, setDetailOrder] = useState<Order | null>(null);
  const [manualOpen, setManualOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeOrders({}, (all) => setOrders(all));
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!detailOrder || !orders) return;
    const fresh = orders.find((o) => o.id === detailOrder.id);
    if (!fresh) {
      setDetailOrder(null);
    } else if (fresh !== detailOrder) {
      setDetailOrder(fresh);
    }
  }, [orders, detailOrder]);

  const counts = useMemo(() => {
    const base: Record<TabKey, number> = {
      pending: 0,
      in_preparation: 0,
      ready: 0,
      delivered: 0,
      cancelled: 0,
      all: orders?.length ?? 0,
      confirmed: 0,
    };
    if (!orders) return base;
    for (const order of orders) {
      base[order.status] = (base[order.status] ?? 0) + 1;
    }
    return base;
  }, [orders]);

  const visibleOrders = useMemo(() => {
    if (!orders) return [];
    const needle = search.trim().toLowerCase();
    return orders.filter((order) => {
      if (tab !== "all" && order.status !== tab) return false;
      if (needle) {
        const matchesName = order.customerName.toLowerCase().includes(needle);
        const matchesPhone = order.customerPhone.toLowerCase().includes(needle);
        if (!matchesName && !matchesPhone) return false;
      }
      return true;
    });
  }, [orders, tab, search]);

  return (
    <div className="grid gap-6">
      <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-display text-3xl text-brown-900 md:text-4xl">
            Pedidos
          </h1>
          <p className="text-sm text-brown-500">
            Entran en tiempo real. Tocá uno para ver detalle y cambiar estado.
          </p>
        </div>
        <Button
          onClick={() => setManualOpen(true)}
          className="self-start rounded-full"
        >
          <Plus className="h-4 w-4" />
          Pedido manual
        </Button>
      </header>

      {/* Tab bar — plain scroll container, no Tabs component */}
      <div className="overflow-x-auto scrollbar-none">
        <div className="flex w-max gap-1">
          {TAB_ORDER.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={cn(
                "shrink-0 whitespace-nowrap rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors md:px-4 md:text-sm",
                tab === key
                  ? "border-brown-900 bg-brown-900 text-background"
                  : "border-transparent text-brown-500 hover:text-brown-700",
              )}
            >
              {TAB_LABEL[key]}
              {counts[key] > 0 && (
                <span
                  className={cn(
                    "ml-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-medium",
                    tab === key ? "bg-background/20" : "bg-muted text-brown-700",
                  )}
                >
                  {counts[key]}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col gap-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brown-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre o teléfono"
            className="pl-9"
          />
        </div>

        {orders === null ? (
          <div className="grid gap-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                aria-hidden="true"
                className="h-20 animate-pulse rounded-2xl bg-card/70"
              />
            ))}
          </div>
        ) : visibleOrders.length === 0 ? (
          <div className="flex min-h-[30vh] flex-col items-center justify-center gap-2 rounded-3xl border border-dashed border-border bg-card/60 px-8 py-16 text-center">
            <p className="font-display text-2xl text-brown-700">
              {tab === "pending"
                ? "Sin pendientes"
                : "No hay pedidos en esta vista"}
            </p>
            <p className="text-sm text-brown-500">
              {tab === "pending"
                ? "¡Buen momento para un mate! ☕"
                : "Probá con otro filtro o cargá uno nuevo."}
            </p>
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {visibleOrders.map((order) => {
              const date = toDate(order.createdAt);
              return (
                <li key={order.id}>
                  <button
                    type="button"
                    onClick={() => setDetailOrder(order)}
                    className="grid w-full gap-2 rounded-2xl border border-border bg-card p-4 text-left transition-colors hover:border-brown-300 sm:grid-cols-[1fr_auto] sm:items-center sm:gap-4"
                  >
                    <div className="flex min-w-0 flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate font-medium text-brown-900">
                          {order.customerName}
                        </span>
                        {order.source === "manual" && (
                          <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-brown-500">
                            Manual
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-brown-500">
                        <span>{date ? formatDateShort(date) : "—"}</span>
                        <span>·</span>
                        <span className="truncate">
                          {order.items.length}{" "}
                          {order.items.length === 1 ? "ítem" : "ítems"}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-2 sm:flex-col sm:items-end">
                      <span className="font-display text-lg text-brown-900 sm:order-1">
                        {formatPrice(order.total)}
                      </span>
                      <div className="flex flex-wrap items-center justify-end gap-1.5 sm:order-2">
                        <span
                          className={cn(
                            "whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-medium",
                            STATUS_COLORS[order.status],
                          )}
                        >
                          {STATUS_LABELS[order.status]}
                        </span>
                        <span
                          className={cn(
                            "whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-medium",
                            order.paid
                              ? "bg-success/15 text-success"
                              : "bg-muted text-brown-500",
                          )}
                        >
                          {order.paid ? "Cobrado" : "Pendiente"}
                        </span>
                      </div>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <OrderDetailDialog
        order={detailOrder}
        onClose={() => setDetailOrder(null)}
      />
      <ManualOrderDialog open={manualOpen} onOpenChange={setManualOpen} />
    </div>
  );
}
