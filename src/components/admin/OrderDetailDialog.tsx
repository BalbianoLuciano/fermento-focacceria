"use client";

import { useState } from "react";
import { MessageCircle, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

import {
  deleteOrder,
  markPaid,
  updateOrderStatus,
} from "@/lib/firebase/orders";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import type { Order, OrderStatus } from "@/lib/types";

const priceFormatter = new Intl.NumberFormat("es-AR");
const formatPrice = (v: number) => `$${priceFormatter.format(v)}`;

const STATUS_OPTIONS: Array<{ value: OrderStatus; label: string }> = [
  { value: "pending", label: "Pendiente" },
  { value: "confirmed", label: "Confirmado" },
  { value: "in_preparation", label: "En preparación" },
  { value: "ready", label: "Listo" },
  { value: "delivered", label: "Entregado" },
  { value: "cancelled", label: "Cancelado" },
];

function toDate(ts: Order["createdAt"]): Date | null {
  if (!ts) return null;
  const maybe = ts as { toDate?: () => Date };
  if (typeof maybe.toDate === "function") return maybe.toDate();
  return null;
}

export function OrderDetailDialog({
  order,
  onClose,
}: {
  order: Order | null;
  onClose: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleStatus = async (value: string) => {
    if (!order) return;
    setBusy(true);
    try {
      await updateOrderStatus(order.id, value as OrderStatus);
      toast.success("Estado actualizado");
    } catch (error) {
      console.error("[orders] status update failed", error);
      toast.error("No pudimos actualizar");
    } finally {
      setBusy(false);
    }
  };

  const handlePaid = async (next: boolean) => {
    if (!order) return;
    setBusy(true);
    try {
      await markPaid(order.id, next);
      toast.success(next ? "Marcado como cobrado" : "Marcado como pendiente");
    } catch (error) {
      console.error("[orders] markPaid failed", error);
      toast.error("No pudimos actualizar");
    } finally {
      setBusy(false);
    }
  };

  const handleWhatsApp = () => {
    if (!order) return;
    const number = order.customerPhone.replace(/\D/g, "");
    if (!number) {
      toast.error("Sin teléfono válido");
      return;
    }
    const url = buildWhatsAppUrl(
      {
        items: order.items,
        total: order.total,
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        notes: order.notes,
      },
      number,
    );
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleDelete = async () => {
    if (!order) return;
    setBusy(true);
    try {
      await deleteOrder(order.id);
      toast.success("Pedido eliminado");
      setConfirmDelete(false);
      onClose();
    } catch (error) {
      console.error("[orders] delete failed", error);
      toast.error("No pudimos eliminar");
    } finally {
      setBusy(false);
    }
  };

  if (!order) return null;
  const date = toDate(order.createdAt);

  return (
    <>
      <Dialog open onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-h-[90svh] max-w-xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {order.customerName}
              {order.source === "manual" && (
                <span className="ml-2 rounded-full bg-muted px-2 py-0.5 align-middle text-[10px] font-medium uppercase tracking-wider text-brown-500">
                  Manual
                </span>
              )}
            </DialogTitle>
            <DialogDescription>
              {date ? date.toLocaleString("es-AR") : ""}
            </DialogDescription>
          </DialogHeader>

          <section className="flex flex-col gap-4">
            <ul className="flex flex-col gap-2 rounded-2xl border border-border bg-background/60 p-3">
              {order.items.map((item) => (
                <li
                  key={`${item.productId}-${item.sizeName}`}
                  className="flex items-center gap-3 text-sm"
                >
                  <span className="flex-1 text-brown-700">
                    {item.qty}x{" "}
                    <span className="font-medium text-brown-900">
                      {item.productName}
                    </span>{" "}
                    <span className="text-brown-500">({item.sizeName})</span>
                  </span>
                  <span className="font-medium text-brown-900">
                    {formatPrice(item.subtotal)}
                  </span>
                </li>
              ))}
            </ul>

            <div className="flex items-center justify-between rounded-2xl bg-secondary/70 px-4 py-3">
              <span className="text-sm text-brown-500">Total</span>
              <span className="font-display text-2xl text-brown-900">
                {formatPrice(order.total)}
              </span>
            </div>

            <div className="grid grid-cols-1 gap-3 rounded-2xl border border-border p-3 text-sm md:grid-cols-2">
              <div>
                <div className="text-xs uppercase tracking-wider text-brown-500">
                  Teléfono
                </div>
                <div className="text-brown-900">{order.customerPhone}</div>
              </div>
              {order.notes && (
                <div className="md:col-span-2">
                  <div className="text-xs uppercase tracking-wider text-brown-500">
                    Notas
                  </div>
                  <div className="text-brown-900">{order.notes}</div>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2 rounded-2xl border border-border p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-brown-700">Estado</span>
                <div className="min-w-[180px]">
                  <Select
                    value={order.status}
                    onValueChange={(v) => handleStatus(v as string)}
                    disabled={busy}
                  >
                    <SelectTrigger>
                      <span className="line-clamp-1">
                        {STATUS_OPTIONS.find((o) => o.value === order.status)
                          ?.label ?? order.status}
                      </span>
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-brown-700">
                  {order.paid ? "Cobrado" : "Pendiente de cobro"}
                </span>
                <Switch
                  checked={order.paid}
                  onCheckedChange={handlePaid}
                  disabled={busy}
                  aria-label="Marcar como cobrado"
                />
              </div>
            </div>
          </section>

          <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => setConfirmDelete(true)}
              className="rounded-full text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Eliminar
            </Button>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="rounded-full"
              >
                Cerrar
              </Button>
              <Button
                type="button"
                onClick={handleWhatsApp}
                className="rounded-full"
              >
                <MessageCircle className="h-4 w-4" />
                WhatsApp
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={confirmDelete}
        onOpenChange={(v) => !v && setConfirmDelete(false)}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Eliminar pedido</DialogTitle>
            <DialogDescription>
              ¿Eliminar el pedido de {order.customerName}? No se puede
              deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setConfirmDelete(false)}
              className="rounded-full"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={busy}
              className="rounded-full"
            >
              {busy ? "Eliminando..." : "Eliminar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
