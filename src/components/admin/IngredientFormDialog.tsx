"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import { Switch } from "@/components/ui/switch";

import { addIngredient, updateIngredient } from "@/lib/firebase/ingredients";
import type { Ingredient, IngredientUnit } from "@/lib/types";

const schema = z.object({
  name: z.string().trim().min(2, "Muy corto").max(60),
  unit: z.enum(["g", "ml", "un"]),
  packageSize: z.number().positive("Debe ser > 0").optional(),
  packagePrice: z.number().nonnegative().optional(),
  pricePerUnit: z.number().nonnegative("Inválido"),
  order: z.number().int().min(0),
  active: z.boolean(),
});
type FormValues = z.infer<typeof schema>;

const priceFormatter = new Intl.NumberFormat("es-AR", {
  maximumFractionDigits: 4,
});

function defaultsFor(ingredient?: Ingredient | null): FormValues {
  if (!ingredient) {
    return {
      name: "",
      unit: "g",
      packageSize: undefined,
      packagePrice: undefined,
      pricePerUnit: 0,
      order: 99,
      active: true,
    };
  }
  return {
    name: ingredient.name,
    unit: ingredient.unit,
    packageSize: ingredient.packageSize,
    packagePrice: ingredient.packagePrice,
    pricePerUnit: ingredient.pricePerUnit,
    order: ingredient.order,
    active: ingredient.active,
  };
}

const UNIT_LABEL: Record<IngredientUnit, string> = {
  g: "gramo (g)",
  ml: "mililitro (ml)",
  un: "unidad",
};

export function IngredientFormDialog({
  open,
  onOpenChange,
  ingredient,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ingredient: Ingredient | null;
}) {
  const editing = ingredient !== null;
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: defaultsFor(ingredient),
  });

  useEffect(() => {
    if (open) form.reset(defaultsFor(ingredient));
  }, [open, ingredient, form]);

  // Auto-compute pricePerUnit from package data when both are present.
  const packageSize = form.watch("packageSize");
  const packagePrice = form.watch("packagePrice");
  useEffect(() => {
    if (
      typeof packageSize === "number" &&
      packageSize > 0 &&
      typeof packagePrice === "number" &&
      packagePrice >= 0
    ) {
      const computed = Number((packagePrice / packageSize).toFixed(4));
      const current = form.getValues("pricePerUnit");
      if (computed !== current) {
        form.setValue("pricePerUnit", computed, { shouldDirty: true });
      }
    }
  }, [packageSize, packagePrice, form]);

  const onSubmit = form.handleSubmit(async (values) => {
    setSubmitting(true);
    try {
      const payload = {
        name: values.name,
        unit: values.unit,
        pricePerUnit: values.pricePerUnit,
        packageSize: values.packageSize,
        packagePrice: values.packagePrice,
        order: values.order,
        active: values.active,
      };
      // Strip undefineds for Firestore.
      const cleaned = Object.fromEntries(
        Object.entries(payload).filter(([, v]) => v !== undefined),
      ) as typeof payload;

      if (editing && ingredient) {
        await updateIngredient(ingredient.id, cleaned);
      } else {
        await addIngredient(cleaned);
      }
      toast.success(editing ? "Ingrediente actualizado" : "Ingrediente creado");
      onOpenChange(false);
    } catch (error) {
      console.error("[ingredients] save failed", error);
      toast.error("No pudimos guardar");
    } finally {
      setSubmitting(false);
    }
  });

  const unit = form.watch("unit");
  const pricePerUnit = form.watch("pricePerUnit");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90svh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editing ? `Editar ${ingredient?.name}` : "Nuevo ingrediente"}
          </DialogTitle>
          <DialogDescription>
            El precio por unidad se usa para calcular el costo de cada pedido
            al momento de crearlo. Después podés subirlo sin afectar los
            pedidos ya cargados.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-[1fr_160px] gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="ing-name">Nombre</Label>
              <Input id="ing-name" {...form.register("name")} />
              {form.formState.errors.name && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.name.message}
                </p>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <Label>Unidad</Label>
              <Select
                value={unit}
                onValueChange={(v) =>
                  form.setValue("unit", v as IngredientUnit)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(UNIT_LABEL) as IngredientUnit[]).map((u) => (
                    <SelectItem key={u} value={u}>
                      {UNIT_LABEL[u]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col gap-3 rounded-2xl border border-border bg-background/60 p-3">
            <p className="text-xs text-brown-500">
              Tip: cargá el tamaño y precio del envase — calculamos el precio
              por {unit} solo.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-2">
                <Label htmlFor="ing-pkg-size">Tamaño del envase ({unit})</Label>
                <Input
                  id="ing-pkg-size"
                  type="number"
                  min={0}
                  step="any"
                  placeholder="1000"
                  {...form.register("packageSize", { valueAsNumber: true })}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="ing-pkg-price">Precio del envase ($)</Label>
                <Input
                  id="ing-pkg-price"
                  type="number"
                  min={0}
                  step="any"
                  placeholder="2500"
                  {...form.register("packagePrice", { valueAsNumber: true })}
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="ing-price">Precio por {unit} ($)</Label>
            <Input
              id="ing-price"
              type="number"
              min={0}
              step="any"
              {...form.register("pricePerUnit", { valueAsNumber: true })}
            />
            {pricePerUnit > 0 && (
              <p className="text-xs text-brown-500">
                = ${priceFormatter.format(pricePerUnit)} por {unit}
              </p>
            )}
            {form.formState.errors.pricePerUnit && (
              <p className="text-xs text-destructive">
                {form.formState.errors.pricePerUnit.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="ing-order">Orden</Label>
              <Input
                id="ing-order"
                type="number"
                min={0}
                {...form.register("order", { valueAsNumber: true })}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Activo</Label>
              <div className="flex h-8 items-center">
                <Switch
                  checked={form.watch("active")}
                  onCheckedChange={(v) => form.setValue("active", v)}
                />
              </div>
            </div>
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
              {submitting ? "Guardando..." : editing ? "Guardar" : "Crear"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
