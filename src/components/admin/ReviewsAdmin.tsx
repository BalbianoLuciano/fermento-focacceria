"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ImagePlus, Pencil, Plus, Star, Trash2 } from "lucide-react";
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
import { cn } from "@/lib/utils";

import {
  addReview,
  deleteReview,
  subscribeReviews,
  updateReview,
} from "@/lib/firebase/reviews";
import { deleteImage, uploadImage } from "@/lib/firebase/storage";
import type { Review } from "@/lib/types";

const schema = z.object({
  authorName: z.string().trim().min(2, "Muy corto").max(60),
  rating: z.number().int().min(1).max(5),
  text: z.string().trim().min(5, "Muy corto").max(400),
  order: z.number().int().min(0),
  active: z.boolean(),
});
type FormValues = z.infer<typeof schema>;

function defaultsFor(review?: Review | null): FormValues {
  if (!review) {
    return {
      authorName: "",
      rating: 5,
      text: "",
      order: 99,
      active: true,
    };
  }
  return {
    authorName: review.authorName,
    rating: review.rating,
    text: review.text,
    order: review.order,
    active: review.active,
  };
}

function StarPicker({
  value,
  onChange,
}: {
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          aria-label={`${star} estrella${star > 1 ? "s" : ""}`}
          className="p-1"
        >
          <Star
            className={cn(
              "h-6 w-6",
              star <= value ? "fill-gold text-gold" : "text-muted",
            )}
          />
        </button>
      ))}
    </div>
  );
}

