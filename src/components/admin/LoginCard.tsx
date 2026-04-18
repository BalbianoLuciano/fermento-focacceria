"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LogIn, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/shared/Logo";
import { useAuth } from "@/hooks/use-auth";

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      aria-hidden="true"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  );
}

export function LoginCard() {
  const router = useRouter();
  const { user, loading, isAdmin, signIn, signOut } = useAuth();
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user && isAdmin) {
      router.replace("/admin");
    }
  }, [loading, user, isAdmin, router]);

  const handleSignIn = async () => {
    setBusy(true);
    try {
      await signIn();
    } catch (error) {
      console.error("[login] sign-in failed", error);
      toast.error("No pudimos iniciar sesión. Probá de nuevo.");
    } finally {
      setBusy(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error("[login] sign-out failed", error);
    }
  };

  if (loading) {
    return (
      <div
        aria-hidden="true"
        className="h-80 w-full max-w-sm animate-pulse rounded-3xl bg-card/60"
      />
    );
  }

  if (user && !isAdmin) {
    return (
      <div className="flex w-full max-w-sm flex-col items-center gap-5 rounded-3xl border border-border bg-card p-8 text-center shadow-sm">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <ShieldAlert className="h-6 w-6" />
        </div>
        <div className="flex flex-col gap-2">
          <h1 className="font-display text-2xl text-brown-900">
            Acceso restringido
          </h1>
          <p className="text-sm text-brown-500">
            Esta cuenta ({user.email}) no tiene permisos para entrar al panel.
          </p>
        </div>
        <div className="flex w-full flex-col gap-2">
          <Button
            type="button"
            onClick={handleSignOut}
            className="h-11 w-full justify-center rounded-full"
            variant="outline"
          >
            Cerrar sesión
          </Button>
          <Link
            href="/"
            className="text-center text-xs text-brown-500 hover:text-brown-700"
          >
            Volver al inicio
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-full max-w-sm flex-col items-center gap-6 rounded-3xl border border-border bg-card p-8 text-center shadow-sm">
      <Logo size="md" as="div" />
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-2xl text-brown-900">
          Panel de Anna
        </h1>
        <p className="text-sm text-brown-500">
          Ingresá con la cuenta de Google registrada.
        </p>
      </div>
      <Button
        type="button"
        onClick={handleSignIn}
        disabled={busy}
        className="h-12 w-full justify-center rounded-full bg-card text-brown-900 border border-border hover:bg-muted"
      >
        <GoogleIcon className="h-5 w-5" />
        {busy ? "Ingresando..." : "Ingresar con Google"}
      </Button>
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-xs text-brown-500 hover:text-brown-700"
      >
        <LogIn className="h-3 w-3 rotate-180" />
        Volver al inicio
      </Link>
    </div>
  );
}
