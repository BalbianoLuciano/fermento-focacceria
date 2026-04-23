import type { CartItem } from "@/lib/cart/cart-store";
import type { DeliveryZone } from "@/lib/types";
import { formatDeliveryDate, ZONE_LABELS } from "@/lib/delivery";

export interface WhatsAppOrderPayload {
  items: CartItem[];
  total: number;
  customerName: string;
  customerPhone: string;
  notes?: string;
  deliveryDate?: string;
  deliveryZone?: DeliveryZone;
}

function formatPrice(value: number): string {
  return `$${value.toLocaleString("es-AR")}`;
}

export function buildWhatsAppMessage(order: WhatsAppOrderPayload): string {
  const {
    items,
    total,
    customerName,
    customerPhone,
    notes,
    deliveryDate,
    deliveryZone,
  } = order;

  const itemLines = items.map((item) => {
    const lineTotal = item.unitPrice * item.qty;
    return `• ${item.qty}x ${item.productName} (${item.sizeName}) — ${formatPrice(lineTotal)}`;
  });

  const lines = [
    "Hola Anna! Quiero hacer un pedido en Fermento Focacceria",
    "",
    "Detalle:",
    ...itemLines,
    "",
    `Total: ${formatPrice(total)}`,
    "",
    `Nombre: ${customerName}`,
    `Tel: ${customerPhone}`,
  ];

  if (deliveryDate && deliveryZone) {
    lines.push(
      `Entrega: ${formatDeliveryDate(deliveryDate)} - ${ZONE_LABELS[deliveryZone]}`,
    );
  }

  if (notes?.trim()) {
    lines.push(`Notas: ${notes.trim()}`);
  }

  return lines.join("\n");
}

export function buildWhatsAppUrl(
  order: WhatsAppOrderPayload,
  whatsappNumber: string,
): string {
  const message = buildWhatsAppMessage(order);
  const number = whatsappNumber.replace(/\D/g, "");
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}
