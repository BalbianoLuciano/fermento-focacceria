"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ImagePlus, Plus, Trash2 } from "lucide-react";
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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

import { addProduct, updateProduct } from "@/lib/firebase/products";
import { deleteImage, uploadImage } from "@/lib/firebase/storage";
import type { Product } from "@/lib/types";

const schema = z.object({
  name: z.string().trim().min(2, "Muy corto").max(60, "Muy largo"),
  description: z.string().trim().min(5, "Muy corto").max(200, "Muy largo"),
  sizes: z
    .array(
      z.object({
        name: z.string().trim().min(1, "Requerido").max(30),
        price: z.number().nonnegative("Inválido"),
      }),
    )
    .min(1, "Al menos un tamaño"),
  order: z.number().int().min(0),
  active: z.boolean(),
});
type FormValues = z.infer<typeof schema>;

function defaultsFor(product?: Product | null): FormValues {
  if (!product) {
    return {
      name: "",
      description: "",
      sizes: [{ name: "Individual", price: 0 }],
      order: 99,
      active: true,
    };
  }
  return {
    name: product.name,
    description: product.description,
    sizes: product.sizes.length
      ? product.sizes.map((s) => ({ name: s.name, price: s.price }))
      : [{ name: "Individual", price: 0 }],
    order: product.order,
    active: product.active,
  };
}

export function ProductFormDialog({
  open,
  onOpenChange,
  product,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product | null;
}) {
  const editing = product !== null;
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: defaultsFor(product),
  });

  const sizes = useFieldArray({ control: form.control, name: "sizes" });

  useEffect(() => {
    if (open) {
      form.reset(defaultsFor(product));
      setFile(null);
      setPreviewUrl(product?.imageUrl ?? null);
    }
  }, [open, product, form]);

  useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const handleFile = (event: ChangeEvent<HTMLInputElement>) => {
    const picked = event.target.files?.[0];
    if (picked) setFile(picked);
  };

  const onSubmit = form.handleSubmit(async (values) => {
    setSubmitting(true);
    try {
      let id = product?.id;
      let imageUrl = product?.imageUrl ?? "";
      const previousImageUrl = product?.imageUrl;

      if (!editing) {
        id = await addProduct({
          name: values.name,
          description: values.description,
          imageUrl: "",
          sizes: values.sizes,
          active: values.active,
          order: values.order,
        });
      }

      if (file && id) {
        imageUrl = await uploadImage(file, `products/${id}/cover.jpg`);
        if (
          previousImageUrl &&
          previousImageUrl !== imageUrl &&
          !previousImageUrl.includes(`/products%2F${id}%2Fcover.jpg`)
        ) {
          // Clean up any older storage object that doesn't match the new path.
          await deleteImage(previousImageUrl).catch(() => {});
        }
      }

      if (id) {
        await updateProduct(id, {
          name: values.name,
          description: values.description,
          imageUrl,
          sizes: values.sizes,
          active: values.active,
          order: values.order,
        });
      }

      toast.success(editing ? "Producto actualizado" : "Producto creado");
      onOpenChange(false);
    } catch (error) {
      console.error("[products] save failed", error);
      toast.error("No pudimos guardar. Revisá las rules y probá de nuevo.");
    } finally {
      setSubmitting(false);
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90svh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editing ? `Editar ${product?.name}` : "Nuevo producto"}
          </DialogTitle>
          <DialogDescription>
            Nombre, descripción, tamaños y foto. Se muestra en el menú público
            si está activo.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label>Foto</Label>
            <div className="flex items-center gap-3">
              <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-border bg-secondary">
                {previewUrl ? (
                  <Image
                    src={previewUrl}
                    alt="Vista previa"
                    fill
                    sizes="80px"
                    className="object-cover"
                    unoptimized={previewUrl.startsWith("blob:")}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-brown-400">
                    <ImagePlus className="h-5 w-5" />
                  </div>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFile}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="rounded-full"
              >
                {previewUrl ? "Cambiar foto" : "Elegir foto"}
              </Button>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="product-name">Nombre</Label>
            <Input id="product-name" {...form.register("name")} />
            {form.formState.errors.name && (
              <p className="text-xs text-destructive">
                {form.formState.errors.name.message}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="product-description">Descripción</Label>
            <Textarea
              id="product-description"
              rows={2}
              {...form.register("description")}
            />
            {form.formState.errors.description && (
              <p className="text-xs text-destructive">
                {form.formState.errors.description.message}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <Label>Tamaños</Label>
              <button
                type="button"
                onClick={() => sizes.append({ name: "", price: 0 })}
                className="inline-flex items-center gap-1 text-xs text-brown-700 hover:text-brown-900"
              >
                <Plus className="h-3 w-3" />
                Agregar tamaño
              </button>
            </div>
            <div className="flex flex-col gap-2">
              {sizes.fields.map((field, index) => (
                <div key={field.id} className="flex items-start gap-2">
                  <Input
                    placeholder="Nombre (ej. XL)"
                    {...form.register(`sizes.${index}.name`)}
                    className="flex-1"
                  />
                  <Input
                    type="number"
                    placeholder="Precio"
                    {...form.register(`sizes.${index}.price`, {
                      valueAsNumber: true,
                    })}
                    className="w-28"
                    min={0}
                  />
                  <button
                    type="button"
                    onClick={() => sizes.remove(index)}
                    disabled={sizes.fields.length === 1}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-brown-500 hover:bg-muted disabled:opacity-40"
                    aria-label="Quitar tamaño"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
            {form.formState.errors.sizes?.message && (
              <p className="text-xs text-destructive">
                {form.formState.errors.sizes.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="product-order">Orden</Label>
              <Input
                id="product-order"
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

          <DialogFooter className="mt-2 gap-2">
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
