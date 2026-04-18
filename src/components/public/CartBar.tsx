"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, ShoppingBag } from "lucide-react";
import {
  selectItemCount,
  selectTotal,
  useCartStore,
} from "@/lib/cart/cart-store";

const priceFormatter = new Intl.NumberFormat("es-AR");

export function CartBar() {
  // Zustand persist middleware hydrates from localStorage on the client.
  // Gate rendering until we're mounted so the server and first-client render
  // always agree on "cart is empty" — only then we reveal the real state.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const total = useCartStore(selectTotal);
  const count = useCartStore(selectItemCount);

  if (!mounted || count === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-4 md:pb-6">
      <Link
        href="/pedido"
        className="pointer-events-auto flex w-full max-w-xl items-center justify-between gap-4 rounded-full bg-brown-900 py-3 pl-5 pr-3 text-background shadow-2xl shadow-brown-900/30 transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
      >
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-background/10">
            <ShoppingBag className="h-4 w-4" />
          </span>
          <div className="flex flex-col leading-tight">
            <span className="text-xs uppercase tracking-wider text-background/70">
              {count} {count === 1 ? "ítem" : "ítems"}
            </span>
            <span className="font-display text-lg">
              ${priceFormatter.format(total)}
            </span>
          </div>
        </div>

        <span className="inline-flex items-center gap-2 rounded-full bg-gold px-5 py-3 text-sm font-medium text-brown-900">
          Ver pedido
          <ArrowRight className="h-4 w-4" />
        </span>
      </Link>
    </div>
  );
}
