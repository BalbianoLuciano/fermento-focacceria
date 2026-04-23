"use client";

import { useEffect, useMemo, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

import { updateOrder } from "@/lib/firebase/orders";
import { subscribeIngredients } from "@/lib/firebase/ingredients";
import { subscribeProducts } from "@/lib/firebase/products";
import type {
  Ingredient,
  Order,
  OrderItem,
  Product,
} from "@/lib/types";
import { computeItemUnitCost, buildIngredientMap } from "@/lib/cost";
import {
  ZONE_LABELS,
  ZONE_OPTIONS,
  type DeliveryZone,
} from "@/lib/delivery";
import { cn } from "@/lib/utils";

const priceFormatter = new Intl.NumberFormat("es-AR");
const formatPrice = (v: number) => `$${priceFormatter.format(Math.round(v))}`;

const schema = z.object({
  customerName: z.string().trim().min(2, "Requerido").max(80),
  customerPhone: z.string().trim().min(4, "Requerido").max(30),
  deliveryZone: z
    .enum(["corrientes", "resistencia"])
    .optional(),
  deliveryDate: z.string().optional(),
  notes: z.string().trim().max(500).optional(),
  items: z
    .array(
      z.object({
        key: z.string(),
        productId: z.string().min(1, "Elegí un producto"),
        sizeName: z.string().min(1, "Elegí un tamaño"),
        qty: z.number().int().min(1),
        originalUnitCost: z.number().optional(),
      }),
    )
    .min(1, "Al menos un ítem"),
});
type FormValues = z.infer<typeof schema>;

function itemKey(item: OrderItem) {
  return `${item.productId}::${item.sizeName}`;
}

export function OrderEditDialog({
  order,
  onClose,
}: {
  order: Order | null;
  onClose: () => void;
}) {
  const [products, setProducts] = useState<Product[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      customerName: "",
      customerPhone: "",
      notes: "",
      items: [],
    },
  });

  const items = useFieldArray({ control: form.control, name: "items" });

  useEffect(() => {
    if (!order) return;
    const unsubProducts = subscribeProducts((all) => setProducts(all));
    const unsubIngredients = subscribeIngredients((all) =>
      setIngredients(all),
    );
    return () => {
      unsubProducts();
      unsubIngredients();
    };
  }, [order]);

  useEffect(() => {
    if (!order) return;
    form.reset({
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      deliveryZone: order.deliveryZone,
      deliveryDate: order.deliveryDate ?? "",
      notes: order.notes ?? "",
      items: order.items.map((item) => ({
        key: itemKey(item),
        productId: item.productId,
        sizeName: item.sizeName,
        qty: item.qty,
        originalUnitCost: item.unitCost,
      })),
    });
  }, [order, form]);

  const watchedZone = form.watch("deliveryZone") as DeliveryZone | undefined;

  const watched = form.watch("items");
  const ingredientMap = useMemo(
    () => buildIngredientMap(ingredients),
    [ingredients],
  );

  const priced = useMemo(
    () =>
      watched.map((line) => {
        const product = products.find((p) => p.id === line.productId);
        const size = product?.sizes.find((s) => s.name === line.sizeName);
        const unitPrice = size?.price ?? 0;
        const unitCost =
          line.originalUnitCost ??
          computeItemUnitCost(product, line.sizeName, ingredientMap);
        const subtotal = unitPrice * line.qty;
        const subtotalCost = unitCost * line.qty;
        return {
          product,
          size,
          unitPrice,
          unitCost,
          subtotal,
          subtotalCost,
        };
      }),
    [watched, products, ingredientMap],
  );

  const totals = useMemo(() => {
    const total = priced.reduce((s, p) => s + p.subtotal, 0);
    const totalCost = priced.reduce((s, p) => s + p.subtotalCost, 0);
    return { total, totalCost, profit: total - totalCost };
  }, [priced]);

  const onSubmit = form.handleSubmit(async (values) => {
    if (!order) return;
    const resolvedItems: OrderItem[] = [];
    for (let i = 0; i < values.items.length; i++) {
      const line = values.items[i];
      const p = priced[i];
      if (!p.product || !p.size) {
        toast.error("Falta un producto o tamaño en una línea");
        return;
      }
      resolvedItems.push({
        productId: p.product.id,
        productName: p.product.name,
        sizeName: p.size.name,
        unitPrice: p.unitPrice,
        qty: line.qty,
        subtotal: p.subtotal,
        unitCost: p.unitCost,
        subtotalCost: p.subtotalCost,
      });
    }

    setSubmitting(true);
    try {
      await updateOrder(order.id, {
        customerName: values.customerName,
        customerPhone: values.customerPhone,
        notes: values.notes?.length ? values.notes : undefined,
        deliveryDate: values.deliveryDate || null,
        deliveryZone: values.deliveryZone || null,
        items: resolvedItems,
        total: totals.total,
        totalCost: totals.totalCost,
        profit: totals.profit,
      });
      toast.success("Pedido actualizado");
      onClose();
    } catch (error) {
      console.error("[orders] edit failed", error);
      toast.error("No pudimos guardar los cambios");
    } finally {
      setSubmitting(false);
    }
  });

  return (
    <Dialog open={order !== null} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90svh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar pedido</DialogTitle>
          <DialogDescription>
            Corregí lo que se cargó mal. Los ítems que ya estaban guardados
            mantienen su costo del momento original; si agregás uno nuevo, se
            calcula con los precios actuales.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="edit-name">Nombre</Label>
              <Input id="edit-name" {...form.register("customerName")} />
              {form.formState.errors.customerName && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.customerName.message}
                </p>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="edit-phone">Teléfono</Label>
              <Input id="edit-phone" {...form.register("customerPhone")} />
              {form.formState.errors.customerPhone && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.customerPhone.message}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label>Zona de entrega</Label>
            <div className="grid grid-cols-2 gap-2">
              {ZONE_OPTIONS.map((zone) => (
                <button
                  key={zone}
                  type="button"
                  onClick={() => {
                    if (watchedZone === zone) {
                      form.setValue("deliveryZone", undefined, { shouldValidate: true });
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
          </div>

          <div className="flex flex-col gap-2">
            <Label>Fecha de entrega</Label>
            <div className="rounded-2xl border border-border bg-background/60 p-3">
              <Calendar
                value={form.watch("deliveryDate") || undefined}
                onChange={(d) =>
                  form.setValue("deliveryDate", d, { shouldValidate: true })
                }
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <Label>Ítems</Label>
              <button
                type="button"
                onClick={() =>
                  items.append({
                    key: `new-${Date.now()}`,
                    productId: "",
                    sizeName: "",
                    qty: 1,
                  })
                }
                className="inline-flex items-center gap-1 text-xs text-brown-700 hover:text-brown-900"
              >
                <Plus className="h-3 w-3" />
                Agregar
              </button>
            </div>
            <div className="flex flex-col gap-3">
              {items.fields.map((field, index) => {
                const p = priced[index];
                const selectedProduct = p?.product;
                const selectedSize = p?.size;
                return (
                  <div
                    key={field.id}
                    className="flex flex-col gap-2 rounded-2xl border border-border bg-background/60 p-3"
                  >
                    <div className="flex items-start gap-2">
                      <div className="min-w-0 flex-1">
                        <Select
                          value={watched[index]?.productId || ""}
                          onValueChange={(v) => {
                            form.setValue(
                              `items.${index}.productId`,
                              v as string,
                            );
                            form.setValue(`items.${index}.sizeName`, "");
                            // New selection → reset originalUnitCost so new cost uses current prices.
                            form.setValue(
                              `items.${index}.originalUnitCost`,
                              undefined,
                            );
                          }}
                        >
                          <SelectTrigger className="w-full">
                            {selectedProduct ? (
                              <span className="line-clamp-1">
                                {selectedProduct.name}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">
                                Producto
                              </span>
                            )}
                          </SelectTrigger>
                          <SelectContent>
                            {products.map((product) => (
                              <SelectItem key={product.id} value={product.id}>
                                {product.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <button
                        type="button"
                        onClick={() => items.remove(index)}
                        disabled={items.fields.length === 1}
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-brown-500 hover:bg-muted disabled:opacity-40"
                        aria-label="Quitar ítem"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-[1fr_72px] items-start gap-2">
                      <Select
                        value={watched[index]?.sizeName || ""}
                        onValueChange={(v) => {
                          form.setValue(`items.${index}.sizeName`, v as string);
                          form.setValue(
                            `items.${index}.originalUnitCost`,
                            undefined,
                          );
                        }}
                        disabled={!selectedProduct}
                      >
                        <SelectTrigger className="w-full">
                          {selectedSize ? (
                            <span className="line-clamp-1">
                              {selectedSize.name} · {formatPrice(selectedSize.price)}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">
                              Tamaño
                            </span>
                          )}
                        </SelectTrigger>
                        <SelectContent>
                          {selectedProduct?.sizes.map((size) => (
                            <SelectItem key={size.name} value={size.name}>
                              {size.name} · {formatPrice(size.price)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        type="number"
                        min={1}
                        aria-label="Cantidad"
                        {...form.register(`items.${index}.qty`, {
                          valueAsNumber: true,
                        })}
                      />
                    </div>

                    {p && p.subtotal > 0 && (
                      <div className="flex items-center justify-between border-t border-border pt-2 text-xs text-brown-500">
                        <span>
                          Subtotal
                          {watched[index]?.originalUnitCost !== undefined ? (
                            <span className="ml-1 text-[10px] uppercase tracking-wider opacity-60">
                              · costo original
                            </span>
                          ) : (
                            <span className="ml-1 text-[10px] uppercase tracking-wider opacity-60">
                              · costo actual
                            </span>
                          )}
                        </span>
                        <span className="font-medium text-brown-900">
                          {formatPrice(p.subtotal)}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            {form.formState.errors.items?.message && (
              <p className="text-xs text-destructive">
                {form.formState.errors.items.message}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="edit-notes">Notas</Label>
            <Textarea id="edit-notes" rows={2} {...form.register("notes")} />
          </div>

          <div className="flex items-center justify-between rounded-2xl bg-secondary/70 px-4 py-3">
            <span className="text-sm text-brown-500">Total</span>
            <span className="font-display text-2xl text-brown-900">
              {formatPrice(totals.total)}
            </span>
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="rounded-full"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="rounded-full"
            >
              {submitting ? "Guardando..." : "Guardar cambios"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
