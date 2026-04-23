"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Check, Minus, Plus, Send, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  isDeliveryDayAllowed,
  ZONE_LABELS,
  ZONE_OPTIONS,
  type DeliveryZone,
} from "@/lib/delivery";

import {
  selectTotal,
  useCartStore,
  type CartItem,
} from "@/lib/cart/cart-store";
import { createOrder } from "@/lib/firebase/orders";
import { subscribeIngredients } from "@/lib/firebase/ingredients";
import { subscribeProducts } from "@/lib/firebase/products";
import type { Ingredient, Product } from "@/lib/types";
import { computeOrderCosts } from "@/lib/cost";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

const priceFormatter = new Intl.NumberFormat("es-AR");
const formatPrice = (v: number) => `$${priceFormatter.format(v)}`;

const schema = z.object({
  customerName: z
    .string()
    .trim()
    .min(2, "Necesitamos tu nombre para coordinar")
    .max(80, "Muy largo, cortalo un poco"),
  customerPhone: z
    .string()
    .trim()
    .regex(/^[\d\s+\-()]{7,20}$/, "Teléfono inválido (solo dígitos y espacios)"),
  deliveryZone: z.enum(["corrientes", "resistencia"], {
    message: "Elegí tu zona",
  }),
  deliveryDate: z.string().min(1, "Elegí una fecha de entrega"),
  notes: z.string().trim().max(500, "Muy largo").optional(),
});
type FormValues = z.infer<typeof schema>;

