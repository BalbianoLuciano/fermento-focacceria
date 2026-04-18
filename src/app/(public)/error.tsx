"use client";

import { useEffect } from "react";
import Link from "next/link";
import { RotateCw } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function PublicError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[public] runtime error", error);
  }, [error]);

  return (
    <section className="mx-auto flex min-h-[60svh] w-full max-w-lg flex-col items-center justify-center gap-6 px-5 py-16 text-center">
      <p className="font-display text-6xl text-brown-300">Uy!</p>
      <h1 className="font-display text-3xl text-brown-900">
        Algo se nos quemó en el horno
      </h1>
      <p className="max-w-sm text-sm text-brown-500">
        Probá recargar. Si sigue, escribinos por WhatsApp.
      </p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button onClick={() => reset()} className="rounded-full">
          <RotateCw className="h-4 w-4" />
          Reintentar
        </Button>
        <Link
          href="/"
          className={cn(
            buttonVariants({ variant: "outline" }),
            "rounded-full",
          )}
        >
          Volver al inicio
        </Link>
      </div>
    </section>
  );
}
