"use client";

import { useEffect, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Trash2 } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

import { createOrder } from "@/lib/firebase/orders";
import { subscribeIngredients } from "@/lib/firebase/ingredients";
import { subscribeProducts } from "@/lib/firebase/products";
import type { Ingredient, Product } from "@/lib/types";
import { computeOrderCosts } from "@/lib/cost";

const priceFormatter = new Intl.NumberFormat("es-AR");
const formatPrice = (v: number) => `$${priceFormatter.format(v)}`;

const schema = z.object({
  customerName: z.string().trim().min(2, "Requerido").max(80),
  customerPhone: z.string().trim().min(4, "Requerido").max(30),
  notes: z.string().trim().max(500).optional(),
  items: z
    .array(
      z.object({
        productId: z.string().min(1, "Elegí un producto"),
        sizeName: z.string().min(1, "Elegí un tamaño"),
        qty: z.number().int().min(1),
      }),
    )
    .min(1, "Agregá al menos un ítem"),
});
type FormValues = z.infer<typeof schema>;

const emptyItem = { productId: "", sizeName: "", qty: 1 };

export function ManualOrderDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
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
      items: [{ ...emptyItem }],
    },
  });

  const items = useFieldArray({ control: form.control, name: "items" });

  useEffect(() => {
    if (!open) return;
    const unsubProducts = subscribeProducts(
      (all) => setProducts(all),
      { activeOnly: true },
    );
    const unsubIngredients = subscribeIngredients((all) =>
      setIngredients(all),
    );
    return () => {
      unsubProducts();
      unsubIngredients();
    };
  }, [open]);

  useEffect(() => {
    if (open) {
      form.reset({
        customerName: "",
        customerPhone: "",
        notes: "",
        items: [{ ...emptyItem }],
      });
    }
  }, [open, form]);

  const watchedItems = form.watch("items");
  const total = watchedItems.reduce((sum, line) => {
    const product = products.find((p) => p.id === line.productId);
    const size = product?.sizes.find((s) => s.name === line.sizeName);
    if (!size) return sum;
    return sum + size.price * (line.qty || 0);
  }, 0);

  const onSubmit = form.handleSubmit(async (values) => {
    const resolved = values.items
      .map((line) => {
        const product = products.find((p) => p.id === line.productId);
        const size = product?.sizes.find((s) => s.name === line.sizeName);
        if (!product || !size) return null;
        return {
          productId: product.id,
          productName: product.name,
          sizeName: size.name,
          unitPrice: size.price,
          qty: line.qty,
        };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);

    if (resolved.length === 0) {
      toast.error("Completá los ítems");
      return;
    }

    setSubmitting(true);
    try {
      const { items: pricedItems, total, totalCost, profit } =
        computeOrderCosts(resolved, products, ingredients);

      await createOrder({
        customerName: values.customerName,
        customerPhone: values.customerPhone,
        notes: values.notes?.length ? values.notes : undefined,
        items: pricedItems,
        total,
        totalCost,
        profit,
        status: "pending",
        paid: false,
        source: "manual",
      });
      toast.success("Pedido manual creado");
      onOpenChange(false);
    } catch (error) {
      console.error("[orders] manual create failed", error);
      toast.error("No pudimos crear el pedido");
    } finally {
      setSubmitting(false);
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90svh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Pedido manual</DialogTitle>
          <DialogDescription>
            Para cargar un pedido que entró por WhatsApp o teléfono.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="manual-name">Nombre</Label>
              <Input id="manual-name" {...form.register("customerName")} />
              {form.formState.errors.customerName && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.customerName.message}
                </p>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="manual-phone">Teléfono</Label>
              <Input id="manual-phone" {...form.register("customerPhone")} />
              {form.formState.errors.customerPhone && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.customerPhone.message}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <Label>Ítems</Label>
              <button
                type="button"
                onClick={() => items.append({ ...emptyItem })}
                className="inline-flex items-center gap-1 text-xs text-brown-700 hover:text-brown-900"
              >
                <Plus className="h-3 w-3" />
                Agregar
              </button>
            </div>
            <div className="flex flex-col gap-3">
              {items.fields.map((field, index) => {
                const selectedProductId = watchedItems[index]?.productId;
                const selectedProduct = products.find(
                  (p) => p.id === selectedProductId,
                );
                const selectedSize = selectedProduct?.sizes.find(
                  (s) => s.name === watchedItems[index]?.sizeName,
                );
                const qty = watchedItems[index]?.qty || 0;
                const lineTotal =
                  selectedSize && qty > 0 ? selectedSize.price * qty : 0;
                return (
                  <div
                    key={field.id}
                    className="flex flex-col gap-2 rounded-2xl border border-border bg-background/60 p-3"
                  >
                    <div className="flex items-start gap-2">
                      <div className="min-w-0 flex-1">
                        <Select
                          value={selectedProductId || ""}
                          onValueChange={(v) => {
                            form.setValue(
                              `items.${index}.productId`,
                              v as string,
                            );
                            form.setValue(`items.${index}.sizeName`, "");
                          }}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Producto" />
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
                        value={watchedItems[index]?.sizeName || ""}
                        onValueChange={(v) =>
                          form.setValue(`items.${index}.sizeName`, v as string)
                        }
                        disabled={!selectedProduct}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Tamaño" />
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

                    {lineTotal > 0 && (
                      <div className="flex items-center justify-between border-t border-border pt-2 text-xs text-brown-500">
                        <span>Subtotal</span>
                        <span className="font-medium text-brown-900">
                          {formatPrice(lineTotal)}
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
            <Label htmlFor="manual-notes">Notas</Label>
            <Textarea
              id="manual-notes"
              rows={2}
              {...form.register("notes")}
            />
          </div>

          <div className="flex items-center justify-between rounded-2xl bg-secondary/70 px-4 py-3">
            <span className="text-sm text-brown-500">Total estimado</span>
            <span className="font-display text-2xl text-brown-900">
              {formatPrice(total)}
            </span>
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="rounded-full"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="rounded-full"
            >
              {submitting ? "Guardando..." : "Crear pedido"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
