"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Download, Receipt, TrendingUp, CircleDollarSign, PackageCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { subscribeOrders } from "@/lib/firebase/orders";
import type { Order } from "@/lib/types";

const priceFormatter = new Intl.NumberFormat("es-AR");
const formatPrice = (v: number) => `$${priceFormatter.format(Math.round(v))}`;

type RangeKey = "today" | "week" | "month" | "quarter" | "year";

const RANGE_OPTIONS: Array<{ value: RangeKey; label: string }> = [
  { value: "today", label: "Hoy" },
  { value: "week", label: "Esta semana" },
  { value: "month", label: "Este mes" },
  { value: "quarter", label: "Últimos 3 meses" },
  { value: "year", label: "Este año" },
];

const COLORS = {
  gold: "#C9A678",
  goldDark: "#A8804E",
  brown700: "#3D2817",
  brown500: "#6B4423",
  brown300: "#A0826D",
};
const PIE_PALETTE = [COLORS.gold, COLORS.brown500, COLORS.brown700, COLORS.brown300, COLORS.goldDark];

function rangeToStart(range: RangeKey): Date {
  const now = new Date();
  const date = new Date(now);
  date.setHours(0, 0, 0, 0);
  switch (range) {
    case "today":
      return date;
    case "week": {
      const day = date.getDay();
      const diff = (day + 6) % 7; // Monday start
      date.setDate(date.getDate() - diff);
      return date;
    }
    case "month":
      return new Date(now.getFullYear(), now.getMonth(), 1);
    case "quarter": {
      const d = new Date(now.getFullYear(), now.getMonth() - 3, 1);
      return d;
    }
    case "year":
      return new Date(now.getFullYear(), 0, 1);
  }
}

function toDate(ts: Order["createdAt"]): Date | null {
  if (!ts) return null;
  const maybe = ts as { toDate?: () => Date };
  if (typeof maybe.toDate === "function") return maybe.toDate();
  return null;
}

const DAYS_OF_WEEK = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

function KpiCard({
  label,
  value,
  hint,
  icon: Icon,
}: {
  label: string;
  value: string;
  hint?: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-brown-500">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <div className="font-display text-3xl text-brown-900">{value}</div>
      {hint && <div className="text-xs text-brown-500">{hint}</div>}
    </div>
  );
}

function ChartCard({
  title,
  children,
  empty,
}: {
  title: string;
  children: React.ReactNode;
  empty?: boolean;
}) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5">
      <h3 className="font-display text-lg text-brown-900">{title}</h3>
      {empty ? (
        <p className="flex h-48 items-center justify-center rounded-xl bg-background/60 text-sm text-brown-500">
          Todavía no hay datos en este rango
        </p>
      ) : (
        <div className="h-64">{children}</div>
      )}
    </div>
  );
}

