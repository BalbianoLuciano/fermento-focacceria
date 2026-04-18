"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { getSettings, updateSettings } from "@/lib/firebase/settings";

const schema = z.object({
  whatsappNumber: z
    .string()
    .trim()
    .regex(
      /^[0-9]{8,15}$/,
      "Sólo dígitos, formato internacional (ej. 5493735456222)",
    ),
  instagramHandle: z
    .string()
    .trim()
    .min(1, "Requerido")
    .regex(/^[a-zA-Z0-9._]+$/, "Sin @, sin espacios"),
  businessName: z.string().trim().min(2).max(60),
  tagline: z.string().trim().max(60).optional().or(z.literal("")),
  heroMessage: z.string().trim().min(5).max(120),
});
type FormValues = z.infer<typeof schema>;

const empty: FormValues = {
  whatsappNumber: "",
  instagramHandle: "",
  businessName: "",
  tagline: "",
  heroMessage: "",
};

export function SettingsForm() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: empty,
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const settings = await getSettings();
        if (!cancelled && settings) {
          form.reset({
            whatsappNumber: settings.whatsappNumber ?? "",
            instagramHandle: settings.instagramHandle ?? "",
            businessName: settings.businessName ?? "",
            tagline: settings.tagline ?? "",
            heroMessage: settings.heroMessage ?? "",
          });
        }
      } catch (error) {
        console.error("[settings] load failed", error);
        toast.error("No pudimos cargar los ajustes");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [form]);

  const onSubmit = form.handleSubmit(async (values) => {
    setSubmitting(true);
    try {
      await updateSettings({
        whatsappNumber: values.whatsappNumber,
        instagramHandle: values.instagramHandle,
        businessName: values.businessName,
        tagline: values.tagline ?? "",
        heroMessage: values.heroMessage,
      });
      toast.success("Ajustes guardados");
    } catch (error) {
      console.error("[settings] save failed", error);
      toast.error("No pudimos guardar");
    } finally {
      setSubmitting(false);
    }
  });

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="font-display text-3xl text-brown-900 md:text-4xl">
          Ajustes
        </h1>
        <p className="text-sm text-brown-500">
          Datos que se muestran en la web pública.
        </p>
      </header>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              aria-hidden="true"
              className="h-16 animate-pulse rounded-2xl bg-card/70"
            />
          ))}
        </div>
      ) : (
        <form
          onSubmit={onSubmit}
          className="flex max-w-xl flex-col gap-5 rounded-3xl border border-border bg-card p-6"
        >
          <div className="flex flex-col gap-2">
            <Label htmlFor="settings-business">Nombre del negocio</Label>
            <Input
              id="settings-business"
              {...form.register("businessName")}
            />
            {form.formState.errors.businessName && (
              <p className="text-xs text-destructive">
                {form.formState.errors.businessName.message}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="settings-tagline">Tagline</Label>
            <Input id="settings-tagline" {...form.register("tagline")} />
            {form.formState.errors.tagline && (
              <p className="text-xs text-destructive">
                {form.formState.errors.tagline.message}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="settings-hero">Hero (título grande de la landing)</Label>
            <Textarea
              id="settings-hero"
              rows={2}
              {...form.register("heroMessage")}
            />
            {form.formState.errors.heroMessage && (
              <p className="text-xs text-destructive">
                {form.formState.errors.heroMessage.message}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="settings-whatsapp">
              WhatsApp (formato wa.me, sólo dígitos)
            </Label>
            <Input
              id="settings-whatsapp"
              placeholder="5493735456222"
              {...form.register("whatsappNumber")}
            />
            {form.formState.errors.whatsappNumber && (
              <p className="text-xs text-destructive">
                {form.formState.errors.whatsappNumber.message}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="settings-instagram">Instagram (usuario)</Label>
            <Input
              id="settings-instagram"
              placeholder="fermentofocacceria_"
              {...form.register("instagramHandle")}
            />
            {form.formState.errors.instagramHandle && (
              <p className="text-xs text-destructive">
                {form.formState.errors.instagramHandle.message}
              </p>
            )}
          </div>

          <div>
            <Button
              type="submit"
              disabled={submitting}
              className="rounded-full"
            >
              {submitting ? "Guardando..." : "Guardar ajustes"}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
