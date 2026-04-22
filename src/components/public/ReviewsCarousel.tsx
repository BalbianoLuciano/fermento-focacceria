"use client";

import Image from "next/image";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Review } from "@/lib/types";

function Rating({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`${value} de 5 estrellas`}>
      {Array.from({ length: 5 }).map((_, i) => {
        const filled = i < value;
        return (
          <Star
            key={i}
            className={cn(
              "h-4 w-4",
              filled ? "fill-gold text-gold" : "text-muted",
            )}
            aria-hidden="true"
          />
        );
      })}
    </div>
  );
}

export function ReviewsCarousel({ reviews }: { reviews: Review[] }) {
  const [emblaRef] = useEmblaCarousel(
    { loop: true, align: "start", containScroll: "trimSnaps" },
    [Autoplay({ delay: 6000, stopOnInteraction: true })],
  );

  if (reviews.length === 0) return null;

  return (
    <div className="overflow-hidden" ref={emblaRef}>
      <div className="flex items-start gap-4 md:gap-6">
        {reviews.map((review) => (
          <figure
            key={review.id}
            className={cn(
              "flex shrink-0 flex-col gap-4 rounded-3xl border border-border bg-card p-6 shadow-sm md:p-7",
              review.imageUrl
                ? "min-w-0 basis-full md:basis-auto md:min-w-[520px]"
                : "min-w-0 basis-full md:basis-auto md:min-w-[420px]",
            )}
          >
            <Rating value={review.rating} />
            <blockquote className="text-base leading-relaxed text-brown-700">
              &ldquo;{review.text}&rdquo;
            </blockquote>
            {review.imageUrl && (
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-secondary">
                <Image
                  src={review.imageUrl}
                  alt={`Reseña de ${review.authorName}`}
                  fill
                  sizes="(max-width: 768px) 85vw, 420px"
                  className="object-cover"
                />
              </div>
            )}
            <figcaption className="mt-auto text-sm font-medium text-brown-500">
              — {review.authorName}
            </figcaption>
          </figure>
        ))}
      </div>
    </div>
  );
}