function downloadCsv(filename: string, rows: string[][]) {
  const csv = rows
    .map((row) =>
      row
        .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
        .join(","),
    )
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function Analytics() {
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [range, setRange] = useState<RangeKey>("month");

  useEffect(() => {
    const unsubscribe = subscribeOrders({}, (all) => setOrders(all));
    return () => unsubscribe();
  }, []);

  const inRange = useMemo(() => {
    if (!orders) return [];
    const start = rangeToStart(range);
    return orders.filter((order) => {
      if (order.status === "cancelled") return false;
      const d = toDate(order.createdAt);
      return d ? d >= start : false;
    });
  }, [orders, range]);

  const kpis = useMemo(() => {
    const billed = inRange.filter((o) => o.paid).reduce((s, o) => s + o.total, 0);
    const pending = inRange.filter((o) => !o.paid).reduce((s, o) => s + o.total, 0);
    const count = inRange.length;
    const avg = count === 0 ? 0 : inRange.reduce((s, o) => s + o.total, 0) / count;
    const paidCount = inRange.filter((o) => o.paid).length;
    const paidPct = count === 0 ? 0 : Math.round((paidCount / count) * 100);
    return { billed, pending, count, avg, paidPct };
  }, [inRange]);

  const revenueByDay = useMemo(() => {
    const map = new Map<string, number>();
    for (const order of inRange) {
      if (!order.paid) continue;
      const d = toDate(order.createdAt);
      if (!d) continue;
      const key = d.toISOString().slice(0, 10);
      map.set(key, (map.get(key) ?? 0) + order.total);
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, total]) => ({
        date: date.slice(5),
        total,
      }));
  }, [inRange]);

  const unitsByFlavor = useMemo(() => {
    const map = new Map<string, number>();
    for (const order of inRange) {
      for (const item of order.items) {
        map.set(item.productName, (map.get(item.productName) ?? 0) + item.qty);
      }
    }
    return Array.from(map.entries())
      .map(([name, qty]) => ({ name, qty }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);
  }, [inRange]);

  const sizeDistribution = useMemo(() => {
    const map = new Map<string, number>();
    for (const order of inRange) {
      for (const item of order.items) {
        map.set(item.sizeName, (map.get(item.sizeName) ?? 0) + item.qty);
      }
    }
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [inRange]);

  const revenueByProduct = useMemo(() => {
    const map = new Map<string, number>();
    for (const order of inRange) {
      for (const item of order.items) {
        map.set(
          item.productName,
          (map.get(item.productName) ?? 0) + item.subtotal,
        );
      }
    }
    return Array.from(map.entries())
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total);
  }, [inRange]);

  const salesByDayOfWeek = useMemo(() => {
    const buckets = DAYS_OF_WEEK.map((day) => ({ day, count: 0 }));
    for (const order of inRange) {
      const d = toDate(order.createdAt);
      if (!d) continue;
      const idx = (d.getDay() + 6) % 7; // Monday = 0
      buckets[idx].count += 1;
    }
    return buckets;
  }, [inRange]);

  const exportCsv = () => {
    const rows: string[][] = [
      ["Fecha", "Cliente", "Teléfono", "Total", "Cobrado", "Estado", "Origen"],
      ...inRange.map((order) => {
        const d = toDate(order.createdAt);
        return [
          d ? d.toISOString() : "",
          order.customerName,
          order.customerPhone,
          order.total.toString(),
          order.paid ? "sí" : "no",
          order.status,
          order.source,
        ];
      }),
    ];
    downloadCsv(`pedidos-${range}.csv`, rows);
  };

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-display text-3xl text-brown-900 md:text-4xl">
            Analíticas
          </h1>
          <p className="text-sm text-brown-500">
            Todo suma pedidos no cancelados. "Facturado" sólo cuenta cobrados.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={range} onValueChange={(v) => setRange(v as RangeKey)}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {RANGE_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            type="button"
            variant="outline"
            onClick={exportCsv}
            className="rounded-full"
          >
            <Download className="h-4 w-4" />
            CSV
          </Button>
        </div>
      </header>

      <div className="grid gap-3 md:grid-cols-4">
        <KpiCard
          label="Facturado"
          value={formatPrice(kpis.billed)}
          hint="cobrado en el rango"
          icon={Receipt}
        />
        <KpiCard
          label="Pedidos"
          value={kpis.count.toString()}
          hint={`${kpis.paidPct}% cobrados`}
          icon={PackageCheck}
        />
        <KpiCard
          label="Ticket promedio"
          value={formatPrice(kpis.avg)}
          icon={TrendingUp}
        />
        <KpiCard
          label="Pendiente de cobro"
          value={formatPrice(kpis.pending)}
          icon={CircleDollarSign}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <ChartCard
          title="Facturación por día"
          empty={revenueByDay.length === 0}
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={revenueByDay}>
              <CartesianGrid strokeDasharray="3 3" stroke={COLORS.brown300} opacity={0.3} />
              <XAxis dataKey="date" stroke={COLORS.brown500} fontSize={12} />
              <YAxis stroke={COLORS.brown500} fontSize={12} />
              <Tooltip
                formatter={(value) =>
                  typeof value === "number" ? formatPrice(value) : String(value)
                }
                contentStyle={{ borderRadius: 12, border: `1px solid ${COLORS.brown300}` }}
              />
              <Line
                type="monotone"
                dataKey="total"
                stroke={COLORS.gold}
                strokeWidth={2.5}
                dot={{ fill: COLORS.gold, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Top sabores (unidades)"
          empty={unitsByFlavor.length === 0}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={unitsByFlavor}>
              <CartesianGrid strokeDasharray="3 3" stroke={COLORS.brown300} opacity={0.3} />
              <XAxis dataKey="name" stroke={COLORS.brown500} fontSize={12} />
              <YAxis stroke={COLORS.brown500} fontSize={12} allowDecimals={false} />
              <Tooltip contentStyle={{ borderRadius: 12, border: `1px solid ${COLORS.brown300}` }} />
              <Bar dataKey="qty" fill={COLORS.gold} radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Tamaño (Individual vs XL)"
          empty={sizeDistribution.length === 0}
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={sizeDistribution}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                innerRadius={40}
                label={(entry) => entry.name}
              >
                {sizeDistribution.map((_, idx) => (
                  <Cell
                    key={idx}
                    fill={PIE_PALETTE[idx % PIE_PALETTE.length]}
                  />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Ingresos por producto"
          empty={revenueByProduct.length === 0}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={revenueByProduct} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke={COLORS.brown300} opacity={0.3} />
              <XAxis type="number" stroke={COLORS.brown500} fontSize={12} />
              <YAxis
                type="category"
                dataKey="name"
                stroke={COLORS.brown500}
                fontSize={12}
                width={100}
              />
              <Tooltip
                formatter={(value) =>
                  typeof value === "number" ? formatPrice(value) : String(value)
                }
                contentStyle={{ borderRadius: 12, border: `1px solid ${COLORS.brown300}` }}
              />
              <Bar
                dataKey="total"
                fill={COLORS.brown500}
                radius={[0, 8, 8, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Pedidos por día de la semana"
          empty={salesByDayOfWeek.every((d) => d.count === 0)}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={salesByDayOfWeek}>
              <CartesianGrid strokeDasharray="3 3" stroke={COLORS.brown300} opacity={0.3} />
              <XAxis dataKey="day" stroke={COLORS.brown500} fontSize={12} />
              <YAxis stroke={COLORS.brown500} fontSize={12} allowDecimals={false} />
              <Tooltip contentStyle={{ borderRadius: 12, border: `1px solid ${COLORS.brown300}` }} />
              <Bar dataKey="count" fill={COLORS.goldDark} radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {orders === null && (
        <p className="text-sm text-brown-500">Cargando datos...</p>
      )}
    </div>
  );
}
