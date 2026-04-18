import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "Pedido",
};

export default function PedidoPage() {
  return (
    <section className="mx-auto flex w-full max-w-xl flex-col items-center gap-8 px-5 pb-20 pt-16 text-center md:px-8 md:pt-24">
      <span className="inline-flex items-center rounded-full border border-border bg-card/80 px-4 py-1.5 text-xs font-medium uppercase tracking-wider text-brown-500 backdrop-blur">
        En construcción
      </span>

      <h1 className="font-display text-4xl leading-tight text-brown-900 md:text-5xl">
        Acá vas a armar tu pedido
      </h1>

      <p className="max-w-md text-base text-brown-500">
        Estamos terminando el carrito y el hand-off a WhatsApp. Volvé en un
        ratito — o mientras tanto, miranos el menú desde la home.
      </p>

      <Link
        href="/"
        className={cn(
          buttonVariants({ variant: "default" }),
          "h-12 rounded-full px-8 text-base gap-2",
        )}
      >
        <ArrowLeft className="h-4 w-4" />
        Volver al inicio
      </Link>
    </section>
  );
}
