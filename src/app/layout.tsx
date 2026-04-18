import type { Metadata } from "next";
import { Berkshire_Swash, Outfit } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import "./globals.css";

const berkshireSwash = Berkshire_Swash({
  variable: "--font-display",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

const outfit = Outfit({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Fermento Focacceria — Recién horneadas, hechas con amor",
    template: "%s · Fermento Focacceria",
  },
  description:
    "Focaccias artesanales con masa madre, fermentación de 24 horas. Pedilas por WhatsApp en Corrientes.",
  openGraph: {
    title: "Fermento Focacceria",
    description:
      "Focaccias artesanales con masa madre. Recién horneadas, hechas con amor.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      suppressHydrationWarning
      className={`${berkshireSwash.variable} ${outfit.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AuthProvider>
          <TooltipProvider>{children}</TooltipProvider>
          <Toaster position="top-center" richColors theme="light" />
        </AuthProvider>
      </body>
    </html>
  );
}
