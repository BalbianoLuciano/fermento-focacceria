"use client";

import Image from "next/image";
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
import { ProductFormDialog } from "@/components/admin/ProductFormDialog";

import {
  deleteProduct,
  setProductActive,
  subscribeProducts,
} from "@/lib/firebase/products";
import { deleteImage } from "@/lib/firebase/storage";
import type { Product } from "@/lib/types";

const priceFormatter = new Intl.NumberFormat("es-AR");
const formatPrice = (v: number) => `$${priceFormatter.format(v)}`;

export function ProductsList() {
  const [products, setProducts] = useState<Product[] | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeProducts((all) => setProducts(all));
    return () => unsubscribe();
  }, []);

  const openNew = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (product: Product) => {
    setEditing(product);
    setFormOpen(true);
  };

  const toggleActive = async (product: Product, next: boolean) => {
    try {
      await setProductActive(product.id, next);
      toast.success(next ? "Activado" : "Desactivado");
    } catch (error) {
      console.error("[products] toggle failed", error);
      toast.error("No pudimos actualizar");
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      if (deleteTarget.imageUrl) {
        await deleteImage(deleteTarget.imageUrl).catch(() => {});
      }
      await deleteProduct(deleteTarget.id);
      toast.success("Producto eliminado");
      setDeleteTarget(null);
    } catch (error) {
      console.error("[products] delete failed", error);
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
            Productos
          </h1>
          <p className="text-sm text-brown-500">
            Lo que aparece en el menú público.
          </p>
        </div>
        <Button onClick={openNew} className="self-start rounded-full">
          <Plus className="h-4 w-4" />
          Nuevo producto
        </Button>
      </header>

      {products === null ? (
        <div className="grid gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              aria-hidden="true"
              className="h-28 animate-pulse rounded-2xl bg-card/70"
            />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="flex min-h-[30vh] flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-border bg-card/60 px-8 py-16 text-center">
          <p className="font-display text-2xl text-brown-700">
            Todavía no hay productos
          </p>
          <p className="text-sm text-brown-500">
            Creá el primero con el botón de arriba.
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {products.map((product) => (
            <li
              key={product.id}
              className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:gap-4"
            >
              <div className="flex gap-3 sm:flex-1">
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-secondary sm:h-16 sm:w-16">
                  {product.imageUrl ? (
                    <Image
                      src={product.imageUrl}
                      alt=""
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center font-display text-xl text-brown-500">
                      {product.name.charAt(0)}
                    </div>
                  )}
                </div>

                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-medium text-brown-900">
                      {product.name}
                    </span>
                    <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-brown-500">
                      #{product.order}
                    </span>
                  </div>
                  <p className="hidden truncate text-xs text-brown-500 sm:block">
                    {product.description}
                  </p>
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    {product.sizes.map((size) => (
                      <span
                        key={size.name}
                        className="inline-flex items-center gap-1 rounded-full bg-background px-2 py-0.5 text-[11px] text-brown-700"
                      >
                        <span className="text-brown-500">{size.name}</span>
                        <span className="font-medium">
                          {formatPrice(size.price)}
                        </span>
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-border pt-3 sm:border-t-0 sm:pt-0">
                <Switch
                  checked={product.active}
                  onCheckedChange={(v) => toggleActive(product, v)}
                  aria-label="Activo"
                />
                <button
                  type="button"
                  onClick={() => openEdit(product)}
                  aria-label={`Editar ${product.name}`}
                  className="flex h-9 w-9 items-center justify-center rounded-full text-brown-700 transition-colors hover:bg-muted"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteTarget(product)}
                  aria-label={`Eliminar ${product.name}`}
                  className="flex h-9 w-9 items-center justify-center rounded-full text-destructive transition-colors hover:bg-destructive/10"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <ProductFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        product={editing}
      />

      <Dialog
        open={deleteTarget !== null}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Eliminar producto</DialogTitle>
            <DialogDescription>
              ¿Eliminar {deleteTarget?.name}? Esto no se puede deshacer.
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
