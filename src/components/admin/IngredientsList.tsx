"use client";

import { useEffect, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
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
import { Switch } from "@/components/ui/switch";
import { IngredientFormDialog } from "@/components/admin/IngredientFormDialog";

import {
  deleteIngredient,
  setIngredientActive,
  subscribeIngredients,
} from "@/lib/firebase/ingredients";
import type { Ingredient } from "@/lib/types";

const priceFormatter = new Intl.NumberFormat("es-AR", {
  maximumFractionDigits: 4,
});

export function IngredientsList() {
  const [ingredients, setIngredients] = useState<Ingredient[] | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Ingredient | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Ingredient | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeIngredients((all) => setIngredients(all));
    return () => unsubscribe();
  }, []);

  const openNew = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (ingredient: Ingredient) => {
    setEditing(ingredient);
    setFormOpen(true);
  };

  const toggleActive = async (ingredient: Ingredient, next: boolean) => {
    try {
      await setIngredientActive(ingredient.id, next);
      toast.success(next ? "Activado" : "Desactivado");
    } catch (error) {
      console.error("[ingredients] toggle failed", error);
      toast.error("No pudimos actualizar");
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteIngredient(deleteTarget.id);
      toast.success("Ingrediente eliminado");
      setDeleteTarget(null);
    } catch (error) {
      console.error("[ingredients] delete failed", error);
      toast.error("No pudimos eliminar");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-display text-3xl text-brown-900 md:text-4xl">
            Ingredientes
          </h1>
          <p className="text-sm text-brown-500">
            Precios por unidad. Se usan para calcular el costo de cada pedido
            al momento de crearlo.
          </p>
        </div>
        <Button onClick={openNew} className="self-start rounded-full">
          <Plus className="h-4 w-4" />
          Nuevo ingrediente
        </Button>
      </header>

      {ingredients === null ? (
        <div className="grid gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              aria-hidden="true"
              className="h-20 animate-pulse rounded-2xl bg-card/70"
            />
          ))}
        </div>
      ) : ingredients.length === 0 ? (
        <div className="flex min-h-[30vh] flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-border bg-card/60 px-8 py-16 text-center">
          <p className="font-display text-2xl text-brown-700">
            Todavía no hay ingredientes
          </p>
          <p className="text-sm text-brown-500">
            Cargá los básicos (harina, aceite, etc.) antes de definir recetas.
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {ingredients.map((ingredient) => (
            <li
              key={ingredient.id}
              className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4"
            >
              <div className="flex flex-1 flex-col gap-0.5 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="truncate font-medium text-brown-900">
                    {ingredient.name}
                  </span>
                  <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-brown-500">
                    #{ingredient.order}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-brown-500">
                  <span className="rounded-full bg-background px-2 py-0.5 font-medium text-brown-700">
                    ${priceFormatter.format(ingredient.pricePerUnit)} /{" "}
                    {ingredient.unit}
                  </span>
                  {typeof ingredient.packageSize === "number" &&
                    typeof ingredient.packagePrice === "number" && (
                      <span>
                        envase: {ingredient.packageSize}
                        {ingredient.unit} = $
                        {priceFormatter.format(ingredient.packagePrice)}
                      </span>
                    )}
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-3">
                <Switch
                  checked={ingredient.active}
                  onCheckedChange={(v) => toggleActive(ingredient, v)}
                  aria-label="Activo"
                />
                <button
                  type="button"
                  onClick={() => openEdit(ingredient)}
                  aria-label={`Editar ${ingredient.name}`}
                  className="flex h-9 w-9 items-center justify-center rounded-full text-brown-700 transition-colors hover:bg-muted"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteTarget(ingredient)}
                  aria-label={`Eliminar ${ingredient.name}`}
                  className="flex h-9 w-9 items-center justify-center rounded-full text-destructive transition-colors hover:bg-destructive/10"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <IngredientFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        ingredient={editing}
      />

      <Dialog
        open={deleteTarget !== null}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Eliminar ingrediente</DialogTitle>
            <DialogDescription>
              ¿Eliminar {deleteTarget?.name}? Si está en alguna receta, esa
              línea va a quedar rota. No se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              className="rounded-full"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleting}
              className="rounded-full"
            >
              {deleting ? "Eliminando..." : "Eliminar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
