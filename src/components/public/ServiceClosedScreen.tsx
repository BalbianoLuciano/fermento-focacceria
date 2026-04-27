import Image from "next/image";
import { MessageCircle } from "lucide-react";
import { Logo } from "@/components/shared/Logo";

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}

const DEFAULT_MSG =
  "Semana de parciales — el horno descansa unos días. Los esperamos pronto con la masa lista.";

interface ServiceClosedScreenProps {
  message?: string;
  whatsappNumber?: string;
  instagramHandle?: string;
}

export function ServiceClosedScreen({
  message,
  whatsappNumber,
  instagramHandle,
}: ServiceClosedScreenProps) {
  const closedMsg = message?.trim() || DEFAULT_MSG;
  const whatsappHref = whatsappNumber
    ? `https://wa.me/${whatsappNumber}`
    : null;
  const instagramHref = instagramHandle
    ? `https://instagram.com/${instagramHandle}`
    : null;

  return (
    <div className="relative flex min-h-svh flex-col items-center justify-center overflow-hidden px-6">
      <div className="absolute inset-0 -z-10">
        <Image
          src="/hero-banner.jpg"
          alt=""
          fill
          sizes="100vw"
          priority
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/92 via-background/80 to-background/92" />
      </div>

      <div className="flex max-w-lg flex-col items-center gap-6 text-center">
        <Logo size="lg" as="div" showTagline={false} />

        <h1 className="font-display text-4xl leading-tight text-brown-900 sm:text-5xl md:text-6xl">
          Volvemos pronto
        </h1>

        <p className="max-w-md text-base text-brown-700 md:text-lg">
          {closedMsg}
        </p>

        {(whatsappHref || instagramHref) && (
          <div className="mt-2 flex flex-wrap justify-center gap-3">
            {whatsappHref && (
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-11 items-center gap-2 rounded-full border border-border bg-card/80 px-5 text-sm text-brown-700 backdrop-blur transition-colors hover:bg-card"
              >
                <MessageCircle className="h-4 w-4" />
                WhatsApp
              </a>
            )}
            {instagramHref && (
              <a
                href={instagramHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-11 items-center gap-2 rounded-full border border-border bg-card/80 px-5 text-sm text-brown-700 backdrop-blur transition-colors hover:bg-card"
              >
                <InstagramIcon className="h-4 w-4" />
                Instagram
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