function ReviewFormDialog({
  open,
  onOpenChange,
  review,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  review: Review | null;
}) {
  const editing = review !== null;
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: defaultsFor(review),
  });

  useEffect(() => {
    if (open) {
      form.reset(defaultsFor(review));
      setFile(null);
      setRemoveImage(false);
      setPreviewUrl(review?.imageUrl ?? null);
    }
  }, [open, review, form]);

  useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const handleFile = (event: ChangeEvent<HTMLInputElement>) => {
    const picked = event.target.files?.[0];
    if (picked) {
      setFile(picked);
      setRemoveImage(false);
    }
  };

  const onSubmit = form.handleSubmit(async (values) => {
    setSubmitting(true);
    try {
      let id = review?.id;
      let imageUrl = review?.imageUrl;
      const previousImageUrl = review?.imageUrl;

      if (!editing) {
        id = await addReview({
          authorName: values.authorName,
          rating: values.rating,
          text: values.text,
          imageUrl: "",
          order: values.order,
          active: values.active,
        });
      }

      if (file && id) {
        imageUrl = await uploadImage(
          file,
          `reviews/${id}.${file.name.split(".").pop() ?? "jpg"}`,
        );
        if (previousImageUrl && previousImageUrl !== imageUrl) {
          await deleteImage(previousImageUrl).catch(() => {});
        }
      } else if (removeImage && previousImageUrl) {
        await deleteImage(previousImageUrl).catch(() => {});
        imageUrl = "";
      }

      if (id) {
        await updateReview(id, {
          authorName: values.authorName,
          rating: values.rating,
          text: values.text,
          imageUrl: imageUrl ?? "",
          order: values.order,
          active: values.active,
        });
      }

      toast.success(editing ? "Reseña actualizada" : "Reseña creada");
      onOpenChange(false);
    } catch (error) {
      console.error("[reviews] save failed", error);
      toast.error("No pudimos guardar");
    } finally {
      setSubmitting(false);
    }
  });

  const rating = form.watch("rating");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90svh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editing ? "Editar reseña" : "Nueva reseña"}
          </DialogTitle>
          <DialogDescription>
            Aparece en el carousel "Lo que dicen" si está activa.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="review-author">Nombre</Label>
            <Input id="review-author" {...form.register("authorName")} />
            {form.formState.errors.authorName && (
              <p className="text-xs text-destructive">
                {form.formState.errors.authorName.message}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Label>Rating</Label>
            <StarPicker
              value={rating}
              onChange={(v) => form.setValue("rating", v)}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="review-text">Texto</Label>
            <Textarea
              id="review-text"
              rows={3}
              {...form.register("text")}
            />
            {form.formState.errors.text && (
              <p className="text-xs text-destructive">
                {form.formState.errors.text.message}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Label>Imagen (opcional)</Label>
            <div className="flex items-center gap-3">
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-border bg-secondary">
                {previewUrl && !removeImage ? (
                  <Image
                    src={previewUrl}
                    alt="Vista previa"
                    fill
                    sizes="64px"
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
                {previewUrl && !removeImage ? "Cambiar" : "Elegir"}
              </Button>
              {previewUrl && !removeImage && (
                <button
                  type="button"
                  onClick={() => {
                    setRemoveImage(true);
                    setFile(null);
                    setPreviewUrl(null);
                  }}
                  className="text-xs text-destructive hover:underline"
                >
                  Quitar
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="review-order">Orden</Label>
              <Input
                id="review-order"
                type="number"
                min={0}
                {...form.register("order", { valueAsNumber: true })}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Activa</Label>
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

export function ReviewsAdmin() {
  const [reviews, setReviews] = useState<Review[] | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Review | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Review | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeReviews((all) => setReviews(all));
    return () => unsubscribe();
  }, []);

  const openNew = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (review: Review) => {
    setEditing(review);
    setFormOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      if (deleteTarget.imageUrl) {
        await deleteImage(deleteTarget.imageUrl).catch(() => {});
      }
      await deleteReview(deleteTarget.id);
      toast.success("Reseña eliminada");
      setDeleteTarget(null);
    } catch (error) {
      console.error("[reviews] delete failed", error);
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
            Reseñas
          </h1>
          <p className="text-sm text-brown-500">
            Testimonios del carousel público.
          </p>
        </div>
        <Button onClick={openNew} className="self-start rounded-full">
          <Plus className="h-4 w-4" />
          Nueva reseña
        </Button>
      </header>

      {reviews === null ? (
        <div className="grid gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              aria-hidden="true"
              className="h-24 animate-pulse rounded-2xl bg-card/70"
            />
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <div className="flex min-h-[30vh] flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-border bg-card/60 px-8 py-16 text-center">
          <p className="font-display text-2xl text-brown-700">
            Todavía no hay reseñas
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {reviews.map((review) => (
            <li
              key={review.id}
              className="flex items-start gap-4 rounded-2xl border border-border bg-card p-4"
            >
              {review.imageUrl && (
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full bg-secondary">
                  <Image
                    src={review.imageUrl}
                    alt=""
                    fill
                    sizes="56px"
                    className="object-cover"
                  />
                </div>
              )}
              <div className="flex flex-1 flex-col gap-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-brown-900">
                    {review.authorName}
                  </span>
                  {!review.active && (
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] uppercase tracking-wider text-brown-500">
                      Inactiva
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={cn(
                        "h-3.5 w-3.5",
                        i < review.rating
                          ? "fill-gold text-gold"
                          : "text-muted",
                      )}
                    />
                  ))}
                </div>
                <p className="text-sm text-brown-700">{review.text}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={() => openEdit(review)}
                  aria-label="Editar"
                  className="flex h-9 w-9 items-center justify-center rounded-full text-brown-700 transition-colors hover:bg-muted"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteTarget(review)}
                  aria-label="Eliminar"
                  className="flex h-9 w-9 items-center justify-center rounded-full text-destructive transition-colors hover:bg-destructive/10"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <ReviewFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        review={editing}
      />

      <Dialog
        open={deleteTarget !== null}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Eliminar reseña</DialogTitle>
            <DialogDescription>
              ¿Eliminar la reseña de {deleteTarget?.authorName}? No se puede
              deshacer.
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