function CartRow({
  item,
  onDec,
  onInc,
  onRemove,
}: {
  item: CartItem;
  onDec: () => void;
  onInc: () => void;
  onRemove: () => void;
}) {
  const subtotal = item.unitPrice * item.qty;
  return (
    <li className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4">
      <div className="flex flex-1 flex-col gap-0.5">
        <span className="font-display text-lg leading-tight text-brown-900">
          {item.productName}
        </span>
        <span className="text-xs uppercase tracking-wider text-brown-500">
          {item.sizeName} · {formatPrice(item.unitPrice)}
        </span>
      </div>

      <div className="flex items-center gap-1 rounded-full border border-border bg-background p-1">
        <button
          type="button"
          onClick={onDec}
          aria-label="Restar una unidad"
          className="flex h-8 w-8 items-center justify-center rounded-full text-brown-700 transition-colors hover:bg-muted"
        >
          <Minus className="h-3.5 w-3.5" />
        </button>
        <span className="min-w-[1.5rem] text-center text-sm font-medium text-brown-900">
          {item.qty}
        </span>
        <button
          type="button"
          onClick={onInc}
          aria-label="Sumar una unidad"
          className="flex h-8 w-8 items-center justify-center rounded-full text-brown-700 transition-colors hover:bg-muted"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="flex flex-col items-end gap-1">
        <span className="font-display text-base text-brown-900">
          {formatPrice(subtotal)}
        </span>
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Quitar ${item.productName}`}
          className="inline-flex items-center gap-1 text-xs text-brown-500 hover:text-destructive"
        >
          <Trash2 className="h-3 w-3" />
          Quitar
        </button>
      </div>
    </li>
  );
}

function EmptyCart() {
  return (
    <div className="mx-auto flex w-full max-w-lg flex-col items-center gap-6 rounded-3xl border border-dashed border-border bg-card/60 px-6 py-16 text-center">
      <p className="font-display text-3xl text-brown-700">
        Todavía no sumaste nada
      </p>
      <p className="max-w-sm text-sm text-brown-500">
        Dale una vuelta al menú y sumá tus sabores favoritos. Después volvés
        acá para confirmar.
      </p>
      <Link
        href="/#menu"
        className="inline-flex h-12 items-center gap-2 rounded-full bg-brown-900 px-6 text-sm font-medium text-background transition-transform hover:-translate-y-0.5"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver al menú
      </Link>
    </div>
  );
}

function SentConfirmation({ customerName }: { customerName: string }) {
  return (
    <div className="mx-auto flex w-full max-w-lg flex-col items-center gap-6 rounded-3xl border border-border bg-card px-6 py-16 text-center shadow-sm">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success/20 text-success">
        <Check className="h-7 w-7" />
      </div>
      <div className="flex flex-col gap-2">
        <h2 className="font-display text-3xl text-brown-900">
          ¡Pedido enviado!
        </h2>
        <p className="max-w-sm text-sm text-brown-500">
          {customerName
            ? `Gracias ${customerName}. Anna te va a escribir por WhatsApp para coordinar la entrega.`
            : "Anna te va a escribir por WhatsApp para coordinar la entrega."}
        </p>
      </div>
      <Link
        href="/"
        className="inline-flex h-12 items-center gap-2 rounded-full bg-brown-900 px-6 text-sm font-medium text-background transition-transform hover:-translate-y-0.5"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver al inicio
      </Link>
    </div>
  );
}

export function PedidoFlow() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const items = useCartStore((state) => state.items);
  const total = useCartStore(selectTotal);
  const updateQty = useCartStore((state) => state.updateQty);
  const removeItem = useCartStore((state) => state.removeItem);
  const clear = useCartStore((state) => state.clear);

  const [submitting, setSubmitting] = useState(false);
  const [sentForName, setSentForName] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);

  useEffect(() => {
    const unsubProducts = subscribeProducts((all) => setProducts(all));
    const unsubIngredients = subscribeIngredients((all) =>
      setIngredients(all),
    );
    return () => {
      unsubProducts();
      unsubIngredients();
    };
  }, []);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      customerName: "",
      customerPhone: "",
      deliveryZone: undefined,
      deliveryDate: "",
      notes: "",
    },
  });

  const watchedZone = form.watch("deliveryZone") as DeliveryZone | undefined;

  // Wait for localStorage hydration before deciding empty vs populated.
  if (!mounted) {
    return (
      <div
        className="mx-auto h-64 w-full max-w-xl animate-pulse rounded-3xl bg-card/40"
        aria-hidden="true"
      />
    );
  }

  if (sentForName !== null) {
    return <SentConfirmation customerName={sentForName} />;
  }

  if (items.length === 0) {
    return <EmptyCart />;
  }

  const onSubmit = form.handleSubmit(async (values) => {
    const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;
    if (!whatsappNumber) {
      toast.error("Falta configurar el número de WhatsApp");
      return;
    }

    setSubmitting(true);
    try {
      const { items: pricedItems, totalCost, profit } = computeOrderCosts(
        items.map((i) => ({
          productId: i.productId,
          productName: i.productName,
          sizeName: i.sizeName,
          unitPrice: i.unitPrice,
          qty: i.qty,
        })),
        products,
        ingredients,
      );

      const url = buildWhatsAppUrl(
        {
          items,
          total,
          customerName: values.customerName,
          customerPhone: values.customerPhone,
          notes: values.notes,
          deliveryDate: values.deliveryDate,
          deliveryZone: values.deliveryZone,
        },
        whatsappNumber,
      );

      // Open WhatsApp synchronously within the user gesture so browsers
      // don't flag it as a blocked popup (async gaps break the gesture chain).
      const opened = window.open(url, "_blank", "noopener,noreferrer");
      if (!opened) {
        window.location.href = url;
      }

      await createOrder({
        customerName: values.customerName,
        customerPhone: values.customerPhone,
        items: pricedItems,
        total,
        totalCost,
        profit,
        notes: values.notes?.length ? values.notes : undefined,
        deliveryDate: values.deliveryDate,
        deliveryZone: values.deliveryZone,
        status: "pending",
        paid: false,
        source: "web",
      });

      clear();
      setSentForName(values.customerName);
    } catch (error) {
      console.error("[pedido] create failed", error);
      toast.error("No pudimos enviar tu pedido. Probá de nuevo en un rato.");
    } finally {
      setSubmitting(false);
    }
  });

  return (
    <div className="mx-auto grid w-full max-w-5xl gap-10 lg:grid-cols-[1fr_380px] lg:items-start">
      <section className="flex flex-col gap-6">
        <header className="flex items-center justify-between">
          <h2 className="font-display text-2xl text-brown-900">Tu pedido</h2>
          <button
            type="button"
            onClick={() => clear()}
            className="text-xs text-brown-500 hover:text-brown-700"
          >
            Vaciar
          </button>
        </header>
        <ul className="flex flex-col gap-3">
          {items.map((item) => (
            <CartRow
              key={`${item.productId}-${item.sizeName}`}
              item={item}
              onInc={() => updateQty(item.productId, item.sizeName, item.qty + 1)}
              onDec={() => updateQty(item.productId, item.sizeName, item.qty - 1)}
              onRemove={() => removeItem(item.productId, item.sizeName)}
            />
          ))}
        </ul>
      </section>

      <form
        onSubmit={onSubmit}
        className="flex flex-col gap-5 rounded-3xl border border-border bg-card p-6 shadow-sm lg:sticky lg:top-24"
      >
        <div className="flex items-baseline justify-between">
          <span className="text-sm text-brown-500">Total</span>
          <span className="font-display text-3xl text-brown-900">
            {formatPrice(total)}
          </span>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="customerName">Nombre</Label>
          <Input
            id="customerName"
            autoComplete="name"
            placeholder="Cómo te llamás"
            {...form.register("customerName")}
            aria-invalid={!!form.formState.errors.customerName}
          />
          {form.formState.errors.customerName && (
            <p className="text-xs text-destructive">
              {form.formState.errors.customerName.message}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="customerPhone">Teléfono</Label>
          <Input
            id="customerPhone"
            type="tel"
            autoComplete="tel"
            placeholder="3735 123456"
            {...form.register("customerPhone")}
            aria-invalid={!!form.formState.errors.customerPhone}
          />
          {form.formState.errors.customerPhone && (
            <p className="text-xs text-destructive">
              {form.formState.errors.customerPhone.message}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="notes">Notas (opcional)</Label>
          <Textarea
            id="notes"
            placeholder="Para retirar mañana al mediodía, sin ajo, etc."
            rows={3}
            {...form.register("notes")}
            aria-invalid={!!form.formState.errors.notes}
          />
          {form.formState.errors.notes && (
            <p className="text-xs text-destructive">
              {form.formState.errors.notes.message}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-2">
            <Label>Zona de entrega</Label>
            <div className="grid grid-cols-2 gap-2">
              {ZONE_OPTIONS.map((zone) => (
                <button
                  key={zone}
                  type="button"
                  onClick={() => {
                    if (watchedZone === zone) {
                      form.setValue("deliveryZone", undefined as unknown as "corrientes", { shouldValidate: true });
                      form.setValue("deliveryDate", "");
                    } else {
                      form.setValue("deliveryZone", zone, { shouldValidate: true });
                      form.setValue("deliveryDate", "");
                    }
                  }}
                  className={cn(
                    "rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                    watchedZone === zone
                      ? "border-brown-900 bg-brown-900 text-background"
                      : "border-border text-brown-600 hover:border-brown-400",
                  )}
                >
                  {ZONE_LABELS[zone]}
                </button>
              ))}
            </div>
            {form.formState.errors.deliveryZone && (
              <p className="text-xs text-destructive">
                {form.formState.errors.deliveryZone.message}
              </p>
            )}
          </div>

          {watchedZone && (
            <div className="flex flex-col gap-2">
              <Label>Fecha de entrega</Label>
              <div className="rounded-2xl border border-border bg-background/60 p-3">
                <Calendar
                  value={form.watch("deliveryDate")}
                  onChange={(d) =>
                    form.setValue("deliveryDate", d, { shouldValidate: true })
                  }
                  isDayDisabled={(d) => !isDeliveryDayAllowed(d, watchedZone)}
                />
              </div>
              {form.formState.errors.deliveryDate && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.deliveryDate.message}
                </p>
              )}
            </div>
          )}
        </div>

        <Button
          type="submit"
          disabled={submitting}
          className={cn(
            "h-12 w-full justify-center rounded-full text-base",
            submitting && "opacity-70",
          )}
        >
          <Send className="h-4 w-4" />
          {submitting ? "Enviando..." : "Confirmar por WhatsApp"}
        </Button>

        <p className="text-center text-xs text-brown-500">
          Te abrimos WhatsApp con el detalle pre-cargado. Anna confirma
          disponibilidad y coordinan entrega/pago.
        </p>
      </form>
    </div>
  );
}
