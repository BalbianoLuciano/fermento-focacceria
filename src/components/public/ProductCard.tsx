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
      <span className="font-display text-5xl text-background drop-shadow-[0_2px_6px_rgba(44,24,16,0.25)]">
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
    <article className="group grid grid-cols-[130px_1fr] items-stretch overflow-hidden rounded-3xl border border-border bg-card shadow-[0_1px_0_rgba(44,24,16,0.04)] transition-shadow hover:shadow-md sm:grid-cols-[180px_1fr] md:grid-cols-[240px_1fr]">
      <div className="relative h-full overflow-hidden bg-secondary">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={`${product.name} — focaccia artesanal recién horneada`}
            fill
            sizes="(max-width: 640px) 130px, (max-width: 768px) 180px, 240px"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <FallbackImage name={product.name} />
        )}
      </div>

      <div className="flex flex-col gap-3 p-4 md:gap-4 md:p-5">
        <div className="flex flex-col gap-1">
          <h3 className="font-display text-2xl leading-tight text-brown-900 md:text-3xl">
            {product.name}
          </h3>
          <p className="text-xs text-brown-500 md:text-sm">
            {product.description}
          </p>
        </div>

        <div className="mt-auto flex flex-col gap-2.5">
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
                    "flex flex-col items-start rounded-lg border px-2.5 py-2 text-left transition-colors",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60",
                    isActive
                      ? "border-brown-700 bg-brown-900 text-background"
                      : "border-border bg-background text-brown-700 hover:bg-muted",
                  )}
                >
                  <span className="text-[10px] font-medium uppercase tracking-wider opacity-80">
                    {size.name}
                  </span>
                  <span className="font-display text-base leading-none md:text-lg">
                    {formatPrice(size.price)}
                  </span>
                </button>
              );
            })}
          </div>

          <Button
            type="button"
            onClick={handleAdd}
            className="h-11 w-full justify-center rounded-full text-sm font-medium md:text-base"
          >
            <Plus className="h-4 w-4" />
            Sumar al pedido
          </Button>
        </div>
      </div>
    </article>
  );
}
