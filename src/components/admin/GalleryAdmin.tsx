"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { Trash2, Upload } from "lucide-react";
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

import {
  addGalleryImage,
  deleteGalleryImage,
  subscribeGalleryImages,
  updateGalleryImage,
} from "@/lib/firebase/gallery";
import { deleteImage, uploadImage } from "@/lib/firebase/storage";
import type { GalleryImage } from "@/lib/types";
import { MenuStoryExport } from "@/components/admin/MenuStoryExport";

export function GalleryAdmin() {
  const [images, setImages] = useState<GalleryImage[] | null>(null);
  const [uploading, setUploading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<GalleryImage | null>(null);
  const [deleting, setDeleting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const unsubscribe = subscribeGalleryImages((all) => setImages(all));
    return () => unsubscribe();
  }, []);

  const handleUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (files.length === 0) return;
    event.target.value = "";

    setUploading(true);
    const currentMaxOrder = images?.reduce(
      (max, img) => Math.max(max, img.order ?? 0),
      0,
    ) ?? 0;

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        // Create the doc first so we can use its id as the storage key.
        const tempId = await addGalleryImage({
          imageUrl: "",
          caption: "",
          order: currentMaxOrder + i + 1,
        });
        const url = await uploadImage(
          file,
          `gallery/${tempId}.${file.name.split(".").pop() ?? "jpg"}`,
        );
        await updateGalleryImage(tempId, { imageUrl: url });
      }
      toast.success(
        files.length === 1
          ? "Imagen subida"
          : `${files.length} imágenes subidas`,
      );
    } catch (error) {
      console.error("[gallery] upload failed", error);
      toast.error("No pudimos subir. Revisá las rules.");
    } finally {
      setUploading(false);
    }
  };

  const handleCaptionBlur = async (image: GalleryImage, caption: string) => {
    const clean = caption.trim();
    if (clean === (image.caption ?? "")) return;
    try {
      await updateGalleryImage(image.id, { caption: clean });
    } catch (error) {
      console.error("[gallery] caption update failed", error);
      toast.error("No pudimos guardar el texto");
    }
  };

  const handleOrderChange = async (image: GalleryImage, order: number) => {
    if (Number.isNaN(order) || order === image.order) return;
    try {
      await updateGalleryImage(image.id, { order });
    } catch (error) {
      console.error("[gallery] order update failed", error);
      toast.error("No pudimos reordenar");
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      if (deleteTarget.imageUrl) {
        await deleteImage(deleteTarget.imageUrl).catch(() => {});
      }
      await deleteGalleryImage(deleteTarget.id);
      toast.success("Imagen eliminada");
      setDeleteTarget(null);
    } catch (error) {
      console.error("[gallery] delete failed", error);
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
            Galería
          </h1>
          <p className="text-sm text-brown-500">
            Fotos que aparecen en la landing y en /galeria.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <MenuStoryExport />
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleUpload}
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="rounded-full"
          >
            <Upload className="h-4 w-4" />
            {uploading ? "Subiendo..." : "Subir imágenes"}
          </Button>
        </div>
      </header>

      {images === null ? (
        <div className="grid gap-3 md:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              aria-hidden="true"
              className="aspect-[4/5] animate-pulse rounded-2xl bg-card/70"
            />
          ))}
        </div>
      ) : images.length === 0 ? (
        <div className="flex min-h-[30vh] flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-border bg-card/60 px-8 py-16 text-center">
          <p className="font-display text-2xl text-brown-700">
            Todavía no hay fotos
          </p>
          <p className="text-sm text-brown-500">
            Subí la primera para que aparezca en la landing.
          </p>
        </div>
      ) : (
        <ul className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {images.map((image) => (
            <li
              key={image.id}
              className="flex flex-col gap-2 rounded-2xl border border-border bg-card p-2"
            >
              <div className="relative aspect-[4/5] w-full overflow-hidden rounded-xl bg-secondary">
                {image.imageUrl ? (
                  <Image
                    src={image.imageUrl}
                    alt={image.caption ?? ""}
                    fill
                    sizes="(max-width: 768px) 50vw, 33vw"
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-brown-400">
                    Sin imagen
                  </div>
                )}
              </div>
              <Input
                defaultValue={image.caption ?? ""}
                placeholder="Descripción opcional"
                onBlur={(e) => handleCaptionBlur(image, e.target.value)}
                className="text-xs"
              />
              <div className="flex items-center justify-between gap-2">
                <label className="flex items-center gap-2 text-xs text-brown-500">
                  Orden
                  <Input
                    type="number"
                    min={0}
                    defaultValue={image.order}
                    onBlur={(e) =>
                      handleOrderChange(image, Number(e.target.value))
                    }
                    className="w-16"
                  />
                </label>
                <button
                  type="button"
                  onClick={() => setDeleteTarget(image)}
                  aria-label="Eliminar imagen"
                  className="flex h-8 w-8 items-center justify-center rounded-full text-destructive transition-colors hover:bg-destructive/10"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Dialog
        open={deleteTarget !== null}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Eliminar imagen</DialogTitle>
            <DialogDescription>
              ¿Eliminar esta imagen? No se puede deshacer.
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
