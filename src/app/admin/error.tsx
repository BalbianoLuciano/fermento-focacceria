"use client";

import { useEffect } from "react";
import { RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[admin] runtime error", error);
  }, [error]);

  return (
    <section className="flex min-h-[60svh] flex-col items-center justify-center gap-4 text-center">
      <h1 className="font-display text-2xl text-brown-900">
        Se rompió algo en el admin
      </h1>
      <p className="max-w-sm text-sm text-brown-500">
        Probá reintentar. Si persiste, revisá la consola del navegador.
      </p>
      <Button onClick={() => reset()} className="rounded-full">
        <RotateCw className="h-4 w-4" />
        Reintentar
      </Button>
    </section>
  );
}
