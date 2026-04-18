import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { Logo } from "@/components/shared/Logo";

const INSTAGRAM_HANDLE = "fermentofocacceria_";

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

export function Footer() {
  const year = new Date().getFullYear();
  const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;
  const whatsappHref = whatsappNumber ? `https://wa.me/${whatsappNumber}` : "#";
  const instagramHref = `https://instagram.com/${INSTAGRAM_HANDLE}`;

  return (
    <footer className="border-t border-border/60 bg-secondary/60">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-5 py-10 md:flex-row md:items-end md:justify-between md:px-8">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col items-start leading-none gap-1">
            <Logo size="md" showTagline={false} />
            <Link
              href="/admin"
              className="font-body text-xs italic font-light tracking-wide text-brown-500 no-underline hover:text-brown-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
              aria-label="Ingresar al panel"
            >
              Fresh from the oven
            </Link>
          </div>
          <p className="max-w-sm text-sm text-brown-500">
            Focaccias artesanales hechas a mano. Masa madre, fermentación de 24
            horas, pedido por WhatsApp.
          </p>
        </div>

        <div className="flex flex-col gap-4 text-sm">
          <div className="flex gap-3">
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Escribinos por WhatsApp"
              className="inline-flex h-11 items-center gap-2 rounded-full border border-border bg-card px-4 text-brown-700 transition-colors hover:bg-muted"
            >
              <MessageCircle className="h-4 w-4" />
              WhatsApp
            </a>
            <a
              href={instagramHref}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Seguinos en Instagram"
              className="inline-flex h-11 items-center gap-2 rounded-full border border-border bg-card px-4 text-brown-700 transition-colors hover:bg-muted"
            >
              <InstagramIcon className="h-4 w-4" />
              Instagram
            </a>
          </div>
          <p className="text-xs text-brown-500">
            © {year} Fermento Focacceria · Corrientes, Argentina
          </p>
        </div>
      </div>
    </footer>
  );
}
