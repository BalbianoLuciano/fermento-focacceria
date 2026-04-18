"use client";

import Image from "next/image";
import { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/lib/cart/cart-store";
import type { Product, ProductSize } from "@/lib/types";

const priceFormatter = new Intl.NumberFormat("es-AR");

function formatPrice(value: number) {
  return `$${priceFormatter.format(value)}`;
}

function FallbackImage({ name }: { name: string }) {
  const initial = name.charAt(0).toUpperCase();
  return (
    <div
      aria-hidden="true"
      className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_30%_30%,var(--gold)/60%,var(--secondary)_70%)]"
    >
      <span className="font-display text-6xl text-background drop-shadow-[0_2px_6px_rgba(44,24,16,0.25)]">
        {initial}
      </span>
    </div>
  );
}

export function ProductCard({ product }: { product: Product }) {
  const [selected, setSelected] = useState<ProductSize>(product.sizes[0]);
  const addItem = useCartStore((state) => state.addItem);

  const handleAdd = () => {
    addItem({
      productId: product.id,
      productName: product.name,
      sizeName: selected.name,
      unitPrice: selected.price,
    });
    toast.success("Sumado al pedido", {
      description: `${product.name} (${selected.name}) · ${formatPrice(selected.price)}`,
    });
  };

  return (
    <article className="group flex flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-[0_1px_0_rgba(44,24,16,0.04)] transition-shadow hover:shadow-md">
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-secondary">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={`${product.name} — focaccia artesanal recién horneada`}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <FallbackImage name={product.name} />
        )}
      </div>

      <div className="flex flex-1 flex-col gap-4 p-5 md:p-6">
        <div className="flex flex-col gap-1.5">
          <h3 className="font-display text-2xl leading-tight text-brown-900">
            {product.name}
          </h3>
          <p className="text-sm text-brown-500">{product.description}</p>
        </div>

        <div className="mt-auto flex flex-col gap-3">
          <div
            role="radiogroup"
            aria-label={`Tamaño de ${product.name}`}
            className="grid grid-cols-2 gap-2"
          >
            {product.sizes.map((size) => {
              const isActive = size.name === selected.name;
              return (
                <button
                  key={size.name}
                  type="button"
                  role="radio"
                  aria-checked={isActive}
                  onClick={() => setSelected(size)}
                  className={cn(
                    "flex flex-col items-start rounded-xl border px-3 py-2.5 text-left transition-colors",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60",
                    isActive
                      ? "border-brown-700 bg-brown-900 text-background"
                      : "border-border bg-background text-brown-700 hover:bg-muted",
                  )}
                >
                  <span className="text-xs font-medium uppercase tracking-wider opacity-80">
                    {size.name}
                  </span>
                  <span className="font-display text-lg leading-none">
                    {formatPrice(size.price)}
                  </span>
                </button>
              );
            })}
          </div>

          <Button
            type="button"
            onClick={handleAdd}
            className="h-12 w-full justify-center rounded-full text-base font-medium"
          >
            <Plus className="h-4 w-4" />
            Sumar al pedido
          </Button>
        </div>
      </div>
    </article>
  );
}
